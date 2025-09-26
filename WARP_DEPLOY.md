# SolarManExcel2DB - Development & Deployment Guide

## 🛠️ Development Setup

### Prerequisites Installation

#### Java Development Kit (JDK)
```bash
# Check current Java version
java -version

# Install Java 11+ using Homebrew (macOS)
brew install openjdk@11

# Set JAVA_HOME environment variable
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@11/11.0.21/libexec/openjdk.jdk/Contents/Home
```

#### Maven Build Tool
```bash
# Install Maven using Homebrew
brew install maven

# Verify installation
mvn -version
```

#### PostgreSQL Database
```bash
# Start the existing PostgreSQL instance
/Users/danieloots/LOOTS_PG/loots_pg.sh

# Or install PostgreSQL using Homebrew
brew install postgresql@14
brew services start postgresql@14
```

### Project Environment Setup

#### Clone and Setup
```bash
# Navigate to project directory
cd /Users/danieloots/Java/SolarManExcel2DB

# Set up environment variables
export DB_USER=your_username
export DB_PASSWORD=your_password

# Verify environment
echo "DB_USER: $DB_USER"
echo "Database URL: jdbc:postgresql://localhost:5432/LOOTS"
```

#### Build Process
```bash
# Clean previous builds
mvn clean

# Compile and package
mvn clean package

# Verify build artifacts
ls -la target/
# Should show: SolarManExcel2DB-1.0-jar-with-dependencies.jar
```

---

## 🏗️ Build Configuration

### Maven Project Structure
```
SolarManExcel2DB/
├── pom.xml                    # Maven configuration
├── src/main/java/loots/jd/    # Source code
│   ├── SolarManExcel2DB.java
│   └── TshwaneElectricityReader.java
├── target/                    # Build artifacts
└── README.md                  # Project documentation
```

### Key Build Features
- **Executable JAR**: Creates self-contained JAR with dependencies
- **Java 11 Target**: Compiled for Java 11 compatibility
- **Maven Assembly**: Packages all dependencies into single JAR

### Dependency Analysis
```bash
# View dependency tree
mvn dependency:tree

# Check for security vulnerabilities
mvn dependency:analyze

# Update dependencies (check pom.xml first)
mvn versions:display-dependency-updates
```

---

## 🚀 Deployment Strategies

### Local Development Deployment
```bash
# Quick test deployment
export DB_USER=loots_user
export DB_PASSWORD=your_secure_password

# Run with test data
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar test_data/sample.xlsx
```

### Production-Ready Deployment

#### 1. Environment Preparation
```bash
# Create production environment variables file
cat > production.env << EOF
DB_USER=production_user
DB_PASSWORD=super_secure_production_password
DB_URL=jdbc:postgresql://prod-host:5432/LOOTS
EOF

# Source environment
source production.env
```

#### 2. Database Schema Verification
```sql
-- Connect to production database
psql -h localhost -p 5432 -d LOOTS -U $DB_USER

-- Verify table exists
\dt public.loots_inverter

-- Check table structure
\d public.loots_inverter

-- Verify permissions
SELECT has_table_privilege('public.loots_inverter', 'INSERT');
SELECT has_table_privilege('public.loots_inverter', 'UPDATE');
```

#### 3. Production Deployment Script
```bash
#!/bin/bash
# deploy_solarman.sh

set -e  # Exit on any error

# Configuration
JAR_PATH="/opt/solarman/SolarManExcel2DB-1.0-jar-with-dependencies.jar"
LOG_DIR="/var/log/solarman"
DATA_DIR="/data/solar_imports"

# Ensure directories exist
mkdir -p $LOG_DIR
mkdir -p $DATA_DIR

# Deploy JAR
cp target/SolarManExcel2DB-1.0-jar-with-dependencies.jar $JAR_PATH

# Set permissions
chmod +x $JAR_PATH

# Create systemd service (optional)
cat > /etc/systemd/system/solarman-import.service << EOF
[Unit]
Description=SolarMan Excel Import Service
After=postgresql.service

[Service]
Type=oneshot
User=solarman
Group=solarman
Environment=DB_USER=$DB_USER
Environment=DB_PASSWORD=$DB_PASSWORD
ExecStart=/usr/bin/java -jar $JAR_PATH %i
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "Deployment complete!"
```

---

## 📊 Monitoring & Logging

### Application Logging
```bash
# Run with detailed logging
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar \
  /path/to/file.xlsx 2>&1 | tee /var/log/solarman/import-$(date +%Y%m%d-%H%M%S).log

# Log rotation setup
cat > /etc/logrotate.d/solarman << EOF
/var/log/solarman/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    copytruncate
}
EOF
```

### Database Monitoring
```sql
-- Monitor import activity
CREATE OR REPLACE VIEW import_summary AS
SELECT 
    DATE(updated) as import_date,
    COUNT(*) as total_records,
    MIN(updated) as first_record,
    MAX(updated) as last_record,
    AVG(production_power) as avg_production,
    MAX(production_power) as peak_production
FROM public.loots_inverter
WHERE updated >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(updated)
ORDER BY import_date DESC;

-- Check for data gaps
SELECT 
    generate_series(
        date_trunc('hour', MIN(updated)),
        date_trunc('hour', MAX(updated)),
        '1 hour'::interval
    ) as expected_hour,
    COUNT(updated) as actual_records
FROM public.loots_inverter
WHERE updated >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY expected_hour
HAVING COUNT(updated) = 0;
```

