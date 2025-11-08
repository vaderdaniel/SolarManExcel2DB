package com.loots.solarmanui.service;

import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExcelProcessingServiceTest {

    private ExcelProcessingService excelProcessingService;

    @BeforeEach
    void setUp() {
        excelProcessingService = new ExcelProcessingService();
    }

    // ==================== SolarMan File Processing Tests ====================

    @Test
    void testProcessSolarManFile_ValidFile() throws IOException {
        // Create a valid SolarMan Excel file
        MultipartFile file = createValidSolarManFile();

        // Process the file
        List<SolarManRecord> records = excelProcessingService.processSolarManFile(file);

        // Verify results
        assertNotNull(records);
        assertEquals(2, records.size());

        SolarManRecord record1 = records.get(0);
        assertEquals(LocalDateTime.of(2024, 1, 15, 10, 30), record1.getUpdated());
        assertEquals(5.5, record1.getProductionPower());
        assertEquals(3.2, record1.getConsumePower());
        assertEquals(2.3, record1.getGridPower());
        assertEquals(0.5, record1.getPurchasePower());
        assertEquals(1.8, record1.getFeedIn());
        assertEquals(4.0, record1.getBatteryPower());
        assertEquals(1.5, record1.getChargePower());
        assertEquals(0.0, record1.getDischargePower());
        assertEquals(85.5, record1.getSoc());
    }

    @Test
    void testProcessSolarManFile_InvalidColumnHeaders() throws IOException {
        // Create a file with invalid headers
        MultipartFile file = createInvalidSolarManFile();

        // Should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            excelProcessingService.processSolarManFile(file);
        });

        assertTrue(exception.getMessage().contains("Invalid SolarMan Excel format"));
    }

    @Test
    void testProcessSolarManFile_FiltersBefore2020() throws IOException {
        // Create a file with records before 2020
        MultipartFile file = createSolarManFileWithOldRecords();

        // Process the file
        List<SolarManRecord> records = excelProcessingService.processSolarManFile(file);

        // Verify old records are filtered out
        assertNotNull(records);
        assertEquals(1, records.size());
        assertTrue(records.get(0).getUpdated().isAfter(LocalDateTime.of(2020, 1, 1, 0, 0)));
    }

    @Test
    void testProcessSolarManFile_HandlesEmptyRows() throws IOException {
        // Create a file with empty rows
        MultipartFile file = createSolarManFileWithEmptyRows();

        // Process the file
        List<SolarManRecord> records = excelProcessingService.processSolarManFile(file);

        // Verify empty rows are skipped
        assertNotNull(records);
        assertEquals(1, records.size());
    }

    @Test
    void testProcessSolarManFile_HandlesNullValues() throws IOException {
        // Create a file with null/empty cell values
        MultipartFile file = createSolarManFileWithNullValues();

        // Process the file
        List<SolarManRecord> records = excelProcessingService.processSolarManFile(file);

        // Verify default values are used
        assertNotNull(records);
        assertEquals(1, records.size());
        SolarManRecord record = records.get(0);
        assertEquals(0.0, record.getProductionPower());
        assertEquals(0.0, record.getConsumePower());
    }

    @Test
    void testProcessSolarManFile_ParsesMultipleDateFormats() throws IOException {
        // Create a file with different date formats
        MultipartFile file = createSolarManFileWithVariousDates();

        // Process the file
        List<SolarManRecord> records = excelProcessingService.processSolarManFile(file);

        // Verify all date formats are parsed
        assertNotNull(records);
        assertTrue(records.size() >= 2);
    }

    // ==================== Tshwane File Processing Tests ====================

    @Test
    void testProcessTshwaneFile_ValidFile() throws IOException {
        // Create a valid Tshwane Excel file
        MultipartFile file = createValidTshwaneFile();

        // Process the file
        List<TshwaneRecord> records = excelProcessingService.processTshwaneFile(file);

        // Verify results
        assertNotNull(records);
        assertEquals(2, records.size());

        TshwaneRecord record1 = records.get(0);
        assertEquals(LocalDateTime.of(2024, 1, 15, 0, 0), record1.getReadingDate());
        assertEquals(1250.5, record1.getReadingValue());
        assertEquals(350.75, record1.getReadingAmount());
        assertEquals("January reading", record1.getReadingNotes());
    }

    @Test
    void testProcessTshwaneFile_SheetNotFound() throws IOException {
        // Create a file without the expected sheet name
        MultipartFile file = createTshwaneFileWithWrongSheetName();

        // Should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            excelProcessingService.processTshwaneFile(file);
        });

        assertTrue(exception.getMessage().contains("Sheet 'Elektrisiteit Lesings' not found"));
    }

    @Test
    void testProcessTshwaneFile_HandlesEmptyRows() throws IOException {
        // Create a file with empty rows
        MultipartFile file = createTshwaneFileWithEmptyRows();

        // Process the file
        List<TshwaneRecord> records = excelProcessingService.processTshwaneFile(file);

        // Verify empty rows are skipped
        assertNotNull(records);
        assertEquals(1, records.size());
    }

    @Test
    void testProcessTshwaneFile_ParsesExcelDateNumbers() throws IOException {
        // Create a file with Excel date numbers
        MultipartFile file = createTshwaneFileWithExcelDates();

        // Process the file
        List<TshwaneRecord> records = excelProcessingService.processTshwaneFile(file);

        // Verify dates are parsed correctly
        assertNotNull(records);
        assertTrue(records.size() > 0);
        assertNotNull(records.get(0).getReadingDate());
    }

    // ==================== File Format Validation Tests ====================

    @Test
    void testValidateFileFormat_ValidXlsxFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[]{1, 2, 3}  // Non-empty file
        );

        assertTrue(excelProcessingService.validateFileFormat(file, "solarman"));
    }

    @Test
    void testValidateFileFormat_ValidXlsFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.xls",
                "application/vnd.ms-excel",
                new byte[]{1, 2, 3}  // Non-empty file
        );

        assertTrue(excelProcessingService.validateFileFormat(file, "solarman"));
    }

    @Test
    void testValidateFileFormat_InvalidFileExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.csv",
                "text/csv",
                new byte[0]
        );

        assertFalse(excelProcessingService.validateFileFormat(file, "solarman"));
    }

    @Test
    void testValidateFileFormat_NullFile() {
        assertFalse(excelProcessingService.validateFileFormat(null, "solarman"));
    }

    @Test
    void testValidateFileFormat_EmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[0]
        );
        // Clear the file to make it empty
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "text/plain", new byte[0]);
        
        assertFalse(excelProcessingService.validateFileFormat(emptyFile, "solarman"));
    }

    @Test
    void testValidateFileFormat_NoFilename() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                null,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                new byte[]{1, 2, 3}
        );

        assertFalse(excelProcessingService.validateFileFormat(file, "solarman"));
    }

    // ==================== Helper Methods to Create Test Files ====================

    private MultipartFile createValidSolarManFile() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("SolarMan Data");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Plant", "Updated", "Time", "Production", "Consumption", "Grid",
                "Purchasing", "Feed-in", "Battery", "Charging", "Discharging", "SoC"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        // Create data rows
        Row dataRow1 = sheet.createRow(1);
        dataRow1.createCell(0).setCellValue("Plant 1");
        dataRow1.createCell(1).setCellValue("2024/01/15 10:30");
        dataRow1.createCell(2).setCellValue("10:30");
        dataRow1.createCell(3).setCellValue(5.5);
        dataRow1.createCell(4).setCellValue(3.2);
        dataRow1.createCell(5).setCellValue(2.3);
        dataRow1.createCell(6).setCellValue(0.5);
        dataRow1.createCell(7).setCellValue(1.8);
        dataRow1.createCell(8).setCellValue(4.0);
        dataRow1.createCell(9).setCellValue(1.5);
        dataRow1.createCell(10).setCellValue(0.0);
        dataRow1.createCell(11).setCellValue(85.5);

        Row dataRow2 = sheet.createRow(2);
        dataRow2.createCell(0).setCellValue("Plant 1");
        dataRow2.createCell(1).setCellValue("2024/01/15 11:00");
        dataRow2.createCell(2).setCellValue("11:00");
        dataRow2.createCell(3).setCellValue(6.0);
        dataRow2.createCell(4).setCellValue(3.5);
        dataRow2.createCell(5).setCellValue(2.5);
        dataRow2.createCell(6).setCellValue(0.6);
        dataRow2.createCell(7).setCellValue(1.9);
        dataRow2.createCell(8).setCellValue(4.2);
        dataRow2.createCell(9).setCellValue(1.6);
        dataRow2.createCell(10).setCellValue(0.0);
        dataRow2.createCell(11).setCellValue(86.0);

        return convertWorkbookToMultipartFile(workbook, "solarman_test.xlsx");
    }

    private MultipartFile createInvalidSolarManFile() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Invalid Data");

        // Create header row with wrong headers
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Wrong", "Headers", "Here"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        return convertWorkbookToMultipartFile(workbook, "invalid_solarman.xlsx");
    }

    private MultipartFile createSolarManFileWithOldRecords() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("SolarMan Data");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Plant", "Updated", "Time", "Production", "Consumption", "Grid",
                "Purchasing", "Feed-in", "Battery", "Charging", "Discharging", "SoC"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        // Create old record (before 2020)
        Row oldRow = sheet.createRow(1);
        oldRow.createCell(0).setCellValue("Plant 1");
        oldRow.createCell(1).setCellValue("2019/12/31 10:30");
        oldRow.createCell(2).setCellValue("10:30");
        for (int i = 3; i < 12; i++) {
            oldRow.createCell(i).setCellValue(0.0);
        }

        // Create new record (after 2020)
        Row newRow = sheet.createRow(2);
        newRow.createCell(0).setCellValue("Plant 1");
        newRow.createCell(1).setCellValue("2024/01/15 10:30");
        newRow.createCell(2).setCellValue("10:30");
        for (int i = 3; i < 12; i++) {
            newRow.createCell(i).setCellValue(1.0);
        }

        return convertWorkbookToMultipartFile(workbook, "solarman_old_records.xlsx");
    }

    private MultipartFile createSolarManFileWithEmptyRows() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("SolarMan Data");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Plant", "Updated", "Time", "Production", "Consumption", "Grid",
                "Purchasing", "Feed-in", "Battery", "Charging", "Discharging", "SoC"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        // Create empty row (row 1)
        sheet.createRow(1);

        // Create valid row (row 2)
        Row dataRow = sheet.createRow(2);
        dataRow.createCell(0).setCellValue("Plant 1");
        dataRow.createCell(1).setCellValue("2024/01/15 10:30");
        dataRow.createCell(2).setCellValue("10:30");
        for (int i = 3; i < 12; i++) {
            dataRow.createCell(i).setCellValue(1.0);
        }

        // Row with empty timestamp (row 3)
        Row emptyTimestampRow = sheet.createRow(3);
        emptyTimestampRow.createCell(0).setCellValue("Plant 1");
        emptyTimestampRow.createCell(1).setCellValue("");
        for (int i = 3; i < 12; i++) {
            emptyTimestampRow.createCell(i).setCellValue(1.0);
        }

        return convertWorkbookToMultipartFile(workbook, "solarman_empty_rows.xlsx");
    }

    private MultipartFile createSolarManFileWithNullValues() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("SolarMan Data");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Plant", "Updated", "Time", "Production", "Consumption", "Grid",
                "Purchasing", "Feed-in", "Battery", "Charging", "Discharging", "SoC"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        // Create row with null values
        Row dataRow = sheet.createRow(1);
        dataRow.createCell(0).setCellValue("Plant 1");
        dataRow.createCell(1).setCellValue("2024/01/15 10:30");
        dataRow.createCell(2).setCellValue("10:30");
        // Leave cells 3-11 empty (null)

        return convertWorkbookToMultipartFile(workbook, "solarman_null_values.xlsx");
    }

    private MultipartFile createSolarManFileWithVariousDates() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("SolarMan Data");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Plant", "Updated", "Time", "Production", "Consumption", "Grid",
                "Purchasing", "Feed-in", "Battery", "Charging", "Discharging", "SoC"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        // Date format: yyyy/MM/dd HH:mm
        Row dataRow1 = sheet.createRow(1);
        dataRow1.createCell(0).setCellValue("Plant 1");
        dataRow1.createCell(1).setCellValue("2024/01/15 10:30");
        for (int i = 3; i < 12; i++) {
            dataRow1.createCell(i).setCellValue(1.0);
        }

        // Date format: yyyy/MM/dd HH:mm:ss
        Row dataRow2 = sheet.createRow(2);
        dataRow2.createCell(0).setCellValue("Plant 1");
        dataRow2.createCell(1).setCellValue("2024/01/15 10:30:00");
        for (int i = 3; i < 12; i++) {
            dataRow2.createCell(i).setCellValue(1.0);
        }

        // Date format: MM/dd/yyyy HH:mm
        Row dataRow3 = sheet.createRow(3);
        dataRow3.createCell(0).setCellValue("Plant 1");
        dataRow3.createCell(1).setCellValue("01/15/2024 10:30");
        for (int i = 3; i < 12; i++) {
            dataRow3.createCell(i).setCellValue(1.0);
        }

        return convertWorkbookToMultipartFile(workbook, "solarman_various_dates.xlsx");
    }

    private MultipartFile createValidTshwaneFile() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Elektrisiteit Lesings");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Reading Date", "Reading Value", "Reading Amount", "Reading Notes"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        // Create data rows
        Row dataRow1 = sheet.createRow(1);
        dataRow1.createCell(0).setCellValue("2024/01/15 00:00");
        dataRow1.createCell(1).setCellValue(1250.5);
        dataRow1.createCell(2).setCellValue(350.75);
        dataRow1.createCell(3).setCellValue("January reading");

        Row dataRow2 = sheet.createRow(2);
        dataRow2.createCell(0).setCellValue("2024/02/15 00:00");
        dataRow2.createCell(1).setCellValue(1300.0);
        dataRow2.createCell(2).setCellValue(375.50);
        dataRow2.createCell(3).setCellValue("February reading");

        return convertWorkbookToMultipartFile(workbook, "tshwane_test.xlsx");
    }

    private MultipartFile createTshwaneFileWithWrongSheetName() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Wrong Sheet Name");

        // Create header row
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Data");

        return convertWorkbookToMultipartFile(workbook, "tshwane_wrong_sheet.xlsx");
    }

    private MultipartFile createTshwaneFileWithEmptyRows() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Elektrisiteit Lesings");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Reading Date", "Reading Value", "Reading Amount", "Reading Notes"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        // Create empty row
        sheet.createRow(1);

        // Create valid row
        Row dataRow = sheet.createRow(2);
        dataRow.createCell(0).setCellValue("2024/01/15 00:00");
        dataRow.createCell(1).setCellValue(1250.5);
        dataRow.createCell(2).setCellValue(350.75);
        dataRow.createCell(3).setCellValue("Valid reading");

        return convertWorkbookToMultipartFile(workbook, "tshwane_empty_rows.xlsx");
    }

    private MultipartFile createTshwaneFileWithExcelDates() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Elektrisiteit Lesings");

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Reading Date", "Reading Value", "Reading Amount", "Reading Notes"};
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        // Create row with Excel date number
        Row dataRow = sheet.createRow(1);
        dataRow.createCell(0).setCellValue("45323"); // Excel date number for 2024-01-15
        dataRow.createCell(1).setCellValue(1250.5);
        dataRow.createCell(2).setCellValue(350.75);
        dataRow.createCell(3).setCellValue("Excel date reading");

        return convertWorkbookToMultipartFile(workbook, "tshwane_excel_dates.xlsx");
    }

    private MultipartFile convertWorkbookToMultipartFile(Workbook workbook, String filename) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        workbook.write(baos);
        workbook.close();
        byte[] bytes = baos.toByteArray();

        return new MockMultipartFile(
                "file",
                filename,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                bytes
        );
    }
}
