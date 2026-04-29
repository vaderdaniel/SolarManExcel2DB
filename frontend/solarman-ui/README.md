# SolarMan UI — Angular Frontend

Version 1.7.0 · Angular 21.2 · Vitest

For full project documentation see **[AGENTS.md](../../AGENTS.md)** at the repository root.

---

## Quick Commands

```bash
npm start                   # dev server on :4200
npx ng test --no-watch      # unit tests (31 tests)
npx ng test                 # unit tests in watch mode
npx playwright test         # e2e tests (requires :4200 running)
npx ng build --configuration production --output-path=dist/solarman-ui
```

---

## Core Technologies

| Technology | Version |
|------------|---------|
| Angular | 21.2 |
| Angular Material | 21.x |
| TypeScript | 5.9.x |
| RxJS | 7.x |
| Vitest | 4.x |
| Playwright | (e2e) |

---

## Component Structure

```
src/app/
├── pages/
│   ├── home/            # HomeComponent — production chart + status panel
│   └── upload/          # UploadComponent — file selection → preview → import
├── components/
│   ├── production-chart/  # CSS bar chart, last 7 days, auto-refreshes on import
│   ├── status-panel/      # polls /api/database/status every 10 s
│   ├── file-upload/       # file picker, 10 MB limit, solarman | tshwane
│   ├── data-preview/      # paginated Material table, Confirm / Cancel
│   └── import-result/     # shows inserted/updated counts + date range
├── services/
│   ├── chart-refresh.service.ts  # cross-component Subject; call triggerRefresh() after import
│   ├── database.service.ts       # GET /api/database/status, /latest-records, /production-stats
│   ├── file-upload.service.ts    # POST /api/upload/{fileType}
│   └── import.service.ts         # POST /api/import/{fileType}
└── models/
    └── production-stat.model.ts  # { date: string; productionUnits: number }
```

---

## Angular Conventions

- **Standalone components only** — `NgModules` are never used. `standalone: true` is the default in Angular 21 and must not be set explicitly.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **Signals** for state — `signal()`, `computed()`, `effect()`; use `update()`/`set()`, never `mutate()`.
- **`inject()`** for DI in components (not constructor injection).
- **`input()` / `output()` functions** instead of `@Input()`/`@Output()` decorators.
- **Native control flow** — `@if`, `@for`, `@switch`; never `*ngIf`/`*ngFor`.
- **`[class]` / `[style]` bindings** — never `ngClass`/`ngStyle`.
- **Host bindings** inside the `host` object of `@Component` — never `@HostBinding`/`@HostListener`.
- **`NgOptimizedImage`** for static images (does not work for inline base64).
- **Reactive forms** over template-driven forms.

---

## Routing

| Path | Component |
|------|-----------|
| `/` | `HomeComponent` |
| `/upload` | `UploadComponent` |
| `**` | redirects to `/` |

Configured in `app.config.ts`.

---

## Cross-Component Chart Refresh

`ChartRefreshService` exposes a `refresh$` observable. Call `triggerRefresh()` after a successful import; `ProductionChartComponent` subscribes and reloads data from `/api/database/production-stats?days=7`.

---

## TypeScript Models

```typescript
// models/production-stat.model.ts
export interface ProductionStat {
  date: string;           // ISO date "YYYY-MM-DD"
  productionUnits: number; // Wh (time-weighted)
}

// Inline in services / components:
export interface DatabaseStatus {
  connected: boolean;
  message: string;
  apiStatus: 'ready' | 'unavailable';
  lastChecked: string;
}

export interface ImportResult {
  recordsInserted: number;
  recordsUpdated: number;
  firstRecordDate: string;
  lastRecordDate: string;
  errorCount: number;
  errors: string[];
}
```

---

## Test Documentation

See **[backend/src/test/README.md](../../backend/src/test/README.md)** for backend and frontend test docs.
