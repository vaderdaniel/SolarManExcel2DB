# SolarManExcel2DB - Quick Reference Guide

## ⚡ Quick Commands

### CLI Application
```bash
# Build the application (includes security scanning)
mvn clean package

# Build with security verification
mvn clean verify

# Set environment variables
export DB_USER=your_username
export DB_PASSWORD=your_password

# Run the application
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar /path/to/file.xlsx

# Start PostgreSQL database
/Users/danieloots/LOOTS_PG/loots_pg.sh
```

### Web UI (Version 1.5)
```bash
# Development mode
cd frontend/solarman-ui && ng serve &
cd backend && mvn spring-boot:run
# Access: http://localhost:4200

# Production build
cd frontend/solarman-ui && npm run build
cd backend && mvn clean package

# Kubernetes deployment
docker build -t solarman-backend:latest -f backend/Dockerfile .
docker build -t solarman-frontend:latest frontend/
kubectl rollout restart deployment/backend deployment/frontend -n default
# Access: http://localhost:30080
```

### Security Scanning
```bash
# Run security scan (integrated with build)
mvn verify

# Standalone security scan
cd backend && ./security-scan.sh

# View security reports
ls -la backend/reports/
```

### One-Liner Setup
```bash
# Complete setup and run
export DB_USER=your_user DB_PASSWORD=your_pass && mvn clean package && java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar ~/Downloads/solar_data.xlsx
```

---

## 🗂️ File Locations

### Key Files
- **JAR**: `target/SolarManExcel2DB-1.0-jar-with-dependencies.jar`
- **Source**: `src/main/java/loots/jd/SolarManExcel2DB.java`
- **Config**: `pom.xml`
- **Database Script**: `/Users/danieloots/LOOTS_PG/loots_pg.sh`

### Expected Excel Format
```
Column 1:  Plant (identifier)
Column 2:  Updated (timestamp) ← CRITICAL
Column 3:  Time (additional)
Column 4:  Production Power
Column 5:  Consumption Power
Column 6:  Grid Power
Column 7:  Purchasing Power
Column 8:  Feed-in Power
Column 9:  Battery Power
Column 10: Charging Power
Column 11: Discharging Power
Column 12: SoC (State of Charge)
```

---

## 🌐 Web UI API Quick Reference (v1.5)

### API Endpoints
```bash
# Check database status
curl http://localhost:30080/api/database/status

# Get production stats (last 7 days)
curl 'http://localhost:30080/api/database/production-stats?days=7'

# Get latest import timestamps
curl http://localhost:30080/api/database/latest-records
```

### Kubernetes Quick Commands
```bash
# Check deployment status
kubectl get pods | grep -E "(backend|frontend)"

# View logs
kubectl logs -f deployment/backend
kubectl logs -f deployment/frontend

# Restart deployments
kubectl rollout restart deployment/backend deployment/frontend -n default

# Check service
kubectl get svc frontend-service
```

### Docker Quick Commands
```bash
# Build images (backend includes security scanning)
docker build -t solarman-backend:latest -f backend/Dockerfile .
docker build -t solarman-frontend:latest frontend/

# Build backend (runtime-only, for pre-built JAR)
docker build -t solarman-backend:latest -f backend/Dockerfile.simple backend/

# View images
docker images | grep solarman

# Remove old images
docker image prune -f
```

### Grafana Quick Commands
```bash
# Access Grafana
kubectl port-forward svc/grafana-service 3000:3000 -n default &
open http://localhost:3000
# Login: admin / admin123

# Restore all dashboards
./restore-dashboards-fixed.sh

# Backup specific dashboard
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/feab8f79-92e8-412e-83a6-99d262725b68' \
  | jq '.dashboard' > grafana/dashboards/daily-stats.json
```

---

## 🔧 Quick Troubleshooting

### Common Errors & Fixes
| Error | Quick Fix |
|-------|-----------|
| `Environment variable DB_USER is not set` | `export DB_USER=your_username` |
| `File does not exist` | Check file path: `ls -la /path/to/file.xlsx` |
| `Wrong number of columns` | Verify Excel file has exactly 12 columns |
| `Database error` | Check if PostgreSQL is running: `pg_ctl status` |
| `Out of memory` | Increase heap: `java -Xmx4G -jar ...` |

### Quick Checks
```bash
# Check if Java is available
java -version

# Check if Maven is available
mvn -version

# Check if PostgreSQL is running
pg_ctl status

# Check if JAR was built
ls -la target/*.jar

# Test database connection
psql -h localhost -p 5432 -d LOOTS -U $DB_USER -c "SELECT 1;"
```

---

## 📊 Database Quick Reference

### Connect to Database
```bash
# Connect to LOOTS database
psql -h localhost -p 5432 -d LOOTS -U $DB_USER

# Quick connection with password prompt
PGPASSWORD=$DB_PASSWORD psql -h localhost -p 5432 -d LOOTS -U $DB_USER
```

### Useful SQL Queries
```sql
-- Check recent imports
SELECT COUNT(*), MAX(updated) FROM public.loots_inverter WHERE updated >= CURRENT_DATE;

-- View latest records
SELECT * FROM public.loots_inverter ORDER BY updated DESC LIMIT 10;

-- Check data for specific day
SELECT COUNT(*), AVG(production_power) FROM public.loots_inverter 
WHERE DATE(updated) = CURRENT_DATE;

-- Find duplicates
SELECT updated, COUNT(*) FROM public.loots_inverter 
GROUP BY updated HAVING COUNT(*) > 1;

-- Table size
SELECT pg_size_pretty(pg_total_relation_size('public.loots_inverter'));
```

