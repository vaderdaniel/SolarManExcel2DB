# Grafana Dashboards - Solar Power Monitoring

This directory contains backup configurations for Grafana dashboards that visualize solar power generation, consumption, and battery data stored in the PostgreSQL `LOOTS` database.

## 🚀 Quick Reference

**Access:** `kubectl port-forward svc/grafana-service 3000:3000 -n default` → http://localhost:3000  
**Login:** `admin` / `admin123`  
**Database user:** `grafana` / `grafana123` (read-only)

### Restore All Dashboards (Recommended)
```bash
./restore-dashboards-fixed.sh
```

### Backup All Dashboards
```bash
# Ensure port-forward is active first
kubectl port-forward svc/grafana-service 3000:3000 -n default &

curl -s -u admin:admin123 'http://localhost:3000/api/dashboards/uid/feab8f79-92e8-412e-83a6-99d262725b68' \
  | jq '.dashboard' > grafana/dashboards/daily-stats.json
curl -s -u admin:admin123 'http://localhost:3000/api/dashboards/uid/208863de-7e71-4c6d-b5f7-ede14cb35b61' \
  | jq '.dashboard' > grafana/dashboards/monthly-stats.json
curl -s -u admin:admin123 'http://localhost:3000/api/dashboards/uid/weekly-stats-iso-week' \
  | jq '.dashboard' > grafana/dashboards/weekly-stats.json
curl -s -u admin:admin123 'http://localhost:3000/api/dashboards/uid/by-week-dashboard' \
  | jq '.dashboard' > grafana/dashboards/by-week.json
curl -s -u admin:admin123 'http://localhost:3000/api/dashboards/uid/tshwane-daily' \
  | jq '.dashboard' > grafana/dashboards/tshwane-daily.json
curl -s -u admin:admin123 'http://localhost:3000/api/datasources/uid/P7D58F15E2B4BC203' \
  | jq 'del(.version)' > grafana/datasource-postgresql.json
```

### Common Troubleshooting
```bash
# Dashboards show "No data" — fix permissions
kubectl exec -n default deployment/postgres -- \
  psql -U danieloots -d LOOTS -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana;"

# Test datasource connection
curl -s -X POST -u admin:admin123 \
  'http://localhost:3000/api/datasources/uid/P7D58F15E2B4BC203/health' | jq .

# Get current datasource UID (if changed)
curl -s -u admin:admin123 'http://localhost:3000/api/datasources' | jq '.[].uid'
```

---

## 📍 Dashboard Access

The Grafana instance is running in a pod and accessible at:
- **URL**: http://localhost:3000
- **Username**: admin
- **Password**: 

## 📊 Available Dashboards

### 1. Daily Stats Dashboard
**File**: `dashboards/daily-stats.json`  
**UID**: `feab8f79-92e8-412e-83a6-99d262725b68`  
**Time Range**: Last 2 days  
**Refresh Rate**: 5 minutes

#### Description
Displays daily aggregated solar power statistics with two main visualization panels:

**Panel 1: Produced and Purchased**
- **Production Units**: Total energy produced by solar panels (Wh)
- **Purchased Units**: Total energy purchased from the grid (Wh)
- **Battery Level**: Shows minimum and maximum battery State of Charge (%) as a yellow line overlay
- **Legend**: Table mode — Sum, Mean, Max for all series

**Panel 2: Consumed and Charging Units**
- **Consumed Units**: Total energy consumption (Wh)
- **Charging Units**: Total energy used to charge the battery (Wh)
- **Feed-in Units**: Total energy fed back to the grid (Wh)
- **Battery Level**: Shows minimum and maximum battery State of Charge (%) as a yellow line overlay
- **Legend**: Table mode — Sum, Mean, Max for all series

**Panel 3: Solar Production Heatmap (Hour vs Day)**
- **Visualization**: Heatmap showing hourly production patterns across days
- **X-axis**: Days
- **Y-axis**: Hours of the day (0-23)
- **Cell Color**: Energy produced (Wh) during that specific hour
- **Color Scheme**: Green gradient
- **Use Case**: Identify peak production times and daily patterns

