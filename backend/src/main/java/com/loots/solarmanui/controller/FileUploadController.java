package com.loots.solarmanui.controller;

import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import com.loots.solarmanui.service.ExcelProcessingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "http://localhost:4200")
public class FileUploadController {

    @Autowired
    private ExcelProcessingService excelProcessingService;
    
    // Store file information temporarily
    private static final Map<String, FileInfo> uploadedFiles = new ConcurrentHashMap<>();
    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir") + "/solarman-uploads/";
    
    static {
        try {
            Files.createDirectories(Paths.get(TEMP_DIR));
        } catch (IOException e) {
            System.err.println("Failed to create temp directory: " + e.getMessage());
        }
    }
    
    public static class FileInfo {
        private final String filePath;
        private final String fileType;
        private final int totalRecords;
        private final long timestamp;
        
        public FileInfo(String filePath, String fileType, int totalRecords) {
            this.filePath = filePath;
            this.fileType = fileType;
            this.totalRecords = totalRecords;
            this.timestamp = System.currentTimeMillis();
        }
        
        public String getFilePath() { return filePath; }
        public String getFileType() { return fileType; }
        public int getTotalRecords() { return totalRecords; }
        public long getTimestamp() { return timestamp; }
    }

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
                previewRecord.put("Plant", "SolarMan Plant"); // Add plant info if available
                previewRecord.put("Updated", record.getUpdated().toString());
                previewRecord.put("Time", record.getUpdated().toString()); // Duplicate for now
                previewRecord.put("Production Power", record.getProductionPower());
                previewRecord.put("Consumption Power", record.getConsumePower());
                previewRecord.put("Grid Power", record.getGridPower());
                previewRecord.put("Purchasing Power", record.getPurchasePower());
                previewRecord.put("Feed-in", record.getFeedIn());
                previewRecord.put("Battery Power", record.getBatteryPower());
                previewRecord.put("Charging Power", record.getChargePower());
                previewRecord.put("Discharging Power", record.getDischargePower());
                previewRecord.put("SoC", record.getSoc());
                previewData.add(previewRecord);
            }

            // Store file temporarily for later import
            String fileId = UUID.randomUUID().toString();
            String tempFilePath = TEMP_DIR + fileId + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), Paths.get(tempFilePath), StandardCopyOption.REPLACE_EXISTING);
            
            // Store file info
            uploadedFiles.put(fileId, new FileInfo(tempFilePath, "solarman", records.size()));
            
            // Clean up old files (older than 1 hour)
            cleanupOldFiles();
            
            Map<String, Object> response = new HashMap<>();
            response.put("previewData", previewData);
            response.put("totalRecords", records.size());
            response.put("fileType", "solarman");
            response.put("fileId", fileId); // Add file ID for import

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
                previewRecord.put("Reading Date", record.getReadingDate().toString());
                previewRecord.put("Reading Value", record.getReadingValue());
                previewRecord.put("Reading Amount", record.getReadingAmount());
                previewRecord.put("Reading Notes", record.getReadingNotes());
                previewData.add(previewRecord);
            }

            // Store file temporarily for later import
            String fileId = UUID.randomUUID().toString();
            String tempFilePath = TEMP_DIR + fileId + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), Paths.get(tempFilePath), StandardCopyOption.REPLACE_EXISTING);
            
            // Store file info
            uploadedFiles.put(fileId, new FileInfo(tempFilePath, "tshwane", records.size()));
            
            // Clean up old files (older than 1 hour)
            cleanupOldFiles();
            
            Map<String, Object> response = new HashMap<>();
            response.put("previewData", previewData);
            response.put("totalRecords", records.size());
            response.put("fileType", "tshwane");
            response.put("fileId", fileId); // Add file ID for import

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("File validation error: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error processing file: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }
    
    private void cleanupOldFiles() {
        long oneHourAgo = System.currentTimeMillis() - (60 * 60 * 1000);
        
        uploadedFiles.entrySet().removeIf(entry -> {
            FileInfo fileInfo = entry.getValue();
            if (fileInfo.getTimestamp() < oneHourAgo) {
                try {
                    Files.deleteIfExists(Paths.get(fileInfo.getFilePath()));
                    return true;
                } catch (IOException e) {
                    System.err.println("Failed to delete old file: " + fileInfo.getFilePath());
                    return false;
                }
            }
            return false;
        });
    }
    
    // Method to get file info for import
    public static FileInfo getFileInfo(String fileId) {
        return uploadedFiles.get(fileId);
    }
}