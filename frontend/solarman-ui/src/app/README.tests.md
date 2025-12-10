# Frontend Unit Tests

## Overview
This directory contains comprehensive unit tests for the SolarManExcel2DB frontend application, built with Angular 20 and Jasmine/Karma.

## Test Structure

```
src/app/
├── components/
│   └── production-chart/
│       ├── production-chart.ts          # Component implementation
│       └── production-chart.spec.ts     # Component tests (18 tests)
├── pages/
│   └── upload/
│       ├── upload.ts                    # Page component
│       └── upload.spec.ts               # Page tests (11 tests)
└── services/
    ├── database.service.ts              # Database API service
    ├── chart-refresh.service.ts         # Chart refresh coordination
    └── import.service.ts                # Import operations
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# Run production chart tests only
npm test -- --include='**/production-chart.spec.ts' --watch=false

# Run upload component tests only
npm test -- --include='**/upload.spec.ts' --watch=false

# Run multiple test files
npm test -- --include='**/{production-chart,upload}.spec.ts' --watch=false
```

### Run Tests in Watch Mode (Development)
```bash
npm test
# Tests will re-run automatically when files change
```

### Run Tests in Headless Mode (CI/CD)
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Test Coverage Summary

### ProductionChartComponent (18 tests)
Tests the production chart visualization component that displays solar production data.

**Key Tests:**

#### processChartData Method (10 tests)
- ✅ Correctly calculates `yAxisMax` for typical production data
  - Rounds to "nice" numbers (e.g., 45600.5 → 50000)
  - Handles various magnitudes (small: 15 → 20, medium: 3500 → 5000, large: 87000 → 100000)
- ✅ Correctly calculates `heightPercent` for each bar (0-100%)
- ✅ Handles empty data arrays
- ✅ Handles null/undefined stats
- ✅ Calculates `yAxisMax` as 10 when max value is 0
- ✅ Sorts data by date ascending (oldest to newest)
- ✅ Generates correct y-axis labels (5 labels from max to 0)

**Example:**
```typescript
it('should correctly calculate yAxisMax for typical production data', () => {
  const stats: ProductionStat[] = [
    { date: '2024-12-08', productionUnits: 45600.5 }
  ];
  
  mockDatabaseService.getProductionStats.and.returnValue(of(stats));
  fixture.detectChanges();
  
  // yAxisMax should be rounded up to 50000 (nice round number)
  expect(component.yAxisMax).toBe(50000);
});
```

#### Chart Auto-Refresh (5 tests)
- ✅ Reloads chart data when ChartRefreshService triggers refresh
- ✅ Subscribes to `refresh$` on component init
- ✅ Unsubscribes from `refresh$` on component destroy
- ✅ Handles multiple refresh triggers
- ✅ Updates `yAxisMax` when refresh provides different data
- ✅ Handles errors during refresh gracefully

**Example:**
```typescript
it('should reload chart data when ChartRefreshService triggers refresh', () => {
  const initialStats = [{ date: '2024-12-08', productionUnits: 45600.5 }];
  mockDatabaseService.getProductionStats.and.returnValue(of(initialStats));
  fixture.detectChanges();
  
  expect(component.chartData.length).toBe(1);
  
  // Update mock and trigger refresh
  const updatedStats = [
    { date: '2024-12-08', productionUnits: 45600.5 },
    { date: '2024-12-09', productionUnits: 50000.0 }
  ];
  mockDatabaseService.getProductionStats.and.returnValue(of(updatedStats));
  refreshSubject.next();
  
  expect(component.chartData.length).toBe(2);
});
```

#### Loading and Error States (3 tests)
- ✅ Sets loading state during data fetch
- ✅ Handles error state when data fetch fails
- ✅ Clears error state on successful refresh

### UploadComponent (11 tests)
Tests the upload page component that manages file imports and triggers chart updates.

**Key Tests:**

#### Chart Refresh After Import (5 tests)
- ✅ Triggers chart refresh after successful import using fileId
- ✅ Triggers chart refresh after successful import using data array
- ✅ Does NOT trigger chart refresh when import fails
- ✅ Triggers chart refresh for Tshwane file type
- ✅ Triggers chart refresh exactly once per successful import

**Example:**
```typescript
it('should trigger chart refresh after successful import', fakeAsync(() => {
  const mockImportResult: ImportResult = {
    recordsInserted: 10,
    recordsUpdated: 5,
    // ... other fields
  };
  
  mockImportService.importDataByFileId.and.returnValue(of(mockImportResult));
  
  component.fileId = 'test-file-id';
  component.onImportConfirmed({ data: [], fileType: 'solarman' });
  
  tick(); // Wait for async operations
  
  expect(mockChartRefreshService.triggerRefresh).toHaveBeenCalledTimes(1);
  expect(component.currentView).toBe('result');
}));
```

#### Import Service Interaction (2 tests)
- ✅ Calls `importDataByFileId` when fileId is available
- ✅ Calls `importData` when fileId is null (fallback)

#### Component State Management (2 tests)
- ✅ Updates component view to 'result' after successful import
- ✅ Does NOT change view when import fails

#### Import Flag Management (2 tests)
- ✅ Clears `isImporting` flag after successful import
- ✅ Clears `isImporting` flag after failed import

## Testing Patterns

### Component Testing with TestBed
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [ProductionChartComponent, HttpClientTestingModule],
    providers: [
      { provide: DatabaseService, useValue: mockDatabaseService },
      { provide: ChartRefreshService, useValue: mockChartRefreshService }
    ]
  }).compileComponents();
  
  fixture = TestBed.createComponent(ProductionChartComponent);
  component = fixture.componentInstance;
});
```

### Mocking Services with Jasmine
```typescript
mockDatabaseService = jasmine.createSpyObj('DatabaseService', ['getProductionStats']);
mockChartRefreshService = jasmine.createSpyObj('ChartRefreshService', ['triggerRefresh']);

