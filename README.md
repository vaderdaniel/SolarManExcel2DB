# SolarManExcel2DB - Complete Web Application

[![Java](https://img.shields.io/badge/Java-11+-blue.svg)](https://www.oracle.com/java/)
[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-green.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue.svg)](https://www.postgresql.org/)

A modern web application for importing solar power generation data from SolarMan Excel exports into a PostgreSQL database. Features a complete full-stack implementation with Angular frontend and Spring Boot backend.

## 🏗️ Architecture Overview

```
┌─────────────────┐    REST API     ┌──────────────────┐    JDBC     ┌─────────────────┐
│   Angular 20    │◄────────────────►│   Spring Boot    │◄───────────►│   PostgreSQL    │
│     Frontend    │                  │     Backend      │             │    Database     │
│  (Port: 4200)   │                  │   (Port: 8080)   │             │   (Port: 5432)  │
└─────────────────┘                  └──────────────────┘             └─────────────────┘
```

## ✨ Key Features

- 🌐 **Modern Web UI**: Angular 20 with Material Design
- 📊 **Real-time Status**: Live database connectivity monitoring
- 📂 **File Upload**: Drag-and-drop Excel file processing
- 👀 **Data Preview**: Review data before importing
- 🚀 **Full File Import**: Processes thousands of records efficiently
- 📈 **Import Results**: Detailed statistics and error reporting
- 🔄 **Dual Support**: SolarMan and Tshwane electricity data formats
- 🛡️ **Data Validation**: Comprehensive file and data validation
- ⚡ **High Performance**: Optimized for large Excel files
- 🎯 **Production Ready**: Complete build and deployment pipeline

## 🚦 Quick Start

### Prerequisites
- Java 11 or higher
- Node.js 18+ and npm
- PostgreSQL database
- Maven 3.6+

### 1. Database Setup
```bash
# Start your PostgreSQL database
/Users/danieloots/LOOTS_PG/loots_pg.sh

# Set environment variables
export DB_USER=your_database_username
export DB_PASSWORD=your_database_password
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Build and run Spring Boot application
mvn spring-boot:run
# Backend runs on http://localhost:8080
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend/solarman-ui

# Install dependencies and start development server
npm install
npm start
# Frontend runs on http://localhost:4200
```

### 4. Access the Application
Open your browser to **http://localhost:4200** and start importing your Excel files!

## 📚 Documentation

This project includes comprehensive documentation organized into specialized files:

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

### v2.0 - Full-Stack Web Application (Latest)
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
- **PostgreSQL**: Robust relational database
- **Docker Ready**: Containerization support
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

## 🚀 Production Deployment

The application builds into a single executable JAR file containing both frontend and backend:

```bash
# Build production application
cd frontend/solarman-ui && npm run build
cd ../../backend && mvn clean package

# Deploy single JAR
java -jar target/solarman-ui-1.0.jar
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

**Latest Version**: 2.0 - Full-Stack Web Application  
**Last Updated**: October 2025  
**Status**: Production Ready ✅