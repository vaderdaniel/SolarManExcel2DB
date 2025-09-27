# SolarManExcel2DB UI - Technical Specification

## 📋 Project Overview

**Project Name**: SolarManExcel2DB Web UI  
**Version**: 1.0.0 (MVP1)  
**Architecture**: Separate frontend/backend projects with REST API communication  
**Frontend**: Angular 20 with Angular Material  
**Backend**: Spring Boot 3.x with embedded Tomcat  
**Database**: PostgreSQL  
**Build Tools**: Maven (backend) + Angular CLI (frontend)  

---

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    HTTP/REST     ┌──────────────────┐    JDBC     ┌─────────────────┐
│   Angular 20    │◄────────────────►│   Spring Boot    │◄───────────►│   PostgreSQL    │
│     Frontend    │                  │     Backend      │             │    Database     │
│  (Port: 4200)   │                  │   (Port: 8080)   │             │   (Port: 5432)  │
└─────────────────┘                  └──────────────────┘             └─────────────────┘
```

### Project Structure
```
SolarManExcel2DB/
├── backend/                          # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/loots/solarmanui/
│   │       ├── SolarManUiApplication.java
│   │       ├── controller/
│   │       │   ├── FileUploadController.java
│   │       │   ├── DatabaseController.java
│   │       │   └── ImportController.java
│   │       ├── service/
│   │       │   ├── ExcelProcessingService.java
│   │       │   ├── DatabaseService.java
│   │       │   └── ImportService.java
│   │       ├── model/
│   │       │   ├── ImportResult.java
│   │       │   ├── DatabaseStatus.java
│   │       │   ├── SolarManRecord.java
│   │       │   └── TshwaneRecord.java
│   │       └── config/
│   │           └── WebConfig.java
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── static/                   # Angular build output
│   └── pom.xml
├── frontend/                         # Angular Frontend
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── file-upload/
│   │   │   ├── data-preview/
│   │   │   ├── status-panel/
│   │   │   └── import-result/
│   │   ├── services/
│   │   │   ├── file-upload.service.ts
│   │   │   ├── database.service.ts
│   │   │   └── import.service.ts
│   │   ├── models/
│   │   └── app.component.ts
│   ├── angular.json
│   ├── package.json
│   └── dist/                         # Build output (copied to backend/static)
├── pom.xml                          # Root Maven configuration
└── README_UI.md                     # UI-specific documentation
```

---

## 🎨 Frontend Specification (Angular 20)

### Core Technologies
- **Angular**: 20.x
- **Angular Material**: Latest compatible version
- **TypeScript**: 5.x
- **Angular CLI**: 20.x
- **RxJS**: 8.x

### UI Components

#### 1. Main Application Layout
```typescript
// app.component.ts
export class AppComponent {
  title = 'SolarMan Excel Import';
}
```

**Layout Structure**:
```html
<mat-toolbar>
  <span>SolarMan Excel Import</span>
</mat-toolbar>

<div class="main-container">
  <app-status-panel></app-status-panel>
  <app-file-upload></app-file-upload>
  <app-data-preview *ngIf="showPreview"></app-data-preview>
  <app-import-result *ngIf="showResult"></app-import-result>
</div>
```

#### 2. Status Panel Component
```typescript
// components/status-panel/status-panel.component.ts
export class StatusPanelComponent implements OnInit, OnDestroy {
  databaseStatus: DatabaseStatus;
  apiStatus: string;
  latestSolarManRecord: Date;
  latestTshwaneRecord: Date;
  private statusInterval: any;

  ngOnInit() {
    this.checkStatus();
    this.statusInterval = setInterval(() => this.checkStatus(), 10000);
  }

