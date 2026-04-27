# Unit Tests

## Overview
This repository contains unit tests for both the backend (Spring Boot / JUnit 5) and frontend (Angular / Vitest) of SolarManExcel2DB.

| Layer | Tests | Runner |
|-------|-------|--------|
| Backend | 56 | `mvn test` |
| Frontend | 31 | `npx ng test --no-watch` |

---

# Backend Tests

## Test Structure

```
src/test/java/com/loots/solarmanui/
├── controller/
│   └── DatabaseControllerTest.java      # REST API endpoint tests
├── service/
│   ├── DatabaseServiceTest.java         # Database operations tests
│   ├── ImportServiceTest.java           # Data import tests
│   └── ExcelProcessingServiceTest.java  # Excel parsing tests
```

## Running Tests

### Run All Tests
```bash
mvn test
```

### Run Specific Test Class
```bash
mvn test -Dtest=DatabaseServiceTest
mvn test -Dtest=DatabaseControllerTest
```

### Run Single Test Method
```bash
mvn test -Dtest=DatabaseServiceTest#testGetProductionStats_SuccessfulCalculation
```

### Generate Test Coverage Report
```bash
mvn test jacoco:report
# Report available at: target/site/jacoco/index.html
```

## Test Coverage Summary

**Total: 56 backend tests** (DatabaseServiceTest: 10, DatabaseControllerTest: 11, ImportServiceTest: 19, ExcelProcessingServiceTest: 16)

### DatabaseServiceTest (10 tests)
Tests the core database service layer, focusing on production statistics calculation.

**Key Tests:**
- ✅ Time-weighted production calculation using SQL window functions
- ✅ Empty result and null handling
- ✅ Various day parameters (1, 7, 30, 365)
- ✅ Connection and query exception handling
- ✅ SQL query verification (LAG, EXTRACT, GREATEST functions)
- ✅ Correct table/column usage (`public.loots_inverter`)

**Example:**
```java
@Test
void testGetProductionStats_SuccessfulCalculation() throws SQLException {
    // Mock database response with 3 days of production data
    when(resultSet.getDouble("production_units"))
        .thenReturn(45600.5)  // Day 1
        .thenReturn(43200.0)  // Day 2
        .thenReturn(41000.25); // Day 3
    
    List<ProductionStat> stats = databaseService.getProductionStats(7);
    
    assertEquals(3, stats.size());
    assertEquals(45600.5, stats.get(0).getProductionUnits());
}
```

### DatabaseControllerTest (11 tests)
Tests the REST API controller layer for database-related endpoints.

**Key Tests:**
- ✅ `/api/database/production-stats` endpoint response format
- ✅ HTTP 200 status with correct JSON structure
- ✅ Default and custom `days` parameter handling
- ✅ Empty result handling
- ✅ Service exception handling (returns empty list, not error)
- ✅ LocalDate and Double serialization verification

**Example:**
```java
@Test
void testGetProductionStats_SuccessfulResponse() {
    List<ProductionStat> mockStats = Arrays.asList(
        new ProductionStat(LocalDate.of(2024, 12, 8), 45600.5)
    );
    when(databaseService.getProductionStats(7)).thenReturn(mockStats);
    
    ResponseEntity<List<ProductionStat>> response = 
        databaseController.getProductionStats(7);
    
    assertEquals(HttpStatus.OK, response.getStatusCode());
    assertEquals(1, response.getBody().size());
}
```

### ImportServiceTest (19 tests)
Tests data import functionality for both SolarMan and Tshwane data sources.

**Key Tests:**
- ✅ Successful import operations (SolarMan and Tshwane)
- ✅ Empty list handling
- ✅ Null field validation
- ✅ Database connection error handling
- ✅ Partial failure scenarios
- ✅ Date range tracking
- ✅ Error logging (limited to 100 entries)
- ✅ SQL injection prevention via PreparedStatements

