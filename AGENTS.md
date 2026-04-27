# AGENTS.md

This file provides comprehensive guidance to AI assistants (Claude Code, Warp, etc.) when working with code in this repository.

# SolarManExcel2DB - Project Documentation

## 🌞 Project Overview
SolarManExcel2DB is a comprehensive full-stack web application for importing and visualizing solar power generation data:
- **Web UI** (Version 1.6): Angular + Spring Boot application with production visualization

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

### Environment Setup
```bash
/Users/danieloots/LOOTS_PG/loots_pg.sh   # Start PostgreSQL
export DB_USER=your_database_username
export DB_PASSWORD=your_database_password
```

### Build & Run (Development)
```bash
# Backend on :8080
cd backend && mvn spring-boot:run

# Frontend on :4200
cd frontend/solarman-ui && npm start
```

### Build & Deploy (Production)
```bash
# Build images
docker build -t solarman-backend:latest -f backend/Dockerfile .
docker build -t solarman-frontend:latest -f frontend/Dockerfile frontend/

# Rollout to Kubernetes
kubectl rollout restart deployment/backend deployment/frontend -n default
kubectl rollout status deployment/backend deployment/frontend -n default
# Access: http://localhost:30080
```

---

## 🏗️ Architecture

### Service Topology
```
Angular (port 4200 dev / 30080 prod)
    ↓ REST API
Spring Boot (port 8080)
    ↓ JDBC
PostgreSQL (port 5432, database: LOOTS)
    ↓ read-only
Grafana (port 3000 via port-forward)
```

### Kubernetes Startup Sequence
```
PostgreSQL (starts first)
    ├─→ Backend (init container waits for postgres:5432)
    │       └─→ Frontend (init container waits for backend:8080)
    └─→ Grafana (init container waits for postgres:5432)
```

### k8s Manifest Files (`k8s/`)
| File | Purpose |
|------|---------|
| `secret.yaml` | DB credentials (base64-encoded, ⚠️ gitignored) |
| `configmap.yaml` | Non-sensitive config (DB URL, DB name) |
| `postgres-pv.yaml` | PersistentVolume (hostPath in Lima VM) |
| `postgres-deployment.yaml` | PostgreSQL Deployment + ClusterIP Service |
| `backend-deployment.yaml` | Spring Boot Deployment + ClusterIP Service |
| `frontend-deployment.yaml` | Angular/nginx Deployment + NodePort 30080 |
| `grafana-pvc.yaml` | Grafana 5Gi PVC |
| `grafana-deployment.yaml` | Grafana Deployment (with postgres datasource) |
| `grafana-service.yaml` | Grafana ClusterIP Service |

### Service Ports
| Service | Internal | External |
|---------|----------|----------|
| postgres-service | 5432 | none (ClusterIP) |
| backend-service | 8080 | none (ClusterIP) |
| frontend-service | 80 | 30080 (NodePort) |
| grafana-service | 3000 | port-forward only |

### Resource Limits
| Pod | Memory Request/Limit | CPU Request/Limit |
|-----|----------------------|-------------------|
| postgres | 256Mi / 512Mi | 250m / 500m |
| backend | 512Mi / 1Gi | 500m / 1000m |
| frontend | 128Mi / 256Mi | 100m / 200m |

---

## 🏛️ Backend Project Structure

```
backend/src/main/java/com/loots/solarmanui/
├── SolarManUiApplication.java
├── controller/
│   ├── FileUploadController.java    # POST /api/upload/{fileType}
│   ├── DatabaseController.java      # GET /api/database/*
│   └── ImportController.java        # POST /api/import/{fileType}
├── service/
│   ├── ExcelProcessingService.java  # Apache POI Excel parsing
│   ├── DatabaseService.java         # JDBC queries, production stats
│   └── ImportService.java           # UPSERT, error logging
├── model/
│   ├── SolarManRecord.java
│   ├── TshwaneRecord.java
│   ├── ProductionStat.java          # {LocalDate date, Double productionUnits}
│   ├── ImportResult.java            # {recordsInserted, recordsUpdated, ...}
│   ├── DatabaseStatus.java
│   └── LatestRecords.java
└── config/
    └── WebConfig.java               # CORS (allows localhost:4200)
```

---

## 🌐 REST API Reference

**Base URL (dev)**: `http://localhost:8080/api`  
**Base URL (prod)**: `http://localhost:30080/api`  
No authentication required.