  checkStatus() {
    // Poll database and API status every 10 seconds
  }
}
```

**Status Panel UI**:
- **API Status**: Color-coded text (Green: "API Ready", Red: "API Unavailable")
- **Database Status**: Color-coded text (Green: "Database Connected", Red: "Database Disconnected")
- **Latest Records**: Display timestamps for last SolarMan and Tshwane imports

#### 3. File Upload Component
```typescript
// components/file-upload/file-upload.component.ts
export class FileUploadComponent {
  selectedFile: File | null = null;
  fileType: 'solarman' | 'tshwane' | null = null;
  maxFileSize = 10 * 1024 * 1024; // 10MB

  onFileSelected(event: any) {
    // Handle file selection with validation
  }

  uploadFile() {
    // Upload file and trigger preview
  }
}
```

**File Upload UI**:
- Two separate file pickers: "Upload SolarMan Excel" and "Upload Tshwane Excel"
- File validation (Excel format, 10MB limit)
- Simple upload button

#### 4. Data Preview Component
```typescript
// components/data-preview/data-preview.component.ts
export class DataPreviewComponent {
  previewData: any[] = [];
  displayedColumns: string[] = [];
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  confirmImport() {
    // Trigger actual database import
  }

  cancelImport() {
    // Clear preview and return to upload
  }
}
```

**Data Preview UI**:
- Material Data Table with pagination
- "Confirm Import" and "Cancel" buttons
- Column headers based on file type

#### 5. Import Result Component
```typescript
// components/import-result/import-result.component.ts
export class ImportResultComponent {
  importResult: ImportResult;

  viewErrorLogs() {
    // Display error logs in dialog
  }
}
```

**Import Result UI**:
- Display: Records inserted, Records updated, Date range of imported data
- "View Error Logs" button (opens Material Dialog)
- "Import Another File" button

### Angular Services

#### 1. File Upload Service
```typescript
// services/file-upload.service.ts
@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private baseUrl = 'http://localhost:8080/api';

  uploadFile(file: File, fileType: string): Observable<any[]> {
    // POST /api/upload/{fileType}
  }

  validateFile(file: File): boolean {
    // Validate file size and format
  }
}
```

#### 2. Database Service
```typescript
// services/database.service.ts
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  checkStatus(): Observable<DatabaseStatus> {
    // GET /api/database/status
  }

  getLatestRecords(): Observable<{solarman: Date, tshwane: Date}> {
    // GET /api/database/latest-records
  }
}
```

#### 3. Import Service
```typescript
// services/import.service.ts
@Injectable({ providedIn: 'root' })
export class ImportService {
  importData(fileType: string, data: any[]): Observable<ImportResult> {
    // POST /api/import/{fileType}
  }

  getErrorLogs(): Observable<string[]> {
    // GET /api/import/error-logs
  }
}
```

### Models
```typescript
// models/database-status.model.ts
export interface DatabaseStatus {
  connected: boolean;
  message: string;
  apiStatus: 'ready' | 'unavailable';
}

// models/import-result.model.ts
export interface ImportResult {
  recordsInserted: number;
  recordsUpdated: number;
  firstRecordDate: Date;
  lastRecordDate: Date;
  errorCount: number;
  errors: string[];
}

// models/solar-record.model.ts
export interface SolarManRecord {
  updated: Date;
  productionPower: number;
  consumePower: number;
  gridPower: number;
  purchasePower: number;
  feedIn: number;
  batteryPower: number;
  chargePower: number;
  dischargePower: number;
  soc: number;
}

// models/tshwane-record.model.ts
export interface TshwaneRecord {
  readingDate: Date;
  readingValue: number;
  readingAmount: number;
  readingNotes: string;
}
```

---

## ⚙️ Backend Specification (Spring Boot)

### Core Technologies
- **Spring Boot**: 3.2.x
- **Spring Web**: REST API endpoints
- **Spring Data JPA**: Database operations
- **Apache POI**: Excel file processing
- **PostgreSQL Driver**: 42.7.x
- **Maven**: 3.9.x

### REST API Endpoints

#### 1. File Upload Controller
```java
// controller/FileUploadController.java
@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "http://localhost:4200")
public class FileUploadController {
    
