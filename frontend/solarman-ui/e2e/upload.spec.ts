import { test, expect, Page } from '@playwright/test';
import { mockAllAPIs, mockUploadResponse, mockImportResult, excelFile } from './mock-api';

async function mockUploadAndImport(page: Page, fileType: 'solarman' | 'tshwane' = 'solarman') {
  await page.route(`**/api/upload/${fileType}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...mockUploadResponse(), fileType }),
    })
  );
  await page.route(`**/api/import/${fileType}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockImportResult()) })
  );
}

/** Choose step → Review step for a SolarMan file. */
async function goToPreview(page: Page) {
  await page.goto('/upload');
  await page.locator('#file-input').setInputFiles(excelFile('solarman_export.xlsx'));
  await page.getByRole('button', { name: 'Upload & preview' }).click();
  await expect(page.locator('app-data-preview')).toBeVisible();
}

test.describe('Upload Page - Choose file', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test('shows the choose-file step by default', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByRole('heading', { level: 1, name: 'Import data' })).toBeVisible();
    await expect(page.locator('.step[aria-current="step"]')).toContainText('Choose file');
    await expect(page.locator('app-file-upload')).toBeVisible();
    await expect(page.getByText('What are you importing?')).toBeVisible();
  });

  test('SolarMan and Tshwane options are radios, SolarMan selected', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByRole('radio', { name: /SolarMan inverter export/ })).toBeChecked();
    await expect(page.getByRole('radio', { name: /Tshwane electricity readings/ })).not.toBeChecked();
  });

  test('file input accepts Excel files', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.locator('#file-input')).toHaveAttribute('accept', '.xlsx,.xls');
  });

  test('drop zone shows the limits for the selected export', async ({ page }) => {
    await page.goto('/upload');
    const hint = page.locator('.dropzone__hint');
    await expect(hint).toContainText('.xlsx or .xls · up to 10 MB · 12 columns in fixed order');

    await page.getByRole('radio', { name: /Tshwane electricity readings/ }).check();
    await expect(hint).toContainText('Elektrisiteit Lesings');
  });

  test('choosing a file shows it and enables Upload & preview', async ({ page }) => {
    await page.goto('/upload');
    const uploadButton = page.getByRole('button', { name: 'Upload & preview' });
    await expect(uploadButton).toBeDisabled();

    await page.locator('#file-input').setInputFiles(excelFile('solarman_export.xlsx'));
    await expect(page.locator('.selected-file')).toContainText('solarman_export.xlsx');
    await expect(uploadButton).toBeEnabled();

    await page.getByRole('button', { name: 'Remove file' }).click();
    await expect(page.locator('.selected-file')).toHaveCount(0);
    await expect(uploadButton).toBeDisabled();
  });

  test('a non-Excel file shows an inline error', async ({ page }) => {
    await page.goto('/upload');
    await page.locator('#file-input').setInputFiles({
      name: 'readings.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('a,b,c'),
    });
    await expect(page.getByRole('alert')).toContainText('Invalid file format');
    await expect(page.getByRole('button', { name: 'Upload & preview' })).toBeDisabled();
  });
});

test.describe('Upload Workflow - SolarMan File', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
    await mockUploadAndImport(page);
  });

  test('Upload & preview shows the review step', async ({ page }) => {
    await goToPreview(page);
    await expect(page.getByRole('heading', { name: 'Check the data before importing' })).toBeVisible();
    await expect(page.locator('.step[aria-current="step"]')).toContainText('Review');
  });

  test('preview shows record count, table and actions', async ({ page }) => {
    await goToPreview(page);
    await expect(page.locator('.preview-info')).toContainText('150');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Production W' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import 150 records' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('importing shows the result with inserted and updated counts', async ({ page }) => {
    await goToPreview(page);
    await page.getByRole('button', { name: 'Import 150 records' }).click();

    const result = page.locator('.result');
    await expect(result.getByRole('heading', { name: 'Import complete' })).toBeVisible();
    await expect(page.locator('.step[aria-current="step"]')).toContainText('Done');
    await expect(result.locator('.stat').nth(0)).toContainText('120');
    await expect(result.locator('.stat').nth(1)).toContainText('30');
    await expect(result.locator('.stat').nth(2)).toContainText('0');
  });

  test('Import another file resets to the choose-file step', async ({ page }) => {
    await goToPreview(page);
    await page.getByRole('button', { name: 'Import 150 records' }).click();
    await expect(page.getByRole('heading', { name: 'Import complete' })).toBeVisible();

    await page.getByRole('button', { name: 'Import another file' }).click();
    await expect(page.locator('app-file-upload')).toBeVisible();
    await expect(page.locator('.step[aria-current="step"]')).toContainText('Choose file');
  });

  test('View overview navigates to the home page', async ({ page }) => {
    await goToPreview(page);
    await page.getByRole('button', { name: 'Import 150 records' }).click();
    await expect(page.getByRole('heading', { name: 'Import complete' })).toBeVisible();

    await page.getByRole('button', { name: 'View overview' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Energy overview' })).toBeVisible();
  });

  test('Back from preview returns to the choose-file step', async ({ page }) => {
    await goToPreview(page);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('app-file-upload')).toBeVisible();
    await expect(page.locator('app-data-preview')).toHaveCount(0);
  });
});

test.describe('Upload Workflow - Tshwane File', () => {
  test('Tshwane file upload works end-to-end', async ({ page }) => {
    await mockAllAPIs(page);
    await mockUploadAndImport(page, 'tshwane');

    await page.goto('/upload');
    await page.getByRole('radio', { name: /Tshwane electricity readings/ }).check();
    await page.locator('#file-input').setInputFiles(excelFile('tshwane_electricity.xlsx'));
    await expect(page.locator('.selected-file')).toContainText('tshwane_electricity.xlsx');

    const uploadRequest = page.waitForRequest('**/api/upload/tshwane');
    await page.getByRole('button', { name: 'Upload & preview' }).click();
    await uploadRequest;
    await expect(page.locator('app-data-preview .badge')).toContainText('Tshwane');

    await page.getByRole('button', { name: /^Import \d+ records$/ }).click();
    await expect(page.getByRole('heading', { name: 'Import complete' })).toBeVisible();
    await expect(page.locator('.result .stat').first()).toContainText('120');
  });
});
