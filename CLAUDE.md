# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SolarManExcel2DB is a Java utility for importing solar power generation data from SolarMan Excel exports into a PostgreSQL database. The project includes two main Java classes:

- **SolarManExcel2DB**: Imports SolarMan solar monitoring system data into the `loots_inverter` table
- **TshwaneElectricityReader**: Imports electricity meter readings from Tshwane Excel files into the `tshwane_electricity` table

## Build Commands

**Build the application:**
```bash
mvn clean package
```

**Run the main SolarMan import utility:**
```bash
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar /path/to/solarman_export.xlsx
```

**Run the Tshwane electricity reader:**
```bash
java -cp target/SolarManExcel2DB-1.0-jar-with-dependencies.jar loots.jd.TshwaneElectricityReader [/path/to/tshwane_file.xlsx]
```

**Compile only:**
```bash
mvn compile
```

## Database Configuration

The application connects to PostgreSQL at `jdbc:postgresql://localhost:5432/LOOTS` using environment variables:
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password

Start the database with: `/Users/danieloots/LOOTS_PG/loots_pg.sh`

## Architecture

**Core Processing Flow:**
1. Excel file validation (column headers and format)
2. Row-by-row processing with data type conversion
3. Timestamp parsing with multiple format support
4. Database upsert operations with conflict resolution
5. Progress tracking and error reporting

**Key Utilities:**
- `parseTimestamp()`: Handles multiple date formats (yyyy/MM/dd, MM/dd/yyyy, SQL format)
- `getCellValueAsString()` / `getCellValueAsDouble()`: Safe Excel cell data extraction
- `upsertRow()`: Database insert/update with ON CONFLICT handling

**Database Tables:**
- `loots_inverter`: Solar power metrics with timestamp as primary key
- `tshwane_electricity`: Electricity readings with reading_date as primary key

**Data Filtering:**
- SolarManExcel2DB only processes records after 2020-01-01
- Both utilities use UPSERT patterns to handle duplicate timestamps

## Technology Stack

- **Java 11+** (configured in pom.xml)
- **Maven** for build management
- **Apache POI 4.1.1** for Excel file processing
- **PostgreSQL Driver 42.7.3** for database connectivity
- No testing framework currently configured

## Future Development Notes

The TECH_SPEC_UI.md file contains detailed specifications for a planned Spring Boot + Angular 20 web interface. The current command-line utilities are designed to be refactored into service classes for the web application.