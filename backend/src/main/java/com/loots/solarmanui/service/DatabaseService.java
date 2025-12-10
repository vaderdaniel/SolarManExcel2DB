package com.loots.solarmanui.service;

import com.loots.solarmanui.model.DatabaseStatus;
import com.loots.solarmanui.model.LatestRecords;
import com.loots.solarmanui.model.ProductionStat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    public List<ProductionStat> getProductionStats(int days) {
        List<ProductionStat> stats = new ArrayList<>();
        
        // SQL query using time-weighted calculation from Grafana dashboard
        String sql = 
            "WITH samples AS ( " +
            "  SELECT " +
            "    updated, " +
            "    production_power, " +
            "    LAG(updated) OVER (ORDER BY updated) AS prev_updated " +
            "  FROM public.loots_inverter " +
            "  WHERE updated IS NOT NULL " +
            "), per_point AS ( " +
            "  SELECT " +
            "    DATE(updated) AS production_date, " +
            "    GREATEST(EXTRACT(EPOCH FROM (updated - prev_updated)) / 3600, 0) * production_power AS wh " +
            "  FROM samples " +
            "  WHERE prev_updated IS NOT NULL " +
            ") " +
            "SELECT " +
            "  production_date, " +
            "  SUM(wh) AS production_units " +
            "FROM per_point " +
            "GROUP BY production_date " +
            "ORDER BY production_date DESC " +
            "LIMIT ?";

        try (Connection connection = dataSource.getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            
            stmt.setInt(1, days);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                java.sql.Date sqlDate = rs.getDate("production_date");
                Double productionUnits = rs.getDouble("production_units");
                
                if (sqlDate != null) {
                    LocalDate date = sqlDate.toLocalDate();
                    stats.add(new ProductionStat(date, productionUnits));
                }
            }
        } catch (SQLException e) {
            System.err.println("Error getting production stats: " + e.getMessage());
        }
        
        return stats;
    }
}
