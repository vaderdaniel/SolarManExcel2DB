# Grafana Dashboards - Solar Power Monitoring

This directory contains backup configurations for Grafana dashboards that visualize solar power generation, consumption, and battery data stored in the PostgreSQL `LOOTS` database.

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

**Panel 2: Consumed and Charging Units**
- **Consumed Units**: Total energy consumption (Wh)
- **Charging Units**: Total energy used to charge the battery (Wh)
- **Battery Level**: Shows minimum and maximum battery State of Charge (%) as a yellow line overlay

Both panels use stacked bar charts with battery levels displayed as line graphs on a secondary axis.

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

**Panel 2: Consumed and Charging Units (Monthly)**
- **Consumed Units**: Total monthly energy consumption (Wh)
- **Charging Units**: Total monthly energy used to charge the battery (Wh)
- **Average Battery Level**: Shows average minimum and maximum daily battery State of Charge (%) as a yellow line overlay

Both panels aggregate data by month and display averages of daily battery extremes.

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

Both panels use stacked bar charts displaying average daily energy per ISO week. Each bar represents one week's average daily amounts.

---

## 🗄️ Data Source

Both dashboards query the PostgreSQL database:
- **Database**: LOOTS
- **Table**: `public.loots_inverter`
- **Datasource UID**: `P7D58F15E2B4BC203`
- **Datasource Type**: `grafana-postgresql-datasource`

### Database Schema
The dashboards expect the following columns in the `loots_inverter` table:
- `updated` (timestamp) - Primary key
- `production_power` (double precision)
- `consume_power` (double precision)
- `grid_power` (double precision)
- `purchase_power` (double precision)
- `feed_in` (double precision)
- `battery_power` (double precision)
- `charge_power` (double precision)
- `discharge_power` (double precision)
- `soc` (double precision) - State of Charge

---

## 📦 Dashboard Backups

Dashboard configuration files are stored in JSON format in the `dashboards/` directory:

```
grafana/
├── README.md (this file)
└── dashboards/
    ├── daily-stats.json
    ├── monthly-stats.json
    └── weekly-stats.json
```

### Backup Information
- **Created**: 2025-11-08
- **Grafana Version**: 12.2.1
- **Format**: JSON (Grafana dashboard export format)

---

## 🔄 Restoring Dashboards

To restore these dashboards to a Grafana instance:

### Method 1: Using Grafana UI
1. Navigate to Dashboards → New → Import
2. Upload the JSON file or paste its contents
3. Select the PostgreSQL datasource
4. Click "Import"

### Method 2: Using Grafana API
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
# Export Daily Stats dashboard
curl -s -u admin \
  'http://localhost:3000/api/dashboards/uid/feab8f79-92e8-412e-83a6-99d262725b68' \
  | jq '.dashboard' > grafana/dashboards/daily-stats.json

# Export Monthly Stats dashboard
curl -s -u admin \
  'http://localhost:3000/api/dashboards/uid/208863de-7e71-4c6d-b5f7-ede14cb35b61' \
  | jq '.dashboard' > grafana/dashboards/monthly-stats.json

# Export By Week dashboard
curl -s -u admin \
  'http://localhost:3000/api/dashboards/uid/weekly-stats-iso-week' \
  | jq '.dashboard' > grafana/dashboards/weekly-stats.json
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

**Last Updated**: 2025-11-08  
**Maintained By**: Daniel Oots
