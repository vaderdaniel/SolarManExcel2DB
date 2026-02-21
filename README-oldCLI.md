# SolarManExcel2DB - Legacy CLI Documentation

> **Note**: This document covers the original command-line interface. For the current Web UI (v1.5) with Angular frontend and production visualization, see [README.md](README.md) or [WARP.md](WARP.md).

A Java utility for importing solar power generation data from SolarMan Excel exports into a PostgreSQL database.

## Overview

This utility reads an Excel file exported from SolarMan solar power monitoring system and inserts the data into a PostgreSQL database table. It captures various metrics including:

- Production power
- Consumption power
- Grid power
- Purchase power
- Feed-in values
- Battery power
- Charging power
- Discharging power
- State of Charge (SoC)

The application validates the Excel file format and only processes data with timestamps after January 1, 2020.

## Prerequisites

- Java 17 or higher
- Maven
- PostgreSQL database (already set up with `/Users/danieloots/LOOTS_PG/loots_pg.sh`)
- Environment variables for database credentials:
  - `DB_USER`: PostgreSQL username
  - `DB_PASSWORD`: PostgreSQL password

## Database

This utility uses the existing `loots_inverter` table in the PostgreSQL database that is started with:
```
/Users/danieloots/LOOTS_PG/loots_pg.sh
```

The default connection string is:
```
jdbc:postgresql://localhost:5432/LOOTS
```

## Building

Build the application using Maven:

```bash
mvn clean package
```

This will create an executable JAR file with all dependencies included.

## Usage

1. Set the required environment variables:

```bash
export DB_USER=your_database_username
export DB_PASSWORD=your_database_password
```

2. Run the application with the path to your Excel file:

```bash
java -jar target/SolarManExcel2DB-1.0-jar-with-dependencies.jar /path/to/your/solarman_export.xlsx
```

## Configuration

The application connects to a PostgreSQL database at `jdbc:postgresql://localhost:5432/LOOTS`. If you need to change this, modify the `DB_URL` constant in the `SolarManExcel2DB.java` file and rebuild.