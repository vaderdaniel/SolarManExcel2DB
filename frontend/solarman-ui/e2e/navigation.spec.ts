import { test, expect } from '@playwright/test';
import { mockAllAPIs } from './mock-api';

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test('toolbar renders with app title', async ({ page }) => {
    await page.goto('/');
    const toolbar = page.locator('mat-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toContainText('SolarMan Excel Import');
  });

  test('Home and Upload nav buttons are visible', async ({ page }) => {
    await page.goto('/');
    const homeButton = page.locator('mat-toolbar button', { hasText: 'Home' });
    const uploadButton = page.locator('mat-toolbar button', { hasText: 'Upload' });
    await expect(homeButton).toBeVisible();
    await expect(uploadButton).toBeVisible();
  });

  test('navigate to Upload page via toolbar button', async ({ page }) => {
    await page.goto('/');
    await page.locator('mat-toolbar button', { hasText: 'Upload' }).click();
    await expect(page).toHaveURL(/\/upload/);
    // Upload page should show file upload card
    await expect(page.locator('text=File Upload')).toBeVisible();
  });

  test('navigate back to Home via toolbar button', async ({ page }) => {
    await page.goto('/upload');
    await page.locator('mat-toolbar button', { hasText: 'Home' }).click();
    await expect(page).toHaveURL(/\/$/);
    // Home page should show production chart
    await expect(page.locator('text=Solar Production')).toBeVisible();
  });

  test('active link highlighting on current route', async ({ page }) => {
    await page.goto('/');
    const homeButton = page.locator('mat-toolbar a.active-link, mat-toolbar button.active-link', { hasText: 'Home' });
    // Home should have the active-link class when on home page
    await expect(page.locator('mat-toolbar [routerlink="/"].active-link')).toBeVisible();

    // Navigate to upload
    await page.locator('mat-toolbar button', { hasText: 'Upload' }).click();
    await expect(page.locator('mat-toolbar [routerlink="/upload"].active-link')).toBeVisible();
  });

  test('footer displays version info', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('SolarManExcel2DB');
    await expect(footer).toContainText('Version 1.5');
  });

  test('wildcard routes redirect to Home', async ({ page }) => {
    await page.goto('/nonexistent-page');
    // Should redirect to home page
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('text=Solar Production')).toBeVisible();
  });
});
