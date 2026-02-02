# SolarManExcel2DB - Version 1.1 Changelog

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
- **TECH_SPEC_UI.md**: Added v1.1 features, routing, new components
- **WARP.md**: Added Web UI section with deployment instructions
- **CHANGELOG_v1.1.md**: This file

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
  - `backend/SECURITY.md` - Complete security scanning documentation
  - `backend/SECURITY-QUICKSTART.md` - Quick reference guide
  - `backend/security-scan.sh` - Standalone security scan script

#### Grafana Backup/Restore System
- **Backup System**: Comprehensive dashboard and datasource backups
  - All 4 dashboards backed up in `grafana/dashboards/`
  - PostgreSQL datasource configuration in `grafana/datasource-postgresql.json`
- **Restore Scripts**: Automated restoration
  - `restore-dashboards-fixed.sh` - Auto-detects and fixes datasource UIDs
  - `restore-dashboards.sh` - Original restore script
- **Documentation**: Complete Grafana documentation
  - `grafana/README.md` - Dashboard descriptions and usage
  - `grafana/BACKUP_RESTORE_GUIDE.md` - Quick reference for backup/restore

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

**Next Steps**:
- Consider adding date range selector for chart
- Add export functionality for chart data
- Implement user authentication (future enhancement)
- Add more chart types (line, area) for different metrics
- Set up automated Grafana dashboard backups in CI/CD
