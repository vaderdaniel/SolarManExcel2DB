# SolarManExcel2DB - API Reference

## 📚 Class Documentation

### SolarManExcel2DB

Main application class for importing SolarMan Excel data into PostgreSQL.

#### Class Overview
```java
package loots.jd;

public final class SolarManExcel2DB {
    private static final String DB_URL = "jdbc:postgresql://localhost:5432/LOOTS";
    private static int rowsInserted = 0;
    private static Timestamp timeThreshold;
}
```

#### Key Methods

##### `main(String[] args)`
**Purpose**: Entry point for the application
**Parameters**: 
- `args[0]` - Path to Excel file to process
**Returns**: `void`
**Environment Variables Required**:
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password

**Usage**:
```bash
java -cp target/classes loots.jd.SolarManExcel2DB /path/to/file.xlsx
```

##### `isColumnsCorrect(ArrayList<Cell> headings)`
**Purpose**: Validates Excel file column structure
**Parameters**: 
- `headings` - List of header cells from Excel file
**Returns**: `boolean` - true if columns match expected format
**Expected Columns**:
1. Plant (starts with "Plant")
2. Updated (starts with "Updated") 
3. Time (starts with "Time")
4. Production (starts with "Production")
5. Consumption (starts with "Consumption")
6. Grid (starts with "Grid")
7. Purchasing (starts with "Purchasing")
8. Feed-in (starts with "Feed-in")
9. Battery (starts with "Battery")
10. Charging (starts with "Charging")
11. Discharging (starts with "Discharging")
12. SoC (starts with "SoC")

##### `getCellValueAsString(Cell cell, String defaultValue)`
**Purpose**: Safely extracts string value from Excel cell
**Parameters**: 
- `cell` - Excel cell object (can be null)
- `defaultValue` - Value to return if cell is null/empty
**Returns**: `String` - Cell value or default
**Handles**: STRING, NUMERIC cell types

##### `getCellValueAsDouble(Cell cell, double defaultValue)`
**Purpose**: Safely extracts numeric value from Excel cell
**Parameters**: 
- `cell` - Excel cell object (can be null)
- `defaultValue` - Value to return if cell is null/empty/invalid
**Returns**: `double` - Cell value or default
**Error Handling**: Logs parsing errors and returns default

##### `parseTimestamp(String value, String defaultValue)`
**Purpose**: Converts string to Timestamp with multiple format support
**Parameters**: 
- `value` - Date/time string from Excel
- `defaultValue` - Default timestamp string if parsing fails
**Returns**: `Timestamp` - Parsed timestamp
**Supported Formats**:
- `yyyy/MM/dd HH:mm`
- `yyyy/MM/dd HH:mm:ss`
- SQL format (`yyyy-MM-dd HH:mm:ss`)
- `MM/dd/yyyy HH:mm`

##### `upsertRow(ArrayList<Cell> cells, PreparedStatement pstmt)`
**Purpose**: Processes a data row and inserts/updates database record
**Parameters**: 
- `cells` - List of cells from Excel row
- `pstmt` - Prepared statement for database operation
**Returns**: `void`
**Side Effects**: 
- Increments `rowsInserted` counter
- Logs processing details
- Validates timestamp threshold (after 2020-01-01)

#### Database Schema Mapping

| Excel Column Index | Database Column | Data Type | Description |
|-------------------|-----------------|-----------|-------------|
| 1 | `updated` | TIMESTAMP | Primary key, record timestamp |
| 3 | `production_power` | DOUBLE | Solar production in watts |
| 4 | `consume_power` | DOUBLE | Energy consumption in watts |
| 5 | `grid_power` | DOUBLE | Grid power flow in watts |
| 6 | `purchase_power` | DOUBLE | Power purchased from grid |
| 7 | `feed_in` | DOUBLE | Power fed into grid |
| 8 | `battery_power` | DOUBLE | Battery power level |
| 9 | `charge_power` | DOUBLE | Battery charging rate |
| 10 | `discharge_power` | DOUBLE | Battery discharge rate |
| 11 | `soc` | DOUBLE | State of charge percentage |

#### SQL Operations

##### UPSERT Statement
```sql
INSERT INTO public.loots_inverter (
    updated, production_power, consume_power, grid_power,
    purchase_power, feed_in, battery_power, charge_power,
    discharge_power, soc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT (updated) DO UPDATE SET
    production_power = EXCLUDED.production_power,
    consume_power = EXCLUDED.consume_power,
    grid_power = EXCLUDED.grid_power,
    purchase_power = EXCLUDED.purchase_power,
    feed_in = EXCLUDED.feed_in,
    battery_power = EXCLUDED.battery_power,
    charge_power = EXCLUDED.charge_power,
    discharge_power = EXCLUDED.discharge_power,
    soc = EXCLUDED.soc
```

---

### TshwaneElectricityReader

Utility class for reading Tshwane electricity meter data from Excel files.

#### Class Overview
```java
package loots.jd;

public class TshwaneElectricityReader {
    private static final String DB_URL = "jdbc:postgresql://localhost:5432/LOOTS";
    private static final String SHEET_NAME = "Elektrisiteit Lesings";
    private static int rowsInserted = 0;
}
```

#### Key Methods

