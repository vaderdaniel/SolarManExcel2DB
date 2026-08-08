# SolarManExcel2DB - Changelog

---

## v1.7.4 - Security Patches (Backend Tomcat CVEs + Frontend npm audit)

**Release Date**: August 8, 2026
**Version**: 1.7.4

### 🔐 Security Fixes

#### Backend — 3 CRITICAL CVEs resolved (`pom.xml`)

| Library | Before | After | CVEs Fixed |
|---------|--------|-------|-------------|
| `tomcat-embed-core` | 10.1.54 | **10.1.55** | CVE-2026-41293 (HTTP/2 request header validation bypass), CVE-2026-43512 (digest-auth bypass), CVE-2026-43515 (authorization bypass via overlapping method constraints) |

- Tomcat overridden via `<tomcat.version>10.1.55</tomcat.version>`
- Confirmed via `mvn verify` (integrated Trivy scan): `pom.xml`, the built JAR, and the rebuilt `solarman-backend:latest` Docker image all scan clean (0 vulnerabilities)

#### Frontend — 27 of 32 npm-audit findings resolved (`package.json` / `package-lock.json`)

- `npm update` pulled in-range fixes for both CRITICAL findings (`tar`, `vitest`) plus 25 high/moderate/low findings, all within existing `^` semver ranges — no `package.json` range changes required
- Angular packages: `21.2.10` → `21.2.20`; `vitest`: `4.0.18` → `4.1.10` (fixes a critical arbitrary file read via the Vitest UI server)
- **Remaining 5** (4 moderate, 1 high — `@angular/build`, `@angular/cli`, `@modelcontextprotocol/sdk`, `@hono/node-server`, `undici`) require an Angular v22 major-version bump to fully resolve; deferred as a separate decision since they're confined to dev/build tooling (the `ng serve` dev-server HTTP client and the Angular CLI's bundled MCP server) and not shipped in the built app or Docker image

### ✅ Test Results
- **61 backend tests**: All passing
- **42 frontend unit tests**: All passing (vitest 4.1.10)
- **87/93 frontend e2e tests**: Passing — the 6 failures are pre-existing stale fixtures unrelated to this change (a footer version-string assertion and a `.error-state` locator that stopped being unique after the Tshwane usage chart was added in v1.7.3)

---

## v1.7.3 - Tshwane Electricity Usage Bar Chart

**Release Date**: April 30, 2026  
**Version**: 1.7.3

### 🆕 New Feature: Tshwane Electricity Usage Chart on Home Page

A new bar chart has been added to the home page, positioned between the Solar Production chart and the System Status panel.

**What it shows:** kWh consumed between each of the last 7 consecutive Tshwane meter readings, computed as `current_cumulative - previous_cumulative` per interval.

**Visual design:** Green gradient bars (distinct from the blue Solar Production chart), same CSS bar chart pattern with dynamic Y-axis scaling, hover tooltips, and responsive layout.

**X-axis labels:** Date + time (`MM/dd HH:mm`) — important because multiple readings can occur on the same day.

**Auto-refresh:** Subscribes to `ChartRefreshService.refresh$` — reloads automatically after a successful Tshwane import.

### 🔧 Technical Changes

#### Backend
- **`TshwaneUsageStat.java`** (new model): `LocalDateTime readingDate`, `Double usageKwh`
- **`DatabaseService.java`**: New `getTshwaneUsageStats(int readings)` method using LATERAL join:
  ```sql
  SELECT a.reading_date,
    ROUND((a.cumulative_electricity_used - b.cumulative_electricity_used)::numeric, 2) AS usage_kwh
  FROM public.tshwane_electricity a
  LEFT JOIN LATERAL (
    SELECT cumulative_electricity_used FROM public.tshwane_electricity
    WHERE reading_date < a.reading_date ORDER BY reading_date DESC LIMIT 1
  ) b ON true
  WHERE b.cumulative_electricity_used IS NOT NULL
  ORDER BY a.reading_date DESC LIMIT ?
  ```
- **`DatabaseController.java`**: New `GET /api/database/tshwane-usage` endpoint (fixed at 7 readings)

