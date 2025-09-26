package loots.jd;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
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
import java.util.ArrayList;
import java.util.Date;

/**
 * SolarManExcel2DB
 * 
 * A utility that reads solar power data from a SolarMan Excel export
 * and inserts it into a PostgreSQL database table.
 */
public final class SolarManExcel2DB {
    private static final String DB_URL = "jdbc:postgresql://localhost:5432/LOOTS";
    private static int rowsInserted = 0;
    private static Timestamp timeThreshold;

    static {
        try {
            timeThreshold = new Timestamp(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
                    .parse("2020-01-01 00:00:00").getTime());
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }

    private static boolean isColumnsCorrect(ArrayList<Cell> headings) {
        boolean isCorrect = headings.size() == 12;
        if(!isCorrect) {
            System.out.println("Wrong number of columns: " + headings.size() + " (expected 12)");
            return false;
        }
        for(Cell heading : headings) {
            if (heading == null || heading.getCellType() != CellType.STRING) {
                System.out.println("Column " + heading.getColumnIndex() + " is not a string type");
                return false;
            }

            String value = heading.getStringCellValue();
            boolean columnCorrect = false;

            switch(heading.getColumnIndex()) {
                case 0:
                    columnCorrect = value.startsWith("Plant");
                    break;
                case 1:
                    columnCorrect = value.startsWith("Updated");
                    break;
                case 2:
                    columnCorrect = value.startsWith("Time");
                    break;
                case 3:
                    columnCorrect = value.startsWith("Production");
                    break;
                case 4:
                    columnCorrect = value.startsWith("Consumption");
                    break;
                case 5:
                    columnCorrect = value.startsWith("Grid");
                    break;
                case 6:
                    columnCorrect = value.startsWith("Purchasing");
                    break;
                case 7:
                    columnCorrect = value.startsWith("Feed-in");
                    break;
                case 8:
                    columnCorrect = value.startsWith("Battery");
                    break;
                case 9:
                    columnCorrect = value.startsWith("Charging");
                    break;
                case 10:
                    columnCorrect = value.startsWith("Discharging");
                    break;
                case 11:
                    columnCorrect = value.startsWith("SoC");
                    break;
                default:
                    return false;
            }

            if(!columnCorrect) {
                System.out.println("Column " + heading.getColumnIndex() + " with value '" + value + "' does not match expected heading");
                return false;
            }
        }
        return true;
    }

    private static String getCellValueAsString(Cell cell, String defaultValue) {
        if (cell == null) return defaultValue;
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().isEmpty() ? defaultValue : cell.getStringCellValue();
            case NUMERIC: return String.valueOf(cell.getNumericCellValue());
            default: return defaultValue;
        }
    }

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

    private static Timestamp parseTimestamp(String value, String defaultValue) {
        if (value == null || value.isEmpty()) {
            System.out.println("Warning: Empty timestamp, using default: " + defaultValue);
            return Timestamp.valueOf(defaultValue);
        }

        try {
            // Try the yyyy/MM/dd HH:mm:ss format from SolarMan
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd HH:mm");
            // Set lenient to false to enforce strict date parsing
            sdf.setLenient(false);
            Date date = sdf.parse(value);
            return new Timestamp(date.getTime());
        } catch (ParseException e) {
            try {
                // Try the yyyy/MM/dd HH:mm:ss format with seconds
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
                sdf.setLenient(false);
                Date date = sdf.parse(value);
                return new Timestamp(date.getTime());
            } catch (ParseException e2) {
                try {
                    // Try standard SQL format
                    return Timestamp.valueOf(value);
                } catch (IllegalArgumentException e3) {
                    // Try alternative format, e.g., "MM/dd/yyyy HH:mm"
                    try {
                        SimpleDateFormat sdf = new SimpleDateFormat("MM/dd/yyyy HH:mm");
                        sdf.setLenient(false);
                        Date date = sdf.parse(value);
                        return new Timestamp(date.getTime());
                    } catch (Exception ex) {
                        System.out.println("Failed to parse timestamp: '" + value + "', using default: " + defaultValue);
                        return Timestamp.valueOf(defaultValue);
                    }
                }
            }
        }
    }