    @PostMapping("/{fileType}")
    public ResponseEntity<List<Map<String, Object>>> uploadFile(
            @PathVariable String fileType,
            @RequestParam("file") MultipartFile file) {
        // Process Excel file and return preview data
    }
}
```

**Endpoints**:
- `POST /api/upload/solarman` - Upload SolarMan Excel file
- `POST /api/upload/tshwane` - Upload Tshwane Excel file

#### 2. Database Controller
```java
// controller/DatabaseController.java
@RestController
@RequestMapping("/api/database")
@CrossOrigin(origins = "http://localhost:4200")
public class DatabaseController {
    
    @GetMapping("/status")
    public ResponseEntity<DatabaseStatus> getDatabaseStatus() {
        // Check database connection and API status
    }
    
    @GetMapping("/latest-records")
    public ResponseEntity<LatestRecords> getLatestRecords() {
        // Get latest import timestamps
    }
    
    @PostMapping("/configure")
    public ResponseEntity<DatabaseStatus> configureDatabaseCredentials(
            @RequestBody DatabaseCredentials credentials) {
        // Handle database credential configuration
    }
}
```

**Endpoints**:
- `GET /api/database/status` - Check database connectivity
- `GET /api/database/latest-records` - Get latest record timestamps
- `POST /api/database/configure` - Configure database credentials (if env vars not set)

#### 3. Import Controller
```java
// controller/ImportController.java
@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "http://localhost:4200")
public class ImportController {
    
    @PostMapping("/{fileType}")
    public ResponseEntity<ImportResult> importData(
            @PathVariable String fileType,
            @RequestBody List<Map<String, Object>> data) {
        // Import data to database and return results
    }
    
    @GetMapping("/error-logs")
    public ResponseEntity<List<String>> getErrorLogs() {
        // Return recent error logs
    }
}
```

**Endpoints**:
- `POST /api/import/solarman` - Import SolarMan data to database
- `POST /api/import/tshwane` - Import Tshwane data to database
- `GET /api/import/error-logs` - Get error logs from recent imports

### Service Layer

#### 1. Excel Processing Service
```java
// service/ExcelProcessingService.java
@Service
public class ExcelProcessingService {
    
    public List<SolarManRecord> processSolarManFile(MultipartFile file) throws IOException {
        // Refactored from existing SolarManExcel2DB.java
        // Parse Excel file and return list of records
    }
    
    public List<TshwaneRecord> processTshwaneFile(MultipartFile file) throws IOException {
        // Refactored from existing TshwaneElectricityReader.java
        // Parse Excel file and return list of records
    }
    
    private boolean validateFileFormat(MultipartFile file, String expectedType) {
        // Validate Excel file format
    }
}
```

#### 2. Database Service
```java
// service/DatabaseService.java
@Service
public class DatabaseService {
    
    @Autowired
    private DataSource dataSource;
    
    public DatabaseStatus checkDatabaseConnection() {
        // Test database connectivity
    }
    
    public LatestRecords getLatestRecordTimestamps() {
        // Query for latest import timestamps
    }
    
    public boolean testCredentials(String username, String password) {
        // Test database credentials
    }
}
```

#### 3. Import Service
```java
// service/ImportService.java
@Service
public class ImportService {
    
    public ImportResult importSolarManData(List<SolarManRecord> records) {
        // Refactored UPSERT logic from existing code
        // Insert/update records in loots_inverter table
    }
    
    public ImportResult importTshwaneData(List<TshwaneRecord> records) {
        // Insert/update records in tshwane_electricity table
    }
    
    private void logError(String message, Exception e) {
        // Log errors for later retrieval
    }
}
```

### Model Classes

#### 1. Database Status Model
```java
// model/DatabaseStatus.java
public class DatabaseStatus {
    private boolean connected;
    private String message;
    private String apiStatus;
    private LocalDateTime lastChecked;
    
    // Constructors, getters, setters
}
```

#### 2. Import Result Model
```java
// model/ImportResult.java
public class ImportResult {
    private int recordsInserted;
    private int recordsUpdated;
    private LocalDateTime firstRecordDate;
    private LocalDateTime lastRecordDate;
    private int errorCount;
    private List<String> errors;
    
