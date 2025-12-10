# SolarManExcel2DB - Warp Documentation

## 🌞 Project Overview
SolarManExcel2DB is a comprehensive solution for importing and visualizing solar power generation data. It consists of:
1. **CLI Tool**: Java utility for batch importing SolarMan Excel exports
2. **Web UI** (Version 1.1): Angular + Spring Boot application with production visualization

This tool streamlines the process of transferring solar monitoring data from Excel files into a PostgreSQL database for analysis, reporting, and visualization.

## 🚀 Quick Start

### Prerequisites
- Java 11 or higher
- Maven 3.6+
- PostgreSQL database (running via `/Users/danieloots/LOOTS_PG/loots_pg.sh`)
- Environment variables: `DB_USER` and `DB_PASSWORD`
- Node.js 20+ and npm (for Web UI)
- Docker and Kubernetes (for containerized deployment)

### Setup Database
```bash
# Start the PostgreSQL database
/Users/danieloots/LOOTS_PG/loots_pg.sh
```

### Environment Setup
```bash
# Set database credentials
export DB_USER=your_database_username
export DB_PASSWORD=your_database_password
```

### Build Project
```bash
# Clean and package the application
mvn clean package
```

### Run Application

#### CLI Tool
```bash
# Import Excel file to database
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar /path/to/your/solarman_export.xlsx
```

#### Web UI (Version 1.1)
```bash
# Development mode
cd frontend/solarman-ui && ng serve    # Frontend on :4200
cd backend && mvn spring-boot:run      # Backend on :8080

# Production mode (Kubernetes)
kubectl get pods -n default            # Check deployment status
# Access at http://localhost:30080
```

## 📊 Web UI Features (Version 1.1)

### Overview
The Web UI provides a modern interface for:
- **File Upload & Import**: Upload Excel files through a web browser
- **Data Visualization**: View solar production trends with interactive charts
- **System Monitoring**: Real-time database and API status
- **Import Management**: Preview data before import, view results after

### Key Features

#### 1. Home Page (`/`)
- **Production Chart**: CSS-based bar chart showing last 7 days of production
  - Time-weighted calculations matching Grafana dashboards
  - Dynamic Y-axis scaling (0 to max)
  - Hover tooltips with exact kWh values
  - Auto-refreshes after data imports
- **System Status Panel**: Database connectivity and latest import timestamps
  - Polls every 10 seconds
  - Color-coded status indicators

#### 2. Upload Page (`/upload`)
- File selection for SolarMan and Tshwane Excel files
- Data preview with Material table and pagination
- Import confirmation workflow
- Results display with statistics
- Navigation back to home

#### 3. Navigation
- Toolbar with Home and Upload buttons
- Active route highlighting
- Responsive design for mobile devices

### API Endpoints

#### Database Status
```bash
GET /api/database/status
# Returns: {connected, message, apiStatus, lastChecked}
```

#### Production Statistics (NEW in v1.1)
```bash
GET /api/database/production-stats?days=7
# Returns: [{date, productionUnits}, ...]
# Uses time-weighted calculation from Grafana
```

#### File Upload
```bash
POST /api/upload/{fileType}
# Accepts: multipart/form-data (Excel file)
# Returns: Preview data array
```

#### Import Data
```bash
POST /api/import/{fileType}
# Accepts: JSON array of records
# Returns: {recordsInserted, recordsUpdated, firstRecordDate, lastRecordDate}
```

### Deployment

#### Kubernetes (Production)
```bash
# Build Docker images
docker build -t solarman-backend:latest -f backend/Dockerfile .
docker build -t solarman-frontend:latest frontend/

# Deploy to Kubernetes
kubectl rollout restart deployment/backend -n default
kubectl rollout restart deployment/frontend -n default

# Access
# Frontend: http://localhost:30080
# Backend API: http://localhost:30080/api
```

#### Development
```bash
# Terminal 1: Backend
cd backend && mvn spring-boot:run

# Terminal 2: Frontend
cd frontend/solarman-ui && ng serve

# Access
# Frontend: http://localhost:4200
# Backend API: http://localhost:8080/api
```

## 📋 Data Processing

### Supported Data Types
The application processes the following solar power metrics:
- **Production Power**: Solar panel energy generation
- **Consumption Power**: Total energy consumption
- **Grid Power**: Power from/to the electrical grid
- **Purchase Power**: Energy purchased from grid
- **Feed-in Values**: Energy fed back to grid
- **Battery Power**: Battery energy levels
- **Charging Power**: Battery charging rate
- **Discharging Power**: Battery discharge rate
- **State of Charge (SoC)**: Battery charge percentage