---

## 🚀 Performance Tips

### Memory Optimization
```bash
# Small files (< 10MB)
java -Xmx1G -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar file.xlsx

# Large files (> 100MB)
java -Xmx8G -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar file.xlsx

# Enable GC logging for performance analysis
java -XX:+PrintGC -XX:+PrintGCDetails -jar application.jar file.xlsx
```

### Batch Processing
```bash
# Process multiple files
for file in ~/Downloads/solar_data/*.xlsx; do
    echo "Processing: $file"
    java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar "$file"
done

# Process with error logging
for file in *.xlsx; do
    java -jar app.jar "$file" >> success.log 2>> error.log
done
```

---

## 📝 Logging & Monitoring

### Quick Logging
```bash
# Log to file with timestamp
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar file.xlsx 2>&1 | \
    while IFS= read -r line; do echo "$(date '+%Y-%m-%d %H:%M:%S') $line"; done | \
    tee import.log

# Simple log redirection
java -jar application.jar file.xlsx > output.log 2>&1
```

### Monitor Progress
```bash
# Real-time monitoring of log file
tail -f import.log

# Count processed records in real-time
watch -n 5 'psql -t -c "SELECT COUNT(*) FROM public.loots_inverter WHERE updated >= CURRENT_DATE;"'
```

---

## 🔄 Development Shortcuts

### Maven Shortcuts
```bash
# Quick build without tests
mvn clean package -DskipTests

# Build with verbose output
mvn clean package -X

# Show dependency tree
mvn dependency:tree

# Update dependencies
mvn versions:display-dependency-updates
```

### IDE Integration
```bash
# Generate IDE project files
mvn eclipse:eclipse  # For Eclipse
mvn idea:idea       # For IntelliJ IDEA

# Clean IDE files
mvn eclipse:clean
mvn idea:clean
```

---

## 🎯 Testing Shortcuts

### Quick Tests
```bash
# Test with small sample file
echo "Creating test file..."
java -jar application.jar test_data/small_sample.xlsx

# Verify import count
psql -t -c "SELECT COUNT(*) FROM public.loots_inverter WHERE updated >= CURRENT_DATE - INTERVAL '1 hour';"
```

### Data Validation
```bash
# Check for data issues
psql -c "
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN production_power < 0 THEN 1 END) as negative_production,
    COUNT(CASE WHEN soc > 100 THEN 1 END) as invalid_soc
FROM public.loots_inverter 
WHERE updated >= CURRENT_DATE;
"
```

---

## 🚨 Emergency Procedures

### Quick Recovery
```bash
# If application hangs, find and kill process
ps aux | grep SolarManExcel2DB
kill -9 <PID>

# If database locks, check for long-running queries
psql -c "SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle';"

# Emergency database backup
pg_dump -h localhost -U $DB_USER -d LOOTS --table=public.loots_inverter > emergency_backup.sql
```

### Data Recovery
```bash
# Restore from backup
psql -h localhost -U $DB_USER -d LOOTS < emergency_backup.sql

# Check data integrity after recovery
psql -c "SELECT MIN(updated), MAX(updated), COUNT(*) FROM public.loots_inverter;"
```

---

## 🔍 Debug Mode

### Enhanced Debugging
```bash
# Enable maximum verbosity
java -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps \
     -Djava.util.logging.config.file=logging.properties \
     -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar file.xlsx

# Debug with heap dump on error
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/ \
     -jar application.jar file.xlsx
```

### SQL Debugging
```bash
# Enable PostgreSQL query logging (in postgresql.conf)
# log_statement = 'all'
# log_min_duration_statement = 0

# Monitor database activity
psql -c "SELECT * FROM pg_stat_activity WHERE datname = 'LOOTS';"
```

---

## 📱 Aliases & Functions

### Useful Bash Aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias solar-build='mvn clean package -DskipTests'
alias solar-run='java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar'
alias solar-db='psql -h localhost -p 5432 -d LOOTS -U $DB_USER'
alias solar-logs='tail -f /var/log/solarman/*.log'

# Function for quick processing
solar-import() {
    if [ -z "$1" ]; then
        echo "Usage: solar-import /path/to/file.xlsx"
        return 1
    fi
    echo "Processing $1..."
    java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar "$1"
    echo "Import completed"
}
```

---

## 📋 Checklist Templates

### Pre-Import Checklist
- [ ] PostgreSQL database is running
- [ ] Environment variables are set (`DB_USER`, `DB_PASSWORD`)
- [ ] Excel file exists and is readable
- [ ] Excel file has 12 columns
- [ ] Application JAR is built and available
- [ ] Sufficient disk space available
- [ ] Database table `loots_inverter` exists

### Post-Import Checklist
- [ ] Check log files for errors
- [ ] Verify record count in database
- [ ] Check for duplicate timestamps
- [ ] Validate data ranges (positive values, realistic SoC, etc.)
- [ ] Archive processed Excel file
- [ ] Update processing logs

---

## 🔗 Quick Links

### File Paths (macOS)
```bash
# Project directory
cd /Users/danieloots/Java/SolarManExcel2DB

# Database script
/Users/danieloots/LOOTS_PG/loots_pg.sh

# Default Tshwane file location
/Users/danieloots/Library/CloudStorage/OneDrive-Personal/Documents/LootsShare/
```

### Command History
```bash
# View recent Java commands
history | grep "java -jar"

# View recent database commands
history | grep psql

# View recent Maven commands
history | grep mvn
```

---

**💡 Pro Tip**: Save this reference as a bookmark for quick access during development and troubleshooting!