    // Constructors, getters, setters
}
```

#### 3. Data Models
```java
// model/SolarManRecord.java
@Entity
@Table(name = "loots_inverter")
public class SolarManRecord {
    @Id
    private LocalDateTime updated;
    private Double productionPower;
    private Double consumePower;
    // ... other fields matching existing table schema
}

// model/TshwaneRecord.java
@Entity
@Table(name = "tshwane_electricity")
public class TshwaneRecord {
    @Id
    private LocalDateTime readingDate;
    private Double readingValue;
    private Double readingAmount;
    private String readingNotes;
    
    // Constructors, getters, setters
}
```

### Configuration

#### 1. Application Properties
```properties
# application.properties
server.port=8080
spring.application.name=solarman-ui

# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Database Configuration (with environment variable fallback)
spring.datasource.url=jdbc:postgresql://localhost:5432/LOOTS
spring.datasource.username=${DB_USER:}
spring.datasource.password=${DB_PASSWORD:}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=false

# Static Content (Angular build output)
spring.web.resources.static-locations=classpath:/static/
```

#### 2. Web Configuration
```java
// config/WebConfig.java
@Configuration
public class WebConfig {
    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:4200")
                        .allowedMethods("GET", "POST", "PUT", "DELETE");
            }
        };
    }
}
```

---

## 🔧 Build Configuration

### Root Maven POM (pom.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.loots</groupId>
    <artifactId>solarman-ui-parent</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    
    <modules>
        <module>backend</module>
    </modules>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <build>
        <plugins>
            <!-- Frontend Maven Plugin for Angular build -->
            <plugin>
                <groupId>com.github.eirslett</groupId>
                <artifactId>frontend-maven-plugin</artifactId>
                <version>1.13.4</version>
                <configuration>
                    <workingDirectory>frontend</workingDirectory>
                    <installDirectory>target</installDirectory>
                </configuration>
                <executions>
                    <execution>
                        <id>install node and npm</id>
                        <goals>
                            <goal>install-node-and-npm</goal>
                        </goals>
                        <configuration>
                            <nodeVersion>v20.11.0</nodeVersion>
                            <npmVersion>10.2.4</npmVersion>
                        </configuration>
                    </execution>
                    <execution>
                        <id>npm install</id>
                        <goals>
                            <goal>npm</goal>
                        </goals>
                        <configuration>
                            <arguments>install</arguments>
                        </configuration>
                    </execution>
                    <execution>
                        <id>npm run build</id>
                        <goals>
                            <goal>npm</goal>
                        </goals>
                        <configuration>
                            <arguments>run build</arguments>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### Backend Maven POM
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.2</version>
        <relativePath/>
    </parent>
    
    <groupId>com.loots</groupId>
    <artifactId>solarman-ui-backend</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>4.1.1</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            
            <!-- Copy Angular build output to static resources -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <executions>
                    <execution>
                        <id>copy-angular-build</id>
                        <phase>process-resources</phase>
                        <goals>
                            <goal>copy-resources</goal>
                        </goals>
                        <configuration>
                            <outputDirectory>${basedir}/src/main/resources/static</outputDirectory>
                            <resources>
                                <resource>
                                    <directory>../frontend/dist/solarman-ui</directory>
                                </resource>
                            </resources>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### Angular Configuration

#### Package.json
```json
{
  "name": "solarman-ui",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build --configuration production --output-path=dist/solarman-ui",
    "test": "ng test",
    "lint": "ng lint"
  },
  "dependencies": {
    "@angular/animations": "^20.0.0",
    "@angular/cdk": "^20.0.0",
    "@angular/common": "^20.0.0",
    "@angular/compiler": "^20.0.0",
    "@angular/core": "^20.0.0",
    "@angular/forms": "^20.0.0",
    "@angular/material": "^20.0.0",
    "@angular/platform-browser": "^20.0.0",
    "@angular/platform-browser-dynamic": "^20.0.0",
    "@angular/router": "^20.0.0",
    "rxjs": "~8.0.0",
    "tslib": "^2.6.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^20.0.0",
    "@angular/cli": "^20.0.0",
    "@angular/compiler-cli": "^20.0.0",
    "typescript": "~5.6.0"
  }
}
```

---

## 🚀 Development Workflow

### 1. Initial Setup
```bash
# 1. Create project structure
mkdir -p backend/src/main/java/com/loots/solarmanui
mkdir -p frontend/src/app

