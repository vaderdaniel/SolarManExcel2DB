import { test, expect } from '@playwright/test';
import {
  mockAllAPIs,
  mockUploadResponse,
  mockImportResult,
} from './mock-api';

test.describe('Upload Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test('shows file selection view by default', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.locator('app-file-upload')).toBeVisible();
    await expect(page.locator('text=File Upload')).toBeVisible();
    await expect(page.locator('text=Select and upload Excel files')).toBeVisible();
  });

  test('SolarMan and Tshwane upload options are visible', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.locator('text=SolarMan Excel File')).toBeVisible();
    await expect(page.locator('text=Tshwane Electricity File')).toBeVisible();
  });

  test('SolarMan and Tshwane file inputs accept Excel files', async ({ page }) => {
    await page.goto('/upload');
    const solarmanInput = page.locator('#solarman-file');
    const tshwaneInput = page.locator('#tshwane-file');
    await expect(solarmanInput).toHaveAttribute('accept', '.xlsx,.xls');
    await expect(tshwaneInput).toHaveAttribute('accept', '.xlsx,.xls');
  });

  test('upload guidelines are displayed', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.locator('text=Upload Guidelines')).toBeVisible();
    await expect(page.locator('text=Maximum file size: 10MB')).toBeVisible();
    await expect(page.locator('text=Supported formats: .xlsx, .xls')).toBeVisible();
  });
});