#### Frontend
- **`tshwane-usage-stat.model.ts`** (new model): `{ readingDate: string; usageKwh: number }`
- **`database.service.ts`**: New `getTshwaneUsageStats()` method
- **`TshwaneChartComponent`** (new, `components/tshwane-chart/`): Standalone, OnPush, green CSS bar chart
- **`HomeComponent`**: Imports and renders `<app-tshwane-chart>` between production chart and status panel

### ✅ Test Results
- **61 backend tests**: All passing (+5 new in `DatabaseServiceTest`)
- **42 frontend tests**: All passing (+11 new in `tshwane-chart.spec.ts`)

---

## v1.7.2 - Grafana Dashboard Updates

**Release Date**: April 29, 2026  
**Version**: 1.7.2

### 📊 New Grafana Dashboard: Tshwane Daily

New dashboard added (`grafana/dashboards/tshwane-daily.json`, UID: `tshwane-daily`):

- **Default time range**: Last 30 days
- **Panel 1 — Daily Electricity Usage (units/day)**: Two line series
  - `week_units_per_day` — rolling 7-day average kWh/day from Tshwane cumulative meter (LATERAL join)
  - `month_units_per_day` — rolling 30-day average kWh/day (LATERAL join)
- **Panel 2 — Weekly Usage vs Daily Grid Purchased (kWh/day)**: Two line series for direct comparison
  - `Weekly avg consumption (kWh/day)` — same 7-day rolling average from Panel 1
  - `Daily grid purchased 7-day avg (kWh/day)` — 7-day rolling average of inverter grid purchases (LAG CTE + sliding window, Wh → kWh)
- Both panels use table-mode legend with Mean, Max, Sum calcs

### 📊 Legend Calcs Added to Existing Dashboards

- **Daily Stats** (panels 1 & 2): Added Sum / Mean / Max legend calcs, legend switched to table mode
- **Monthly Stats** (panels 1 & 2): Added Sum / Mean / Max legend calcs, legend switched to table mode

### 🔧 Technical Notes

- Tshwane consumption uses `LATERAL` joins to find the nearest prior reading ≥ 7/30 days back — correct for irregularly-spaced meter readings
- Inverter purchased units use `LAG()` in a CTE to avoid correlated-subquery NULL issues inside `GROUP BY` aggregates
- `restore-dashboards-fixed.sh` picks up `tshwane-daily.json` automatically via `*.json` glob — no script changes needed

---

## v1.7.1 - Tshwane Excel Parsing Bug Fix

**Release Date**: April 29, 2026  
**Version**: 1.7.1

### 🐛 Bug Fixes

#### Tshwane Upload Preview Showed 0 Rows

**Root cause 1 — Formula cells in Col C:**  
All "Cumulative Electricity used" values (Col C) in the spreadsheet are Excel formula cells (`=IF(AND(...), SUM(...), "")`). Apache POI reports these as `CellType.FORMULA`. The `getCellValueAsDouble` helper only handled `STRING` and `NUMERIC`, returning the default value of `-1.0` for any other type — silently skipping every row.

**Fix:** `getCellValueAsDouble` now detects `CellType.FORMULA` and resolves the actual result type via `cell.getCachedFormulaResultType()` before reading the numeric value.

**Root cause 2 — Native date cells in Col A:**  
Date values in Col A are native Excel date cells (`data_type=d`). Previously converted to a serial number string then parsed back via string patterns, which was fragile.

**Fix:** `parseTshwaneRow` now detects date cells via `DateUtil.isCellDateFormatted()` and reads them directly with `cell.getDateCellValue()`.

**Result:** All 869 rows from the spreadsheet now parse and preview correctly.

---

## v1.7 - Tshwane Electricity Data Model Redesign

**Release Date**: April 29, 2026  
**Version**: 1.7.0

### 🔄 Feature Changes

#### Tshwane Electricity Import — New Columns

The `tshwane_electricity` table previously stored the raw Electricity Reading meter value (`reading_value`) and a billing amount (`reading_amount`, always 0). The import now captures the data that is actually useful for energy analysis:

| Before | After |
|--------|-------|
| `reading_value` (raw meter reading, Col B) | `cumulative_electricity_used` (running total since baseline, Col C) |
| `reading_amount` (always 0, dropped) | — |
| `reading_notes` (never populated) | `reading_notes` now populated from Col O (sparse milestone notes) |

#### Excel Source Mapping — "Elektrisiteit Lesings" Sheet

