import { test, expect } from '@playwright/test';
import { mockAllAPIs } from './mock-api';

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test('header renders with the SolarMan brand', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header.site-header');
    await expect(header).toBeVisible();
    await expect(header.locator('.brand')).toContainText('SolarMan');
  });

  test('Overview and Import data nav links are visible', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Import data' })).toBeVisible();
  });

  test('navigate to Import data via the header', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Import data' }).click();
    await expect(page).toHaveURL(/\/upload/);
    await expect(page.getByRole('heading', { level: 1, name: 'Import data' })).toBeVisible();
  });

  test('navigate back to Overview via the header', async ({ page }) => {
    await page.goto('/upload');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Energy overview' })).toBeVisible();
  });

  test('current page is marked in the navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Import data' })).not.toHaveAttribute('aria-current', 'page');

    await nav.getByRole('link', { name: 'Import data' }).click();
    await expect(nav.getByRole('link', { name: 'Import data' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current', 'page');
  });

  test('footer displays version info', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('SolarManExcel2DB');
    await expect(footer).toContainText('Version 2.0.2');
  });

  test('wildcard routes redirect to Overview', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Energy overview' })).toBeVisible();
  });
});
