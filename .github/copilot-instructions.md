# Copilot Instructions

Full project documentation — architecture, build/test commands, backend and frontend conventions, REST API reference, database schema, Excel file format, deployment workflow, and troubleshooting (including the `npm ci`/nerdctl/jackson-core gotchas) — lives in **[AGENTS.md](../AGENTS.md)** at the repository root. Read that file first; it is the single source of truth this file summarizes.

## Quick Orientation

Full-stack solar power data application: Excel files → PostgreSQL → Angular UI.

- **`backend/`** — Spring Boot 3.5 (Java 17) REST API on `:8080`. Raw JDBC against PostgreSQL — no Spring Data JPA repositories. Serves the Angular build as static files in production.
- **`frontend/solarman-ui/`** — Angular 21 SPA on `:4200` (dev). Angular Material + Signals. Vitest unit tests + Playwright e2e. See `frontend/solarman-ui/.github/copilot-instructions.md` for Angular-specific conventions.
- **`k8s/`** — Kubernetes manifests. Frontend exposed on NodePort 30080; nginx proxies `/api` to the backend ClusterIP service.
- **`grafana/`** — Dashboard JSON backups and datasource configs for the PostgreSQL Grafana instance.

## Most-Used Commands

```bash
cd backend && mvn spring-boot:run                 # dev server on :8080
cd backend && mvn test                            # all 61 tests
cd frontend/solarman-ui && npm start              # dev server on :4200
cd frontend/solarman-ui && npx ng test --no-watch # 42 unit tests (Vitest)
```

See AGENTS.md's "Quick Start" and "Build & Test Commands" for the full set, including Docker/Kubernetes builds and rollouts.
