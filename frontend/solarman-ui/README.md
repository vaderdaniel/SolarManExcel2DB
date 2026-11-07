# SolarMan UI — Angular Frontend

Version 2.0.2 · Angular 21.2 · Vitest

For full project documentation see **[AGENTS.md](../../AGENTS.md)** at the repository root.

---

## Quick Commands

```bash
npm start                   # dev server on :4200
npx ng test --no-watch      # unit tests (54 tests)
npx ng test                 # unit tests in watch mode
npx playwright test         # e2e tests (33 tests × 3 browsers; starts ng serve on :4200 if needed)
npm run build               # production build → dist/solarman-ui/browser
```

---

## Core Technologies

| Technology | Version |
|------------|---------|
| Angular | 21.2 |
| Angular Material | 21.x (preview table, paginator, snack bars only) |
| TypeScript | 5.9.x |
| RxJS | 7.x |
| Vitest | 4.x |
| Playwright | (e2e) |
| Fonts | Inter (body), Space Grotesk (headings), from Google Fonts |

---

## Component Structure

```
src/app/
├── pages/
│   ├── home/            # HomeComponent — "Energy overview": KPI cards, both charts, status strip
│   └── upload/          # UploadComponent — step indicator, Choose file → Review → Done (result shown inline)
├── components/
│   ├── _bar-chart.scss    # shared bar-chart styles (@use'd by both charts; host sets --bar-color)
│   ├── energy-summary/    # four KPI cards (signals); reloads on import
│   ├── production-chart/  # amber bars, last 7 days, best day highlighted, reloads on import
│   ├── tshwane-chart/     # blue bars, kWh/day since previous reading, latest highlighted, reloads on import
│   ├── status-panel/      # status strip; reads SystemStatusService
│   ├── file-upload/       # source radio cards, drop zone (#file-input), drag-and-drop, inline errors
│   └── data-preview/      # paginated Material table, "Import N records" / Back
├── services/
│   ├── chart-refresh.service.ts   # cross-component Subject; call triggerRefresh() after import
│   ├── system-status.service.ts   # app-wide 10 s poll of status + latest records (signals); started by App
│   ├── database.service.ts        # GET /api/database/status, /latest-records, /production-stats, /tshwane-usage
│   ├── file-upload.service.ts     # POST /api/upload/{fileType}
│   └── import.service.ts          # POST /api/import/{fileType}
└── models/
    ├── production-stat.model.ts    # { date: string; productionUnits: number }
    ├── tshwane-usage-stat.model.ts # { readingDate; previousReadingDate?; usageKwh; usageKwhPerDay? }
    ├── database-status.model.ts
    ├── import-result.model.ts
    ├── solar-record.model.ts
    └── tshwane-record.model.ts
```

---

## Angular Conventions

See **[AGENTS.md § Angular Conventions](../../AGENTS.md#angular-conventions-canonical--other-docs-link-here)** at the repository root for the canonical list (standalone components, signals, `inject()`, native control flow, etc.).

---

## Design System ("Daylight")

Global tokens and shared classes live in `src/styles.scss`:

| Token | Value | Use |
|-------|-------|-----|
| `--sm-bg` / `--sm-surface` | `#F3F5F7` / `#FFFFFF` | Page background / cards |
| `--sm-ink` / `--sm-muted` | `#15202B` / `#5B6672` | Text / secondary text |
| `--sm-solar` / `--sm-solar-strong` / `--sm-solar-ink` | `#F2A007` / `#C27C00` / `#8A5300` | Solar bars / highlighted bar / amber text |
| `--sm-grid` / `--sm-grid-ink` | `#2E6BD8` / `#2457B0` | Grid bars / blue text |
| `--sm-ok*` / `--sm-danger*` | greens / reds | Status dots, pills, errors |
| `--sm-font-display` / `--sm-font-body` | Space Grotesk / Inter | Headings / everything else |

Shared classes: `.sm-card`, `.sm-btn` + `.sm-btn--primary` / `.sm-btn--secondary`, `.sm-icon` (inline SVG stroke icons), `.sm-dot` (status dot), `.sm-visually-hidden`.

---

## Routing

| Path | Component | Nav label |
|------|-----------|-----------|
| `/` | `HomeComponent` | Overview |
| `/upload` | `UploadComponent` | Import data |
| `**` | redirects to `/` |

Configured in `app.config.ts`.

---

## Cross-Component Chart Refresh

`ChartRefreshService` exposes a `refresh$` observable. Call `triggerRefresh()` after a successful import; `ProductionChartComponent`, `TshwaneChartComponent` and `EnergySummaryComponent` reload from `/api/database/production-stats?days=7` and `/api/database/tshwane-usage`, and `SystemStatusService` re-checks the status and latest record times.

---

## TypeScript Models

```typescript
// models/production-stat.model.ts
export interface ProductionStat {
  date: string;           // ISO date "YYYY-MM-DD"
  productionUnits: number; // Wh (time-weighted)
}

// models/tshwane-usage-stat.model.ts
export interface TshwaneUsageStat {
  readingDate: string;                  // ISO datetime
  previousReadingDate?: string | null;  // the reading before this one
  usageKwh: number;                     // kWh consumed since the previous reading
  usageKwhPerDay?: number | null;       // usageKwh ÷ days since the previous reading (charted)
}

// models/database-status.model.ts (also exports LatestRecords, DatabaseCredentials)
export interface DatabaseStatus {
  connected: boolean;
  message: string;
  apiStatus: 'ready' | 'unavailable';
  lastChecked?: Date;
}

// models/import-result.model.ts
export interface ImportResult {
  recordsInserted: number;
  recordsUpdated: number;
  firstRecordDate: Date;
  lastRecordDate: Date;
  errorCount: number;
  errors: string[];
  success: boolean;   // not sent by the backend
  message?: string;
}
```

---

## Test Documentation

See **[backend/src/test/README.md](../../backend/src/test/README.md)** for backend and frontend test docs.
