package com.loots.solarmanui.controller;

import com.loots.solarmanui.model.ImportResult;
import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import com.loots.solarmanui.service.ImportService;
import com.loots.solarmanui.service.ExcelProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileInputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.mock.web.MockMultipartFile;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "http://localhost:4200")
public class ImportController {

    @Autowired
    private ImportService importService;
    
    @Autowired
    private ExcelProcessingService excelProcessingService;

    @PostMapping("/solarman")
    public ResponseEntity<?> importSolarManData(@RequestBody Map<String, Object> request) {
        // Check if request contains fileId (new approach) or data array (legacy)
        if (request.containsKey("fileId")) {
            return importSolarManFromFile((String) request.get("fileId"));
        } else if (request.containsKey("data")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) request.get("data");
            return importSolarManFromData(data);
        } else {
            return ResponseEntity.badRequest().body("Request must contain either 'fileId' or 'data'");
        }
    }
    
    public ResponseEntity<?> importSolarManFromFile(String fileId) {
        try {
            // Get file info
            FileUploadController.FileInfo fileInfo = FileUploadController.getFileInfo(fileId);
            if (fileInfo == null) {
                return ResponseEntity.badRequest().body("File not found or expired. Please upload the file again.");
            }
            
            // Load and process the full file
            File file = new File(fileInfo.getFilePath());
            if (!file.exists()) {
                return ResponseEntity.badRequest().body("File not found on disk. Please upload the file again.");
            }
            
            try (FileInputStream fis = new FileInputStream(file)) {
                MultipartFile multipartFile = new MockMultipartFile(
                    "file",
                    file.getName(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fis
                );
                
                // Process ALL records from the file
                List<SolarManRecord> records = excelProcessingService.processSolarManFile(multipartFile);
                
                // Import all records
                ImportResult result = importService.importSolarManData(records);
                return ResponseEntity.ok(result);
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error importing SolarMan data: " + e.getMessage());
        }
    }
    
    public ResponseEntity<?> importSolarManFromData(List<Map<String, Object>> data) {
        try {
            // Convert Map data back to SolarManRecord objects
            List<SolarManRecord> records = new ArrayList<>();

            for (Map<String, Object> recordMap : data) {
                try {
                    SolarManRecord record = new SolarManRecord();

                    // Parse updated timestamp - check both display name and camelCase
                    String updatedStr = (String) recordMap.get("Updated");
                    if (updatedStr == null) {
                        updatedStr = (String) recordMap.get("updated");
                    }
                    
                    if (updatedStr != null && !updatedStr.trim().isEmpty()) {
                        try {
                            LocalDateTime updated;
                            // Try parsing with seconds first, then without seconds
                            try {
                                updated = LocalDateTime.parse(updatedStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                            } catch (Exception e1) {
                                // Try parsing without seconds (add :00)
                                String updatedWithSeconds = updatedStr.contains(":") && !updatedStr.matches(".*:\\d{2}:\\d{2}$") 
                                    ? updatedStr + ":00" : updatedStr;
                                updated = LocalDateTime.parse(updatedWithSeconds, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                            }
                            record.setUpdated(updated);
                        } catch (Exception e) {
                            return ResponseEntity.badRequest().body("Invalid date format: " + updatedStr + " - " + e.getMessage());
                        }
                    } else {
                        return ResponseEntity.badRequest().body("Missing or empty 'Updated' field in record");
                    }

                    // Parse numeric fields - check both display names and camelCase
                    record.setProductionPower(parseDoubleValue(getFieldValue(recordMap, "Production Power", "productionPower")));
                    record.setConsumePower(parseDoubleValue(getFieldValue(recordMap, "Consumption Power", "consumePower")));
                    record.setGridPower(parseDoubleValue(getFieldValue(recordMap, "Grid Power", "gridPower")));
                    record.setPurchasePower(parseDoubleValue(getFieldValue(recordMap, "Purchasing Power", "purchasePower")));
                    record.setFeedIn(parseDoubleValue(getFieldValue(recordMap, "Feed-in", "feedIn")));
                    record.setBatteryPower(parseDoubleValue(getFieldValue(recordMap, "Battery Power", "batteryPower")));
                    record.setChargePower(parseDoubleValue(getFieldValue(recordMap, "Charging Power", "chargePower")));
                    record.setDischargePower(parseDoubleValue(getFieldValue(recordMap, "Discharging Power", "dischargePower")));
                    record.setSoc(parseDoubleValue(getFieldValue(recordMap, "SoC", "soc")));

                    records.add(record);

                } catch (DateTimeParseException e) {
                    return ResponseEntity.badRequest().body("Invalid date format in record: " + e.getMessage());
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Error parsing record: " + e.getMessage());
                }
            }

            // Import the records
            ImportResult result = importService.importSolarManData(records);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error importing SolarMan data: " + e.getMessage());
        }
    }

    @PostMapping("/tshwane")
    public ResponseEntity<?> importTshwaneData(@RequestBody Map<String, Object> request) {
        // Check if request contains fileId (new approach) or data array (legacy)
        if (request.containsKey("fileId")) {
            return importTshwaneFromFile((String) request.get("fileId"));
        } else if (request.containsKey("data")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data = (List<Map<String, Object>>) request.get("data");
            return importTshwaneFromData(data);
        } else {
            return ResponseEntity.badRequest().body("Request must contain either 'fileId' or 'data'");
        }
    }
    
    public ResponseEntity<?> importTshwaneFromFile(String fileId) {
        try {
            // Get file info
            FileUploadController.FileInfo fileInfo = FileUploadController.getFileInfo(fileId);
            if (fileInfo == null) {
                return ResponseEntity.badRequest().body("File not found or expired. Please upload the file again.");
            }
            
            // Load and process the full file
            File file = new File(fileInfo.getFilePath());
            if (!file.exists()) {
                return ResponseEntity.badRequest().body("File not found on disk. Please upload the file again.");
            }
            
            try (FileInputStream fis = new FileInputStream(file)) {
                MultipartFile multipartFile = new MockMultipartFile(
                    "file",
                    file.getName(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fis
                );
                
                // Process ALL records from the file
                List<TshwaneRecord> records = excelProcessingService.processTshwaneFile(multipartFile);
                
                // Import all records
                ImportResult result = importService.importTshwaneData(records);
                return ResponseEntity.ok(result);
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error importing Tshwane data: " + e.getMessage());
        }
    }
    
    public ResponseEntity<?> importTshwaneFromData(List<Map<String, Object>> data) {
        try {
            // Convert Map data back to TshwaneRecord objects
            List<TshwaneRecord> records = new ArrayList<>();

            for (Map<String, Object> recordMap : data) {
                try {
                    TshwaneRecord record = new TshwaneRecord();

                    // Parse reading date - check both display name and camelCase
                    String readingDateStr = (String) recordMap.get("Reading Date");
                    if (readingDateStr == null) {
                        readingDateStr = (String) recordMap.get("readingDate");
                    }
                    if (readingDateStr != null && !readingDateStr.trim().isEmpty()) {
                        try {
                            LocalDateTime readingDate;
                            // Try parsing with seconds first, then without seconds
                            try {
                                readingDate = LocalDateTime.parse(readingDateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                            } catch (Exception e1) {
                                // Try parsing without seconds (add :00)
                                String dateWithSeconds = readingDateStr.contains(":") && !readingDateStr.matches(".*:\\d{2}:\\d{2}$") 
                                    ? readingDateStr + ":00" : readingDateStr;
                                readingDate = LocalDateTime.parse(dateWithSeconds, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                            }
                            record.setReadingDate(readingDate);
                        } catch (Exception e) {
                            return ResponseEntity.badRequest().body("Invalid date format: " + readingDateStr + " - " + e.getMessage());
                        }
                    }

                    // Parse numeric fields - check both display names and camelCase
                    record.setReadingValue(parseDoubleValue(getFieldValue(recordMap, "Reading Value", "readingValue")));
                    record.setReadingAmount(parseDoubleValue(getFieldValue(recordMap, "Reading Amount", "readingAmount")));
                    record.setReadingNotes((String) getFieldValue(recordMap, "Reading Notes", "readingNotes"));

                    records.add(record);

                } catch (DateTimeParseException e) {
                    return ResponseEntity.badRequest().body("Invalid date format in record: " + e.getMessage());
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body("Error parsing record: " + e.getMessage());
                }
            }

            // Import the records
            ImportResult result = importService.importTshwaneData(records);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error importing Tshwane data: " + e.getMessage());
        }
    }

    @GetMapping("/error-logs")
    public ResponseEntity<List<String>> getErrorLogs() {
        try {
            List<String> errorLogs = importService.getErrorLogs();
            return ResponseEntity.ok(errorLogs);
        } catch (Exception e) {
            List<String> errorResponse = new ArrayList<>();
            errorResponse.add("Error retrieving error logs: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @DeleteMapping("/error-logs")
    public ResponseEntity<?> clearErrorLogs() {
        try {
            importService.clearErrorLogs();
            return ResponseEntity.ok().body("Error logs cleared successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error clearing error logs: " + e.getMessage());
        }
    }

    private Object getFieldValue(Map<String, Object> recordMap, String displayName, String camelCaseName) {
        Object value = recordMap.get(displayName);
        if (value == null) {
            value = recordMap.get(camelCaseName);
        }
        return value;
    }

    private Double parseDoubleValue(Object value) {
        if (value == null) {
            return 0.0;
        }

        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }

        if (value instanceof String) {
            String strValue = (String) value;
            if (strValue.trim().isEmpty()) {
                return 0.0;
            }
            try {
                return Double.parseDouble(strValue);
            } catch (NumberFormatException e) {
                return 0.0;
            }
        }

        return 0.0;
    }
}