##### `main(String[] args)`
**Purpose**: Entry point for Tshwane electricity data import
**Parameters**: 
- `args[0]` - Optional path to Excel file (default: predefined path)
**Default File**: `/Users/danieloots/Library/CloudStorage/OneDrive-Personal/Documents/LootsShare/Tshwane Lesings en rekeninge.xlsx`

##### `createTableIfNotExists(Connection conn)`
**Purpose**: Creates the electricity readings table if it doesn't exist
**Parameters**: 
- `conn` - Database connection
**Returns**: `void`
**Creates Table**:
```sql
CREATE TABLE IF NOT EXISTS public.tshwane_electricity (
    reading_date TIMESTAMP NOT NULL,
    reading_value DOUBLE PRECISION NOT NULL,
    reading_amount DOUBLE PRECISION,
    reading_notes TEXT,
    CONSTRAINT tshwane_electricity_pkey PRIMARY KEY (reading_date)
)
```

##### `parseDate(String value, String defaultValue)`
**Purpose**: Parses various date formats including Excel serial numbers
**Parameters**: 
- `value` - Date string or Excel serial number
- `defaultValue` - Default value if parsing fails
**Returns**: `Timestamp`
**Supported Formats**:
- `yyyy/MM/dd HH:mm`
- `dd/MM/yyyy`
- SQL format
- Excel date serial numbers

##### `convertExcelDateToTimestamp(double excelDate)`
**Purpose**: Converts Excel date serial number to Timestamp
**Parameters**: 
- `excelDate` - Excel date as double (days since 1899-12-30)
**Returns**: `Timestamp`
**Algorithm**: Calculates milliseconds from Excel base date (1899-12-30)

##### `insertRow(Row row, PreparedStatement pstmt)`
**Purpose**: Inserts electricity reading data into database
**Parameters**: 
- `row` - Excel row containing reading data
- `pstmt` - Prepared statement for insert operation
**Column Mapping**:
- Column 0: `reading_date`
- Column 1: `reading_value` 
- Column 2: `reading_amount`
- Column 3: `reading_notes`

---

## 🔧 Configuration Constants

### Database Configuration
```java
// Database connection URL
private static final String DB_URL = "jdbc:postgresql://localhost:5432/LOOTS";

// Time threshold for data filtering (2020-01-01 00:00:00)
private static Timestamp timeThreshold = new Timestamp(
    new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse("2020-01-01 00:00:00").getTime()
);
```

### Excel Processing
```java
// Expected column count for SolarMan files
private static final int EXPECTED_COLUMNS = 12;

// Target sheet name for Tshwane electricity data
private static final String SHEET_NAME = "Elektrisiteit Lesings";
```

## 🚨 Error Handling

### Exception Types
- `IOException` - File reading errors
- `SQLException` - Database operation errors
- `ParseException` - Date/time parsing errors
- `NumberFormatException` - Numeric conversion errors

### Error Recovery
- **Cell Parsing**: Uses default values for null/invalid cells
- **Date Parsing**: Attempts multiple formats before failing
- **Database Errors**: Logs error but continues processing other rows
- **File Errors**: Graceful shutdown with error message

### Logging Strategy
```java
// Row processing status
System.out.print("Line " + rowCount + ": ");

// Cell value logging (abbreviated)
System.out.print("Up " + updateTime + " Pr " + prodPower);

// Result confirmation
System.out.println("Row inserted/updated successfully");
```

## 🔒 Security Features

### SQL Injection Prevention
- Uses `PreparedStatement` exclusively
- Parameters bound safely with `pstmt.setTimestamp()`, `pstmt.setDouble()`
- No dynamic SQL construction

### Credential Security
```java
// Environment variable access
String dbUser = System.getenv("DB_USER");
String dbPasswordStr = System.getenv("DB_PASSWORD");
char[] dbPassword = dbPasswordStr.toCharArray();

// Memory cleanup
for (int i = 0; i < dbPassword.length; i++) {
    dbPassword[i] = 0;
}
```

## 📊 Performance Characteristics

### Memory Usage
- **Streaming Processing**: Processes Excel rows sequentially
- **Connection Pooling**: Single database connection per run
- **Memory Cleanup**: Explicit resource closure in finally blocks

### Processing Speed
- **Batch Size**: Single row transactions (can be optimized for batch processing)
- **File Size**: Suitable for files up to ~100MB (limited by available heap)
- **Throughput**: Approximately 1000-5000 rows per minute (database dependent)

### Resource Management
```java
// Proper resource cleanup pattern
try (Connection conn = DriverManager.getConnection(DB_URL, dbUser, dbPassword);
     PreparedStatement pstmt = conn.prepareStatement(sql);
     InputStream xlsxFile = new FileInputStream(xlsxFileName);
     Workbook wb = new XSSFWorkbook(xlsxFile)) {
    // Processing logic
} catch (Exception e) {
    // Error handling
} finally {
    // Additional cleanup
}
```

---

## 📝 Usage Examples

### Custom Database Connection
```java
// To modify database connection, change the constant:
private static final String DB_URL = "jdbc:postgresql://your-host:5432/your-database";
```

### Custom Time Filtering
```java
// To change the time threshold:
timeThreshold = new Timestamp(
    new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").parse("2019-01-01 00:00:00").getTime()
);
```

### Batch Processing Integration
```java
// Example integration with batch processing framework
public void processSolarFiles(List<String> filePaths) {
    for (String filePath : filePaths) {
        SolarManExcel2DB.main(new String[]{filePath});
    }
}
```