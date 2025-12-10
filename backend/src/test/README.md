# Backend Unit Tests

## Overview
This directory contains comprehensive unit tests for the SolarManExcel2DB backend application, built with Spring Boot and JUnit 5.

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
- ✅ Valid Excel file processing
- ✅ Column validation (12 expected columns)
- ✅ Date filtering (after January 1, 2020)
- ✅ Invalid file format handling
- ✅ Empty/corrupted file handling

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
