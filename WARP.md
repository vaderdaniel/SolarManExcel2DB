# SolarManExcel2DB - Warp Documentation

## 🌞 Project Overview
SolarManExcel2DB is a comprehensive solution for importing and visualizing solar power generation data. It consists of:
1. **CLI Tool**: Java utility for batch importing SolarMan Excel exports
2. **Web UI** (Version 1.5): Angular + Spring Boot application with production visualization

This tool streamlines the process of transferring solar monitoring data from Excel files into a PostgreSQL database for analysis, reporting, and visualization.

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- PostgreSQL database (running via `/Users/danieloots/LOOTS_PG/loots_pg.sh`)
- Environment variables: `DB_USER` and `DB_PASSWORD`
- Node.js 18+ and npm (for Web UI)
- Docker and Kubernetes (for containerized deployment)
- Trivy (for security scanning)

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
# Clean and package the application (includes security scanning)
mvn clean package

# Build with security verification
mvn clean verify
```

### Run Application

#### CLI Tool
```bash
# Import Excel file to database
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar /path/to/your/solarman_export.xlsx
```

#### Web UI (Version 1.5)
```bash
# Development mode
cd frontend/solarman-ui && ng serve    # Frontend on :4200
cd backend && mvn spring-boot:run      # Backend on :8080

# Production mode (Kubernetes)
kubectl get pods -n default            # Check deployment status
# Access at http://localhost:30080
```

## 📊 Web UI Features (Version 1.5)

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
- **Apache POI 5.5.1**: Excel file processing
- **PostgreSQL JDBC 42.7.10**: Database connectivity
- **Apache Tomcat 10.1.52**: Embedded web server (security-patched)
- **Java 17**: Runtime environment
- **Spring Boot 3.5.10**: Web framework (backend)
- **Angular 21**: Frontend framework
- **Vitest**: Frontend test runner
- **Trivy**: Security vulnerability scanning

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

### Security Scanning
The application includes automated vulnerability scanning using Trivy:

```bash
# Integrated with Maven build
mvn verify

# Standalone security scan
cd backend && ./security-scan.sh
```

**Scans:**
- Maven dependencies (pom.xml)
- JAR artifacts (target/*.jar)
- Docker images (solarman-backend:latest)

**Reports Location:** `backend/reports/`

**Build Behavior:**
- Fails on CRITICAL vulnerabilities
- Logs HIGH, MEDIUM, LOW vulnerabilities

**Security Updates:**
- ✅ Tomcat upgraded to 10.1.52 (latest security patches)
- ✅ Regular dependency scanning
- ✅ Container image hardening

For detailed security documentation:
- **[backend/SECURITY.md](backend/SECURITY.md)** - Complete guide
- **[backend/SECURITY-QUICKSTART.md](backend/SECURITY-QUICKSTART.md)** - Quick reference

### Credential Management
- Uses environment variables for database credentials
- Passwords are cleared from memory after use
- No credentials stored in code or configuration files

### Data Validation
- Timestamp validation prevents invalid data
- Numeric validation for power measurements
- SQL injection protection via PreparedStatements

## 📊 Grafana Dashboards

### Overview
The application integrates with Grafana for comprehensive data visualization:

**Available Dashboards:**
1. **Daily Stats** - Last 2 days with hourly heatmaps
2. **Weekly Stats** - ISO week aggregations with hourly patterns
3. **Monthly Stats** - Long-term trends with monthly patterns
4. **By Week Number** - Seasonal patterns across all years

### Access Grafana
```bash
# Port-forward to Grafana service
kubectl port-forward svc/grafana-service 3000:3000 -n default

# Open in browser
open http://localhost:3000

# Login credentials
# Username: admin
# Password: admin123
```

### Backup & Restore
```bash
# Restore all dashboards (automated)
./restore-dashboards-fixed.sh

# Manual backup of specific dashboard
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/feab8f79-92e8-412e-83a6-99d262725b68' \
  | jq '.dashboard' > grafana/dashboards/daily-stats.json
```

**Documentation:**
- **[grafana/README.md](grafana/README.md)** - Complete dashboard documentation
- **[grafana/BACKUP_RESTORE_GUIDE.md](grafana/BACKUP_RESTORE_GUIDE.md)** - Backup procedures
- **Dashboard Backups:** `grafana/dashboards/`
- **Datasource Config:** `grafana/datasource-postgresql.json`

## 📋 Maintenance

### Regular Tasks
1. **Database Maintenance**: Monitor `loots_inverter` table size
2. **Log Rotation**: Archive import logs regularly
3. **Backup**: Ensure database backups include solar data
4. **Updates**: Keep dependencies updated for security
5. **Security Scanning**: Run Trivy scans before deployments
6. **Grafana Backups**: Backup dashboards after modifications

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

#### Backend Tests (Java/Spring Boot)
```bash
# Run all backend tests
cd backend
mvn test

