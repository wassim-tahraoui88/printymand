# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

| Path | What it is |
| --- | --- |
| `frontend/` | Angular 21 SPA — **the working application**. All feature work happens here. |
| `backend/` | NestJS 11 + Postgres API — an incomplete scaffold (see "Backend state" below). |
| `new_report/` | LaTeX thesis (`main.tex`, `mainmatter/`, `figures/screenshots/`) documenting the project. |
| `Printymand_Website_New_Style/` | Static HTML/JSX design prototype. Not built, not imported — a visual reference only. |
| `.clone/`, `.claude/worktrees/` | Claude Code worktree scratch space. Never edit; not part of the app. |

Printymand is a Tunisian print-on-demand marketplace with four roles: **customer**, **designer**, **printer**, **admin**.

## Commands

Frontend (run from `frontend/`):

```bash
npm start
```

```bash
npm run build
```

```bash
npx ng test --watch=false
```

Single test file / single test name (the Angular `unit-test` builder runs Vitest in jsdom):

```bash
npx ng test --watch=false --include "src/app/models/order-status.spec.ts"
```

```bash
npx ng test --watch=false --filter "in flight"
```

The Browser-pane preview is preconfigured: `.claude/launch.json` defines `printymand-frontend` on port 4200. Use `preview_start` with that name rather than running the dev server through a shell.

Backend (run from `backend/`): `npm run dev` (watch), `npm run build`, `npm run start:prod`. `npm run lint` is broken — the script invokes ESLint but no `eslint.config.*` exists. `npm test` finds no specs (`backend/src` contains none).

## Backend state — read before touching it

The backend does **not** currently compile, and the app does not depend on it:

- `backend/node_modules` is stale relative to `package.json`; `pg` and `socket.io` are not installed. Run `npm install` in `backend/` first.
- Genuine type errors exist beyond the missing modules (e.g. `application/use-cases/{cart,users}/index.ts` re-export a non-existent `./refresh.use-case`; `get-product.use-case.ts` returns `{ user: ProductDto }` against a `UserDto` output type).
- `cart.controller.ts` and `users.controller.ts` are empty shells; `designs.controller.ts` declares `@Get()` twice, so the second route is unreachable.
- `backend/dist/` is a stale build from an unrelated version of the project (`firebase/`, `exporter/` directories). Ignore it.
- `frontend/src/app/services/api.service.ts` describes the *intended* API surface (orders, payouts, notifications, admin, moderation). Most of those endpoints do not exist server-side yet. Treat `api.service.ts` as the contract to build toward, not as a description of what runs.

## Frontend architecture

### PlatformStoreService is the application

`frontend/src/app/services/platform-store.service.ts` (~2100 lines) holds the entire domain — users, designs, products, printer offerings, cart, orders, reviews, payouts, notifications, moderation log, platform settings — in one `signal<PlatformState>`, exposes it through `computed` selectors, and persists to `localStorage` via an `effect` in the constructor. Business rules live here, not in components: rank thresholds (`designerLevelForScore`, `printerLevelForScore`), pricing margin/royalty (`DEFAULT_PLATFORM_SETTINGS`), payout terms, the order lifecycle. Pages are thin: they `inject(PlatformStoreService)` and read signals.

Consequences to respect:

- **Bump `STORAGE_KEY`** (currently `printymand_platform_state_v7`) whenever `PlatformState`'s shape changes incompatibly. `readState()` merges persisted state over seeded state by id — persisted entries always win, so a shape change without a version bump leaves users on broken data.
- `nextId` is reconciled against `highestUsedId()` on load; do not hand out ids by any other route than `takeNextId()`.
- Persistence can fail (uploaded artwork is inlined as data URLs and blows the ~5 MB quota). `storageWarning` surfaces that to the UI — keep it wired when touching persistence.

### Mock-first, backend-optional

`environment.useRealApi` decides whether HTTP is attempted at all. `tryApi()` returns `null` when the API is off or fails, and records the outcome in `backendMode`: `mock` (no API), `api` (last call succeeded), `hybrid` (API enabled but unreachable — serving local state). `syncApi()` mirrors a local mutation to the backend without blocking the UI. Dev config has `useRealApi: false`; prod (`environment.prod.ts`) has it `true`. `angular.json` performs the file replacement.

Every store mutation that has a backend counterpart should apply locally **and** call `tryApi`/`syncApi` — never one without the other.

Demo logins (from `data/mock.ts`, password `demo123` for all): `sami@printymand.tn` (customer), `amira@printymand.tn` (designer), `contact@printpro.tn` (printer), `nadia@printymand.tn` (admin).

