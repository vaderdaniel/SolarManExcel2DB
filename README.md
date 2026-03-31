# SolarManExcel2DB - Complete Web Application

[![Java](https://img.shields.io/badge/Java-17+-blue.svg)](https://www.oracle.com/java/)
[![Angular](https://img.shields.io/badge/Angular-21-red.svg)](https://angular.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.10-green.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue.svg)](https://www.postgresql.org/)
[![Grafana](https://img.shields.io/badge/Grafana-Latest-orange.svg)](https://grafana.com/)

A modern web application for importing solar power generation data from SolarMan Excel exports into a PostgreSQL database. Features a complete full-stack implementation with Angular frontend and Spring Boot backend.

## 🏗️ Architecture Overview

```
┌─────────────────┌    REST API     ┌──────────────────┌    JDBC     ┌─────────────────┌
│    Angular 21   │◄────────────────►│   Spring Boot    │◄───────────►│   PostgreSQL    │
│     Frontend    │                  │     Backend      │             │    Database     │
│  (Port: 4200)   │                  │   (Port: 8080)   │             │   (Port: 5432)  │
└─────────────────┘                  └──────────────────┘             └────────┌────────┌
                                                                                │
                                                                                │ Read-Only
                                                                                │
                                                                       ┌────────▼────────┌
                                                                       │     Grafana     │
                                                                       │   Monitoring    │
                                                                       │  (Port: 3000)   │
                                                                       └─────────────────┌
```

### Kubernetes Startup Sequence

When deployed to Kubernetes, init containers ensure proper startup order:
- **PostgreSQL** starts first (no dependencies)
- **Backend & Grafana** wait for PostgreSQL to be ready (port 5432)
- **Frontend** waits for Backend to be ready (port 8080)

This prevents connection errors and ensures clean application startup.

## ✨ Key Features

### Web UI (Version 1.5)
- 🌐 **Modern Web UI**: Angular 21 with Material Design and Routing
- 📊 **Production Visualization**: Interactive bar chart showing last 7 days of solar production
- 🔄 **Time-Weighted Calculations**: Accurate energy production metrics matching Grafana dashboards
- 🧭 **Multi-Page Navigation**: Dedicated Home and Upload pages with toolbar navigation
- 📊 **Real-time Status**: Live database connectivity monitoring with 10-second polling
- 🔄 **Auto-Refresh Charts**: Charts automatically update after data imports
- 📂 **File Upload**: Drag-and-drop Excel file processing
- 👀 **Data Preview**: Review data before importing with Material tables
- 🚀 **Full File Import**: Processes thousands of records efficiently
- 📈 **Import Results**: Detailed statistics and error reporting
- 🔄 **Dual Support**: SolarMan and Tshwane electricity data formats
- 🛡️ **Data Validation**: Comprehensive file and data validation
- ⚡ **High Performance**: Optimized for large Excel files
- 🎯 **Production Ready**: Complete Kubernetes deployment with Rancher Desktop
- 📊 **Grafana Integration**: Optional monitoring and data visualization

## 🚦 Quick Start

### Choose Your Deployment Method

You can run the application in three different ways:

#### 🐳 **Option 1: Docker & Kubernetes (Recommended)**

Run the complete application stack in containers with Kubernetes orchestration:

```bash
# 1. Build Docker images
./scripts/build-images.sh

# 2. Deploy to Kubernetes
./scripts/k8s-deploy.sh

# 3. Access the application
open http://localhost:30080
```

📘 **[Full Docker & Kubernetes Documentation →](DOCKER_KUBERNETES_DEPLOYMENT.md)**

#### 🐋 **Option 2: Docker Compose (Quick Testing)**

Run all services with Docker Compose for quick local testing:

```bash
# Start all services
./scripts/docker-compose-up.sh

# Access the application
open http://localhost:8081

# Stop services
docker-compose down
```

#### 💻 **Option 3: Local Development (Native)**

Run components natively for active development:
### Prerequisites
- Java 17 or higher
- Node.js 18+ and npm
- PostgreSQL database
- Maven 3.6+
- Trivy (for security scanning)

**1. Database Setup**
```bash
# Start your PostgreSQL database
/Users/danieloots/LOOTS_PG/loots_pg.sh

# Set environment variables
export DB_USER=your_database_username
export DB_PASSWORD=your_database_password
```

**2. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Build and run Spring Boot application
mvn spring-boot:run
# Backend runs on http://localhost:8080
```

**3. Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend/solarman-ui

# Install dependencies and start development server
npm install
npm start
# Frontend runs on http://localhost:4200
```

**4. Access the Application**

Open your browser to **http://localhost:4200** and start importing your Excel files!

## 📚 Documentation

This project includes comprehensive documentation organized into specialized files:

- **[WARP.md](WARP.md)** — Main project documentation (overview, features, setup, troubleshooting)
- **[WARP_QUICK.md](WARP_QUICK.md)** — Quick reference for common commands and queries
- **[WARP_API.md](WARP_API.md)** — REST API and CLI class reference
- **[WARP_DEPLOY.md](WARP_DEPLOY.md)** — Development & deployment guide (local, Docker, Kubernetes)
- **[TECH_SPEC_UI.md](TECH_SPEC_UI.md)** — Technical architecture and component specifications
- **[DOCKER_KUBERNETES_DEPLOYMENT.md](DOCKER_KUBERNETES_DEPLOYMENT.md)** — Docker & Kubernetes deployment with Rancher Desktop
- **[BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md)** — Spring Boot backend technical documentation
- **[CHANGELOG_v1.5.md](CHANGELOG_v1.5.md)** — Version history, release notes and migration guide
- **[grafana/README.md](grafana/README.md)** — Grafana dashboard documentation
- **[grafana/BACKUP_RESTORE_GUIDE.md](grafana/BACKUP_RESTORE_GUIDE.md)** — Grafana backup & restore procedures
- **[backend/SECURITY.md](backend/SECURITY.md)** — Security scanning with Trivy
- **[backend/SECURITY-QUICKSTART.md](backend/SECURITY-QUICKSTART.md)** — Security quick reference

## 🎯 Recent Major Updates

### v1.5 - Dependency Upgrades & Vitest Migration (February 21, 2026)
- ✅ **Java 17**: Upgraded from Java 11 to Java 17
- ✅ **Angular 21**: Upgraded from Angular 20.3 to Angular 21
- ✅ **Vitest Migration**: Migrated frontend tests from Karma/Jasmine to Vitest
- ✅ **Spring Boot 3.5.10**: Upgraded from 3.2.2
- ✅ **Apache POI 5.5.1**: Upgraded from 4.1.1
- ✅ **PostgreSQL JDBC 42.7.10**: Upgraded from 42.7.3
- ✅ **Tomcat 10.1.52**: Upgraded from 10.1.35

### Security & Infrastructure Enhancements (February 2, 2026)
- ✅ **Security Scanning**: Integrated Trivy vulnerability scanning for dependencies and Docker images
- ✅ **Grafana Backup/Restore**: Comprehensive backup and restore system for dashboards and datasources
- ✅ **Tomcat Security Update**: Upgraded to version 10.1.35 (CVE-2025-24813 fixed)
- ✅ **Simplified Dockerfile**: Added `Dockerfile.simple` for runtime-only builds
- ✅ **Enhanced Documentation**: New security guides and Grafana backup procedures

### v1.1 - Production Visualization & Multi-Page UI
- ✅ **Production Chart**: CSS-based bar chart showing 7-day solar production trends
- ✅ **Multi-Page Routing**: Separated Home and Upload pages with Angular Router
- ✅ **Time-Weighted Stats**: New API endpoint with Grafana-compatible calculations
- ✅ **Auto-Refresh**: Charts automatically update after successful imports
- ✅ **Toolbar Navigation**: Material Design navigation with active route highlighting
- ✅ **Kubernetes Deployment**: Complete containerization with Rancher Desktop
- ✅ **Enhanced Architecture**: Service-based chart refresh and event system

### v2.0 - Full-Stack Web Application
- ✅ **Complete Rewrite**: Transformed from CLI to full web application
- ✅ **Full File Import**: Fixed critical issue - now imports ALL records (1,988+) instead of just preview data
- ✅ **Smart File Storage**: Temporary file storage with unique IDs for reliable full imports
- ✅ **Enhanced UI**: Real-time record counts, improved preview experience
- ✅ **Flexible Date Parsing**: Handles multiple date formats automatically
- ✅ **Production Ready**: Complete CI/CD pipeline with comprehensive testing

### Key Technical Achievements
- **File Processing**: Successfully handles large Excel files (tested with 1,988 records)
- **Memory Management**: Efficient temporary file storage with automatic cleanup
- **Error Recovery**: Robust error handling with detailed logging and user feedback
- **Performance**: Optimized database operations with batch processing and UPSERT logic
- **User Experience**: Intuitive workflow with clear progress indicators and validation

## 🛠️ Technology Stack

### Frontend
- **Angular 21**: Latest framework with standalone components
- **Angular Material**: Modern Material Design components
- **TypeScript 5.9**: Type-safe development environment
- **RxJS**: Reactive programming for API communication
- **Vitest**: Fast unit test runner (migrated from Karma/Jasmine)
- **SCSS**: Advanced styling with component encapsulation

### Backend
- **Spring Boot 3.5.10**: Enterprise-grade Java framework
- **Spring Data JPA**: Powerful ORM with PostgreSQL integration
- **Apache POI 5.5.1**: Excel file processing and validation
- **Apache Tomcat 10.1.52**: Embedded web server (security-patched)
- **Java 17**: Runtime environment
- **Maven**: Dependency management and build automation
- **Hibernate**: Advanced database operations and caching
- **Trivy**: Security vulnerability scanning

### Database & Infrastructure
- **PostgreSQL**: Robust relational database with persistent storage
- **Docker**: Multi-stage builds for optimized images
- **Kubernetes**: Production-ready orchestration with Rancher Desktop
- **nginx**: High-performance reverse proxy for frontend
- **Grafana**: Analytics and monitoring platform with PostgreSQL datasource
- **Environment Configuration**: Flexible deployment options

## 📊 Supported Data Formats

### SolarMan Excel Files
- Production Power, Consumption Power, Grid Power
- Battery operations (Charging, Discharging, SoC)
- Feed-in tariff data and purchasing power
- Timestamp validation and filtering (post-2020 data)

### Tshwane Electricity Files  
- Reading dates, values, and amounts
- Billing notes and consumption patterns
- Municipal electricity usage tracking

## 🔄 Development Workflow

### Native Development (Local)
```bash
# 1. Start Database
/Users/danieloots/LOOTS_PG/loots_pg.sh

# 2. Backend Development (Terminal 1)
cd backend
mvn spring-boot:run

# 3. Frontend Development (Terminal 2)  
cd frontend/solarman-ui
npm start

# 4. Production Build
npm run build                    # Frontend
mvn clean package               # Backend
```

### Docker Development (Containerized)
```bash
# 1. Build all images
./scripts/build-images.sh

# 2. Run with Docker Compose
./scripts/docker-compose-up.sh

# 3. View logs
docker-compose logs -f

# 4. Stop services
docker-compose down
```

### Kubernetes Development (Production-like)
```bash
# 1. Build images
./scripts/build-images.sh

# 2. Deploy to Kubernetes
./scripts/k8s-deploy.sh

# 3. View logs
kubectl logs -l app=backend -f

# 4. Clean up
./scripts/k8s-delete.sh
```

## 🚀 Production Deployment

### Option 1: Kubernetes (Recommended for Production)

Deploy the complete application stack to Kubernetes with proper orchestration:

```bash
# Build Docker images
./scripts/build-images.sh

# Deploy to Kubernetes
./scripts/k8s-deploy.sh

# Access application at http://localhost:30080
```

For detailed deployment instructions, see **[DOCKER_KUBERNETES_DEPLOYMENT.md](DOCKER_KUBERNETES_DEPLOYMENT.md)**

### Option 2: Docker Compose

Deploy with Docker Compose for simpler environments:

```bash
# Start all services
./scripts/docker-compose-up.sh

# Access application at http://localhost:8081
```

### Option 3: Single JAR Deployment

The application builds into a single executable JAR file containing both frontend and backend:

```bash
# Build production application
cd frontend/solarman-ui && npm run build
cd ../../backend && mvn clean package

# Deploy single JAR
java -jar target/solarman-ui-backend-1.5.0.jar

# Access application at http://localhost:8080
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Check the relevant documentation files above
- Review the issue tracker
- Contact the development team

## 🏆 Acknowledgments

- Built with modern web development best practices
- Optimized for solar energy data management
- Designed for enterprise-scale deployments
- Committed to sustainable energy monitoring

---

**Latest Version**: 1.5 - Dependency Upgrades & Vitest Migration  
**Last Updated**: March 1, 2026  
**Status**: Production Ready ✅

## 🔒 Security

The application includes automated security scanning using Trivy:

```bash
# Run security scan (integrated with Maven build)
mvn verify

# Run security scan standalone
cd backend && ./security-scan.sh
```

Security reports are generated in `backend/reports/`:
- Maven dependencies scan
- JAR artifact scan
- Docker image scan

For detailed security documentation, see:
- **[backend/SECURITY.md](backend/SECURITY.md)** - Comprehensive security scanning guide
- **[backend/SECURITY-QUICKSTART.md](backend/SECURITY-QUICKSTART.md)** - Quick reference

## 📊 Grafana Dashboards

The application integrates with Grafana for data visualization:

**Dashboards:**
- Daily Stats - Last 2 days with hourly heatmaps
- Weekly Stats - ISO week aggregations
- Monthly Stats - Long-term trends
- By Week Number - Seasonal patterns

**Access:**
```bash
kubectl port-forward svc/grafana-service 3000:3000 -n default
open http://localhost:3000
```

**Backup & Restore:**
```bash
# Restore all dashboards
./restore-dashboards-fixed.sh
```

For detailed Grafana documentation, see:
- **[grafana/README.md](grafana/README.md)** - Complete dashboard documentation
- **[grafana/BACKUP_RESTORE_GUIDE.md](grafana/BACKUP_RESTORE_GUIDE.md)** - Backup procedures

## 📸 Screenshots

### Home Page with Production Chart
- 7-day production bar chart with time-weighted calculations
- System status panel with real-time database monitoring
- Responsive Material Design interface

### Upload Page
- File selection and preview
- Import confirmation workflow
- Detailed import results with statistics

### Navigation
- Toolbar with Home and Upload buttons
- Active route highlighting
- Seamless page transitions