# Run specific test classes
mvn test -Dtest=DatabaseServiceTest
mvn test -Dtest=DatabaseControllerTest
mvn test -Dtest=ImportServiceTest
```

**Test Coverage:**
- **DatabaseServiceTest** (10 tests): Time-weighted production calculation, error handling, SQL verification
- **DatabaseControllerTest** (11 tests): REST API endpoints, response format validation, exception handling
- **ImportServiceTest** (19 tests): Data import operations, validation, error logging
- **ExcelProcessingServiceTest** (16 tests): Excel file parsing, data extraction

**Total: 56 backend tests**

#### Frontend Tests (Angular/Vitest)
```bash
# Run all frontend tests
cd frontend/solarman-ui
npx ng test --no-watch

# Run tests in watch mode (development)
npx ng test
```

**Test Coverage:**
- **ProductionChartComponent** (18 tests):
  - Time-weighted calculation verification
  - yAxisMax calculation (rounds to "nice" numbers)
  - heightPercent calculation for bar charts
  - Auto-refresh on ChartRefreshService trigger
  - Empty data, null/undefined handling
  - Error state management
  - Subscription lifecycle (ngOnInit/ngOnDestroy)
  
- **UploadComponent** (11 tests):
  - Chart refresh trigger after successful import
  - Import service interaction (fileId vs data array)
  - Error handling and state management
  - Component view transitions
  - Support for both SolarMan and Tshwane file types

- **AppComponent** (2 tests):
  - Application creation and title rendering

**Total: 31 frontend tests**

#### Key Test Scenarios

**Production Statistics API:**
1. ✅ `DatabaseService.getProductionStats()` correctly implements time-weighted calculation using SQL window functions (LAG, EXTRACT)
2. ✅ `/api/database/production-stats` endpoint returns proper JSON format with LocalDate and Double types
3. ✅ Handles edge cases: empty results, null dates, connection failures

**Chart Visualization:**
4. ✅ `ProductionChartComponent.processChartData()` correctly calculates yAxisMax (e.g., 45600.5 → 50000)
5. ✅ Bar heights calculated as percentage of yAxisMax (0-100%)
6. ✅ Sorts data chronologically (oldest to newest)
7. ✅ Generates 5 y-axis labels from max to 0

**Chart Auto-Refresh:**
8. ✅ ProductionChartComponent subscribes to ChartRefreshService.refresh$ on init
9. ✅ Reloads chart data when refresh is triggered
10. ✅ Properly unsubscribes on component destroy
11. ✅ Handles multiple refresh triggers
12. ✅ Updates yAxisMax when new data arrives

**Import Workflow:**
13. ✅ UploadComponent triggers ChartRefreshService.triggerRefresh() after successful import
14. ✅ Does NOT trigger refresh when import fails
15. ✅ Works for both SolarMan and Tshwane file types
16. ✅ Supports both fileId-based and data array imports

#### Integration Testing
```bash
# Test with sample data
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar test_data/sample.xlsx
```

---

## 📝 Recent Updates

### February 21, 2026 - Dependency Upgrades & Vitest Migration
- Upgraded Java from 11 to 17 (both CLI and backend)
- Upgraded Angular from 20.3 to 21
- Migrated frontend tests from Karma/Jasmine to Vitest
- Upgraded Spring Boot from 3.2.2 to 3.5.10
- Upgraded Apache POI from 4.1.1 to 5.5.1
- Upgraded PostgreSQL JDBC from 42.7.3 to 42.7.10
- Upgraded Apache Tomcat from 10.1.35 to 10.1.52
- All 56 backend tests and 31 frontend tests passing

### February 2, 2026 - Security & Infrastructure
- Added Trivy security scanning integration
- Upgraded Apache Tomcat to 10.1.35 (CVE-2025-24813 fixed)
- Added comprehensive Grafana backup/restore system
- Created Dockerfile.simple for runtime-only builds
- Enhanced security documentation
- Updated Grafana dashboard backups

### Version History
- **v1.1** - Production visualization & multi-page UI
- **v2.0** - Full-stack web application transformation
- **v1.5** - Dependency upgrades, Angular 21, Java 17, Vitest migration

---

**Note**: This utility is designed for local development and small-scale data imports. For production environments, consider implementing additional monitoring, error recovery, and scalability features.

**Last Updated**: February 21, 2026
