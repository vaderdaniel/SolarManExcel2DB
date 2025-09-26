package loots.jd;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

/**
 * TshwaneElectricityReader
 * 
 * A utility that reads electricity meter readings from a Tshwane Excel file
 * and inserts them into a PostgreSQL database table.
 * This class specifically reads from the "Elektrisiteit Lesings" tab
 * and imports only the first four columns.
 */
public class TshwaneElectricityReader {
    private static final String DB_URL = "jdbc:postgresql://localhost:5432/LOOTS";
    private static final String SHEET_NAME = "Elektrisiteit Lesings";
    private static int rowsInserted = 0;

    /**
     * Gets a cell value as a string, with a default value if the cell is null or empty.
     */
    private static String getCellValueAsString(Cell cell, String defaultValue) {
        if (cell == null) return defaultValue;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().isEmpty() ? defaultValue : cell.getStringCellValue();
            case NUMERIC: return String.valueOf(cell.getNumericCellValue());
            default: return defaultValue;
        }
    }

    /**
     * Gets a cell value as a double, with a default value if the cell is null or empty.
     */
    private static double getCellValueAsDouble(Cell cell, double defaultValue) {
        if (cell == null) return defaultValue;
        switch (cell.getCellType()) {
            case STRING:
                String value = cell.getStringCellValue();
                try {
                    return value.isEmpty() ? defaultValue : Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    System.out.println("Warning: Could not parse double value from cell: " + value);
                    return defaultValue;
                }
            case NUMERIC:
                return cell.getNumericCellValue();
            default:
                return defaultValue;
        }
    }

    /**
     * Parses a date string into a Timestamp object.
     */
    private static Timestamp parseDate(String value, String defaultValue) {
        if (value == null || value.isEmpty()) {
            System.out.println("Warning: Empty date, using default: " + defaultValue);
            return Timestamp.valueOf(defaultValue);
        }

        try {
            // Try the yyyy/MM/dd format
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd HH:mm");
            sdf.setLenient(true);
            Date date = sdf.parse(value);
            return new Timestamp(date.getTime());
        } catch (ParseException e) {
            try {
                // Try the dd/MM/yyyy format
                SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
                sdf.setLenient(true);
                Date date = sdf.parse(value);
                return new Timestamp(date.getTime());
            } catch (ParseException e2) {
                try {
                    // Try standard SQL format
                    return Timestamp.valueOf(value);
                } catch (IllegalArgumentException e3) {
                    try {
                        // Try Excel date serial number
                        double excelDate = Double.parseDouble(value);
                        return convertExcelDateToTimestamp(excelDate);
                    } catch (NumberFormatException e4) {
                        System.out.println("Failed to parse date: '" + value + "', using default: " + defaultValue);
                        return Timestamp.valueOf(defaultValue);
                    }
                }
            }
        }
    }

    private static Timestamp convertExcelDateToTimestamp(double excelDate) {
        // Excel's base date is 1899-12-30, but Java's Timestamp starts from 1970-01-01
        Calendar calendar = Calendar.getInstance();
        calendar.set(1899, Calendar.DECEMBER, 30, 0, 0, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        long baseTime = calendar.getTimeInMillis();
        long timeInMillis = baseTime + (long) (excelDate * 24 * 60 * 60 * 1000);
        return new Timestamp(timeInMillis);
    }

    /**
     * Creates the tshwane_electricity table if it doesn't exist.
     */
    private static void createTableIfNotExists(Connection conn) throws SQLException {
        String createTableSQL = 
            "CREATE TABLE IF NOT EXISTS public.tshwane_electricity (" +
            "reading_date TIMESTAMP NOT NULL, " +
            "reading_value DOUBLE PRECISION NOT NULL, " +
            "reading_amount DOUBLE PRECISION, " +
            "reading_notes TEXT, " +
            "CONSTRAINT tshwane_electricity_pkey PRIMARY KEY (reading_date)" +
            ")";

        try (PreparedStatement pstmt = conn.prepareStatement(createTableSQL)) {
            pstmt.executeUpdate();
            System.out.println("Table tshwane_electricity created or already exists");
        }
    }

    /**
     * Inserts a row into the tshwane_electricity table.
     */
    private static void insertRow(Row row, PreparedStatement pstmt) throws SQLException {
        if (row == null) return;

        String readingDate = getCellValueAsString(row.getCell(0), "");
        double readingValue = getCellValueAsDouble(row.getCell(1), 0.0);
        double readingAmount = getCellValueAsDouble(row.getCell(2), 0.0);
        String readingNotes = getCellValueAsString(row.getCell(3), "");

        // Skip if reading date is empty
        if (readingDate.isEmpty()) {
            System.out.println("Warning: Empty reading date, skipping row");
            return;
        }

        try {
            // Parse the date
            Timestamp timestamp = parseDate(readingDate, "2023-01-01 00:00:00");
            
            // Set parameters
            pstmt.setTimestamp(1, timestamp);               // reading_date
            pstmt.setDouble(2, readingValue);               // reading_value
            pstmt.setDouble(3, readingAmount);              // reading_amount
            pstmt.setString(4, readingNotes);               // reading_notes

            // Execute the statement and update count
            int result = pstmt.executeUpdate();
            if (result > 0) {
                rowsInserted += result;
                System.out.println("Row inserted/updated successfully: " + readingDate + ", " + readingValue);
            } else {
                System.out.println("No rows affected by this statement");
            }
        } catch (SQLException e) {
            System.out.println("Database error: " + e.getMessage());
            throw e; // Re-throw to be caught by main method
        }
    }

    public static void main(String[] args) {
        String xlsxFilePath = "/Users/danieloots/Library/CloudStorage/OneDrive-Personal/Documents/LootsShare/Tshwane Lesings en rekeninge.xlsx";
        
        if (args.length > 0) {
            xlsxFilePath = args[0];
        }

        File xlsxFile = new File(xlsxFilePath);

        // Get database credentials from environment variables
        String dbUser = System.getenv("DB_USER");
        String dbPasswordStr = System.getenv("DB_PASSWORD");

        // Validate environment variables
        if (dbUser == null || dbUser.trim().isEmpty()) {
            System.out.println("Error: Environment variable DB_USER is not set or is empty");
            System.exit(1);
        }

        if (dbPasswordStr == null || dbPasswordStr.trim().isEmpty()) {
            System.out.println("Error: Environment variable DB_PASSWORD is not set or is empty");
            System.exit(1);
        }

        char[] dbPassword = dbPasswordStr.toCharArray();

        System.out.println("Starting import from file: " + xlsxFile.getAbsolutePath());

        if (!xlsxFile.exists()) {
            System.out.println("Error: File does not exist: " + xlsxFile.getAbsolutePath());
            System.exit(1);
        }

        String sql = "INSERT INTO public.tshwane_electricity (reading_date, reading_value, reading_amount, reading_notes) " +
                "VALUES (?, ?, ?, ?) " +
                "ON CONFLICT (reading_date) DO UPDATE SET " +
                "reading_value = EXCLUDED.reading_value, " +
                "reading_amount = EXCLUDED.reading_amount, " +
                "reading_notes = EXCLUDED.reading_notes";

        Connection conn = null;
        PreparedStatement pstmt = null;
        InputStream inputStream = null;
        Workbook workbook = null;

        try {
            inputStream = new FileInputStream(xlsxFile);
            workbook = new XSSFWorkbook(inputStream);

            System.out.println("Found " + workbook.getNumberOfSheets() + " sheets in workbook");

            // Find the specific sheet
            Sheet sheet = null;
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                if (SHEET_NAME.equalsIgnoreCase(workbook.getSheetName(i))) {
                    sheet = workbook.getSheetAt(i);
                    System.out.println("Found sheet: " + workbook.getSheetName(i));
                    break;
                }
            }

            if (sheet == null) {
                System.out.println("Error: Sheet '" + SHEET_NAME + "' not found in workbook");
                System.exit(1);
            }

            // Connect to database
            System.out.println("Connecting to database...");
            conn = DriverManager.getConnection(DB_URL, dbUser, new String(dbPassword));
            conn.setAutoCommit(true);

            // Create table if it doesn't exist
            createTableIfNotExists(conn);

            pstmt = conn.prepareStatement(sql);

            int rowCount = 0;
            boolean skipHeader = true;

            for (Row row : sheet) {
                if (row == null) continue;

                // Skip header row
                if (skipHeader) {
                    skipHeader = false;
                    continue;
                }

                rowCount++;
                System.out.print("Processing row " + rowCount + ": ");
                
                try {
                    insertRow(row, pstmt);
                } catch (SQLException e) {
                    System.out.println("Error processing row " + rowCount + ": " + e.getMessage());
                }
            }

            System.out.println("Processing complete. Total rows inserted/updated in database: " + rowsInserted);

        } catch (IOException e) {
            System.out.println("File error: " + e.getMessage());
        } catch (SQLException e) {
            System.out.println("Database error: " + e.getMessage());
        } finally {
            // Close resources in reverse order of creation
            try {
                if (pstmt != null) pstmt.close();
                if (conn != null) conn.close();
                if (workbook != null) workbook.close();
                if (inputStream != null) inputStream.close();

                // Clear sensitive data
                if (dbPassword != null) {
                    for (int i = 0; i < dbPassword.length; i++) {
                        dbPassword[i] = 0;
                    }
                }
            } catch (IOException | SQLException e) {
                System.out.println("Error closing resources: " + e.getMessage());
            }
        }
    }
}