import { test, expect } from '@playwright/test';
import {
  mockAllAPIs,
  mockStatusConnected,
  mockStatusDisconnected,
  mockLatestRecords,
  mockProductionStats,
} from './mock-api';

test.describe('Home Page - Production Chart', () => {
  test('chart card renders with title', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    const chartCard = page.locator('app-production-chart mat-card');
    await expect(chartCard).toBeVisible();
    await expect(chartCard).toContainText('Solar Production - Last 7 Days');
  });

  test('chart bars render when API returns data', async ({ page }) => {
    const stats = mockProductionStats();
    await page.route('**/api/database/status', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStatusConnected()) })
    );
    await page.route('**/api/database/production-stats*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stats) })
    );
    await page.route('**/api/database/latest-records', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLatestRecords()) })
    );

    await page.goto('/');
    // Wait for bars to render
    const bars = page.locator('.bar-wrapper');
    await expect(bars.first()).toBeVisible();
    await expect(bars).toHaveCount(7);
  });

  test('chart shows empty state when API returns empty array', async ({ page }) => {
    await page.route('**/api/database/status', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStatusConnected()) })
    );
    await page.route('**/api/database/production-stats*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/database/latest-records', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLatestRecords()) })
    );

    await page.goto('/');
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('text=No production data available')).toBeVisible();
  });

  test('chart shows error state when API fails', async ({ page }) => {
    await page.route('**/api/database/status', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStatusConnected()) })
    );
    await page.route('**/api/database/production-stats*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
    );
    await page.route('**/api/database/latest-records', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLatestRecords()) })
    );

    await page.goto('/');
    await expect(page.locator('.error-state')).toBeVisible();
    await expect(page.locator('text=Failed to load production data')).toBeVisible();
  });

  test('bar tooltip shows kWh value on hover', async ({ page }) => {
    const stats = [
      { date: '2026-02-20', productionUnits: 4500 },
      { date: '2026-02-19', productionUnits: 3200 },
    ];
    await page.route('**/api/database/status', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStatusConnected()) })
    );
    await page.route('**/api/database/production-stats*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stats) })
    );
    await page.route('**/api/database/latest-records', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLatestRecords()) })
    );

    await page.goto('/');
    const firstBar = page.locator('.bar').first();
    await expect(firstBar).toBeVisible();
    // The title attribute should contain the kWh display value
    const title = await firstBar.getAttribute('title');
    expect(title).toContain('kWh');
  });

  test('chart info shows energy units label', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    await expect(page.locator('.chart-info')).toContainText('Watt-hours');
  });
});

test.describe('Home Page - Status Panel', () => {
  test('status panel renders with title', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    const statusCard = page.locator('app-status-panel mat-card');
    await expect(statusCard).toBeVisible();
    await expect(statusCard).toContainText('System Status');
  });

  test('status panel shows connected state', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    const statusPanel = page.locator('app-status-panel');
    await expect(statusPanel).toContainText('API Ready');
    await expect(statusPanel).toContainText('Database Connected');
  });

  test('status panel shows disconnected state when API is unavailable', async ({ page }) => {
    await page.route('**/api/database/status', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStatusDisconnected()) })
    );
    await page.route('**/api/database/production-stats*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/database/latest-records', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ solarman: null, tshwane: null }) })
    );

    await page.goto('/');
    const statusPanel = page.locator('app-status-panel');
    await expect(statusPanel).toContainText('API Unavailable');
    await expect(statusPanel).toContainText('Database Disconnected');
  });

  test('latest import records display correctly', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');
    const statusPanel = page.locator('app-status-panel');
    await expect(statusPanel).toContainText('Latest Import Records');
    await expect(statusPanel).toContainText('SolarMan:');
    await expect(statusPanel).toContainText('Tshwane:');
    // Should show formatted dates, not "No records found"
    await expect(statusPanel.locator('.record-value').first()).not.toContainText('No records found');
  });

  test('latest records show "No records found" when null', async ({ page }) => {
    await page.route('**/api/database/status', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStatusConnected()) })
    );
    await page.route('**/api/database/production-stats*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProductionStats()) })
    );
    await page.route('**/api/database/latest-records', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ solarman: null, tshwane: null }) })
    );

    await page.goto('/');
    const recordValues = page.locator('app-status-panel .record-value');
    await expect(recordValues.first()).toContainText('No records found');
    await expect(recordValues.last()).toContainText('No records found');
  });
});
