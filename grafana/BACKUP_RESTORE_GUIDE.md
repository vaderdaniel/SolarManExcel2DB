# Grafana Backup & Restore - Quick Reference

## 📦 Current Backups

### Dashboards (4 total)
Located in `grafana/dashboards/`:
1. **Daily Stats** - `daily-stats.json` (UID: feab8f79-92e8-412e-83a6-99d262725b68)
2. **Monthly Stats** - `monthly-stats.json` (UID: 208863de-7e71-4c6d-b5f7-ede14cb35b61)
3. **Weekly Stats** - `weekly-stats.json` (UID: weekly-stats-iso-week)
4. **By ISO Week Number** - `by-week.json` (UID: by-week-dashboard)

### Datasource
Located in `grafana/`:
- **PostgreSQL-LOOTS** - `datasource-postgresql.json` (UID: P7D58F15E2B4BC203)

**Last Backup**: February 2, 2026

---

## 🔄 Restore Dashboards

### Option 1: Automated Script (Recommended)
```bash
# From project root
./restore-dashboards-fixed.sh
```

**What it does:**
- ✅ Auto-detects correct datasource UID
- ✅ Updates all dashboard datasource references
- ✅ Imports all 4 dashboards
- ✅ Provides detailed feedback

### Option 2: Manual via Grafana UI
1. Open Grafana at http://localhost:3000
2. Go to **Dashboards** → **New** → **Import**
3. Upload JSON file or paste contents
4. Select **PostgreSQL-LOOTS** as datasource
5. Click **Import**

---

## 💾 Create New Backups

### Prerequisites
```bash
# Ensure port-forward is active
kubectl port-forward svc/grafana-service 3000:3000 -n default
```

### Backup All Dashboards
```bash
# Daily Stats
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/feab8f79-92e8-412e-83a6-99d262725b68' \
  | jq '.dashboard' > grafana/dashboards/daily-stats.json

# Monthly Stats
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/208863de-7e71-4c6d-b5f7-ede14cb35b61' \
  | jq '.dashboard' > grafana/dashboards/monthly-stats.json

# Weekly Stats
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/weekly-stats-iso-week' \
  | jq '.dashboard' > grafana/dashboards/weekly-stats.json

# By ISO Week Number
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/by-week-dashboard' \
  | jq '.dashboard' > grafana/dashboards/by-week.json
```

### Backup Datasource
```bash
curl -s -u admin:admin123 \
  'http://localhost:3000/api/datasources/uid/P7D58F15E2B4BC203' \
  | jq 'del(.version)' > grafana/datasource-postgresql.json
```

---

## 🔧 Common Issues

### Issue: Dashboards show "No data"

**Solution 1: Check datasource connection**
```bash
curl -s -X POST -u admin:admin123 \
  'http://localhost:3000/api/datasources/uid/P7D58F15E2B4BC203/health' | jq .
```

**Solution 2: Fix database permissions**
```bash
kubectl exec -n default deployment/postgres -- \
  psql -U danieloots -d LOOTS -c "ALTER USER grafana WITH PASSWORD 'grafana123';"

kubectl exec -n default deployment/postgres -- \
  psql -U danieloots -d LOOTS -c "GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana;"
```

**Solution 3: Clear browser cache**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
- Clear all localhost:3000 cache in browser DevTools

### Issue: Restore script fails

**Check port-forward is running:**
```bash
lsof -ti:3000
# Should return a PID if port-forward is active
```

**Start port-forward if needed:**
```bash
kubectl port-forward svc/grafana-service 3000:3000 -n default &
```

### Issue: Wrong datasource UID

**Get current datasource UID:**
```bash
curl -s -u admin:admin123 'http://localhost:3000/api/datasources' | jq '.[].uid'
```

The restore script automatically handles this, but you can manually update dashboards if needed.

---

## 📊 Database Information

- **Host**: postgres-service:5432 (from within Kubernetes cluster)
- **Database**: LOOTS
- **Table**: public.loots_inverter
- **Grafana User**: grafana
- **Grafana Password**: grafana123
- **PostgreSQL Version**: 16.11
- **Data Range**: June 2023 - Present
- **Total Records**: ~266,000+

---

## 🌐 Access Information

- **Grafana URL**: http://localhost:3000
- **Username**: admin
- **Password**: admin123
- **Port Forward Command**: `kubectl port-forward svc/grafana-service 3000:3000 -n default`

---

## 📝 Notes

- Backups are stored in JSON format (native Grafana export format)
- Dashboard UIDs are preserved to maintain links and references
- Datasource UID must match between backup and target Grafana instance
- The restore script handles datasource UID mismatches automatically
- Always backup before making major changes to dashboards
- Password is stored in `secureJsonData` and not included in datasource backup

---

**For detailed information, see `grafana/README.md`**