### Data Validation
- ✅ Validates Excel file format (12 expected columns)
- ✅ Filters data after January 1, 2020
- ✅ Handles duplicate timestamps with UPSERT operations
- ✅ Provides detailed error logging

## 🗄️ Database Schema

### Target Table: `loots_inverter`
```sql
-- The application uses this existing table
-- Connection: jdbc:postgresql://localhost:5432/LOOTS
CREATE TABLE public.loots_inverter (
    updated TIMESTAMP PRIMARY KEY,
    production_power DOUBLE PRECISION,
    consume_power DOUBLE PRECISION,
    grid_power DOUBLE PRECISION,
    purchase_power DOUBLE PRECISION,
    feed_in DOUBLE PRECISION,
    battery_power DOUBLE PRECISION,
    charge_power DOUBLE PRECISION,
    discharge_power DOUBLE PRECISION,
    soc DOUBLE PRECISION
);
```

## 🔧 Configuration

### Database Connection
- **URL**: `jdbc:postgresql://localhost:5432/LOOTS`
- **Table**: `public.loots_inverter`
- **Operation**: UPSERT (INSERT with conflict resolution)

### Excel File Format
Expected column order:
1. Plant (identifier)
2. Updated (timestamp)
3. Time (additional time info)
4. Production Power
5. Consumption Power
6. Grid Power
7. Purchasing Power
8. Feed-in
9. Battery Power
10. Charging Power
11. Discharging Power
12. SoC (State of Charge)

## 🛠️ Development

### Project Structure
```
src/main/java/loots/jd/
├── SolarManExcel2DB.java       # Main application
└── TshwaneElectricityReader.java # Utility reader
```

### Key Dependencies
- **Apache POI 4.1.1**: Excel file processing
- **PostgreSQL JDBC 42.7.3**: Database connectivity
- **Java 11**: Runtime environment

### Build Configuration
```xml
<!-- Maven configuration -->
<groupId>loots.jd</groupId>
<artifactId>SolarManExcel2DB</artifactId>
<version>1.0</version>
```

## 📈 Usage Examples

### Basic Import
```bash
# Import a standard SolarMan export file
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar ~/Downloads/solarman_export_2024.xlsx
```

### Batch Processing
```bash
# Process multiple files
for file in ~/Downloads/solar_data/*.xlsx; do
    java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar "$file"
done
```

### Debug Mode
```bash
# Run with verbose output (application provides detailed logging)
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar /path/to/file.xlsx 2>&1 | tee import.log
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check if PostgreSQL is running
pg_ctl status

# Verify environment variables
echo $DB_USER
echo $DB_PASSWORD

# Test connection manually
psql -h localhost -p 5432 -d LOOTS -U $DB_USER
```

#### Excel File Format Error
- Ensure the Excel file has exactly 12 columns
- Verify column headers match expected format
- Check that timestamps are in recognized format

#### Memory Issues
```bash
# Increase JVM heap size for large files
java -Xmx2G -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar file.xlsx
```

### Log Analysis
The application provides detailed logging for each row processed:
- Row number and processing status
- Timestamp validation results
- Database operation results
- Error messages with context

## 🔐 Security

### Credential Management
- Uses environment variables for database credentials
- Passwords are cleared from memory after use
- No credentials stored in code or configuration files

### Data Validation
- Timestamp validation prevents invalid data
- Numeric validation for power measurements
- SQL injection protection via PreparedStatements

## 📋 Maintenance

### Regular Tasks
1. **Database Maintenance**: Monitor `loots_inverter` table size
2. **Log Rotation**: Archive import logs regularly
3. **Backup**: Ensure database backups include solar data
4. **Updates**: Keep dependencies updated for security

### Monitoring
```sql
-- Check recent imports
SELECT COUNT(*), MAX(updated), MIN(updated) 
FROM public.loots_inverter 
WHERE updated >= CURRENT_DATE - INTERVAL '7 days';

-- Check data completeness
SELECT 
    DATE(updated) as date,
    COUNT(*) as records,
    AVG(production_power) as avg_production,
    AVG(soc) as avg_battery_soc
FROM public.loots_inverter 
WHERE updated >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(updated)
ORDER BY date DESC;
```

## 🤝 Contributing

### Code Standards
- Follow Java naming conventions
- Add comprehensive error handling
- Include logging for debugging
- Document any configuration changes

### Testing
```bash
# Run unit tests (if available)
mvn test

# Integration testing with sample data
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar test_data/sample.xlsx
```

---

**Note**: This utility is designed for local development and small-scale data imports. For production environments, consider implementing additional monitoring, error recovery, and scalability features.