package com.loots.solarmanui.service;

import com.loots.solarmanui.model.ImportResult;
import com.loots.solarmanui.model.SolarManRecord;
import com.loots.solarmanui.model.TshwaneRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImportService {

    @Autowired
    private DataSource dataSource;

    private final List<String> errorLogs = new ArrayList<>();

    public ImportResult importSolarManData(List<SolarManRecord> records) {
        ImportResult result = new ImportResult();
        LocalDateTime firstDate = null;
        LocalDateTime lastDate = null;
        int inserted = 0;
        int updated = 0;

        String sql = "INSERT INTO public.loots_inverter (updated, production_power, consume_power, grid_power, " +
                "purchase_power, feed_in, battery_power, charge_power, discharge_power, soc) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                "ON CONFLICT (updated) DO UPDATE SET " +
                "production_power = EXCLUDED.production_power, " +
                "consume_power = EXCLUDED.consume_power, " +
                "grid_power = EXCLUDED.grid_power, " +
                "purchase_power = EXCLUDED.purchase_power, " +
                "feed_in = EXCLUDED.feed_in, " +
                "battery_power = EXCLUDED.battery_power, " +
                "charge_power = EXCLUDED.charge_power, " +
                "discharge_power = EXCLUDED.discharge_power, " +
                "soc = EXCLUDED.soc";

        try (Connection connection = dataSource.getConnection();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            connection.setAutoCommit(true);

            for (SolarManRecord record : records) {
                try {
                    // Check for null updated field
                    if (record.getUpdated() == null) {
                        String errorMessage = "Record has null updated field, skipping";
                        result.addError(errorMessage);
                        logError(errorMessage, new IllegalArgumentException("Null updated field"));
                        continue;
                    }
                    
                    pstmt.setTimestamp(1, Timestamp.valueOf(record.getUpdated()));
                    pstmt.setDouble(2, record.getProductionPower() != null ? record.getProductionPower() : 0.0);
                    pstmt.setDouble(3, record.getConsumePower() != null ? record.getConsumePower() : 0.0);
                    pstmt.setDouble(4, record.getGridPower() != null ? record.getGridPower() : 0.0);
                    pstmt.setDouble(5, record.getPurchasePower() != null ? record.getPurchasePower() : 0.0);
                    pstmt.setDouble(6, record.getFeedIn() != null ? record.getFeedIn() : 0.0);
                    pstmt.setDouble(7, record.getBatteryPower() != null ? record.getBatteryPower() : 0.0);
                    pstmt.setDouble(8, record.getChargePower() != null ? record.getChargePower() : 0.0);
                    pstmt.setDouble(9, record.getDischargePower() != null ? record.getDischargePower() : 0.0);
                    pstmt.setDouble(10, record.getSoc() != null ? record.getSoc() : 0.0);

                    int rowsAffected = pstmt.executeUpdate();
                    if (rowsAffected > 0) {
                        inserted++;
                    }

                    // Track date range - with null check
                    if (record.getUpdated() != null) {
                        if (firstDate == null || record.getUpdated().isBefore(firstDate)) {
                            firstDate = record.getUpdated();
                        }
                        if (lastDate == null || record.getUpdated().isAfter(lastDate)) {
                            lastDate = record.getUpdated();
                        }
                    }

                } catch (SQLException e) {
                    String errorMessage = "Error importing SolarMan record at " + record.getUpdated() + ": " + e.getMessage();
                    result.addError(errorMessage);
                    logError(errorMessage, e);
                }
            }

        } catch (SQLException e) {
            String errorMessage = "Database connection error during SolarMan import: " + e.getMessage();
            result.addError(errorMessage);
            logError(errorMessage, e);
        }

        result.setRecordsInserted(inserted);
        result.setRecordsUpdated(updated);
        result.setFirstRecordDate(firstDate);
        result.setLastRecordDate(lastDate);

        return result;
    }

    public ImportResult importTshwaneData(List<TshwaneRecord> records) {
        ImportResult result = new ImportResult();
        LocalDateTime firstDate = null;
        LocalDateTime lastDate = null;
        int inserted = 0;
        int updated = 0;

        String sql = "INSERT INTO public.tshwane_electricity (reading_date, reading_value, reading_amount, reading_notes) " +
                "VALUES (?, ?, ?, ?) " +
                "ON CONFLICT (reading_date) DO UPDATE SET " +
                "reading_value = EXCLUDED.reading_value, " +
                "reading_amount = EXCLUDED.reading_amount, " +
                "reading_notes = EXCLUDED.reading_notes";

        try (Connection connection = dataSource.getConnection();
             PreparedStatement pstmt = connection.prepareStatement(sql)) {

            connection.setAutoCommit(true);

            for (TshwaneRecord record : records) {
                try {
                    pstmt.setTimestamp(1, Timestamp.valueOf(record.getReadingDate()));
                    pstmt.setDouble(2, record.getReadingValue() != null ? record.getReadingValue() : 0.0);
                    pstmt.setDouble(3, record.getReadingAmount() != null ? record.getReadingAmount() : 0.0);
                    pstmt.setString(4, record.getReadingNotes() != null ? record.getReadingNotes() : "");

                    int rowsAffected = pstmt.executeUpdate();
                    if (rowsAffected > 0) {
                        inserted++;
                    }

                    // Track date range
                    if (firstDate == null || record.getReadingDate().isBefore(firstDate)) {
                        firstDate = record.getReadingDate();
                    }
                    if (lastDate == null || record.getReadingDate().isAfter(lastDate)) {
                        lastDate = record.getReadingDate();
                    }

                } catch (SQLException e) {
                    String errorMessage = "Error importing Tshwane record at " + record.getReadingDate() + ": " + e.getMessage();
                    result.addError(errorMessage);
                    logError(errorMessage, e);
                }
            }

        } catch (SQLException e) {
            String errorMessage = "Database connection error during Tshwane import: " + e.getMessage();
            result.addError(errorMessage);
            logError(errorMessage, e);
        }

        result.setRecordsInserted(inserted);
        result.setRecordsUpdated(updated);
        result.setFirstRecordDate(firstDate);
        result.setLastRecordDate(lastDate);

        return result;
    }

    private void logError(String message, Exception e) {
        String logEntry = LocalDateTime.now() + ": " + message;
        errorLogs.add(logEntry);
        System.err.println(logEntry);

        // Keep only last 100 error logs to prevent memory issues
        if (errorLogs.size() > 100) {
            errorLogs.remove(0);
        }
    }

    public List<String> getErrorLogs() {
        return new ArrayList<>(errorLogs);
    }

    public void clearErrorLogs() {
        errorLogs.clear();
    }
}