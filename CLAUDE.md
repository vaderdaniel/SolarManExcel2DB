# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SolarManExcel2DB is a full-stack web application for importing and visualizing solar power generation data:
- **Backend** (`backend/`): Spring Boot 3.5.10 REST API with Excel processing and PostgreSQL integration
- **Frontend** (`frontend/solarman-ui/`): Angular 21 application with Material Design and production charts
- **Infrastructure**: Kubernetes manifests (`k8s/`), Docker configs (`docker/`), Grafana dashboards (`grafana/`)

## Build Commands

**Backend (Spring Boot):**
```bash
cd backend
mvn clean package          # Build application JAR
mvn spring-boot:run        # Run in development mode (port 8080)
mvn test                   # Run all 56 backend tests
mvn clean verify           # Build + security scan (Trivy)
```

**Frontend (Angular):**
```bash
cd frontend/solarman-ui
npm install                # Install dependencies
npm start                  # Development server on :4200
npm run build              # Production build
npx ng test --no-watch     # Run all 31 frontend tests
```

## Database Configuration

The backend connects to PostgreSQL at `jdbc:postgresql://localhost:5432/LOOTS` via environment variables:
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password

Start the database with: `/Users/danieloots/LOOTS_PG/loots_pg.sh`

Configure in `backend/src/main/resources/application.properties`.

## Architecture

**Backend Services:**
- `ExcelProcessingService`: Parses SolarMan and Tshwane Excel files using Apache POI
- `ImportService`: Handles data validation and UPSERT operations to PostgreSQL
- `DatabaseService`: Production statistics using time-weighted SQL calculations (LAG window functions)
- `DatabaseController`: REST endpoints for upload (`/api/upload`), import (`/api/import`), and status (`/api/database`)

**Frontend Components:**
- `ProductionChartComponent`: CSS bar chart with time-weighted 7-day solar production data
- `UploadComponent`: File upload, preview, and import workflow
- `ChartRefreshService`: Event bus for triggering chart refresh after imports

**Database Tables:**
- `loots_inverter`: Solar power metrics with `updated` timestamp as primary key
- `tshwane_electricity`: Electricity readings with `reading_date` as primary key

## Technology Stack

- **Java 17** / **Spring Boot 3.5.10** (backend — `backend/pom.xml`)
- **Angular 21** / **TypeScript** (frontend)
- **Maven** for backend build management
- **Apache POI 5.5.1** for Excel file processing
- **PostgreSQL Driver 42.7.10** for database connectivity
- **JUnit 5 + Mockito** for backend testing (56 tests)
- **Vitest** for frontend testing (31 tests)
- **Docker** / **Kubernetes** for deployment
- **Trivy** for security scanning

See TECH_SPEC_UI.md, AGENTS.md, and README.md for comprehensive documentation.