**Panel 4: Energy Consumption Heatmap (Hour vs Day)**
- **Visualization**: Heatmap showing hourly consumption patterns across days
- **X-axis**: Days
- **Y-axis**: Hours of the day (0-23)
- **Cell Color**: Energy consumed (Wh) during that specific hour
- **Color Scheme**: Red gradient
- **Use Case**: Identify peak usage times and daily consumption patterns

Panels 1-2 use stacked bar charts with battery levels displayed as line graphs on a secondary axis. Panels 3-4 use heatmap visualizations with 24 hourly buckets.

---

### 2. Monthly Stats Dashboard
**File**: `dashboards/monthly-stats.json`  
**UID**: `208863de-7e71-4c6d-b5f7-ede14cb35b61`  
**Time Range**: Last 1 year  
**Refresh Rate**: 5 minutes

#### Description
Displays monthly aggregated solar power statistics, providing a long-term view of energy patterns:

**Panel 1: Produced and Purchased (Monthly)**
- **Production Units**: Total monthly energy produced by solar panels (Wh)
- **Purchased Units**: Total monthly energy purchased from the grid (Wh)
- **Average Battery Level**: Shows average minimum and maximum daily battery State of Charge (%) as a yellow line overlay
- **Legend**: Table mode — Sum, Mean, Max for all series

**Panel 2: Consumed and Charging Units (Monthly)**
- **Consumed Units**: Total monthly energy consumption (Wh)
- **Charging Units**: Total monthly energy used to charge the battery (Wh)
- **Feed-in Units**: Total monthly energy fed back to the grid (Wh)
- **Average Battery Level**: Shows average minimum and maximum daily battery State of Charge (%) as a yellow line overlay
- **Legend**: Table mode — Sum, Mean, Max for all series

**Panel 3: Solar Production Heatmap (Hour vs Month)**
- **Visualization**: Heatmap showing average daily hourly production patterns per month
- **X-axis**: Months
- **Y-axis**: Hours of the day (0-23)
- **Cell Color**: Average energy produced per day (Wh) during that hour for each month
- **Color Scheme**: Green gradient
- **Use Case**: Identify seasonal production patterns and monthly variations

**Panel 4: Energy Consumption Heatmap (Hour vs Month)**
- **Visualization**: Heatmap showing average daily hourly consumption patterns per month
- **X-axis**: Months
- **Y-axis**: Hours of the day (0-23)
- **Cell Color**: Average energy consumed per day (Wh) during that hour for each month
- **Color Scheme**: Red gradient
- **Use Case**: Identify seasonal consumption patterns and monthly usage variations

Panels 1-2 aggregate data by month and display averages of daily battery extremes. Panels 3-4 show hourly patterns averaged per day for each month.

---

### 3. Weekly Stats Dashboard
**File**: `dashboards/weekly-stats.json`  
**UID**: `weekly-stats-iso-week`  
**Title**: Weekly Stats  
**Time Range**: Last 2 years  
**Refresh Rate**: 5 minutes

#### Description
Displays weekly aggregated solar power statistics based on ISO week numbers, providing insights into weekly patterns across different seasons:

**Panel 1: Produced and Purchased (Average per day by ISO week)**
- **Production Units**: Average daily energy produced by solar panels per ISO week (Wh)
- **Purchased Units**: Average daily energy purchased from the grid per ISO week (Wh)
- Shows patterns across different weeks of the year
- Useful for identifying seasonal trends and comparing similar weeks across years

**Panel 2: Consumed, Charging, and Feed-in (Average per day by ISO week)**
- **Consumed Units**: Average daily energy consumption per ISO week (Wh)
- **Charging Units**: Average daily energy used to charge the battery per ISO week (Wh)
- **Feed-in Units**: Average daily energy fed back to the grid per ISO week (Wh)
- Displays energy usage patterns and grid interaction across different weeks

