package com.loots.solarmanui.service;

import com.loots.solarmanui.model.ImportResult;
import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImportServiceTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private PreparedStatement preparedStatement;

    @InjectMocks
    private ImportService importService;

    @BeforeEach
    void setUp() throws SQLException {
        // Reset any state
        importService.clearErrorLogs();
        
        // Setup default mock behavior (lenient to allow tests to override)
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.prepareStatement(anyString())).thenReturn(preparedStatement);
        lenient().doNothing().when(connection).setAutoCommit(anyBoolean());
    }

    // ==================== SolarMan Import Tests ====================

    @Test
    void testImportSolarManData_SuccessfulImport() throws SQLException {
        // Create test data
        List<SolarManRecord> records = createValidSolarManRecords();

        // Mock successful database inserts
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        ImportResult result = importService.importSolarManData(records);

        // Verify results
        assertNotNull(result);
        assertEquals(2, result.getRecordsInserted());
        assertEquals(0, result.getRecordsUpdated());
        assertEquals(0, result.getErrorCount());
        assertEquals(LocalDateTime.of(2024, 1, 15, 10, 0), result.getFirstRecordDate());
        assertEquals(LocalDateTime.of(2024, 1, 15, 11, 0), result.getLastRecordDate());

        // Verify database interactions
        verify(preparedStatement, times(2)).executeUpdate();
        verify(preparedStatement, times(2)).setTimestamp(eq(1), any(Timestamp.class));
        verify(preparedStatement, times(18)).setDouble(anyInt(), anyDouble()); // 9 fields * 2 records
    }

    @Test
    void testImportSolarManData_EmptyList() throws SQLException {
        // Create empty list
        List<SolarManRecord> records = new ArrayList<>();

        // Execute import
        ImportResult result = importService.importSolarManData(records);

        // Verify results
        assertNotNull(result);
        assertEquals(0, result.getRecordsInserted());
        assertEquals(0, result.getErrorCount());
        assertNull(result.getFirstRecordDate());
        assertNull(result.getLastRecordDate());

        // Verify no database interactions
        verify(preparedStatement, never()).executeUpdate();
    }

    @Test
    void testImportSolarManData_NullUpdatedField() throws SQLException {
        // Create record with null updated field
        SolarManRecord record = new SolarManRecord();
        record.setUpdated(null);
        record.setProductionPower(5.5);
        List<SolarManRecord> records = Arrays.asList(record);

        // Execute import
        ImportResult result = importService.importSolarManData(records);

        // Verify error is recorded
        assertNotNull(result);
        assertEquals(0, result.getRecordsInserted());
        assertEquals(1, result.getErrorCount());
        assertTrue(result.getErrors().get(0).contains("null updated field"));

        // Verify no database insert attempted
        verify(preparedStatement, never()).executeUpdate();
    }

    @Test
    void testImportSolarManData_DatabaseConnectionError() throws SQLException {
        // Create test data
        List<SolarManRecord> records = createValidSolarManRecords();

        // Mock database connection failure
        when(dataSource.getConnection()).thenThrow(new SQLException("Connection failed"));

        // Execute import
        ImportResult result = importService.importSolarManData(records);

        // Verify error handling
        assertNotNull(result);
        assertEquals(0, result.getRecordsInserted());
        assertEquals(1, result.getErrorCount());
        assertTrue(result.getErrors().get(0).contains("Database connection error"));
    }

    @Test
    void testImportSolarManData_PartialFailure() throws SQLException {
        // Create test data
        List<SolarManRecord> records = createValidSolarManRecords();

        // Mock: first insert succeeds, second fails
        when(preparedStatement.executeUpdate())
                .thenReturn(1)
                .thenThrow(new SQLException("Constraint violation"));

        // Execute import
        ImportResult result = importService.importSolarManData(records);

        // Verify partial success
        assertNotNull(result);
        assertEquals(1, result.getRecordsInserted());
        assertEquals(1, result.getErrorCount());
        assertTrue(result.getErrors().get(0).contains("Error importing SolarMan record"));

        // Verify both inserts were attempted
        verify(preparedStatement, times(2)).executeUpdate();
    }

    @Test
    void testImportSolarManData_HandlesNullValues() throws SQLException {
        // Create record with null numeric values
        SolarManRecord record = new SolarManRecord();
        record.setUpdated(LocalDateTime.of(2024, 1, 15, 10, 0));
        record.setProductionPower(null);
        record.setConsumePower(null);
        record.setGridPower(null);
        record.setPurchasePower(null);
        record.setFeedIn(null);
        record.setBatteryPower(null);
        record.setChargePower(null);
        record.setDischargePower(null);
        record.setSoc(null);
        List<SolarManRecord> records = Arrays.asList(record);

        // Mock successful insert
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        ImportResult result = importService.importSolarManData(records);

        // Verify success with default values
        assertNotNull(result);
        assertEquals(1, result.getRecordsInserted());
        assertEquals(0, result.getErrorCount());

        // Verify default values (0.0) were used
        verify(preparedStatement, times(9)).setDouble(anyInt(), eq(0.0));
    }

    @Test
    void testImportSolarManData_TracksDateRange() throws SQLException {
        // Create records with various dates
        SolarManRecord record1 = createSolarManRecord(LocalDateTime.of(2024, 1, 10, 10, 0), 1.0);
        SolarManRecord record2 = createSolarManRecord(LocalDateTime.of(2024, 1, 20, 10, 0), 2.0);
        SolarManRecord record3 = createSolarManRecord(LocalDateTime.of(2024, 1, 15, 10, 0), 3.0);
        List<SolarManRecord> records = Arrays.asList(record1, record2, record3);

        // Mock successful inserts
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        ImportResult result = importService.importSolarManData(records);

        // Verify date range
        assertEquals(LocalDateTime.of(2024, 1, 10, 10, 0), result.getFirstRecordDate());
        assertEquals(LocalDateTime.of(2024, 1, 20, 10, 0), result.getLastRecordDate());
    }

    // ==================== Tshwane Import Tests ====================

    @Test
    void testImportTshwaneData_SuccessfulImport() throws SQLException {
        // Create test data
        List<TshwaneRecord> records = createValidTshwaneRecords();

        // Mock successful database inserts
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        ImportResult result = importService.importTshwaneData(records);

        // Verify results
        assertNotNull(result);
        assertEquals(2, result.getRecordsInserted());
        assertEquals(0, result.getRecordsUpdated());
        assertEquals(0, result.getErrorCount());
        assertEquals(LocalDateTime.of(2024, 1, 15, 0, 0), result.getFirstRecordDate());
        assertEquals(LocalDateTime.of(2024, 2, 15, 0, 0), result.getLastRecordDate());

        // Verify database interactions
        verify(preparedStatement, times(2)).executeUpdate();
        verify(preparedStatement, times(2)).setTimestamp(eq(1), any(Timestamp.class));
        verify(preparedStatement, times(4)).setDouble(anyInt(), anyDouble()); // 2 numeric fields * 2 records
        verify(preparedStatement, times(2)).setString(eq(4), anyString());
    }

    @Test
    void testImportTshwaneData_EmptyList() throws SQLException {
        // Create empty list
        List<TshwaneRecord> records = new ArrayList<>();

        // Execute import
        ImportResult result = importService.importTshwaneData(records);

        // Verify results
        assertNotNull(result);
        assertEquals(0, result.getRecordsInserted());
        assertEquals(0, result.getErrorCount());
        assertNull(result.getFirstRecordDate());
        assertNull(result.getLastRecordDate());

        // Verify no database interactions
        verify(preparedStatement, never()).executeUpdate();
    }

    @Test
    void testImportTshwaneData_DatabaseConnectionError() throws SQLException {
        // Create test data
        List<TshwaneRecord> records = createValidTshwaneRecords();

        // Mock database connection failure
        when(dataSource.getConnection()).thenThrow(new SQLException("Connection failed"));

        // Execute import
        ImportResult result = importService.importTshwaneData(records);

        // Verify error handling
        assertNotNull(result);
        assertEquals(0, result.getRecordsInserted());
        assertEquals(1, result.getErrorCount());
        assertTrue(result.getErrors().get(0).contains("Database connection error"));
    }

    @Test
    void testImportTshwaneData_PartialFailure() throws SQLException {
        // Create test data
        List<TshwaneRecord> records = createValidTshwaneRecords();

        // Mock: first insert succeeds, second fails
        when(preparedStatement.executeUpdate())
                .thenReturn(1)
                .thenThrow(new SQLException("Constraint violation"));

        // Execute import
        ImportResult result = importService.importTshwaneData(records);

        // Verify partial success
        assertNotNull(result);
        assertEquals(1, result.getRecordsInserted());
        assertEquals(1, result.getErrorCount());
        assertTrue(result.getErrors().get(0).contains("Error importing Tshwane record"));

        // Verify both inserts were attempted
        verify(preparedStatement, times(2)).executeUpdate();
    }

    @Test
    void testImportTshwaneData_HandlesNullValues() throws SQLException {
        // Create record with null values
        TshwaneRecord record = new TshwaneRecord();
        record.setReadingDate(LocalDateTime.of(2024, 1, 15, 0, 0));
        record.setReadingValue(null);
        record.setReadingAmount(null);
        record.setReadingNotes(null);
        List<TshwaneRecord> records = Arrays.asList(record);

        // Mock successful insert
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        ImportResult result = importService.importTshwaneData(records);

        // Verify success with default values
        assertNotNull(result);
        assertEquals(1, result.getRecordsInserted());
        assertEquals(0, result.getErrorCount());

        // Verify default values were used
        verify(preparedStatement, times(2)).setDouble(anyInt(), eq(0.0));
        verify(preparedStatement, times(1)).setString(eq(4), eq(""));
    }

    @Test
    void testImportTshwaneData_TracksDateRange() throws SQLException {
        // Create records with various dates
        TshwaneRecord record1 = createTshwaneRecord(LocalDateTime.of(2024, 1, 10, 0, 0), 1250.5);
        TshwaneRecord record2 = createTshwaneRecord(LocalDateTime.of(2024, 3, 20, 0, 0), 1500.0);
        TshwaneRecord record3 = createTshwaneRecord(LocalDateTime.of(2024, 2, 15, 0, 0), 1375.0);
        List<TshwaneRecord> records = Arrays.asList(record1, record2, record3);

        // Mock successful inserts
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        ImportResult result = importService.importTshwaneData(records);

        // Verify date range
        assertEquals(LocalDateTime.of(2024, 1, 10, 0, 0), result.getFirstRecordDate());
        assertEquals(LocalDateTime.of(2024, 3, 20, 0, 0), result.getLastRecordDate());
    }

    // ==================== Error Logging Tests ====================

    @Test
    void testErrorLogging_RecordsErrors() throws SQLException {
        // Create test data
        List<SolarManRecord> records = createValidSolarManRecords();

        // Mock database errors
        when(preparedStatement.executeUpdate())
                .thenThrow(new SQLException("Error 1"))
                .thenThrow(new SQLException("Error 2"));

        // Execute import
        importService.importSolarManData(records);

        // Verify error logs
        List<String> errorLogs = importService.getErrorLogs();
        assertEquals(2, errorLogs.size());
        assertTrue(errorLogs.get(0).contains("Error importing SolarMan record"));
        assertTrue(errorLogs.get(1).contains("Error importing SolarMan record"));
    }

    @Test
    void testErrorLogging_ClearLogs() throws SQLException {
        // Create test data and generate errors
        List<SolarManRecord> records = createValidSolarManRecords();
        when(preparedStatement.executeUpdate()).thenThrow(new SQLException("Test error"));
        importService.importSolarManData(records);

        // Verify logs exist
        assertFalse(importService.getErrorLogs().isEmpty());

        // Clear logs
        importService.clearErrorLogs();

        // Verify logs are cleared
        assertTrue(importService.getErrorLogs().isEmpty());
    }

    @Test
    void testErrorLogging_LimitedTo100Entries() throws SQLException {
        // Create 150 records
        List<SolarManRecord> records = new ArrayList<>();
        for (int i = 0; i < 150; i++) {
            records.add(createSolarManRecord(LocalDateTime.of(2024, 1, 1, i % 24, 0), 1.0));
        }

        // Mock all as failures
        when(preparedStatement.executeUpdate()).thenThrow(new SQLException("Test error"));

        // Execute import
        importService.importSolarManData(records);

        // Verify only 100 logs are kept
        List<String> errorLogs = importService.getErrorLogs();
        assertEquals(100, errorLogs.size());
    }

    @Test
    void testErrorLogging_GetLogsCopy() throws SQLException {
        // Create test data and generate error
        List<SolarManRecord> records = createValidSolarManRecords();
        when(preparedStatement.executeUpdate()).thenThrow(new SQLException("Test error"));
        importService.importSolarManData(records);

        // Get logs
        List<String> logs1 = importService.getErrorLogs();
        List<String> logs2 = importService.getErrorLogs();

        // Verify we get copies (not same instance)
        assertNotSame(logs1, logs2);
        assertEquals(logs1.size(), logs2.size());
    }

    // ==================== SQL Injection Prevention Tests ====================

    @Test
    void testImportSolarManData_UsesPreparedStatements() throws SQLException {
        // Create test data with special characters
        SolarManRecord record = createSolarManRecord(LocalDateTime.of(2024, 1, 15, 10, 0), 5.5);
        List<SolarManRecord> records = Arrays.asList(record);

        // Mock successful insert
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        importService.importSolarManData(records);

        // Verify prepared statement was used (not direct SQL concatenation)
        verify(connection).prepareStatement(contains("INSERT INTO public.loots_inverter"));
        verify(connection).prepareStatement(contains("ON CONFLICT"));
        verify(preparedStatement).setTimestamp(anyInt(), any(Timestamp.class));
        verify(preparedStatement, atLeastOnce()).setDouble(anyInt(), anyDouble());
    }

    @Test
    void testImportTshwaneData_UsesPreparedStatements() throws SQLException {
        // Create test data
        TshwaneRecord record = createTshwaneRecord(LocalDateTime.of(2024, 1, 15, 0, 0), 1250.5);
        record.setReadingNotes("'; DROP TABLE tshwane_electricity; --"); // SQL injection attempt
        List<TshwaneRecord> records = Arrays.asList(record);

        // Mock successful insert
        when(preparedStatement.executeUpdate()).thenReturn(1);

        // Execute import
        importService.importTshwaneData(records);

        // Verify prepared statement was used with proper parameter binding
        verify(connection).prepareStatement(contains("INSERT INTO public.tshwane_electricity"));
        verify(preparedStatement).setString(eq(4), contains("DROP TABLE")); // String is passed as parameter, not concatenated
    }

    // ==================== Helper Methods ====================

    private List<SolarManRecord> createValidSolarManRecords() {
        List<SolarManRecord> records = new ArrayList<>();

        SolarManRecord record1 = createSolarManRecord(LocalDateTime.of(2024, 1, 15, 10, 0), 5.5);
        SolarManRecord record2 = createSolarManRecord(LocalDateTime.of(2024, 1, 15, 11, 0), 6.0);

        records.add(record1);
        records.add(record2);

        return records;
    }

    private SolarManRecord createSolarManRecord(LocalDateTime updated, double productionPower) {
        SolarManRecord record = new SolarManRecord();
        record.setUpdated(updated);
        record.setProductionPower(productionPower);
        record.setConsumePower(3.2);
        record.setGridPower(2.3);
        record.setPurchasePower(0.5);
        record.setFeedIn(1.8);
        record.setBatteryPower(4.0);
        record.setChargePower(1.5);
        record.setDischargePower(0.0);
        record.setSoc(85.5);
        return record;
    }

    private List<TshwaneRecord> createValidTshwaneRecords() {
        List<TshwaneRecord> records = new ArrayList<>();

        TshwaneRecord record1 = createTshwaneRecord(LocalDateTime.of(2024, 1, 15, 0, 0), 1250.5);
        TshwaneRecord record2 = createTshwaneRecord(LocalDateTime.of(2024, 2, 15, 0, 0), 1300.0);

        records.add(record1);
        records.add(record2);

        return records;
    }

    private TshwaneRecord createTshwaneRecord(LocalDateTime readingDate, double readingValue) {
        TshwaneRecord record = new TshwaneRecord();
        record.setReadingDate(readingDate);
        record.setReadingValue(readingValue);
        record.setReadingAmount(350.75);
        record.setReadingNotes("Test reading");
        return record;
    }
}