    private static void upsertRow(final ArrayList<Cell> cells, final PreparedStatement pstmt) throws SQLException {
        String updateTime = null;
        String prodPower = "0.0";
        String consumePower = "0.0";
        String gridPower = "0.0";
        String purchasePower = "0.0";
        String feedIn = "0.0";
        String batteryPower = "0.0";
        String chargePower = "0.0";
        String dischargePower = "0.0";
        String soc = "0.0";

        // Verify that we have cells to process
        if (cells.isEmpty()) {
            System.out.println("Warning: Empty row, skipping");
            return;
        }

        for (Cell cell : cells) {
            if (cell == null) continue;

            switch (cell.getColumnIndex()) {
                case 1: // Updated time
                    updateTime = getCellValueAsString(cell, "");
                    System.out.print("Up " + updateTime);
                    break;
                case 3: // Production Power
                    prodPower = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Pr " + prodPower);
                    break;
                case 4: // Consume Power
                    consumePower = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Co " + consumePower);
                    break;
                case 5: // Grid Power
                    gridPower = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Gr " + gridPower);
                    break;
                case 6: // Purchase Power
                    purchasePower = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Pu " + purchasePower);
                    break;
                case 7: // Feed-in
                    feedIn = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Fi " + feedIn);
                    break;
                case 8: // Battery Power
                    batteryPower = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Ba " + batteryPower);
                    break;
                case 9: // Charge Power
                    chargePower = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Ch " + chargePower);
                    break;
                case 10: // Discharge Power
                    dischargePower = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" Di " + dischargePower);
                    break;
                case 11: // SoC (State of Charge)
                    soc = String.valueOf(getCellValueAsDouble(cell, 0.0));
                    System.out.print(" So " + soc + " | ");
                    break;
            }
        }

        // Validate updateTime before proceeding
        if (updateTime == null || updateTime.isEmpty()) {
            System.out.println("Warning: Missing timestamp, skipping row");
            return;
        }

        try {
            // Parse the timestamp first to validate it
            Timestamp timestamp = parseTimestamp(updateTime, "2023-01-01 00:00:00");
            System.out.print("TIMESTAMP " + timestamp.toString() + " => ");
            // Check if the resulting date is after 1 Jan 2020
            if(timestamp.before(timeThreshold)) {
                System.out.println("date is before 2020-01-01, no rows affected");
                return;
            }

            // Set all parameters
            pstmt.setTimestamp(1, timestamp);                        // updated
            pstmt.setDouble(2, Double.parseDouble(prodPower));       // production_power
            pstmt.setDouble(3, Double.parseDouble(consumePower));    // consume_power
            pstmt.setDouble(4, Double.parseDouble(gridPower));       // grid_power
            pstmt.setDouble(5, Double.parseDouble(purchasePower));   // purchase_power
            pstmt.setDouble(6, Double.parseDouble(feedIn));          // feed_in
            pstmt.setDouble(7, Double.parseDouble(batteryPower));    // battery_power
            pstmt.setDouble(8, Double.parseDouble(chargePower));     // charge_power
            pstmt.setDouble(9, Double.parseDouble(dischargePower));  // discharge_power
            pstmt.setDouble(10, Double.parseDouble(soc));            // soc

            // Execute the statement and update count
            int result = pstmt.executeUpdate();
            if (result > 0) {
                rowsInserted += result;
                System.out.println("Row inserted/updated successfully");
            } else {
                System.out.println("No rows affected by this statement");
            }
        } catch (NumberFormatException e) {
            System.out.println("Error parsing numeric value: " + e.getMessage());
        } catch (SQLException e) {
            System.out.println("Database error: " + e.getMessage());
            throw e; // Re-throw to be caught by main method
        }
    }

    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Error: Please specify the name of the Excel file to read");
            System.exit(1);
        }

        File xlsxFileName = new File(args[0]);

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

        System.out.println("Starting import from file: " + xlsxFileName.getAbsolutePath());

        if (!xlsxFileName.exists()) {
            System.out.println("Error: File does not exist: " + xlsxFileName.getAbsolutePath());
            System.exit(1);
        }

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

        Connection conn = null;
        PreparedStatement pstmt = null;
        InputStream xlsxFile = null;
        Workbook wb = null;

        try {
            xlsxFile = new FileInputStream(xlsxFileName);
            wb = new XSSFWorkbook(xlsxFile);

            System.out.println("Found " + wb.getNumberOfSheets() + " sheets in Spreadsheet " + args[0]);

            // Connect to database
            System.out.println("Connecting to database...");
            conn = DriverManager.getConnection(DB_URL, dbUser, new String(dbPassword));

            // Make sure auto-commit is enabled
            conn.setAutoCommit(true);

            pstmt = conn.prepareStatement(sql);

            Sheet sheet1 = wb.getSheetAt(0);
            int rowCount = 0;
            boolean columnsIsCorrect = false;
            ArrayList<Cell> headings = new ArrayList<>();

            for (Row row : sheet1) {
                if (row == null) continue;

                ArrayList<Cell> currentRow = new ArrayList<>();

                if (rowCount == 0) {
                    // Process header row
                    for (Cell cell : row) {
                        headings.add(cell);
                    }
                    columnsIsCorrect = isColumnsCorrect(headings);
                    if (!columnsIsCorrect) {
                        System.out.println("Error: Column headers do not match expected format. Aborting.");
                        break;
                    }
                } else if (columnsIsCorrect) {
                    // Process data row
                    for (Cell cell : row) {
                        currentRow.add(cell);
                    }

                    System.out.print("Line " + rowCount + ": ");
                    try {
                        upsertRow(currentRow, pstmt);
                    } catch (SQLException e) {
                        System.out.println("Error processing row " + rowCount + ": " + e.getMessage());
                    }
                }
                rowCount++;
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
                if (wb != null) wb.close();
                if (xlsxFile != null) xlsxFile.close();

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