### ExcelProcessingServiceTest (16 tests)
Tests Excel file parsing and data extraction.

**Key Tests:**
- ✅ Valid SolarMan and Tshwane file processing
- ✅ Column validation (12 expected columns)
- ✅ Date filtering (after January 1, 2020)
- ✅ Multiple date format parsing (yyyy/MM/dd, MM/dd/yyyy, SQL format)
- ✅ Excel date serial number conversion
- ✅ Empty rows and null value handling
- ✅ Invalid file format / missing sheet handling
- ✅ File format validation (.xlsx, .xls, .csv rejection)

## Testing Patterns

### Mocking with Mockito
All tests use Mockito for mocking dependencies:

```java
@ExtendWith(MockitoExtension.class)
class DatabaseServiceTest {
    @Mock
    private DataSource dataSource;
    
    @InjectMocks
    private DatabaseService databaseService;
}
```

### Lenient Stubbing
For flexible mock setup in `@BeforeEach`:

```java
@BeforeEach
void setUp() throws SQLException {
    lenient().when(dataSource.getConnection()).thenReturn(connection);
}
```

### Verification
Verify method calls and parameters:

```java
verify(preparedStatement).setInt(1, 7);
verify(connection).prepareStatement(contains("LAG(updated)"));
```

## Test Data Helpers

### Creating Test Records
```java
private ProductionStat createProductionStat(LocalDate date, double units) {
    return new ProductionStat(date, units);
}

private SolarManRecord createSolarManRecord(LocalDateTime updated, double power) {
    SolarManRecord record = new SolarManRecord();
    record.setUpdated(updated);
    record.setProductionPower(power);
    // ... set other fields
    return record;
}
```

## Best Practices

1. **Test Independence**: Each test should be independent and not rely on execution order
2. **Descriptive Names**: Test method names clearly describe what is being tested
3. **Arrange-Act-Assert**: Follow AAA pattern for test structure
4. **Mock External Dependencies**: Database, file system, network calls are mocked
5. **Edge Cases**: Tests cover null values, empty collections, and error conditions
6. **SQL Verification**: Complex SQL queries are verified for correctness

## Troubleshooting

### ByteBuddy Experimental Warning
If you see warnings about ByteBuddy on Java 25:
```bash
mvn test -Dnet.bytebuddy.experimental=true
```

This is already configured in `pom.xml`:
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>-Dnet.bytebuddy.experimental=true</argLine>
    </configuration>