### Performance Monitoring
```bash
# System resource monitoring during import
#!/bin/bash
# monitor_import.sh

echo "Starting resource monitoring..."

# Monitor Java process
java -XX:+PrintGCDetails -XX:+PrintGCTimeStamps \
     -Xloggc:/var/log/solarman/gc.log \
     -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar $1 &

JAVA_PID=$!

# Monitor system resources
while kill -0 $JAVA_PID 2>/dev/null; do
    echo "$(date): CPU: $(top -p $JAVA_PID -n 1 -b | awk 'NR==8{print $9}')%, Memory: $(ps -p $JAVA_PID -o %mem --no-headers)%"
    sleep 5
done

echo "Import completed"
```

---

## 🔄 Automated Processing

### Cron Job Setup
```bash
# Add to crontab for automated daily processing
crontab -e

# Add this line (runs daily at 6 AM)
0 6 * * * /opt/solarman/scripts/process_daily_imports.sh >> /var/log/solarman/cron.log 2>&1
```

### Processing Script
```bash
#!/bin/bash
# process_daily_imports.sh

SCRIPT_DIR="/opt/solarman/scripts"
DATA_DIR="/data/solar_imports"
PROCESSED_DIR="/data/solar_imports/processed"
LOG_FILE="/var/log/solarman/daily_import.log"

# Source environment variables
source /opt/solarman/config/production.env

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting daily import process"

# Process all new Excel files
for file in $DATA_DIR/*.xlsx; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        log "Processing file: $filename"
        
        # Run the import
        if java -jar /opt/solarman/SolarManExcel2DB-1.0-jar-with-dependencies.jar "$file" >> $LOG_FILE 2>&1; then
            log "Successfully processed: $filename"
            
            # Move to processed directory
            mv "$file" "$PROCESSED_DIR/$filename.$(date +%Y%m%d-%H%M%S)"
            log "Moved to processed: $filename"
        else
            log "ERROR: Failed to process: $filename"
            # Move to error directory for manual inspection
            mv "$file" "$DATA_DIR/errors/"
        fi
    fi
done

log "Daily import process completed"
```

---

## 🛡️ Security & Backup

### Security Hardening
```bash
# Create dedicated user for solar imports
sudo useradd -r -m -s /bin/bash solarman
sudo usermod -a -G postgres solarman  # If needed for database access

# Set proper file permissions
sudo chown -R solarman:solarman /opt/solarman
sudo chmod 750 /opt/solarman
sudo chmod 640 /opt/solarman/config/production.env
```

### Backup Strategy
```bash
#!/bin/bash
# backup_solar_data.sh

BACKUP_DIR="/backup/solarman/$(date +%Y%m)"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U $DB_USER -d LOOTS \
  --table=public.loots_inverter \
  --verbose \
  > $BACKUP_DIR/loots_inverter_$(date +%Y%m%d).sql

# Compress backup
gzip $BACKUP_DIR/loots_inverter_$(date +%Y%m%d).sql

# Clean old backups (keep 3 months)
find /backup/solarman -name "*.sql.gz" -mtime +90 -delete

echo "Backup completed: $BACKUP_DIR"
```

---

## 🔍 Testing & Quality Assurance

### Unit Testing Setup
```bash
# Add test dependencies to pom.xml
# Then create test structure
mkdir -p src/test/java/loots/jd
mkdir -p src/test/resources
```

### Integration Testing
```bash
#!/bin/bash
# integration_test.sh

# Setup test database
createdb test_loots
psql test_loots -c "CREATE TABLE public.loots_inverter (
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
);"

# Test with sample data
export DB_USER=test_user
export DB_PASSWORD=test_password
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar test_data/sample.xlsx

# Verify results
psql test_loots -c "SELECT COUNT(*) FROM public.loots_inverter;"

# Cleanup
dropdb test_loots
```

### Performance Testing
```bash
# Test with large dataset
time java -Xmx4G -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar large_dataset.xlsx

# Memory profiling
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/ \
     -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar test_file.xlsx
```

---

## 🚨 Troubleshooting

### Common Deployment Issues

#### Java Version Conflicts
```bash
# Check Java version
java -version
javac -version

# Fix path issues
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
export PATH=$JAVA_HOME/bin:$PATH
```

#### Database Connection Issues
```bash
# Test database connectivity
pg_isready -h localhost -p 5432

# Check database permissions
psql -c "GRANT ALL PRIVILEGES ON DATABASE LOOTS TO your_user;"
psql -d LOOTS -c "GRANT ALL PRIVILEGES ON TABLE loots_inverter TO your_user;"
```

#### Memory Issues
```bash
# Increase heap size
java -Xmx8G -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar large_file.xlsx

# Enable garbage collection logging
java -XX:+PrintGC -XX:+PrintGCDetails -jar application.jar input.xlsx
```

### Deployment Verification Checklist

- [ ] Java 11+ installed and configured
- [ ] Maven build successful
- [ ] Database connectivity verified
- [ ] Environment variables set
- [ ] Sample file processing works
- [ ] Log files created and readable
- [ ] Database records inserted correctly
- [ ] Error handling tested
- [ ] Backup strategy implemented
- [ ] Monitoring configured

---

## 📋 Maintenance

### Regular Maintenance Tasks

#### Weekly
- Check log file sizes and rotate if necessary
- Verify database connection health
- Review processing errors
- Update dependency security patches

#### Monthly
- Database performance analysis
- Backup verification
- Disk space monitoring
- Application performance review

#### Quarterly  
- Dependency updates
- Security audit
- Performance optimization review
- Documentation updates

### Version Upgrade Process
```bash
# Backup current version
cp target/SolarManExcel2DB-1.0-jar-with-dependencies.jar backup/

# Build new version
mvn clean package

# Test new version with sample data
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar test_data/sample.xlsx

# Deploy new version
sudo systemctl stop solarman-import
cp target/SolarManExcel2DB-1.0-jar-with-dependencies.jar /opt/solarman/
sudo systemctl start solarman-import
```