**Panel 3: Solar Production Heatmap (Hour vs Week)**
- **Visualization**: Heatmap showing average daily hourly production patterns per ISO week
- **X-axis**: ISO weeks
- **Y-axis**: Hours of the day (0-23)
- **Cell Color**: Average energy produced per day (Wh) during that hour for each week
- **Color Scheme**: Green gradient
- **Use Case**: Compare weekly production patterns and identify typical hourly profiles

**Panel 4: Energy Consumption Heatmap (Hour vs Week)**
- **Visualization**: Heatmap showing average daily hourly consumption patterns per ISO week
- **X-axis**: ISO weeks
- **Y-axis**: Hours of the day (0-23)
- **Cell Color**: Average energy consumed per day (Wh) during that hour for each week
- **Color Scheme**: Red gradient
- **Use Case**: Compare weekly consumption patterns and identify typical hourly usage profiles

Panels 1-2 use stacked bar charts displaying average daily energy per ISO week. Panels 3-4 show hourly patterns averaged per day for each week.

---

### 4. By ISO week number Dashboard
**File**: `dashboards/by-week.json`  
**UID**: `by-week-dashboard`  
**Title**: By ISO week number  
**Time Range**: Ignored (uses all available data)  
**Refresh Rate**: 5 minutes

#### Description
Displays seasonal patterns by aggregating data across all years for each ISO week number (1-53). Unlike other dashboards, this ignores the time range picker and always uses all available data in the database.

**Key Difference from Weekly Stats Dashboard:**
- **X-axis**: Shows ISO week numbers (W1-W53) instead of dates, with labels rotated 45° for better readability
- **Data Aggregation**: Combines data from the same ISO week across multiple years
- **Example**: Week 25 shows the average of Week 25 from 2023, 2024, and any other years in the database
- **Use Case**: Identify seasonal trends - "Week 25 typically produces X Wh regardless of year"

**Panel 1: Produced and Purchased (Average per day by ISO week number)**
- **Production Units**: Average daily energy produced per ISO week number across all years (Wh)
- **Purchased Units**: Average daily energy purchased per ISO week number across all years (Wh)

**Panel 2: Consumed, Charging, and Feed-in (Average per day by ISO week number)**
- **Consumed Units**: Average daily energy consumption per ISO week number across all years (Wh)
- **Charging Units**: Average daily battery charging per ISO week number across all years (Wh)
- **Feed-in Units**: Average daily energy fed to grid per ISO week number across all years (Wh)

---

### 5. Tshwane Daily Dashboard
**File**: `dashboards/tshwane-daily.json`  
**UID**: `tshwane-daily`  
**Title**: Tshwane Daily  
**Time Range**: Last 30 days (default)  
**Refresh Rate**: On demand

#### Description
Displays Tshwane utility electricity consumption trends derived from the `tshwane_electricity` table. Both panels use rolling average calculations to smooth irregular reading intervals.

**Panel 1: Daily Electricity Usage (units/day)**
- **Weekly avg (units/day)**: Rolling average of kWh consumed per day over the preceding 7+ days — calculated from the Tshwane cumulative meter readings using a LATERAL join
- **Monthly avg (units/day)**: Same calculation over the preceding 30+ days
- Useful for identifying short-term vs long-term consumption trends
- **Legend**: Table mode — Mean, Max, Sum

**Panel 2: Weekly Electricity Usage vs Daily Grid Purchased (kWh/day)**
- **Weekly avg consumption (kWh/day)**: Same 7-day rolling average from Panel 1 (blue line)
- **Daily grid purchased 7-day avg (kWh/day)**: 7-day rolling average of units purchased from the grid by the inverter (from `loots_inverter.purchase_power`, converted Wh → kWh) — red line
- Allows direct comparison between Tshwane meter consumption and inverter grid purchases
- Both series use kWh/day so they share the same Y-axis
- **Legend**: Table mode — Mean, Max, Sum