# 2. Initialize Angular project
cd frontend
npx @angular/cli@20 new solarman-ui --routing=false --style=scss
cd ..

# 3. Set up Spring Boot backend
# Create Spring Boot application using Spring Initializr
```

### 2. Development Process
```bash
# Backend development (Terminal 1)
cd backend
mvn spring-boot:run

# Frontend development (Terminal 2)
cd frontend
ng serve

# Access application
# Frontend: http://localhost:4200 (development)
# Backend API: http://localhost:8080/api
# Production: http://localhost:8080 (serves Angular app)
```

### 3. Build Process
```bash
# Full build (builds Angular and packages with Spring Boot)
mvn clean package

# This will:
# 1. Build Angular application (production build)
# 2. Copy Angular build output to Spring Boot static resources
# 3. Package Spring Boot JAR with embedded Angular app
```

---

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Angular components and services using Jasmine/Karma
- **Integration Tests**: HTTP service communication with backend APIs
- **Manual Testing**: UI functionality and file upload workflows

### Backend Testing
- **Unit Tests**: Service layer business logic using JUnit 5
- **Integration Tests**: REST API endpoints using @SpringBootTest
- **Database Tests**: Repository layer using @DataJpaTest

---

## 📝 Error Handling

### Frontend Error Handling
```typescript
// Global error handling
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Global error:', error);
    // Show toast notification
  }
}
```

### Backend Error Handling
```java
// Global exception handler
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<ErrorResponse> handleFileUploadError(FileUploadException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }
    
    @ExceptionHandler(DatabaseConnectionException.class)
    public ResponseEntity<ErrorResponse> handleDatabaseError(DatabaseConnectionException e) {
        return ResponseEntity.status(503).body(new ErrorResponse(e.getMessage()));
    }
}
```

---

## 📋 MVP1 Features Checklist

### Core Features
- [ ] File upload functionality (SolarMan and Tshwane Excel files)
- [ ] Excel data preview with pagination
- [ ] Database connection status monitoring (10-second polling)
- [ ] Import data confirmation and execution
- [ ] Import results display (records inserted/updated, date range)
- [ ] Error log viewing capability
- [ ] Database credential configuration (when env vars not available)

### Technical Requirements
- [ ] Angular 20 with Angular Material UI
- [ ] Spring Boot REST API backend
- [ ] File size limit enforcement (10MB)
- [ ] Toast notifications for validation errors
- [ ] Color-coded status indicators
- [ ] Responsive single-page application
- [ ] Manual refresh for Angular development
- [ ] Maven build integration

### Non-Functional Requirements
- [ ] No authentication required
- [ ] Embedded Tomcat on port 8080
- [ ] CORS configuration for development
- [ ] Microservices-ready architecture
- [ ] Configuration file support
- [ ] Environment variable integration

---

## 🎯 Success Criteria

1. **User can successfully upload and import SolarMan Excel files**
2. **User can successfully upload and import Tshwane Excel files**
3. **Database connectivity status is clearly visible and updates every 10 seconds**
4. **Data preview shows accurate Excel content before import**
5. **Import results provide clear feedback on success/failure**
6. **Error handling provides user-friendly feedback**
7. **Application handles database credential configuration gracefully**
8. **Single JAR deployment serves both API and UI**

---

This technical specification provides a complete blueprint for developing the SolarManExcel2DB UI application. The specification is designed to be AI-agent friendly with clear structure, detailed implementation guidance, and specific technical requirements.