| Excel Column | Header | Maps To |
|---|---|---|
| A | Day | `reading_date` (PRIMARY KEY — unchanged) |
| C | Cumulative Electricity used | `cumulative_electricity_used` (new) |
| O | *(no header)* | `reading_notes` (sparse milestone notes) |

Rows where Column C is empty are skipped (e.g., the first baseline row).

#### Example Notes Captured (Col O)
- *"Last reading by Tshwane before Prepaid Electricity Installed"*
- *"Tshwane Prepaid Electricity Installed"*
- *"Moved swimming pool pump to Inverter and switch on daily"*
- *"Added two batteries to the inverter and got new geyser element"*

### 🗄️ Database Schema Change

```sql
-- Before
CREATE TABLE public.tshwane_electricity (
    reading_date   TIMESTAMP PRIMARY KEY,
    reading_value  DOUBLE PRECISION NOT NULL,
    reading_amount DOUBLE PRECISION,
    reading_notes  TEXT
);

-- After
CREATE TABLE public.tshwane_electricity (
    reading_date                TIMESTAMP PRIMARY KEY,
    cumulative_electricity_used DOUBLE PRECISION NOT NULL,
    reading_notes               TEXT
);
```

Migration applied:
```sql
DELETE FROM public.tshwane_electricity;  -- existing data cleared
ALTER TABLE public.tshwane_electricity RENAME COLUMN reading_value TO cumulative_electricity_used;
ALTER TABLE public.tshwane_electricity DROP COLUMN reading_amount;
```

### 🔧 Technical Changes

#### Backend
- **`TshwaneRecord.java`**: Removed `readingAmount` field; renamed `readingValue` → `cumulativeElectricityUsed`; removed unused JPA annotations (`@Entity`, `@Table`, `@Id`, `@Column`)
- **`ExcelProcessingService.java`**: `parseTshwaneRow()` now reads Col C (index 2) for value and Col O (index 14) for notes; rows with no Col C value are skipped
- **`ImportService.java`**: UPSERT SQL updated to 3-column schema (`reading_date`, `cumulative_electricity_used`, `reading_notes`)
- **`FileUploadController.java`**: Preview map key changed from `"Reading Value"` → `"Cumulative Electricity Used"`; `"Reading Amount"` removed
- **`ImportController.java`**: Legacy data-path field lookups updated to `cumulativeElectricityUsed` / `"Cumulative Electricity Used"`

#### Frontend
- **`tshwane-record.model.ts`**: Removed `readingAmount`; replaced `readingValue` with `cumulativeElectricityUsed` in both `TshwaneRecord` and `TshwanePreviewData` interfaces
- **`data-preview.ts`**: Tshwane column list updated — `"Cumulative Electricity Used"` replaces `"Reading Value"`; `"Reading Amount"` removed

### ✅ Test Results
- **56 backend tests**: All passing
- **31 frontend tests**: All passing

### 🔄 Migration Notes

#### Breaking Changes
- `tshwane_electricity.reading_value` → renamed to `cumulative_electricity_used`
- `tshwane_electricity.reading_amount` → dropped
- All existing Tshwane data must be re-imported from the Excel source file

#### Upgrade Path
1. Pull latest code
2. Apply DB migration (already done in k8s environment)
3. Re-import Tshwane data via Upload page using the Excel source file
4. Build and deploy Docker images

---

## v1.6 - Security Vulnerability Fixes

**Release Date**: April 27, 2026  
**Version**: 1.6.0

### 🔐 Security Fixes

#### Backend — 10 vulnerabilities resolved (pom.xml)

| Library | Before | After | Severity / CVEs Fixed |
|---------|--------|-------|-----------------------|
| `tomcat-embed-core` | 10.1.52 | **10.1.54** | CRITICAL CVE-2026-29145 (auth bypass) + 6 others |
| `spring-webmvc` | 6.2.15 | **6.2.17** | CVE-2026-22737, CVE-2026-22735 |
| `commons-lang3` | 3.17.0 | **3.18.0** | CVE-2025-48924 |

- Tomcat overridden via `<tomcat.version>10.1.54</tomcat.version>`
- Spring Framework overridden via `<spring-framework.version>6.2.17</spring-framework.version>`
- commons-lang3 overridden via `<commons-lang3.version>3.18.0</commons-lang3.version>`

