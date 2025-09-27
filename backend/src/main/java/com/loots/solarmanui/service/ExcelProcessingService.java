package com.loots.solarmanui.service;

import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class ExcelProcessingService {

    private static final String TSHWANE_SHEET_NAME = "Elektrisiteit Lesings";

    public List<SolarManRecord> processSolarManFile(MultipartFile file) throws IOException {
        List<SolarManRecord> records = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            boolean firstRow = true;
            for (Row row : sheet) {
                if (row == null) continue;

                if (firstRow) {
                    if (!validateSolarManColumns(row)) {
                        throw new IllegalArgumentException("Invalid SolarMan Excel format - column headers do not match expected format");
                    }
                    firstRow = false;
                    continue;
                }

                SolarManRecord record = parseSolarManRow(row);
                if (record != null) {
                    records.add(record);
                }
            }
        }

        return records;
    }

    public List<TshwaneRecord> processTshwaneFile(MultipartFile file) throws IOException {
        List<TshwaneRecord> records = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = findSheet(workbook, TSHWANE_SHEET_NAME);
            if (sheet == null) {
                throw new IllegalArgumentException("Sheet '" + TSHWANE_SHEET_NAME + "' not found in workbook");
            }

            boolean firstRow = true;
            for (Row row : sheet) {
                if (row == null) continue;

                if (firstRow) {
                    firstRow = false;
                    continue;
                }

                TshwaneRecord record = parseTshwaneRow(row);
                if (record != null) {
                    records.add(record);
                }
            }
        }

        return records;
    }

    private boolean validateSolarManColumns(Row headerRow) {
        if (headerRow.getLastCellNum() < 12) {
            return false;
        }

        String[] expectedHeaders = {
            "Plant", "Updated", "Time", "Production", "Consumption", "Grid",
            "Purchasing", "Feed-in", "Battery", "Charging", "Discharging", "SoC"
        };

        for (int i = 0; i < expectedHeaders.length; i++) {
            Cell cell = headerRow.getCell(i);
            if (cell == null || cell.getCellType() != CellType.STRING) {
                return false;
            }

            String value = cell.getStringCellValue();
            if (!value.startsWith(expectedHeaders[i])) {
                return false;
            }
        }

        return true;
    }

    private SolarManRecord parseSolarManRow(Row row) {
        try {
            String updateTimeStr = getCellValueAsString(row.getCell(1), "");
            if (updateTimeStr.isEmpty()) {
                return null;
            }

            LocalDateTime updateTime = parseTimestamp(updateTimeStr);
            if (updateTime == null) {
                return null;
            }

            // Filter records before 2020-01-01
            if (updateTime.isBefore(LocalDateTime.of(2020, 1, 1, 0, 0))) {
                return null;
            }

            SolarManRecord record = new SolarManRecord();
            record.setUpdated(updateTime);
            record.setProductionPower(getCellValueAsDouble(row.getCell(3), 0.0));
            record.setConsumePower(getCellValueAsDouble(row.getCell(4), 0.0));
            record.setGridPower(getCellValueAsDouble(row.getCell(5), 0.0));
            record.setPurchasePower(getCellValueAsDouble(row.getCell(6), 0.0));
            record.setFeedIn(getCellValueAsDouble(row.getCell(7), 0.0));
            record.setBatteryPower(getCellValueAsDouble(row.getCell(8), 0.0));
            record.setChargePower(getCellValueAsDouble(row.getCell(9), 0.0));
            record.setDischargePower(getCellValueAsDouble(row.getCell(10), 0.0));
            record.setSoc(getCellValueAsDouble(row.getCell(11), 0.0));

            return record;
        } catch (Exception e) {
            System.err.println("Error parsing SolarMan row: " + e.getMessage());
            return null;
        }
    }

    private TshwaneRecord parseTshwaneRow(Row row) {
        try {
            String readingDateStr = getCellValueAsString(row.getCell(0), "");
            if (readingDateStr.isEmpty()) {
                return null;
            }

            LocalDateTime readingDate = parseDate(readingDateStr);
            if (readingDate == null) {
                return null;
            }

            TshwaneRecord record = new TshwaneRecord();
            record.setReadingDate(readingDate);
            record.setReadingValue(getCellValueAsDouble(row.getCell(1), 0.0));
            record.setReadingAmount(getCellValueAsDouble(row.getCell(2), 0.0));
            record.setReadingNotes(getCellValueAsString(row.getCell(3), ""));

            return record;
        } catch (Exception e) {
            System.err.println("Error parsing Tshwane row: " + e.getMessage());
            return null;
        }
    }

    private Sheet findSheet(Workbook workbook, String sheetName) {
        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            if (sheetName.equalsIgnoreCase(workbook.getSheetName(i))) {
                return workbook.getSheetAt(i);
            }
        }
        return null;
    }

    private String getCellValueAsString(Cell cell, String defaultValue) {
        if (cell == null) return defaultValue;
        switch (cell.getCellType()) {
            case STRING:
                String value = cell.getStringCellValue();
                return value.isEmpty() ? defaultValue : value;
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue());
            default:
                return defaultValue;
        }
    }

    private double getCellValueAsDouble(Cell cell, double defaultValue) {
        if (cell == null) return defaultValue;
        switch (cell.getCellType()) {
            case STRING:
                String value = cell.getStringCellValue();
                try {
                    return value.isEmpty() ? defaultValue : Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    return defaultValue;
                }
            case NUMERIC:
                return cell.getNumericCellValue();
            default:
                return defaultValue;
        }
    }

    private LocalDateTime parseTimestamp(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd HH:mm");
            sdf.setLenient(false);
            Date date = sdf.parse(value);
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        } catch (ParseException e) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
                sdf.setLenient(false);
                Date date = sdf.parse(value);
                return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            } catch (ParseException e2) {
                try {
                    SimpleDateFormat sdf = new SimpleDateFormat("MM/dd/yyyy HH:mm");
                    sdf.setLenient(false);
                    Date date = sdf.parse(value);
                    return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
                } catch (ParseException e3) {
                    return null;
                }
            }
        }
    }

    private LocalDateTime parseDate(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd HH:mm");
            sdf.setLenient(true);
            Date date = sdf.parse(value);
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        } catch (ParseException e) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
                sdf.setLenient(true);
                Date date = sdf.parse(value);
                return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            } catch (ParseException e2) {
                try {
                    double excelDate = Double.parseDouble(value);
                    return convertExcelDateToLocalDateTime(excelDate);
                } catch (NumberFormatException e3) {
                    return null;
                }
            }
        }
    }

    private LocalDateTime convertExcelDateToLocalDateTime(double excelDate) {
        Calendar calendar = Calendar.getInstance();
        calendar.set(1899, Calendar.DECEMBER, 30, 0, 0, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        long baseTime = calendar.getTimeInMillis();
        long timeInMillis = baseTime + (long) (excelDate * 24 * 60 * 60 * 1000);
        return new Date(timeInMillis).toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    public boolean validateFileFormat(MultipartFile file, String expectedType) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return false;
        }

        return originalFilename.toLowerCase().endsWith(".xlsx") || originalFilename.toLowerCase().endsWith(".xls");
    }
}