test.describe('Upload Workflow - SolarMan File', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test('file selection shows file info and Upload button', async ({ page }) => {
    await page.goto('/upload');

    // Create a mock Excel file and trigger file selection
    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });

    // Should show file info
    await expect(page.locator('.selected-file-info')).toBeVisible();
    await expect(page.locator('text=solarman_export.xlsx')).toBeVisible();
    await expect(page.locator('.file-type')).toContainText('solarman');

    // Upload button should be visible
    await expect(page.locator('button', { hasText: 'Upload & Preview' })).toBeVisible();
  });

  test('Upload & Preview button triggers upload and shows preview', async ({ page }) => {
    const uploadResponse = mockUploadResponse();
    await page.route('**/api/upload/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );

    await page.goto('/upload');

    // Select a file
    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });

    // Click Upload & Preview
    await page.locator('button', { hasText: 'Upload & Preview' }).click();

    // Should transition to preview view
    await expect(page.locator('app-data-preview')).toBeVisible();
    await expect(page.locator('text=Data Preview')).toBeVisible();
  });

  test('preview shows record count and table', async ({ page }) => {
    const uploadResponse = mockUploadResponse();
    await page.route('**/api/upload/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );

    await page.goto('/upload');

    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });

    await page.locator('button', { hasText: 'Upload & Preview' }).click();
    await expect(page.locator('app-data-preview')).toBeVisible();

    // Should show total records count
    await expect(page.locator('text=Total records to import:')).toBeVisible();
    await expect(page.locator('.preview-info')).toContainText('150');

    // Table should be visible
    await expect(page.locator('table')).toBeVisible();

    // Confirm and Cancel buttons should be present
    await expect(page.locator('button', { hasText: 'Confirm Import' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Cancel' })).toBeVisible();
  });

  test('Confirm Import transitions to result view', async ({ page }) => {
    const uploadResponse = mockUploadResponse();
    const importResult = mockImportResult();

    await page.route('**/api/upload/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );
    await page.route('**/api/import/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(importResult) })
    );

    await page.goto('/upload');

    // Select file and upload
    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
    await page.locator('button', { hasText: 'Upload & Preview' }).click();
    await expect(page.locator('app-data-preview')).toBeVisible();

    // Confirm import
    await page.locator('button', { hasText: 'Confirm Import' }).click();

    // Should show result view
    await expect(page.locator('text=Import Completed')).toBeVisible();
  });

  test('result view shows records inserted and updated stats', async ({ page }) => {
    const uploadResponse = mockUploadResponse();
    const importResult = mockImportResult();

    await page.route('**/api/upload/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );
    await page.route('**/api/import/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(importResult) })
    );

    await page.goto('/upload');

    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
    await page.locator('button', { hasText: 'Upload & Preview' }).click();
    await expect(page.locator('app-data-preview')).toBeVisible();
    await page.locator('button', { hasText: 'Confirm Import' }).click();

    // Verify import stats
    await expect(page.locator('text=Import Completed')).toBeVisible();
    await expect(page.locator('text=Records Inserted:')).toBeVisible();
    await expect(page.locator('text=120')).toBeVisible();
    await expect(page.locator('text=Records Updated:')).toBeVisible();
    await expect(page.locator('text=30')).toBeVisible();
  });

  test('Import Another File resets to upload view', async ({ page }) => {
    const uploadResponse = mockUploadResponse();
    const importResult = mockImportResult();

    await page.route('**/api/upload/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );
    await page.route('**/api/import/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(importResult) })
    );

    await page.goto('/upload');

    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
    await page.locator('button', { hasText: 'Upload & Preview' }).click();
    await expect(page.locator('app-data-preview')).toBeVisible();
    await page.locator('button', { hasText: 'Confirm Import' }).click();
    await expect(page.locator('text=Import Completed')).toBeVisible();

    // Click Import Another File
    await page.locator('button', { hasText: 'Import Another File' }).click();

    // Should be back to upload view
    await expect(page.locator('app-file-upload')).toBeVisible();
    await expect(page.locator('app-file-upload mat-card-title')).toContainText('File Upload');
  });

  test('Go to Home navigates to home page', async ({ page }) => {
    const uploadResponse = mockUploadResponse();
    const importResult = mockImportResult();

    await page.route('**/api/upload/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );
    await page.route('**/api/import/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(importResult) })
    );

    await page.goto('/upload');

    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
    await page.locator('button', { hasText: 'Upload & Preview' }).click();
    await expect(page.locator('app-data-preview')).toBeVisible();
    await page.locator('button', { hasText: 'Confirm Import' }).click();
    await expect(page.locator('text=Import Completed')).toBeVisible();

    // Click Go to Home
    await page.locator('button', { hasText: 'Go to Home' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('text=Solar Production')).toBeVisible();
  });

  test('Cancel from preview returns to upload view', async ({ page }) => {
    const uploadResponse = mockUploadResponse();
    await page.route('**/api/upload/solarman', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );

    await page.goto('/upload');

    const buffer = Buffer.from('mock excel content');
    await page.locator('#solarman-file').setInputFiles({
      name: 'solarman_export.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
    await page.locator('button', { hasText: 'Upload & Preview' }).click();
    await expect(page.locator('app-data-preview')).toBeVisible();

    // Click Cancel
    await page.locator('button', { hasText: 'Cancel' }).click();

    // Should be back to upload view
    await expect(page.locator('app-file-upload')).toBeVisible();
    await expect(page.locator('app-file-upload mat-card-title')).toContainText('File Upload');
  });
});

test.describe('Upload Workflow - Tshwane File', () => {
  test('Tshwane file upload works end-to-end', async ({ page }) => {
    await mockAllAPIs(page);

    const uploadResponse = {
      ...mockUploadResponse(),
      fileType: 'tshwane',
    };
    const importResult = mockImportResult();

    await page.route('**/api/upload/tshwane', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uploadResponse) })
    );
    await page.route('**/api/import/tshwane', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(importResult) })
    );

    await page.goto('/upload');

    // Select Tshwane file
    const buffer = Buffer.from('mock tshwane content');
    await page.locator('#tshwane-file').setInputFiles({
      name: 'tshwane_electricity.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });

    await expect(page.locator('text=tshwane_electricity.xlsx')).toBeVisible();
    await page.locator('button', { hasText: 'Upload & Preview' }).click();
    await expect(page.locator('app-data-preview')).toBeVisible();

    await page.locator('button', { hasText: 'Confirm Import' }).click();
    await expect(page.locator('text=Import Completed')).toBeVisible();
    await expect(page.locator('text=120')).toBeVisible();
  });
});