### Services around the store

- `auth.service.ts` — session facade: who is signed in and edits to their *own* account. Admin actions on *other* users live on the store, deliberately.
- `api.service.ts` — thin HTTP client, no options per call; credentials are attached by `http-credentials.interceptor.ts`.
- `guards/auth-role.guard.ts` — `authRoleGuard(roles)` requires sign-in and role membership, and bounces unverified designers/printers to `/verification-pending`. Calling it with no arguments means "any signed-in user" and is only correct for genuinely shared pages.

### Routing and roles

All routes are children of `LayoutComponent` in `app.routes.ts`. Role restrictions live there, not in components, with the rationale in comments (e.g. `BUYER_ROLES` excludes printers because printers fulfil orders rather than buy). Each role has its own dashboard and profile route; `AuthService.dashboardMap` is the single place the role→home mapping is defined.

### Components and templates

Standalone components throughout, `inject()` over constructor injection, signals over RxJS for state. Pages live in `pages/` as `<name>.page.ts` + sibling `<name>.html` (`templateUrl`); small components keep inline templates. `frontend/src/app/models/types.ts` is the shared type vocabulary — extend it rather than declaring local shapes.

### Styling

One global stylesheet: `frontend/src/styles.css` (~1700 lines). It defines `--pm-*` design tokens, a dark theme under `[data-theme="dark"]`, and the semantic class layer (`pm-btn`, `pm-card`, `pm-status-*`, plus the editorial classes the home page uses). Tailwind v4 is available via `@import "tailwindcss"` and PostCSS.

No component has its own stylesheet except `app.ts`. **Add new styling as tokens and semantic classes in `styles.css`, and always define both themes.** Theme selection is a `signal` in `layout.component.ts` writing `document.documentElement.dataset['theme']` and `localStorage['pm-theme']`.

## Backend architecture (as designed)

Clean/hexagonal layering, one directory per layer under `backend/src`:

- `api/` — controllers, DTOs, guards, filters, interceptors, decorators. Controllers only translate HTTP to a use case.
- `application/use-cases/` — one class per operation implementing `UseCase<Input, Output>` with a single `execute()`.
- `domain/` — entities, value objects, policies, and **abstract repository classes** (`domain/repositories/*.repository.ts`) that double as DI tokens.
- `infrastructure/` — Postgres implementations of those repositories, auth (JWT), realtime (socket.io), health.
- `modules/` — the wiring: each feature module binds `{ provide: XRepository, useClass: PostgresXRepository }` and lists its use cases and controller.

Adding an endpoint means touching all five: repository interface → Postgres implementation (+ SQL in the sibling `queries.ts`) → use case → controller → module provider list.

Other conventions:

- **SQL is raw**, kept in `queries.ts` next to each repository; no ORM. `PostgresUtils.getFirst/getAll` unwrap `pg` results.
- **Migrations** are `src/infrastructure/persistence/postgres/migrations/YYYY.MM.DD-NN__name.sql`; create them with `new-migration.sh` in that directory, which derives the sequence number and `git add`s the file.
- **Errors**: throw `AppException(status, code, details)` where `code` is from the `ErrorCode` union in `shared/exceptions/error-code.d.ts`. Add new codes to that union rather than using bare strings.
- **Auth**: `JwtGuard` reads the `AUTH_TOKEN` cookie first, then `Authorization: Bearer`, checks a cache-backed blacklist, and populates `request.user: IPrincipal`. `RbacGuard` + `@Roles('DESIGNER')` gate by role; `ADMIN` bypasses all role checks.
- **Config**: `ConfigModule` loads `.env.${NODE_ENV}` (`development` when unset) — `backend/.env.{development,local,production}`. `npm run local` sets `NODE_ENV=local`, which is also what disables Postgres SSL.
- Routes are served under `/api` with URI versioning, default `v1` — a `@Controller('products')` is reachable at `/api/v1/products`. CORS is hardcoded to `http://localhost:4200` with credentials in `main.ts`.
- Global providers registered in `app.module.ts`: validation pipe, throttler guard (three named tiers configured from env), class serializer, logger interceptor, three exception filters.

## Ambient types

Both projects rely on ambient global types instead of imports: backend `src/shared/types/*.d.ts` (`IPrincipal`, `UUID`, Postgres/settings types) and the DTO declarations under `domain/dto/`. If a type appears undefined-but-used, look for a `.d.ts` before adding an import.
