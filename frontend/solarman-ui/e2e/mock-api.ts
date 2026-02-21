import { Page } from '@playwright/test';

/** Mock production stats for the last 7 days */
export function mockProductionStats() {
  const stats = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    stats.push({
      date: date.toISOString().split('T')[0],
      productionUnits: 3000 + Math.round(Math.random() * 2000),
    });
  }
  return stats;
}

/** Mock database status (connected) */
export function mockStatusConnected() {
  return {
    connected: true,
    message: 'Database connected',
    apiStatus: 'ready',
  };
}

/** Mock database status (disconnected) */
export function mockStatusDisconnected() {
  return {
    connected: false,
    message: 'API unavailable',
    apiStatus: 'unavailable',
  };
}

/** Mock latest records */
export function mockLatestRecords() {
  return {
    solarman: '2026-02-20T14:30:00',
    tshwane: '2026-02-18T09:15:00',
  };
}

/** Mock upload response with preview data */
export function mockUploadResponse() {
  return {
    previewData: [
      {
        Updated: '2026-02-20 10:00:00',
        'Production Power': 1500,
        'Consumption Power': 800,
        'Grid Power': -700,
        'Purchasing Power': 0,
        'Feed-in': 700,
        'Battery Power': 200,
        'Charging Power': 200,
        'Discharging Power': 0,
        SoC: 85,
      },
      {
        Updated: '2026-02-20 10:05:00',
        'Production Power': 1600,
        'Consumption Power': 850,
        'Grid Power': -750,
        'Purchasing Power': 0,
        'Feed-in': 750,
        'Battery Power': 180,
        'Charging Power': 180,
        'Discharging Power': 0,
        SoC: 87,
      },
      {
        Updated: '2026-02-20 10:10:00',
        'Production Power': 1700,
        'Consumption Power': 900,
        'Grid Power': -800,
        'Purchasing Power': 0,
        'Feed-in': 800,
        'Battery Power': 150,
        'Charging Power': 150,
        'Discharging Power': 0,
        SoC: 89,
      },
    ],
    totalRecords: 150,
    fileType: 'solarman',
    fileId: 'mock-file-id-123',
  };
}

/** Mock import result */
export function mockImportResult() {
  return {
    recordsInserted: 120,
    recordsUpdated: 30,
    firstRecordDate: '2026-02-20T00:00:00',
    lastRecordDate: '2026-02-20T23:55:00',
    errorCount: 0,
    errors: [],
    success: true,
    message: 'Import completed successfully',
  };
}

/**
 * Set up all API mocks for a healthy/connected backend.
 * Call this before navigating to any page.
 */
export async function mockAllAPIs(page: Page) {
  await page.route('**/api/database/status', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockStatusConnected()) })
  );

  await page.route('**/api/database/production-stats*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProductionStats()) })
  );

  await page.route('**/api/database/latest-records', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockLatestRecords()) })
  );
}
