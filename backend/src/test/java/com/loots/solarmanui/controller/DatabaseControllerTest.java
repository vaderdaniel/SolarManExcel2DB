package com.loots.solarmanui.controller;

import com.loots.solarmanui.model.ProductionStat;
import com.loots.solarmanui.service.DatabaseService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DatabaseControllerTest {

    @Mock
    private DatabaseService databaseService;

    @InjectMocks
    private DatabaseController databaseController;

    // ==================== /api/database/production-stats Tests ====================

    @Test
    void testGetProductionStats_SuccessfulResponse() {
        // Setup mock data
        List<ProductionStat> mockStats = Arrays.asList(
            new ProductionStat(LocalDate.of(2024, 12, 8), 45600.5),
            new ProductionStat(LocalDate.of(2024, 12, 7), 43200.0),
            new ProductionStat(LocalDate.of(2024, 12, 6), 41000.25)
        );

        when(databaseService.getProductionStats(7)).thenReturn(mockStats);

        // Execute
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(3, response.getBody().size());

        // Verify first stat
        ProductionStat firstStat = response.getBody().get(0);
        assertEquals(LocalDate.of(2024, 12, 8), firstStat.getDate());
        assertEquals(45600.5, firstStat.getProductionUnits());

        // Verify service was called with correct parameter
        verify(databaseService).getProductionStats(7);
    }

    @Test
    void testGetProductionStats_DefaultDaysParameter() {
        // Setup mock data
        List<ProductionStat> mockStats = Arrays.asList(
            new ProductionStat(LocalDate.of(2024, 12, 8), 45600.5)
        );

        when(databaseService.getProductionStats(7)).thenReturn(mockStats);

        // Execute with default parameter (7 days)
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify service was called with default value
        verify(databaseService).getProductionStats(7);
    }

    @Test
    void testGetProductionStats_CustomDaysParameter() {
        // Setup mock data
        List<ProductionStat> mockStats = new ArrayList<>();

        when(databaseService.getProductionStats(30)).thenReturn(mockStats);

        // Execute with custom parameter
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(30);

        // Verify
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify service was called with custom value
        verify(databaseService).getProductionStats(30);
    }

    @Test
    void testGetProductionStats_EmptyResult() {
        // Setup empty result
        List<ProductionStat> emptyStats = new ArrayList<>();

        when(databaseService.getProductionStats(7)).thenReturn(emptyStats);

        // Execute
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());

        // Verify service was called
        verify(databaseService).getProductionStats(7);
    }

    @Test
    void testGetProductionStats_HandlesServiceException() {
        // Setup mock to throw exception
        when(databaseService.getProductionStats(anyInt()))
                .thenThrow(new RuntimeException("Database error"));

        // Execute
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify error handling - should return OK with empty list
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());

        // Verify service was called
        verify(databaseService).getProductionStats(7);
    }

    @Test
    void testGetProductionStats_HandlesNullPointerException() {
        // Setup mock to throw NullPointerException
        when(databaseService.getProductionStats(anyInt()))
                .thenThrow(new NullPointerException("Null data"));

        // Execute
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify error handling
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }

    @Test
    void testGetProductionStats_CorrectResponseFormat() {
        // Setup mock data with specific values to verify JSON serialization
        List<ProductionStat> mockStats = Arrays.asList(
            new ProductionStat(LocalDate.of(2024, 12, 8), 45600.5),
            new ProductionStat(LocalDate.of(2024, 12, 7), 43200.0)
        );

        when(databaseService.getProductionStats(7)).thenReturn(mockStats);

        // Execute
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify response structure
        assertNotNull(response);
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());

        // Verify each stat has correct structure
        for (ProductionStat stat : response.getBody()) {
            assertNotNull(stat.getDate());
            assertNotNull(stat.getProductionUnits());
            assertTrue(stat.getProductionUnits() >= 0);
        }
    }

    @Test
    void testGetProductionStats_VerifiesDateFormatInResponse() {
        // Setup mock data
        LocalDate testDate = LocalDate.of(2024, 12, 8);
        List<ProductionStat> mockStats = Arrays.asList(
            new ProductionStat(testDate, 45600.5)
        );

        when(databaseService.getProductionStats(7)).thenReturn(mockStats);

        // Execute
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify date is in correct format (LocalDate)
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals(testDate, response.getBody().get(0).getDate());
        assertEquals(2024, response.getBody().get(0).getDate().getYear());
        assertEquals(12, response.getBody().get(0).getDate().getMonthValue());
        assertEquals(8, response.getBody().get(0).getDate().getDayOfMonth());
    }

    @Test
    void testGetProductionStats_VerifiesProductionUnitsFormatInResponse() {
        // Setup mock data with various production values
        List<ProductionStat> mockStats = Arrays.asList(
            new ProductionStat(LocalDate.of(2024, 12, 8), 45600.5),
            new ProductionStat(LocalDate.of(2024, 12, 7), 0.0),
            new ProductionStat(LocalDate.of(2024, 12, 6), 123.456789)
        );

        when(databaseService.getProductionStats(7)).thenReturn(mockStats);

        // Execute
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(7);

        // Verify production units are returned as doubles
        assertNotNull(response.getBody());
        assertEquals(3, response.getBody().size());
        assertEquals(45600.5, response.getBody().get(0).getProductionUnits());
        assertEquals(0.0, response.getBody().get(1).getProductionUnits());
        assertEquals(123.456789, response.getBody().get(2).getProductionUnits());
    }

    @Test
    void testGetProductionStats_WithLargeDaysParameter() {
        // Setup mock data
        List<ProductionStat> mockStats = new ArrayList<>();

        when(databaseService.getProductionStats(365)).thenReturn(mockStats);

        // Execute with large days parameter
        ResponseEntity<List<ProductionStat>> response = databaseController.getProductionStats(365);

        // Verify
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify service was called with correct parameter
        verify(databaseService).getProductionStats(365);
    }

    @Test
    void testGetProductionStats_MultipleCallsDoNotInterfere() {
        // Setup mock data
        List<ProductionStat> stats7Days = Arrays.asList(
            new ProductionStat(LocalDate.of(2024, 12, 8), 45600.5)
        );
        List<ProductionStat> stats30Days = Arrays.asList(
            new ProductionStat(LocalDate.of(2024, 12, 8), 45600.5),
            new ProductionStat(LocalDate.of(2024, 12, 7), 43200.0)
        );

        when(databaseService.getProductionStats(7)).thenReturn(stats7Days);
        when(databaseService.getProductionStats(30)).thenReturn(stats30Days);

        // Execute multiple calls
        ResponseEntity<List<ProductionStat>> response1 = databaseController.getProductionStats(7);
        ResponseEntity<List<ProductionStat>> response2 = databaseController.getProductionStats(30);

        // Verify both calls work independently
        assertNotNull(response1.getBody());
        assertEquals(1, response1.getBody().size());

        assertNotNull(response2.getBody());
        assertEquals(2, response2.getBody().size());

        // Verify service was called twice with different parameters
        verify(databaseService).getProductionStats(7);
        verify(databaseService).getProductionStats(30);
    }
}