> ⚠️ `jackson-core` 2.19.4 has a MEDIUM advisory (GHSA-72hv-8253-57qq); no fix available in the 2.19.x range managed by Spring Boot 3.5.10. Monitor for a Spring Boot patch that upgrades to 2.21.x.

#### Frontend — 18 vulnerabilities resolved (package.json)

| Package | Before | After | CVEs / Advisories |
|---------|--------|-------|-------------------|
| `@angular/core` + all Angular packages | 21.1.x | **21.2.10** | XSS in i18n (CVE), Angular compiler XSS |
| `@angular/build` | 21.1.4 | **21.2.8** | Brings fixed vite and undici |
| `@angular/cli` | 21.1.4 | **21.2.8** | — |
| `vite` (transitive) | 7.3.0 | updated via `@angular/build` | Path traversal, arbitrary file read, `server.fs.deny` bypass |
| `undici` (transitive) | 7.20.0 | updated via `@angular/build` | HTTP smuggling, WebSocket memory overflow, CRLF injection |
| `hono` (transitive) | — | patched | Cookie bypass, path traversal, HTML injection |
| `postcss` (transitive) | — | patched | XSS via unescaped `</style>` |

Upgraded via `npx ng update @angular/core@21 @angular/cli@21` then `npm audit fix`.

### ✅ Test Results
- **56 backend tests**: All passing
- **31 frontend tests**: All passing

---

## v1.5 - Version 1.1 Features & Post-Release Updates

**Release Date**: December 10, 2025  
**Version**: 1.1.0

## 🎉 Major Features

### Frontend Restructuring
- **Multi-page Application**: Implemented Angular routing with dedicated pages
  - Home page (`/`) with production chart and system status
  - Upload page (`/upload`) with file management workflow
  - Navigation toolbar with Home and Upload buttons

### Production Visualization
- **Solar Production Chart**: New CSS-based bar chart component
  - Displays last 7 days of electricity production
  - Time-weighted calculations matching Grafana dashboard methodology
  - Dynamic Y-axis scaling (0 to calculated maximum)
  - Interactive hover tooltips showing exact kWh values
  - Responsive design for mobile devices
  - Auto-refreshes after data imports

### Enhanced User Experience
- **Toolbar Navigation**: Material Design navigation with active route highlighting
- **Separated Workflows**: File upload isolated to dedicated page
- **Chart Refresh Service**: Real-time chart updates after imports
- **Improved Layout**: Cleaner separation of concerns with routing

## 🔧 Technical Changes

### Backend
#### New Components
- **ProductionStat Model** (`model/ProductionStat.java`)
  - Fields: `LocalDate date`, `Double productionUnits`
  
- **Production Stats API** (`controller/DatabaseController.java`)
  - Endpoint: `GET /api/database/production-stats?days=7`
  - Returns aggregated production data for specified days
  