#### SQL Approach
- Tshwane consumption uses `LATERAL` joins to find the nearest reading ≥ 7/30 days prior
- Inverter purchased units use a `LAG()` CTE to calculate time-weighted Wh per interval, then a `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` window for the 7-day rolling average

---

**File**: `datasource-postgresql.json`  
**UID**: `P7D58F15E2B4BC203`  
**Name**: PostgreSQL-LOOTS

### Configuration Details
- **Type**: grafana-postgresql-datasource
- **URL**: postgres-service:5432
- **Database**: LOOTS
- **User**: grafana
- **Password**: grafana123 (stored in secureJsonData)
- **SSL Mode**: disable
- **PostgreSQL Version**: 1600 (16.0)
- **Connection Pool**:
  - Max Open Connections: 100
  - Max Idle Connections: 100
  - Connection Max Lifetime: 14400 seconds (4 hours)

### Restoring the Datasource
The datasource is automatically provisioned when deploying Grafana via Kubernetes using the ConfigMap in `k8s/grafana-deployment.yaml`. However, if you need to restore it manually:

```bash
# Update the datasource via API (requires password in secureJsonData)
curl -X PUT \
  -H "Content-Type: application/json" \
  -u admin:admin123 \
  -d @grafana/datasource-postgresql.json \
  'http://localhost:3000/api/datasources/1'
```

**Note**: When restoring via API, you'll need to add the password to secureJsonData:
```json
{
  ...,
  "secureJsonData": {
    "password": "grafana123"
  }
}
```

---

## 🗄️ Data Source

All dashboards query the PostgreSQL database:
- **Database**: LOOTS
- **Tables**: `public.loots_inverter` (solar/inverter data), `public.tshwane_electricity` (utility meter data)
- **Datasource UID**: `P7D58F15E2B4BC203`
- **Datasource Type**: `grafana-postgresql-datasource`
- **PostgreSQL Version**: 16.13
- **Datasource Backup**: `datasource-postgresql.json`

### Database Schema
The dashboards expect the following columns:

**`public.loots_inverter`** (used by Daily Stats, Monthly Stats, Weekly Stats, By Week Number, Tshwane Daily Panel 2):
- `updated` (timestamp) - Primary key
- `production_power`, `consume_power`, `grid_power`, `purchase_power`, `feed_in` (double precision)
- `battery_power`, `charge_power`, `discharge_power`, `soc` (double precision)

**`public.tshwane_electricity`** (used by Tshwane Daily):
- `reading_date` (timestamp) - Primary key
- `cumulative_electricity_used` (double precision) - Running total since baseline (kWh)
- `reading_notes` (text) - Sparse milestone notes

---

## 📦 Dashboard Backups

Dashboard configuration files are stored in JSON format in the `dashboards/` directory:

```
grafana/
├── README.md (this file)
├── datasource-postgresql.json
└── dashboards/
    ├── by-week.json
    ├── daily-stats.json
    ├── monthly-stats.json
    ├── tshwane-daily.json
    └── weekly-stats.json
```

### Backup Information
- **Created**: 2025-11-08
- **Last Updated**: April 29, 2026
- **Grafana Version**: 12.3.0 (running in Kubernetes)
- **PostgreSQL Version**: 16.13
- **Format**: JSON (Grafana dashboard export format)
- **Datasource UID**: P7D58F15E2B4BC203

---

## 🔄 Restoring Dashboards

To restore these dashboards to a Grafana instance:

### Method 1: Using the Automated Restore Script (Recommended)
The project includes a script that automatically fixes datasource UIDs and imports all dashboards:

```bash
# From the project root directory
./restore-dashboards-fixed.sh
```

This script will:
- Automatically detect the correct datasource UID
- Update all dashboard datasource references
- Import all four dashboards
- Provide success/failure feedback for each dashboard

### Method 2: Using Grafana UI
1. Navigate to Dashboards → New → Import
2. Upload the JSON file or paste its contents
3. Select the PostgreSQL datasource
4. Click "Import"