</plugin>
```

### Test Failures
If tests fail:
1. Check mock setup in `@BeforeEach`
2. Verify test data matches expected values
3. Ensure proper exception handling in tests
4. Check for resource leaks (connections, streams)

## Adding New Tests

When adding new tests:
1. Follow existing naming conventions (`test[MethodName]_[Scenario]`)
2. Add `@Test` annotation
3. Use appropriate assertions from JUnit 5
4. Mock all external dependencies
5. Verify the behavior, not the implementation
6. Add comments for complex test scenarios

## Resources

- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)

---

# Frontend Tests

## Test Structure

```
frontend/solarman-ui/src/app/
├── components/
│   └── production-chart/
│       ├── production-chart.ts          # Component
│       └── production-chart.spec.ts     # 18 tests
├── pages/
│   └── upload/
│       ├── upload.ts                    # Page component
│       └── upload.spec.ts               # 11 tests
└── app.spec.ts                          # 2 tests
```

## Running Tests

```bash
cd frontend/solarman-ui
npx ng test --no-watch    # run once
npx ng test               # watch mode (re-runs on file change)
npx playwright test       # e2e tests (requires :4200 running)
```

## Test Coverage Summary

### ProductionChartComponent (18 tests)

#### processChartData (10 tests)
- ✅ Calculates `yAxisMax` — rounds to "nice" numbers (e.g., 45600.5 → 50000, 15 → 20, 87000 → 100000)
- ✅ Calculates `heightPercent` for each bar (0–100%)
- ✅ Handles empty arrays and null/undefined stats
- ✅ Sets `yAxisMax` to 10 when max value is 0
- ✅ Sorts data by date ascending (oldest to newest)
- ✅ Generates 5 y-axis labels from max to 0

#### Chart Auto-Refresh (5 tests)
- ✅ Reloads chart data when `ChartRefreshService` triggers refresh
- ✅ Subscribes to `refresh$` on `ngOnInit`
- ✅ Unsubscribes from `refresh$` on `ngOnDestroy`
- ✅ Handles multiple refresh triggers
- ✅ Updates `yAxisMax` when refresh provides different data

#### Loading and Error States (3 tests)
- ✅ Sets loading state during data fetch
- ✅ Handles error state when data fetch fails
- ✅ Clears error state on successful refresh

### UploadComponent (11 tests)

#### Chart Refresh After Import (5 tests)
- ✅ Triggers refresh after successful import (fileId path)
- ✅ Triggers refresh after successful import (data array path)
- ✅ Does NOT trigger refresh when import fails
- ✅ Triggers refresh for Tshwane file type
- ✅ Triggers refresh exactly once per successful import

#### Import Service Interaction (2 tests)
- ✅ Calls `importDataByFileId` when fileId is available
- ✅ Calls `importData` when fileId is null (fallback)

#### Component State Management (2 tests)
- ✅ Updates view to `'result'` after successful import
- ✅ Does NOT change view when import fails

#### Import Flag Management (2 tests)
- ✅ Clears `isImporting` after successful import
- ✅ Clears `isImporting` after failed import

## Testing Patterns

### Component Setup with TestBed
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [ProductionChartComponent],
    providers: [
      { provide: DatabaseService, useValue: mockDatabaseService },
      { provide: ChartRefreshService, useValue: mockChartRefreshService }
    ]
  }).compileComponents();
  fixture = TestBed.createComponent(ProductionChartComponent);
  component = fixture.componentInstance;
});
```

### Mocking Services with Vitest
```typescript
import { vi } from 'vitest';
const mockDatabaseService = { getProductionStats: vi.fn() };

// For observable properties
Object.defineProperty(mockChartRefreshService, 'refresh$', {
  get: () => refreshSubject.asObservable()
});
```

### Testing with Synchronous Observables
`of()` emits synchronously — no `fakeAsync`/`tick` needed:
```typescript
mockService.getData.mockReturnValue(of(testData));
component.doSomething();
expect(component.result).toBe(expectedValue);
```

### Error Case
```typescript
mockService.getData.mockReturnValue(throwError(() => new Error('DB error')));
fixture.detectChanges();
expect(component.hasError).toBe(true);
```

## Common Troubleshooting

| Error | Fix |
|-------|-----|
| "No provider for HttpClient" | Use `provideHttpClient()` + `provideHttpClientTesting()` in providers |
| "Cannot read property 'subscribe' of undefined" | Ensure mocked services return observables via `of(...)` |
| "Expected to be running in 'ProxyZone'" | Remove `fakeAsync`/`tick` — `of()` is synchronous |

## Configuration

- **Runner**: Vitest via `@angular/build:unit-test` builder
- **Environment**: jsdom
- **TypeScript**: `tsconfig.spec.json` with `vitest/globals` types
- **Zone.js**: `zone.js/testing` polyfill included via Angular build config

## Adding New Tests

1. Create `my-component.spec.ts` next to the component
2. Use `describe('MyComponent', () => { ... })`
3. Configure `TestBed` in `beforeEach`
4. Mock all injected services
5. Name tests: `it('should do X when Y happens', ...)`

## Resources

- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Vitest Documentation](https://vitest.dev/)
- [RxJS Testing](https://rxjs.dev/guide/testing/marble-testing)
- [Angular Material Harnesses](https://material.angular.io/guide/using-component-harnesses)
