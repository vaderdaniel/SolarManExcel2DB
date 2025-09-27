package com.loots.solarmanui.service;

import com.loots.solarmanui.model.DatabaseStatus;
import com.loots.solarmanui.model.LatestRecords;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;

@Service
public class DatabaseService {

    @Autowired
    private DataSource dataSource;

    public DatabaseStatus checkDatabaseConnection() {
        LocalDateTime now = LocalDateTime.now();

        try (Connection connection = dataSource.getConnection()) {
            // Test connection with a simple query
            try (PreparedStatement stmt = connection.prepareStatement("SELECT 1")) {
                stmt.executeQuery();
                return new DatabaseStatus(true, "Database Connected", "ready", now);
            }
        } catch (SQLException e) {
            return new DatabaseStatus(false,
                "Database Disconnected: " + e.getMessage(),
                "unavailable", now);
        }
    }

    public LatestRecords getLatestRecordTimestamps() {
        LocalDateTime latestSolarMan = null;
        LocalDateTime latestTshwane = null;

        try (Connection connection = dataSource.getConnection()) {
            // Get latest SolarMan record
            try (PreparedStatement stmt = connection.prepareStatement(
                    "SELECT MAX(updated) as latest FROM public.loots_inverter")) {
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    java.sql.Timestamp ts = rs.getTimestamp("latest");
                    if (ts != null) {
                        latestSolarMan = ts.toLocalDateTime();
                    }
                }
            }

            // Get latest Tshwane record
            try (PreparedStatement stmt = connection.prepareStatement(
                    "SELECT MAX(reading_date) as latest FROM public.tshwane_electricity")) {
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    java.sql.Timestamp ts = rs.getTimestamp("latest");
                    if (ts != null) {
                        latestTshwane = ts.toLocalDateTime();
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Error getting latest record timestamps: " + e.getMessage());
        }

        return new LatestRecords(latestSolarMan, latestTshwane);
    }

    public boolean testCredentials(String username, String password) {
        try {
            String url = "jdbc:postgresql://localhost:5432/LOOTS";
            try (Connection connection = java.sql.DriverManager.getConnection(url, username, password)) {
                try (PreparedStatement stmt = connection.prepareStatement("SELECT 1")) {
                    stmt.executeQuery();
                    return true;
                }
            }
        } catch (SQLException e) {
            return false;
        }
    }
}