### Method 3: Using Grafana API
```bash
# Restore Daily Stats dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -u admin \
  -d @grafana/dashboards/daily-stats.json \
  http://localhost:3000/api/dashboards/db

# Restore Monthly Stats dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -u admin \
  -d @grafana/dashboards/monthly-stats.json \
  http://localhost:3000/api/dashboards/db
```

**Note**: When using the API method, you may need to wrap the dashboard JSON in the following structure:
```json
{
  "dashboard": <dashboard-json-content>,
  "overwrite": true
}
```

---

## 🔧 Updating Backups

To create new backups of the current dashboards:

```bash
# Export all five dashboards
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/feab8f79-92e8-412e-83a6-99d262725b68' \
  | jq '.dashboard' > grafana/dashboards/daily-stats.json

curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/208863de-7e71-4c6d-b5f7-ede14cb35b61' \
  | jq '.dashboard' > grafana/dashboards/monthly-stats.json

curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/weekly-stats-iso-week' \
  | jq '.dashboard' > grafana/dashboards/weekly-stats.json

curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/by-week-dashboard' \
  | jq '.dashboard' > grafana/dashboards/by-week.json

curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/tshwane-daily' \
  | jq '.dashboard' > grafana/dashboards/tshwane-daily.json

# Export PostgreSQL datasource configuration
curl -s -u admin:admin123 \
  'http://localhost:3000/api/datasources/uid/P7D58F15E2B4BC203' \
  | jq 'del(.version)' > grafana/datasource-postgresql.json
```

**Note**: Requires port-forward to be active:
```bash
kubectl port-forward svc/grafana-service 3000:3000 -n default
```

---

## 📈 Key Metrics

### Energy Flow Metrics
- **Production Power**: Solar panel generation
- **Consumption Power**: Total household/facility usage
- **Purchase Power**: Energy bought from grid
- **Feed-in**: Energy sold back to grid (if applicable)

### Battery Metrics
- **Charge Power**: Rate of battery charging (negative values)
- **Discharge Power**: Rate of battery discharging
- **State of Charge (SoC)**: Battery level as a percentage
- **Min/Max SoC**: Daily extremes of battery charge level

### Calculation Method
Energy units (Wh) are calculated by integrating power measurements over time:
```sql
SUM(EXTRACT(EPOCH FROM time_delta) / 3600 * power_measurement)
```

This accounts for varying intervals between measurements to provide accurate energy totals.

---

## 🔗 Related Documentation

- **Data Import Tool**: See the main project README for information about the SolarManExcel2DB import utility
- **Database Setup**: Database runs via `/Users/danieloots/LOOTS_PG/loots_pg.sh`
- **Data Source**: SolarMan Excel exports processed by the Java utility

---

## 📝 Notes

- Dashboards automatically filter data using Grafana's `$__timeFilter(updated)` macro
- Time zones are set to UTC in both dashboards
- Both dashboards use stacked bar charts for energy metrics
- Battery SoC is displayed on a separate right-hand axis (0-100%)
- Dashboard refresh intervals: 5 minutes, 30 minutes, 1 hour

---

**Last Updated**: April 29, 2026  
**Maintained By**: Daniel Oots

## 🔧 Troubleshooting

### Database User Permissions
If dashboards show "No data", ensure the `grafana` user has proper permissions:

```bash
# Connect to PostgreSQL pod
kubectl exec -n default deployment/postgres -- psql -U danieloots -d LOOTS

# Set password for grafana user
ALTER USER grafana WITH PASSWORD 'grafana123';

# Grant SELECT permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana;
```

### Datasource Connection Issues
Test the datasource connection:

```bash
# Via Grafana API
curl -s -X POST -u admin:admin123 \
  'http://localhost:3000/api/datasources/uid/P7D58F15E2B4BC203/health' | jq .
```

### Browser Cache Issues
If dashboards show "No data" after successful restore:
1. Hard refresh your browser (Cmd+Shift+R on Mac)
2. Clear browser cache for localhost:3000
3. Close and reopen your browser
