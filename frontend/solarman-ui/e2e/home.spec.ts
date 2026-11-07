import { test, expect, Page } from '@playwright/test';
import { mockAllAPIs, mockStatusDisconnected } from './mock-api';

/** Overrides one endpoint after mockAllAPIs (later routes take precedence). */
async function mockJson(page: Page, url: string, body: unknown, status = 200) {
  await page.route(url, (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

test.describe('Home Page - Key figures', () => {
  test('shows the page heading and four KPI cards', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Energy overview' })).toBeVisible();
    const kpis = page.locator('app-energy-summary .kpi');
    await expect(kpis).toHaveCount(4);
    await expect(kpis.nth(1)).toContainText('Produced, last 7 days');
    await expect(kpis.nth(3)).toContainText('Tshwane meter, last 7 readings');
    await expect(kpis.nth(3)).toContainText('40.8');
  });

  test('Import data button opens the import page', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    await page.locator('.page__header').getByRole('link', { name: 'Import data' }).click();
    await expect(page).toHaveURL(/\/upload/);
  });
});

test.describe('Home Page - Charts', () => {
  test('production chart renders with title', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const chart = page.locator('app-production-chart');
    await expect(chart.getByRole('heading', { name: 'Solar production' })).toBeVisible();
    await expect(chart).toContainText('Last 7 days · kWh');
  });

  test('production bars render when API returns data', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const bars = page.locator('app-production-chart .bar-wrapper');
    await expect(bars.first()).toBeVisible();
    await expect(bars).toHaveCount(7);
  });

  test('production chart shows empty state when API returns empty array', async ({ page }) => {
    await mockAllAPIs(page);
    await mockJson(page, '**/api/database/production-stats*', []);
    await page.goto('/');

    await expect(page.locator('app-production-chart .empty-state')).toBeVisible();
    await expect(page.locator('text=No production data available')).toBeVisible();
  });

  test('production chart shows error state when API fails', async ({ page }) => {
    await mockAllAPIs(page);
    await mockJson(page, '**/api/database/production-stats*', { error: 'boom' }, 500);
    await page.goto('/');

    await expect(page.locator('app-production-chart .error-state')).toBeVisible();
    await expect(page.locator('text=Failed to load production data')).toBeVisible();
  });

  test('bar tooltip shows kWh value', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const firstBar = page.locator('app-production-chart .bar').first();
    await expect(firstBar).toBeVisible();
    expect(await firstBar.getAttribute('title')).toContain('kWh');
  });

  test('Tshwane chart renders one bar per reading', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const chart = page.locator('app-tshwane-chart');
    await expect(chart.getByRole('heading', { name: 'Tshwane electricity' })).toBeVisible();
    await expect(chart).toContainText('kWh/day since previous reading');
    await expect(chart.locator('.bar-wrapper')).toHaveCount(7);
    await expect(chart.locator('.bar.is-highlight')).toHaveCount(1);
    // Latest reading: 11.87 kWh over ~3 days → 3.9 kWh/day
    await expect(chart.locator('.bar-value').last()).toHaveText('3.9');
    expect(await chart.locator('.bar').last().getAttribute('title')).toContain('3.94 kWh/day · 11.87 kWh over 3.0 days since 2 Nov');
  });
});

test.describe('Home Page - System status', () => {
  test('status section renders with title', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const status = page.locator('app-status-panel');
    await expect(status.getByRole('heading', { name: 'System status' })).toBeVisible();
  });

  test('shows connected state in the panel and the header', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const status = page.locator('app-status-panel');
    await expect(status.locator('.status-value').first()).toContainText('Ready');
    await expect(status.locator('.status-value').nth(1)).toContainText('Connected');
    await expect(page.locator('.status-pill')).toContainText('All systems normal');
  });

  test('shows disconnected state when API is unavailable', async ({ page }) => {
    await mockAllAPIs(page);
    await mockJson(page, '**/api/database/status', mockStatusDisconnected());
    await page.goto('/');

    const status = page.locator('app-status-panel');
    await expect(status.locator('.status-value').first()).toContainText('Unavailable');
    await expect(status.locator('.status-value').nth(1)).toContainText('Disconnected');
    await expect(page.locator('.status-pill')).toContainText('API unavailable');
  });

  test('latest import records display correctly', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const status = page.locator('app-status-panel');
    await expect(status).toContainText('Latest SolarMan record');
    await expect(status).toContainText('Latest Tshwane reading');
    await expect(status.locator('.record-value').first()).toContainText('20 Feb 2026, 14:30');
    await expect(page.locator('.page__subtitle')).toContainText('solar data up to 20 Feb, 14:30');
  });

  test('latest records show "No records found" when null', async ({ page }) => {
    await mockAllAPIs(page);
    await mockJson(page, '**/api/database/latest-records', { solarman: null, tshwane: null });
    await page.goto('/');

    const recordValues = page.locator('app-status-panel .record-value');
    await expect(recordValues.first()).toContainText('No records found');
    await expect(recordValues.last()).toContainText('No records found');
  });
});
