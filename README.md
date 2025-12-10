# SolarManExcel2DB - Complete Web Application

[![Java](https://img.shields.io/badge/Java-11+-blue.svg)](https://www.oracle.com/java/)
[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-green.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue.svg)](https://www.postgresql.org/)
[![Grafana](https://img.shields.io/badge/Grafana-Latest-orange.svg)](https://grafana.com/)

A modern web application for importing solar power generation data from SolarMan Excel exports into a PostgreSQL database. Features a complete full-stack implementation with Angular frontend and Spring Boot backend.

## 🏗️ Architecture Overview

```
┌─────────────────┌    REST API     ┌──────────────────┌    JDBC     ┌─────────────────┌
│   Angular 20    │◄──────────────►│   Spring Boot    │◄───────────►│   PostgreSQL    │
│     Frontend    │                  │     Backend      │             │    Database     │
│  (Port: 4200)   │                  │   (Port: 8080)   │             │   (Port: 5432)  │
└─────────────────┘                  └──────────────────┘             └────────┬────────┘
                                                                                │
                                                                                │ Read-Only
                                                                                │
                                                                       ┌────────▼────────┌
                                                                       │     Grafana     │
                                                                       │   Monitoring    │
                                                                       │  (Port: 3000)   │
                                                                       └─────────────────┘
```

### Kubernetes Startup Sequence

When deployed to Kubernetes, init containers ensure proper startup order:
- **PostgreSQL** starts first (no dependencies)
- **Backend & Grafana** wait for PostgreSQL to be ready (port 5432)
- **Frontend** waits for Backend to be ready (port 8080)

This prevents connection errors and ensures clean application startup.

## ✨ Key Features

### Web UI (Version 1.1)
- 🌐 **Modern Web UI**: Angular 20 with Material Design and Routing
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

**Prerequisites:**
- Java 11 or higher
- Node.js 18+ and npm
- PostgreSQL database
- Maven 3.6+

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

### 🆕 [WARP.md](WARP.md) - **Main Documentation (v1.1)**
**Complete Project Documentation**

Primary documentation covering both CLI and Web UI (v1.1), including:
- Project overview and quick start guide
- Web UI features (production chart, navigation, file upload)
- API endpoints with examples
- Kubernetes and Docker deployment instructions
- Data processing and database schema
- Troubleshooting and maintenance

*Start here for a complete understanding of the project.*

### ⚡ [WARP_QUICK.md](WARP_QUICK.md) - **Quick Reference**
**Essential Commands and Quick Access**

Quick reference guide with:
- CLI and Web UI quick commands
- API endpoint curl examples
- Kubernetes and Docker quick commands
- Common troubleshooting solutions
- Database queries and performance tips

*Perfect for day-to-day operations and quick lookups.*

### 🌐 [WARP_API.md](WARP_API.md) - **API Reference**
**Complete API Documentation**

Comprehensive API documentation covering:
- Web UI REST API endpoints (v1.1)
- Request/response formats with examples
- Production stats endpoint with SQL queries
- Error responses and status codes
- CLI application class documentation

*Essential for developers integrating with the API.*

### 🚀 [WARP_DEPLOY.md](WARP_DEPLOY.md) - **Deployment Guide**
**Development & Deployment Instructions**

Complete deployment guide including:
- CLI application deployment
- Web UI development setup
- Docker multi-stage builds
- Kubernetes deployment procedures
- Rolling updates and troubleshooting
- Monitoring and logging

*Critical for DevOps and production deployments.*

### 📖 [TECH_SPEC_UI.md](TECH_SPEC_UI.md) - **Technical Specifications**
**Detailed Technical Architecture**

In-depth technical documentation covering:
- System architecture and components
- Frontend components (v1.1 with routing)
- Backend services and controllers
- Production stats API with time-weighted calculations
- Database operations and models
- Build configuration

*For developers working on the codebase.*

### 📝 [CHANGELOG_v1.1.md](CHANGELOG_v1.1.md) - **Version 1.1 Changelog**
**Release Notes and Migration Guide**

Detailed changelog for v1.1 including:
- Major features (production chart, routing, navigation)
- Technical changes (backend and frontend)
- Deployment updates
- Bug fixes (chart bar alignment)
- Migration notes

*Important for understanding what's new in v1.1.*

### 🐳 [DOCKER_KUBERNETES_DEPLOYMENT.md](DOCKER_KUBERNETES_DEPLOYMENT.md)
**Docker & Kubernetes Deployment Guide**

Complete guide for containerized deployment with Docker and Kubernetes (Rancher Desktop), including:
- Docker image building from source (multi-stage builds)
- Kubernetes manifests and configuration
- PostgreSQL with persistent volume mounting
- Service networking and exposure strategies
- Deployment scripts and automation
- Troubleshooting and monitoring
- Production deployment considerations
- Docker Compose for local testing

*Essential for DevOps engineers and production deployments. Start here for containerized environments.*

### 📖 [README-oldCLI.md](README-oldCLI.md)
**Original Command-Line Interface Documentation**

Contains documentation for the legacy command-line version of SolarManExcel2DB. This covers:
- Original Java CLI utility usage
- Command-line parameters and options
- Direct JAR file execution
- Legacy build and deployment instructions
- Historical project evolution context

*Use this if you need to understand the original CLI tool or want to run the application in command-line mode.*

### 🎨 [FRONTEND_README.md](FRONTEND_README.md)
**Angular Frontend Implementation Guide**

Comprehensive documentation for the Angular 20 frontend application, including:
- Complete Angular project structure and organization
- Component architecture (Status Panel, File Upload, Data Preview, Import Results)
- Angular Material UI implementation and theming
- Service layer design and API integration
- TypeScript models and interfaces
- Development workflow and build processes
- Responsive design and user experience features
- Production build configuration and deployment

*Essential reading for frontend developers or anyone working on the UI components.*

### 🔧 [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md)
**Spring Boot Backend Technical Documentation**

Detailed technical documentation for the Spring Boot backend system, covering:
- REST API endpoint specifications and usage
- Service layer architecture and business logic
- Database integration and ORM configuration
- Excel file processing and validation logic
- Error handling and logging strategies
- Security and CORS configuration
- Maven build configuration and dependencies
- Production deployment considerations
- Integration with existing legacy code

*Critical documentation for backend developers and system administrators.*

## 🎯 Recent Major Updates

### v1.1 - Production Visualization & Multi-Page UI (Latest)
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
- **Angular 20**: Latest framework with standalone components
- **Angular Material**: Modern Material Design components
- **TypeScript**: Type-safe development environment
- **RxJS**: Reactive programming for API communication
- **SCSS**: Advanced styling with component encapsulation

### Backend
- **Spring Boot 3.2.2**: Enterprise-grade Java framework
- **Spring Data JPA**: Powerful ORM with PostgreSQL integration
- **Apache POI 4.1.1**: Excel file processing and validation
- **Maven**: Dependency management and build automation
- **Hibernate**: Advanced database operations and caching

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
java -jar target/solarman-ui-1.0.jar

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

**Latest Version**: 1.1 - Production Visualization & Multi-Page UI  
**Last Updated**: December 2025  
**Status**: Production Ready ✅

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