### `GET /api/database/status`
```json
{ "connected": true, "message": "Database Connected", "apiStatus": "ready", "lastChecked": "2026-04-27T14:00:00" }
```

### `GET /api/database/latest-records`
```json
{ "solarman": "2026-04-26T18:45:00", "tshwane": "2026-04-20T12:30:00" }
```

### `GET /api/database/production-stats?days=7`
```json
[
  {"date": "2026-04-26", "productionUnits": 11746.75},
  {"date": "2026-04-25", "productionUnits": 15621.25}
]
```
Time-weighted using SQL LAG window function:
```sql
WITH samples AS (
  SELECT updated, production_power,
    LAG(updated) OVER (ORDER BY updated) AS prev_updated
  FROM public.loots_inverter
), per_point AS (
  SELECT DATE(updated) AS production_date,
    GREATEST(EXTRACT(EPOCH FROM (updated - prev_updated)) / 3600, 0)
      * production_power AS wh
  FROM samples WHERE prev_updated IS NOT NULL
)
SELECT production_date, SUM(wh) AS production_units
FROM per_point GROUP BY production_date
ORDER BY production_date DESC LIMIT ?;
```

### `POST /api/upload/{fileType}`
- `fileType`: `solarman` | `tshwane`
- Request: `multipart/form-data`, field `file`, max 10 MB
- Response: JSON array of preview records

### `POST /api/import/{fileType}`
- Request body: JSON array from preview
```json
{ "recordsInserted": 145, "recordsUpdated": 23, "firstRecordDate": "2026-04-01T00:00:00", "lastRecordDate": "2026-04-26T23:45:00", "errorCount": 0 }
```

### Error format (all endpoints)
```json
{ "error": "message", "status": 400, "timestamp": "2026-04-27T14:00:00" }
```
Status codes: `200` success · `400` bad request · `500` server error · `503` database unavailable

---

## 📊 Web UI Features

### Home Page (`/`)
- CSS-based production bar chart — last 7 days, time-weighted, auto-refreshes after import
- System status panel — polls every 10 seconds, color-coded indicators

### Upload Page (`/upload`)
- File selection (SolarMan or Tshwane), data preview with pagination, import confirmation, results display

### Angular Conventions
- Standalone components (`ChangeDetectionStrategy.OnPush`)
- Signals: `signal()`, `computed()`, `effect()` — use `update()`/`set()`, never `mutate()`
- `inject()` for DI, `input()`/`output()` functions instead of decorators
- Native control flow: `@if`, `@for`, `@switch`
- `ChartRefreshService.triggerRefresh()` after successful import → `ProductionChartComponent` reloads

---

## 📋 Data Processing

### Excel File Format (12 columns, fixed order)
| # | Column | Notes |
|---|--------|-------|
| 1 | Plant | identifier |
| 2 | Updated | timestamp ← PRIMARY KEY |
| 3 | Time | additional |
| 4-12 | Production/Consumption/Grid/Purchase/Feed-in/Battery/Charging/Discharging/SoC | DOUBLE PRECISION |

- Records before 2020-01-01 are filtered out
- Duplicate timestamps handled with `ON CONFLICT (updated) DO UPDATE SET ...`

---

## 🗄️ Database Schema

```sql
-- Connection: jdbc:postgresql://localhost:5432/LOOTS (dev)
--             jdbc:postgresql://postgres-service:5432/LOOTS (k8s)
CREATE TABLE public.loots_inverter (
    updated          TIMESTAMP PRIMARY KEY,
    production_power DOUBLE PRECISION,
    consume_power    DOUBLE PRECISION,
    grid_power       DOUBLE PRECISION,
    purchase_power   DOUBLE PRECISION,
    feed_in          DOUBLE PRECISION,
    battery_power    DOUBLE PRECISION,
    charge_power     DOUBLE PRECISION,
    discharge_power  DOUBLE PRECISION,
    soc              DOUBLE PRECISION
);
```

### Useful SQL
```sql
-- Recent import check
SELECT COUNT(*), MAX(updated), MIN(updated) FROM public.loots_inverter
WHERE updated >= CURRENT_DATE - INTERVAL '7 days';

-- Data completeness
SELECT DATE(updated) AS date, COUNT(*) AS records, AVG(production_power) AS avg_prod
FROM public.loots_inverter
WHERE updated >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(updated) ORDER BY date DESC;

-- Find duplicates
SELECT updated, COUNT(*) FROM public.loots_inverter
GROUP BY updated HAVING COUNT(*) > 1;

-- Table size
SELECT pg_size_pretty(pg_total_relation_size('public.loots_inverter'));
```