// Setup observable properties
Object.defineProperty(mockChartRefreshService, 'refresh$', {
  get: () => refreshSubject.asObservable()
});
```

### Testing Async Operations with fakeAsync/tick
```typescript
it('should handle async operations', fakeAsync(() => {
  mockService.someMethod.and.returnValue(of(data));
  
  component.doSomething();
  tick(); // Advance virtual time to complete async operations
  
  expect(component.result).toBe(expectedValue);
}));
```

### Testing Observables with RxJS
```typescript
// Success case
mockService.getData.and.returnValue(of(testData));

// Error case
mockService.getData.and.returnValue(
  throwError(() => new Error('Test error'))
);
```

### Testing Subject Emissions
```typescript
const refreshSubject = new Subject<void>();

// Trigger the subject
refreshSubject.next();

// Verify subscription behavior
expect(component.wasRefreshed).toBe(true);
```

## Test Data Helpers

### Creating Mock Production Stats
```typescript
const mockStats: ProductionStat[] = [
  { date: '2024-12-08', productionUnits: 45600.5 },
  { date: '2024-12-07', productionUnits: 43200.0 }
];
```

### Creating Mock Import Results
```typescript
const mockImportResult: ImportResult = {
  recordsInserted: 10,
  recordsUpdated: 5,
  firstRecordDate: new Date('2024-12-01'),
  lastRecordDate: new Date('2024-12-08'),
  errorCount: 0,
  errors: [],
  success: true
};
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not affect others
2. **Use fakeAsync/tick**: For testing asynchronous code predictably
3. **Mock External Dependencies**: HTTP calls, services, etc. should be mocked
4. **Test User Behavior**: Focus on what users see and interact with
5. **Verify Observable Subscriptions**: Ensure proper subscription/unsubscription
6. **Test Edge Cases**: Empty data, null values, errors
7. **Keep Tests Simple**: One assertion per test when possible

## Common Patterns

### Testing Component Lifecycle
```typescript
it('should unsubscribe on component destroy', () => {
  fixture.detectChanges(); // Triggers ngOnInit
  
  const unsubscribeSpy = spyOn(
    (component as any).refreshSubscription, 
    'unsubscribe'
  );
  
  fixture.destroy(); // Triggers ngOnDestroy
  
  expect(unsubscribeSpy).toHaveBeenCalled();
});
```

### Testing Error Handling
```typescript
it('should handle error state when data fetch fails', () => {
  mockService.getData.and.returnValue(
    throwError(() => new Error('Database error'))
  );
  
  fixture.detectChanges();
  
  expect(component.hasError).toBe(true);
  expect(component.errorMessage).toBe('Failed to load data');
});
```

### Testing Service Calls
```typescript
it('should call service with correct parameters', fakeAsync(() => {
  component.loadData(7);
  tick();
  
  expect(mockService.getData).toHaveBeenCalledWith(7);
  expect(mockService.getData).toHaveBeenCalledTimes(1);
}));
```

## Troubleshooting

### Common Issues

#### "No provider for HttpClient"
Add `HttpClientTestingModule` to imports:
```typescript
await TestBed.configureTestingModule({
  imports: [MyComponent, HttpClientTestingModule]
});
```

#### "Cannot read property 'subscribe' of undefined"
Ensure mocked services return observables:
```typescript
mockService.getData.and.returnValue(of(mockData));
```

#### "Expected spy to have been called but it was not"
Check if async operations completed:
```typescript
it('test name', fakeAsync(() => {
  // ... test code ...
  tick(); // Add this to complete async operations
  expect(spy).toHaveBeenCalled();
}));
```

#### Tests Timing Out
Reduce default timeout or check for infinite loops:
```typescript
beforeEach(() => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000; // 10 seconds
});
```

## Debugging Tests

### Running Tests with Console Output
```bash
npm test -- --watch=false --browsers=Chrome
# Opens Chrome DevTools for debugging
```

### Adding Debug Breakpoints
```typescript
it('should do something', () => {
  debugger; // Execution will pause here in Chrome DevTools
  component.doSomething();
  expect(component.result).toBe(expectedValue);
});
```

### Logging Test Data
```typescript
it('should process data correctly', () => {
  fixture.detectChanges();
  console.log('Component state:', component.chartData);
  expect(component.chartData.length).toBe(3);
});
```

## Adding New Tests

When adding new tests:

1. **Create test file** next to component: `my-component.spec.ts`
2. **Follow naming convention**: `describe('MyComponent', () => { ... })`
3. **Setup TestBed** in `beforeEach`
4. **Mock all dependencies**
5. **Use descriptive test names**: `it('should do X when Y happens', ...)`
6. **Clean up** in `afterEach` if needed
7. **Test accessibility**: Use semantic HTML and ARIA labels

## Resources

- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Configuration](https://karma-runner.github.io/latest/config/configuration-file.html)
- [RxJS Testing](https://rxjs.dev/guide/testing/marble-testing)
- [Angular Material Testing](https://material.angular.io/guide/using-component-harnesses)

## Test Configuration

### karma.conf.js
The project uses Karma with Jasmine and ChromeHeadless for CI/CD compatibility.

### tsconfig.spec.json
TypeScript configuration for test files, includes `node_modules/@angular/*/testing`.

### Angular.json
Test configuration in `projects.solarman-ui.architect.test`.
