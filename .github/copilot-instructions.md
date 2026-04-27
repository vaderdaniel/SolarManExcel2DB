# Copilot Instructions

## Architecture

Full-stack solar power data application: Excel files → PostgreSQL → Angular UI.

- **`backend/`** — Spring Boot 3.5 (Java 17) REST API on `:8080`. Raw JDBC against PostgreSQL. Serves the Angular build as static files in production.
- **`frontend/solarman-ui/`** — Angular 21 SPA on `:4200` (dev). Angular Material + Signals. Vitest unit tests + Playwright e2e.
- **`k8s/`** — Kubernetes manifests. Frontend exposed on NodePort 30080; nginx proxies `/api` to the backend ClusterIP service.
- **`grafana/`** — Dashboard JSON backups and datasource configs for the PostgreSQL Grafana instance.

**Production build flow:** `ng build` output is copied into `backend/src/main/resources/static/` so the Spring Boot JAR serves both the API and the static frontend. In dev, the Angular proxy config forwards `/api` calls to `:8080`.

**k8s startup order:** PostgreSQL → Backend (init container polls `postgres-service:5432`) → Frontend (init container polls `backend-service:8080`). Grafana also waits for PostgreSQL.

---

## Build & Test Commands

### Backend
```bash
cd backend
mvn spring-boot:run                                      # dev server on :8080
mvn test                                                 # all 56 tests
mvn test -Dtest=DatabaseServiceTest                      # single test class
mvn test -Dtest=DatabaseServiceTest#testMethodName       # single test method
mvn clean package                                        # build JAR
mvn verify                                               # build + Trivy security scan (fails on CRITICAL CVEs)
```

### Frontend
```bash
cd frontend/solarman-ui
npm start                                                # dev server on :4200
npx ng test --no-watch                                   # 31 unit tests (Vitest), exit when done
npx ng test                                              # watch mode
npx playwright test                                      # e2e (requires :4200 running)
npx ng build --configuration production --output-path=dist/solarman-ui
```

### Docker & Kubernetes
```bash
# Build images (use docker directly — nerdctl buildkit may not be running)
docker build -t solarman-backend:latest -f backend/Dockerfile .
docker build -t solarman-frontend:latest -f frontend/Dockerfile frontend/

# Rollout
kubectl rollout restart deployment/backend deployment/frontend -n default
kubectl rollout status deployment/backend deployment/frontend --timeout=120s
```

### Prerequisites
```bash
export DB_USER=your_db_user
export DB_PASSWORD=your_db_password
# PostgreSQL at localhost:5432, database: LOOTS
```

---

## Backend Conventions

- **Raw JDBC only** — `DataSource`, `Connection`, `PreparedStatement`, `ResultSet`. Never add Spring Data JPA repositories.
- **UPSERT pattern** — all inserts use `ON CONFLICT (updated) DO UPDATE SET ...` to handle re-imports safely.
- **`@Autowired` for DI** in service classes, not constructor injection.
- **`ImportResult`** is the standard return type for import operations (`recordsInserted`, `recordsUpdated`, `firstRecordDate`, `lastRecordDate`, error list).
- **Two data tables:** `public.loots_inverter` (SolarMan inverter) and `public.tshwane_electricity` (Tshwane utility). Each has its own model, controller, and service import path.
- **Production stats** use a time-weighted SQL query with `LAG` and `EXTRACT` window functions in `DatabaseService.getProductionStats()`.
- **Credentials via env vars** only — `${DB_USER:}` / `${DB_PASSWORD:}` in `application.properties`. Never hardcode.
- **Security scanning** — `mvn verify` runs Trivy on Maven deps, JAR, and Docker image. Standalone: `./security-scan.sh`. Reports in `backend/reports/`.

### Primary DB Schema
```sql
public.loots_inverter (
  updated TIMESTAMP PRIMARY KEY,
  production_power, consume_power, grid_power, purchase_power,
  feed_in, battery_power, charge_power, discharge_power, soc
  -- all DOUBLE PRECISION
)
```

---

## Frontend Conventions (Angular 21)

- **Standalone components only** — never use `NgModules`. Do NOT set `standalone: true` explicitly; it's the default.
- **`ChangeDetectionStrategy.OnPush`** on every component.
- **Signals for state** — `signal()`, `computed()`, `effect()`. Use `update()`/`set()`, never `mutate()`.
- **`inject()` over constructor injection** for services in components.
- **`input()` and `output()` functions** instead of `@Input()`/`@Output()` decorators.
- **Native control flow** — `@if`, `@for`, `@switch` in templates, not `*ngIf`/`*ngFor`/`*ngSwitch`.
- **`[class]` and `[style]` bindings** — never `ngClass` or `ngStyle`.
- **Host bindings** go inside the `host` object of `@Component`/`@Directive` — never use `@HostBinding`/`@HostListener` decorators.
- **`NgOptimizedImage`** for all static images (does not work for inline base64).
- **Reactive forms** over Template-driven forms.
- **`ChartRefreshService`** is the cross-component bus — call `triggerRefresh()` after a successful import; `ProductionChartComponent` subscribes to `refresh$` and reloads.
- **Routes** — `/` → `HomeComponent`, `/upload` → `UploadComponent`, defined in `app.config.ts`.

---

## Excel File Format

Both SolarMan and Tshwane imports require exactly **12 columns in fixed order**. Handled by `ExcelProcessingService`. Records before 2020-01-01 are filtered out.

---

## Known Gotchas

- **`npm install` not `npm ci`** in Dockerfiles and scripts — the lock file is generated with a newer npm than is available in the Node 22 Docker image, so `npm ci` fails on lock file mismatch.
- **nerdctl buildkit** may not be running in Rancher Desktop; use `docker` directly for image builds.
- **`jackson-core` 2.19.x** has an unfixed MEDIUM CVE — no fix available in the 2.19.x range managed by Spring Boot 3.5.x. Monitor for a future Spring Boot patch.