---

## 🐳 PostgreSQL Data (Rancher Desktop)

Data is stored in the Lima VM, **not** directly on macOS:

```
macOS /tmp/postgres-k8s-test/  ← appears empty from macOS
         ↓ (Lima VM)
Lima VM /tmp/postgres-k8s-test/pgdata/  ← actual files here
         ↓ (hostPath PV)
Container /var/lib/postgresql/data/pgdata/
```

**Survives:** pod restarts, rollouts, `kubectl delete pod`  
**Does NOT survive:** Rancher Desktop VM reset, `kubectl delete pv postgres-pv`

### Database Backup & Restore
```bash
# Backup to macOS
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  pg_dump -U danieloots LOOTS | gzip > ~/loots_backup_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip -c ~/loots_backup_20260427.sql.gz | \
  kubectl exec -i $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U danieloots -d LOOTS

# Check DB size
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- \
  psql -U danieloots -d LOOTS -c "SELECT pg_size_pretty(pg_database_size('LOOTS'));"
```

---

## 🔄 Update & Deployment Workflow

### Full Rebuild + Rollout
```bash
# Build all images
docker build -t solarman-postgres:latest -f docker/postgresql/Dockerfile docker/postgresql/
docker build -t solarman-backend:latest -f backend/Dockerfile .
docker build -t solarman-frontend:latest -f frontend/Dockerfile frontend/

# Or use the script (uses nerdctl if available, else docker)
./scripts/build-images.sh

# Rollout
kubectl rollout restart deployment/backend deployment/frontend -n default
kubectl rollout status deployment/backend deployment/frontend --timeout=120s
```

### Backend-only Update
```bash
docker build -t solarman-backend:latest -f backend/Dockerfile .
kubectl rollout restart deployment/backend -n default
```

### Frontend-only Update
```bash
docker build -t solarman-frontend:latest -f frontend/Dockerfile frontend/
kubectl rollout restart deployment/frontend -n default
```

### Full Kubernetes Deploy (first time or full teardown)
```bash
./scripts/k8s-deploy.sh   # applies all manifests + waits for readiness
./scripts/k8s-delete.sh   # tears down (keeps PV data)
```

---

## 🔐 Security

### Scanning
```bash
cd backend && mvn verify          # integrated Trivy scan (fails on CRITICAL)
cd backend && ./security-scan.sh  # standalone scan
ls backend/reports/               # maven-dependencies.json, jar-artifact.json, docker-image.json
```

### Credentials
- Kubernetes: `k8s/secret.yaml` (base64-encoded, ⚠️ gitignored — never commit)
- Local dev: `$DB_USER` / `$DB_PASSWORD` env vars only
- Regenerate secret value: `echo -n "value" | base64`

### Status
- ✅ Tomcat 10.1.54 (CRITICAL CVE-2026-29145 patched)
- ✅ Spring Framework 6.2.17 (CVE-2026-22737 patched)
- ✅ commons-lang3 3.18.0 (CVE-2025-48924 patched)
- ✅ Angular 21.2.10 (XSS in i18n patched)
- ✅ Zero npm audit vulnerabilities

For full security docs: `backend/SECURITY.md` · `backend/SECURITY-QUICKSTART.md`

---

## 📊 Grafana

**Access**: `kubectl port-forward svc/grafana-service 3000:3000 -n default` → http://localhost:3000  
**Login**: `admin` / `admin123`  
**Datasource**: PostgreSQL-LOOTS (read-only `grafana` user, `grafana123`)

### Dashboards
- Daily Stats — last 2 days, hourly heatmaps
- Weekly Stats — ISO week aggregations
- Monthly Stats — long-term trends
- By Week Number — seasonal patterns

### Management
```bash
# Restore all dashboards
./restore-dashboards-fixed.sh

# Backup a specific dashboard
curl -s -u admin:admin123 \
  'http://localhost:3000/api/dashboards/uid/feab8f79-92e8-412e-83a6-99d262725b68' \
  | jq '.dashboard' > grafana/dashboards/daily-stats.json

# Restart / delete Grafana
kubectl rollout restart deployment/grafana
kubectl logs -l app=grafana -f
```

Full docs: `grafana/README.md` · `grafana/BACKUP_RESTORE_GUIDE.md`

---

## 🚨 Troubleshooting

