package com.loots.solarmanui.service;

import com.loots.solarmanui.model.ProductionStat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DatabaseServiceTest {

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private PreparedStatement preparedStatement;

    @Mock
    private ResultSet resultSet;

    @InjectMocks
    private DatabaseService databaseService;

    @BeforeEach
    void setUp() throws SQLException {
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.prepareStatement(anyString())).thenReturn(preparedStatement);
    }

    // ==================== getProductionStats Tests ====================

    @Test
    void testGetProductionStats_SuccessfulCalculation() throws SQLException {
        // Mock database response with 3 days of production data
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next())
                .thenReturn(true)  // First row
                .thenReturn(true)  // Second row
                .thenReturn(true)  // Third row
                .thenReturn(false); // No more rows

        when(resultSet.getDate("production_date"))
                .thenReturn(java.sql.Date.valueOf(LocalDate.of(2024, 12, 8)))
                .thenReturn(java.sql.Date.valueOf(LocalDate.of(2024, 12, 7)))
                .thenReturn(java.sql.Date.valueOf(LocalDate.of(2024, 12, 6)));

        when(resultSet.getDouble("production_units"))
                .thenReturn(45600.5)  // Day 3
                .thenReturn(43200.0)  // Day 2
                .thenReturn(41000.25); // Day 1

        // Execute
        List<ProductionStat> stats = databaseService.getProductionStats(7);

        // Verify
        assertNotNull(stats);
        assertEquals(3, stats.size());

        // Verify first stat
        assertEquals(LocalDate.of(2024, 12, 8), stats.get(0).getDate());
        assertEquals(45600.5, stats.get(0).getProductionUnits());

        // Verify second stat
        assertEquals(LocalDate.of(2024, 12, 7), stats.get(1).getDate());
        assertEquals(43200.0, stats.get(1).getProductionUnits());

        // Verify third stat
        assertEquals(LocalDate.of(2024, 12, 6), stats.get(2).getDate());
        assertEquals(41000.25, stats.get(2).getProductionUnits());

        // Verify SQL query includes time-weighted calculation
        verify(connection).prepareStatement(contains("LAG(updated) OVER (ORDER BY updated)"));
        verify(connection).prepareStatement(contains("EXTRACT(EPOCH FROM (updated - prev_updated))"));
        verify(connection).prepareStatement(contains("production_power"));
        verify(connection).prepareStatement(contains("LIMIT ?"));

        // Verify prepared statement parameter
        verify(preparedStatement).setInt(1, 7);
    }

    @Test
    void testGetProductionStats_EmptyResult() throws SQLException {
        // Mock empty result set
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(false);

        // Execute
        List<ProductionStat> stats = databaseService.getProductionStats(7);

        // Verify
        assertNotNull(stats);
        assertTrue(stats.isEmpty());

        // Verify query was executed
        verify(preparedStatement).executeQuery();
    }

    @Test
    void testGetProductionStats_WithNullDate() throws SQLException {
        // Mock result with null date
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next())
                .thenReturn(true)
                .thenReturn(false);

        when(resultSet.getDate("production_date")).thenReturn(null);
        when(resultSet.getDouble("production_units")).thenReturn(1000.0);

        // Execute
        List<ProductionStat> stats = databaseService.getProductionStats(7);

        // Verify - null date should be skipped
        assertNotNull(stats);
        assertTrue(stats.isEmpty());
    }

    @Test
    void testGetProductionStats_HandlesZeroProductionUnits() throws SQLException {
        // Mock result with zero production
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next())
                .thenReturn(true)
                .thenReturn(false);

        when(resultSet.getDate("production_date"))
                .thenReturn(java.sql.Date.valueOf(LocalDate.of(2024, 12, 8)));
        when(resultSet.getDouble("production_units")).thenReturn(0.0);

        // Execute
        List<ProductionStat> stats = databaseService.getProductionStats(7);

        // Verify - zero production should be included
        assertNotNull(stats);
        assertEquals(1, stats.size());
        assertEquals(0.0, stats.get(0).getProductionUnits());
    }

    @Test
    void testGetProductionStats_DifferentDayParameters() throws SQLException {
        // Mock result for different day parameters
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(false);

        // Test with different day values
        databaseService.getProductionStats(1);
        verify(preparedStatement).setInt(1, 1);

        databaseService.getProductionStats(30);
        verify(preparedStatement).setInt(1, 30);

        databaseService.getProductionStats(365);
        verify(preparedStatement).setInt(1, 365);
    }

    @Test
    void testGetProductionStats_HandlesQueryException() throws SQLException {
        // Mock SQL exception
        when(preparedStatement.executeQuery()).thenThrow(new SQLException("Query failed"));

        // Execute - should not throw, but return empty list
        List<ProductionStat> stats = databaseService.getProductionStats(7);

        // Verify error handling
        assertNotNull(stats);
        assertTrue(stats.isEmpty());

        // Verify query was attempted
        verify(preparedStatement).executeQuery();
    }

    @Test
    void testGetProductionStats_HandlesConnectionException() throws SQLException {
        // Mock connection failure
        when(dataSource.getConnection()).thenThrow(new SQLException("Connection failed"));

        // Execute - should not throw, but return empty list
        List<ProductionStat> stats = databaseService.getProductionStats(7);

        // Verify error handling
        assertNotNull(stats);
        assertTrue(stats.isEmpty());
    }

    @Test
    void testGetProductionStats_VerifiesTimeWeightedCalculation() throws SQLException {
        // Mock result
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(false);

        // Execute
        databaseService.getProductionStats(7);

        // Verify SQL includes time-weighted calculation components
        verify(connection).prepareStatement(argThat(sql -> 
            sql.contains("WITH samples AS") &&
            sql.contains("LAG(updated) OVER (ORDER BY updated)") &&
            sql.contains("per_point AS") &&
            sql.contains("GREATEST(EXTRACT(EPOCH FROM (updated - prev_updated)) / 3600, 0) * production_power") &&
            sql.contains("SUM(wh) AS production_units") &&
            sql.contains("GROUP BY production_date") &&
            sql.contains("ORDER BY production_date DESC")
        ));
    }

    @Test
    void testGetProductionStats_HandlesMixedPositiveAndNegativeValues() throws SQLException {
        // Mock result with mixed values
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next())
                .thenReturn(true)
                .thenReturn(true)
                .thenReturn(false);

        when(resultSet.getDate("production_date"))
                .thenReturn(java.sql.Date.valueOf(LocalDate.of(2024, 12, 8)))
                .thenReturn(java.sql.Date.valueOf(LocalDate.of(2024, 12, 7)));

        when(resultSet.getDouble("production_units"))
                .thenReturn(45600.5)
                .thenReturn(-100.0); // Negative value (could happen with time-weighted calc)

        // Execute
        List<ProductionStat> stats = databaseService.getProductionStats(7);

        // Verify both values are included
        assertNotNull(stats);
        assertEquals(2, stats.size());
        assertEquals(45600.5, stats.get(0).getProductionUnits());
        assertEquals(-100.0, stats.get(1).getProductionUnits());
    }

    @Test
    void testGetProductionStats_VerifiesCorrectTableAndColumns() throws SQLException {
        // Mock result
        when(preparedStatement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(false);

        // Execute
        databaseService.getProductionStats(7);

        // Verify correct table and columns are used
        verify(connection).prepareStatement(argThat(sql ->
            sql.contains("FROM public.loots_inverter") &&
            sql.contains("updated") &&
            sql.contains("production_power") &&
            sql.contains("WHERE updated IS NOT NULL")
        ));
    }
}
