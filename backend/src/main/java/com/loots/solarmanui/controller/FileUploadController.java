package com.loots.solarmanui.controller;

import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import com.loots.solarmanui.service.ExcelProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "http://localhost:4200")
public class FileUploadController {

    @Autowired
    private ExcelProcessingService excelProcessingService;

    @PostMapping("/solarman")
    public ResponseEntity<?> uploadSolarManFile(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file format
            if (!excelProcessingService.validateFileFormat(file, "solarman")) {
                return ResponseEntity.badRequest().body("Invalid file format. Please upload an Excel file.");
            }

            // Process the Excel file
            List<SolarManRecord> records = excelProcessingService.processSolarManFile(file);

            // Convert to preview format (first 10 records for preview)
            List<Map<String, Object>> previewData = new ArrayList<>();
            int previewLimit = Math.min(records.size(), 10);

            for (int i = 0; i < previewLimit; i++) {
                SolarManRecord record = records.get(i);
                Map<String, Object> previewRecord = new HashMap<>();
                previewRecord.put("updated", record.getUpdated().toString());
                previewRecord.put("productionPower", record.getProductionPower());
                previewRecord.put("consumePower", record.getConsumePower());
                previewRecord.put("gridPower", record.getGridPower());
                previewRecord.put("purchasePower", record.getPurchasePower());
                previewRecord.put("feedIn", record.getFeedIn());
                previewRecord.put("batteryPower", record.getBatteryPower());
                previewRecord.put("chargePower", record.getChargePower());
                previewRecord.put("dischargePower", record.getDischargePower());
                previewRecord.put("soc", record.getSoc());
                previewData.add(previewRecord);
            }

            // Store full data in session or cache for later import
            // For now, return preview data with total count
            Map<String, Object> response = new HashMap<>();
            response.put("previewData", previewData);
            response.put("totalRecords", records.size());
            response.put("fileType", "solarman");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("File validation error: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error processing file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }

    @PostMapping("/tshwane")
    public ResponseEntity<?> uploadTshwaneFile(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file format
            if (!excelProcessingService.validateFileFormat(file, "tshwane")) {
                return ResponseEntity.badRequest().body("Invalid file format. Please upload an Excel file.");
            }

            // Process the Excel file
            List<TshwaneRecord> records = excelProcessingService.processTshwaneFile(file);

            // Convert to preview format (first 10 records for preview)
            List<Map<String, Object>> previewData = new ArrayList<>();
            int previewLimit = Math.min(records.size(), 10);

            for (int i = 0; i < previewLimit; i++) {
                TshwaneRecord record = records.get(i);
                Map<String, Object> previewRecord = new HashMap<>();
                previewRecord.put("readingDate", record.getReadingDate().toString());
                previewRecord.put("readingValue", record.getReadingValue());
                previewRecord.put("readingAmount", record.getReadingAmount());
                previewRecord.put("readingNotes", record.getReadingNotes());
                previewData.add(previewRecord);
            }

            // Store full data in session or cache for later import
            // For now, return preview data with total count
            Map<String, Object> response = new HashMap<>();
            response.put("previewData", previewData);
            response.put("totalRecords", records.size());
            response.put("fileType", "tshwane");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("File validation error: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error processing file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }
}