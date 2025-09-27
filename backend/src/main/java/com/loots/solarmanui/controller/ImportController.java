package com.loots.solarmanui.controller;

import com.loots.solarmanui.model.ImportResult;
import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import com.loots.solarmanui.service.ImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "http://localhost:4200")
public class ImportController {

    @Autowired
    private ImportService importService;

    @PostMapping("/solarman")
    public ResponseEntity<?> importSolarManData(@RequestBody List<Map<String, Object>> data) {
        try {
            // Convert Map data back to SolarManRecord objects
            List<SolarManRecord> records = new ArrayList<>();

            for (Map<String, Object> recordMap : data) {
                try {
                    SolarManRecord record = new SolarManRecord();

                    // Parse updated timestamp
                    String updatedStr = (String) recordMap.get("updated");
                    if (updatedStr != null) {
                        LocalDateTime updated = LocalDateTime.parse(updatedStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                        record.setUpdated(updated);
                    }

                    // Parse numeric fields
                    record.setProductionPower(parseDoubleValue(recordMap.get("productionPower")));
                    record.setConsumePower(parseDoubleValue(recordMap.get("consumePower")));
                    record.setGridPower(parseDoubleValue(recordMap.get("gridPower")));
                    record.setPurchasePower(parseDoubleValue(recordMap.get("purchasePower")));
                    record.setFeedIn(parseDoubleValue(recordMap.get("feedIn")));
                    record.setBatteryPower(parseDoubleValue(recordMap.get("batteryPower")));
                    record.setChargePower(parseDoubleValue(recordMap.get("chargePower")));
                    record.setDischargePower(parseDoubleValue(recordMap.get("dischargePower")));
                    record.setSoc(parseDoubleValue(recordMap.get("soc")));

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
    public ResponseEntity<?> importTshwaneData(@RequestBody List<Map<String, Object>> data) {
        try {
            // Convert Map data back to TshwaneRecord objects
            List<TshwaneRecord> records = new ArrayList<>();

            for (Map<String, Object> recordMap : data) {
                try {
                    TshwaneRecord record = new TshwaneRecord();

                    // Parse reading date
                    String readingDateStr = (String) recordMap.get("readingDate");
                    if (readingDateStr != null) {
                        LocalDateTime readingDate = LocalDateTime.parse(readingDateStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                        record.setReadingDate(readingDate);
                    }

                    // Parse numeric fields
                    record.setReadingValue(parseDoubleValue(recordMap.get("readingValue")));
                    record.setReadingAmount(parseDoubleValue(recordMap.get("readingAmount")));
                    record.setReadingNotes((String) recordMap.get("readingNotes"));

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