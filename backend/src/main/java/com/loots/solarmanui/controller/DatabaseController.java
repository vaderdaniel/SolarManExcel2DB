package com.loots.solarmanui.controller;

import com.loots.solarmanui.model.DatabaseStatus;
import com.loots.solarmanui.model.LatestRecords;
import com.loots.solarmanui.model.ProductionStat;
import com.loots.solarmanui.service.DatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/database")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:30080"})
public class DatabaseController {

    @Autowired
    private DatabaseService databaseService;

    @GetMapping("/status")
    public ResponseEntity<DatabaseStatus> getDatabaseStatus() {
        try {
            DatabaseStatus status = databaseService.checkDatabaseConnection();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            DatabaseStatus errorStatus = new DatabaseStatus(
                false,
                "Error checking database status: " + e.getMessage(),
                "unavailable",
                java.time.LocalDateTime.now()
            );
            return ResponseEntity.ok(errorStatus);
        }
    }

    @GetMapping("/latest-records")
    public ResponseEntity<LatestRecords> getLatestRecords() {
        try {
            LatestRecords latestRecords = databaseService.getLatestRecordTimestamps();
            return ResponseEntity.ok(latestRecords);
        } catch (Exception e) {
            // Return empty records on error
            LatestRecords emptyRecords = new LatestRecords(null, null);
            return ResponseEntity.ok(emptyRecords);
        }
    }

    @PostMapping("/configure")
    public ResponseEntity<?> configureDatabaseCredentials(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");

            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Username is required");
            }

            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Password is required");
            }

            boolean credentialsValid = databaseService.testCredentials(username, password);

            if (credentialsValid) {
                // Note: In a real application, you might want to store these credentials
                // securely or update the application configuration
                DatabaseStatus status = new DatabaseStatus(
                    true,
                    "Database credentials validated successfully",
                    "ready",
                    java.time.LocalDateTime.now()
                );
                return ResponseEntity.ok(status);
            } else {
                DatabaseStatus status = new DatabaseStatus(
                    false,
                    "Invalid database credentials",
                    "unavailable",
                    java.time.LocalDateTime.now()
                );
                return ResponseEntity.badRequest().body(status);
            }

        } catch (Exception e) {
            DatabaseStatus errorStatus = new DatabaseStatus(
                false,
                "Error testing database credentials: " + e.getMessage(),
                "unavailable",
                java.time.LocalDateTime.now()
            );
            return ResponseEntity.internalServerError().body(errorStatus);
        }
    }

    @GetMapping("/production-stats")
    public ResponseEntity<List<ProductionStat>> getProductionStats(
            @RequestParam(defaultValue = "7") int days) {
        try {
            List<ProductionStat> stats = databaseService.getProductionStats(days);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            // Return empty list on error
            return ResponseEntity.ok(List.of());
        }
    }
}
