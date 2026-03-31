# SolarManExcel2DB - API Reference

## 📚 Overview

This document covers the Web UI REST API (v1.5): HTTP endpoints for the Angular frontend.

---

## 🌐 Web UI REST API (Version 1.5)

### Base URL
- **Development**: `http://localhost:8080/api`
- **Production** (Kubernetes): `http://localhost:30080/api`

### Authentication
No authentication required (v1.5)

### Endpoints

#### Database Operations

##### `GET /api/database/status`
Check database connectivity and API status.

**Response**:
```json
{
  "connected": true,
  "message": "Database Connected",
  "apiStatus": "ready",
  "lastChecked": "2025-12-10T15:30:00"
}
```

##### `GET /api/database/latest-records`
Get timestamps of most recent imports.

**Response**:
```json
{
  "solarman": "2025-12-09T18:45:00",
  "tshwane": "2025-12-08T12:30:00"
}
```

##### `GET /api/database/production-stats?days=7` (NEW v1.1)
Get production statistics for last N days with time-weighted calculations.

**Query Parameters**:
- `days` (optional): Number of days to retrieve (default: 7)

**Response**:
```json
[
  {"date": "2025-12-09", "productionUnits": 11746.75},
  {"date": "2025-12-08", "productionUnits": 15621.25},
  {"date": "2025-12-07", "productionUnits": 17614.67}
]
```

**Calculation Method**: Time-weighted using LAG window function
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

#### File Operations

##### `POST /api/upload/{fileType}`
Upload and preview Excel file data.

**Path Parameters**:
- `fileType`: Either `solarman` or `tshwane`

**Request**: `multipart/form-data`
- `file`: Excel file (max 10MB)

**Response**: Array of preview records
```json
[
  {
    "Updated": "2025-12-09 14:30:00",
    "Production Power": 2500.5,
    "Consumption Power": 1800.2,
    ...
  }
]
```

##### `POST /api/import/{fileType}`
Import previewed data into database.

**Path Parameters**:
- `fileType`: Either `solarman` or `tshwane`

**Request Body**: Array of records from preview

**Response**:
```json
{
  "recordsInserted": 145,
  "recordsUpdated": 23,
  "firstRecordDate": "2025-12-01T00:00:00",
  "lastRecordDate": "2025-12-09T23:45:00",
  "errorCount": 0
}
```

### Error Responses

All endpoints return standard error format:
```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2025-12-10T15:30:00"
}
```

**Common Status Codes**:
- `200`: Success
- `400`: Bad request (invalid file, parameters)
- `500`: Server error (database connection, processing)
- `503`: Service unavailable (database down)