- **DatabaseService Enhancement** (`service/DatabaseService.java`)
  - Method: `getProductionStats(int days)`
  - SQL: Time-weighted calculation using LAG window function
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
  FROM per_point
  GROUP BY production_date
  ORDER BY production_date DESC
  LIMIT ?;
  ```

### Frontend
#### New Components
1. **HomeComponent** (`pages/home/`)
   - Contains: ProductionChart + StatusPanel
   - Route: `/`

2. **UploadComponent** (`pages/upload/`)
   - Contains: FileUpload → DataPreview → ImportResult workflow
   - Route: `/upload`

3. **ProductionChartComponent** (`components/production-chart/`)
   - CSS-based bar chart (no external chart libraries)
   - Features: Dynamic scaling, tooltips, responsive design
   - Subscribes to ChartRefreshService

#### New Services
- **ChartRefreshService** (`services/chart-refresh.service.ts`)
  - Uses RxJS Subject for event-driven chart updates
  - Triggered after successful imports

#### New Models
- **ProductionStat** (`models/production-stat.model.ts`)
  - Interface: `{date: string, productionUnits: number}`

#### Enhanced Services
- **DatabaseService** extended with `getProductionStats(days: number)`

#### Router Configuration
- **App Config** (`app.config.ts`)
  - Routes configured with `provideRouter`
  - Paths: `/` (Home), `/upload` (Upload)

#### Component Updates
- **App Component** simplified to toolbar + router-outlet
- **App Template** updated with navigation buttons and router-outlet

### Styling
#### Chart Styles (`production-chart.scss`)
- Bar chart with gradient fill
- Grid lines and Y-axis labels
- Hover effects with tooltips
- Responsive breakpoints for mobile
- **Bar Alignment Fix**: Bars now grow upward from 0 (bottom-aligned)

#### App Styles (`app.scss`)
- Navigation button styles
- Active route highlighting
- Responsive toolbar
- Footer positioning

## 📦 Deployment

### Docker Images
- **Backend**: `solarman-backend:latest`
  - Includes embedded Angular frontend
  - Multi-stage build: Node → Maven → Amazon Corretto

- **Frontend**: `solarman-frontend:latest`
  - Standalone Nginx-served Angular app
  - Multi-stage build: Node → Nginx Alpine

### Kubernetes
- Deployed to Rancher Desktop cluster
- Services:
  - Backend: ClusterIP on port 8080
  - Frontend: NodePort on 30080
  - Access: http://localhost:30080

## 🔄 Migration Notes

### Breaking Changes
- None (backward compatible)

### Configuration Updates
- Footer version updated from 1.0 to 1.1
- No database schema changes required

### Upgrade Path
1. Pull latest code
2. Build Docker images
3. Restart Kubernetes deployments
4. No data migration needed

## 📝 Documentation Updates

### Updated Files
- **frontend/solarman-ui/README.md**: Consolidated v1.1 features, routing, component structure, Angular conventions, and TypeScript models from TECH_SPEC_UI.md
- **WARP.md**: Added Web UI section with deployment instructions
- **CHANGELOG_v1.5.md**: This file

### Key Documentation Sections
- Project structure updated with new directories
- Router configuration documented
- Production chart component specifications
- New API endpoint documentation
- Kubernetes deployment procedures

## 🐛 Bug Fixes
- **Chart Bar Alignment**: Fixed bars to grow upward from 0 instead of hanging from top
  - Added `justify-content: flex-end` to `.bar-wrapper`
  - Added `align-self: stretch` to `.bar`

## 🚀 Performance
- Chart uses CSS-only rendering (no canvas, no external libraries)
- Efficient time-weighted SQL query with window functions
- Lazy-loaded chart data (only fetched when needed)
- RxJS-based event system for minimal re-renders

## 🔐 Security
- No new security concerns
- Same CORS configuration
- Database credentials via environment variables
- No authentication changes (still unauthenticated)

## 📊 Metrics
- Bundle size: ~738 kB (within acceptable range)
- New API endpoint: ~20-50ms response time
- Chart render time: <100ms for 7 data points
- Docker image sizes:
  - Backend: ~450 MB
  - Frontend: ~45 MB

## 🎯 Success Criteria Met
✅ Footer displays "Version 1.1"  
✅ File Upload moved to separate `/upload` page  
✅ System Status moved to bottom of home page  
✅ Navigation buttons in toolbar  
✅ Production bar chart on home page  
✅ Chart shows last 7 days with time-weighted calculations  
✅ Chart automatically refreshes after imports  
✅ Bars aligned at bottom (0) and extend upward  
✅ Deployed to Kubernetes successfully  
✅ Documentation updated  

## 👥 Contributors
- Implementation via Warp AI Agent
- User: danieloots

---

## 🔄 Post-v1.1 Updates

### February 2, 2026 - Security & Infrastructure

#### Security Enhancements
- **Trivy Integration**: Added automated vulnerability scanning
  - Scans Maven dependencies, JAR artifacts, and Docker images
  - Integrated into Maven build process (`mvn verify`)
  - Reports generated in `backend/reports/`
  - Build fails on CRITICAL vulnerabilities
- **Tomcat Security Update**: Upgraded to version 10.1.35
  - Fixed CVE-2025-24813
  - Updated via `<tomcat.version>` property in `pom.xml`
- **Security Documentation**: Added comprehensive guides
  - `backend/SECURITY.md` - Complete security scanning documentation (includes quick reference)
  - `backend/security-scan.sh` - Standalone security scan script

#### Grafana Backup/Restore System
- **Backup System**: Comprehensive dashboard and datasource backups
  - All 4 dashboards backed up in `grafana/dashboards/`
  - PostgreSQL datasource configuration in `grafana/datasource-postgresql.json`
- **Restore Scripts**: Automated restoration
  - `restore-dashboards-fixed.sh` - Auto-detects and fixes datasource UIDs
  - `restore-dashboards.sh` - Original restore script
- **Documentation**: Complete Grafana documentation
  - `grafana/README.md` - Dashboard descriptions, usage, and backup/restore guide

#### Docker Improvements
- **Dockerfile.simple**: New runtime-only Dockerfile
  - Located at `backend/Dockerfile.simple`
  - For pre-built JARs without full build process
  - Faster deployment with Amazon Corretto 17 Alpine
- **.dockerignore**: Added for frontend
  - Excludes `node_modules/`, `.git/`, build artifacts
  - Reduces Docker build context size

#### Deployment Updates
- **Java Runtime**: Backend Dockerfile updated
  - Added `--add-opens` flag for Java reflection compatibility
  - Resolves `java.io` package access warnings
- **.gitignore**: Enhanced with security report exclusions
  - `backend/reports/` excluded from version control
  - Security scan outputs not committed

### Impact
- **Security**: Automated vulnerability detection in CI/CD pipeline
- **Reliability**: Grafana dashboards can be restored easily
- **Deployment**: More flexible Docker build options
- **Maintenance**: Clear documentation for backup/restore procedures

---

### February 21, 2026 - Dependency Upgrades & Vitest Migration

#### Core Dependency Upgrades
- **Java**: 11 → 17 (both CLI and backend)
- **Spring Boot**: 3.2.2 → 3.5.10
- **Angular**: 20.3 → 21
- **Apache POI**: 4.1.1 → 5.5.1 (both CLI and backend)
- **PostgreSQL JDBC**: 42.7.3 → 42.7.10 (both CLI and backend)
- **Apache Tomcat**: 10.1.35 → 10.1.52
- **TypeScript**: ~5.6 → ~5.9.2

#### Test Framework Migration
- **Karma/Jasmine → Vitest**: Complete migration of frontend test runner
  - Replaced `jasmine.createSpyObj` with `vi.fn()` mocks
  - Replaced `spyOn` with `vi.spyOn`
  - Replaced `HttpClientTestingModule` with `provideHttpClient()` + `provideHttpClientTesting()`
  - Updated `angular.json` test builder from `@angular/build:karma` to `@angular/build:unit-test`
  - Updated `tsconfig.spec.json` types to `vitest/globals`
  - Removed all Karma/Jasmine packages
  - Removed `fakeAsync`/`tick` from upload tests (unnecessary with synchronous `of()` mocks)
  - Added `testing` build configuration with `zone.js/testing` polyfill

#### Test Results
- **56 backend tests**: All passing
- **31 frontend tests**: All passing (18 production-chart + 11 upload + 2 app)

#### Impact
- **Performance**: Vitest runs significantly faster than Karma
- **Compatibility**: Java 17 enables modern language features
- **Security**: Latest dependency versions include security patches
- **No Breaking Changes**: API contracts and database schema unchanged

---

### March 1, 2026 - Documentation Housekeeping & Node 22 Upgrade

#### Documentation Fixes
- **CLI JAR Version**: Fixed all references from `SolarManExcel2DB-1.0` to `SolarManExcel2DB-1.5` across 5 documentation files
- **Build Config**: Fixed Maven version reference in WARP.md from 1.0 to 1.5
- **Backend JAR Name**: Fixed README.md to use correct artifact name `solarman-ui-backend-1.5.0.jar`
- **Dockerfile References**: Updated Node.js version references in deployment docs

#### Node.js Upgrade
- **Backend Dockerfile**: Upgraded frontend-build stage from `node:20-alpine` to `node:22-alpine`
- **Frontend Dockerfile**: Already upgraded to `node:22-alpine` (previous commit)
- Both Dockerfiles now consistently use Node.js 22

#### Impact
- **Documentation**: All version references now match actual project configuration
- **Consistency**: Frontend and backend Dockerfiles use the same Node.js version
- **No Breaking Changes**: No API or database schema changes

---

**Next Steps**:
- Upgrade `jackson-core` once Spring Boot 3.5.x ships a version with 2.21.x (resolves remaining MEDIUM advisory)
- Consider adding date range selector for chart
- Add export functionality for chart data
- Implement user authentication (future enhancement)
- Add more chart types (line, area) for different metrics
- Set up automated Grafana dashboard backups in CI/CD