### Database Connection Failed
```bash
pg_ctl status
echo $DB_USER && echo $DB_PASSWORD
psql -h localhost -p 5432 -d LOOTS -U $DB_USER
```

### Excel File Format Error
- Must have exactly 12 columns in the fixed order above
- Timestamps must be in a recognized format (`yyyy/MM/dd`, `MM/dd/yyyy`, SQL format, or Excel serial)

### Kubernetes: Images Not Found (`ErrImageNeverPull`)
```bash
docker images | grep solarman    # verify images exist
./scripts/build-images.sh        # rebuild if missing
```

### Kubernetes: Init Containers Stuck (`Init:0/1`)
```bash
kubectl logs <pod-name> -c wait-for-postgres   # backend/grafana
kubectl logs <pod-name> -c wait-for-backend    # frontend
kubectl get svc postgres-service backend-service
kubectl get endpoints postgres-service
```

### Kubernetes: PVC Not Binding
```bash
kubectl get pv,pvc
kubectl describe pvc postgres-pvc
```

### Frontend Can't Reach Backend
```bash
kubectl exec -it $(kubectl get pod -l app=frontend -o jsonpath='{.items[0].metadata.name}') \
  -- cat /etc/nginx/conf.d/default.conf
```

### Port Conflicts (Docker Compose)
```bash
lsof -i :8080 && lsof -i :8081 && lsof -i :5432
```

---

## 🔧 Configuration

### Build Configuration
```xml
<!-- backend/pom.xml -->
<groupId>com.loots</groupId>
<artifactId>solarman-ui-backend</artifactId>
<version>1.6.0</version>

<properties>
  <tomcat.version>10.1.54</tomcat.version>
  <spring-framework.version>6.2.17</spring-framework.version>
  <commons-lang3.version>3.18.0</commons-lang3.version>
</properties>
```

### Key Dependencies
- **Apache POI 5.5.1** — Excel file processing
- **PostgreSQL JDBC 42.7.10** — Database connectivity
- **Apache Tomcat 10.1.54** — Embedded web server
- **Java 17** — Runtime
- **Spring Boot 3.5.10** — Web framework
- **Angular 21.2** — Frontend framework
- **Vitest** — Frontend test runner
- **Trivy** — Security vulnerability scanning

---

## 🤝 Contributing

### Testing
```bash
# Backend (56 tests)
cd backend && mvn test
mvn test -Dtest=DatabaseServiceTest          # single class
mvn test -Dtest=ImportServiceTest#methodName # single method

# Frontend (31 tests)
cd frontend/solarman-ui && npx ng test --no-watch
npx ng test                                  # watch mode
npx playwright test                          # e2e (requires :4200)
```

See `backend/src/test/README.md` for full test documentation.

### Code Standards
- Backend: raw JDBC only (no Spring Data JPA repositories), `@Autowired` for DI, `ImportResult` return type for imports
- Frontend: standalone components, OnPush, signals, `inject()`, native control flow

---

## 📝 Recent Updates

### April 27, 2026 - Security Vulnerability Fixes (v1.6)
- Upgraded Apache Tomcat from 10.1.52 to 10.1.54 (CRITICAL CVE-2026-29145 + 6 other CVEs)
- Forced Spring Framework override to 6.2.17 (CVE-2026-22737, CVE-2026-22735)
- Forced commons-lang3 override to 3.18.0 (CVE-2025-48924)
- Upgraded Angular from 21.1.x to 21.2.10 (XSS in i18n CVEs fixed)
- Upgraded @angular/build from 21.1.4 to 21.2.8 (updated vite, undici; path traversal/HTTP smuggling fixed)
- Resolved all 18 npm audit vulnerabilities (zero remaining)
- All 56 backend tests and 31 frontend tests passing

### March 1, 2026 - Documentation Housekeeping & Node 22 Upgrade
- Upgraded Node.js from 20 to 22 in both frontend and backend Dockerfiles
- Updated all documentation to reflect current software versions

### February 21, 2026 - Dependency Upgrades & Vitest Migration
- Upgraded Java from 11 to 17 (backend)
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
- **v1.6** - Security vulnerability fixes (Tomcat, Spring, Angular 21.2)
- **v1.5** - Dependency upgrades, Angular 21, Java 17, Vitest migration
- **v1.1** - Production visualization & multi-page UI
- **v2.0** - Full-stack web application transformation

---

**Last Updated**: April 27, 2026


