# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChartAlchemy is a full-stack web app for AI-powered data visualization. Users can generate charts via natural language prompts (Google Gemini), upload a CSV/XLSX dataset to have a chart built automatically, or build/edit charts manually. Authentication supports email/password and Google OAuth 2.0.

## Tech Stack

- **Backend**: Node.js + Fastify (TypeScript, ESM), PostgreSQL + Prisma ORM, Google Gemini API (`@google/genai`), JWT auth, Nodemailer, Zod + TypeBox validation
- **Frontend**: React 19, TailwindCSS v4, Apache ECharts, React Router v7, Vite 7, Radix UI (via shadcn), Motion
- **Testing**: Node.js native `node:test` + Supertest (backend only)
- **Deploy**: Frontend on Vercel (`frontend/vercel.json`), backend on Heroku. Docker Compose files (`docker-compose.yml` at root, `backend/postgres/docker-compose.yml`) are for local build/dev only, not production.

## Commands

```bash
# Root (npm workspaces — frontend + backend)
npm run dev              # Start both dev servers in parallel
npm run dev:test         # Same, but backend uses .env.test
npm run start            # Start backend (production)
npm run start:test       # Start backend with .env.test
npm run build            # Build frontend (tsc + vite) and backend (tsc)
npm run lint             # Lint both
npm run lint:fix         # Auto-fix ESLint in both
npm run format           # Prettier format (backend)
npm run format:check     # Check Prettier formatting (backend)
npm run test             # Run backend tests (uses .env.test)
npm run db:up            # Start Postgres via Docker + run migrations
npm run db:down          # Stop Postgres container

# Backend only (from backend/)
npm run dev              # nodemon watching src/ (runs tsx src/server.ts)
npm run start            # tsx src/server.ts
npm run test             # Node.js test runner with .env.test, --test-concurrency=1
npm run db:up            # docker compose up -d --wait + prisma migrate deploy + generate
npm run db:migrate       # prisma migrate deploy && prisma generate
npm run lint:fix         # Auto-fix ESLint

# Frontend only (from frontend/)
npm run dev              # Vite dev server on http://localhost:5173
npm run build            # tsc -b && vite build
npm run preview          # Vite preview build
```

To run a single backend test file:
```bash
cd backend && npx tsx --env-file=.env.test --test test/auth.test.ts
```

Local Postgres (only) via Docker:
```bash
cd backend/postgres && docker compose up -d
```

Full stack (db + backend + frontend + adminer) via Docker:
```bash
docker compose up -d
```

## Architecture

### Request flow (backend)
Routes (`routes/`) → Controllers (`controllers/`) → Services (`services/`) → Prisma

- **Routes** (`routes/`): `auth.routes.ts`, `oauth.routes.ts`, `chart.routes.ts`. Registered in `app.ts` with prefixes `auth`, `oauth/google`, `chart`. Apply rate-limit hooks and attach controller handlers. Dataset generation is exposed as `POST /chart/generate-from-dataset/:token` — accepts `multipart/form-data` with a `file` part (CSV or XLSX, max 5 MB) plus optional `chartType`, `xField`, and `yField` fields.
- **Controllers** (`controllers/`): `auth.controller.ts`, `oauth.controller.ts`, `chart.controller.ts`. Validate request body/params/query with Zod schemas via `utils/validateRequest.ts`, call services, return responses.
- **Services** (`services/`): Business logic only — no HTTP concerns. Includes `auth.service.ts`, `oauth.service.ts`, `chart.service.ts`, `gemini.service.ts`, `mail.service.ts`, plus token-specific services (`refreshToken.service.ts`, `activationToken.service.ts`). Dataset generation lives in `services/dataset/` — `index.ts` (orchestrator), `parseFile.ts` (CSV/XLSX → `ParsedDataset`), `inferFields.ts` (column type detection), `buildChartOption.ts` (ECharts option builder), and `parsers/` (format-specific parsers).
- **Plugins** (`plugins/`): `auth.plugin.ts` (JWT), `db.plugin.ts` (Prisma client), `gemini.plugin.ts` (Gemini SDK), `googleAuth.ts` (Google OAuth client).
- **Hooks** (`hooks/`): Custom rate limiting — `rateLimitByIp.ts`, `rateLimitByEmail.ts`.
- **Jobs** (`jobs/`): Scheduled cleanup (toad-scheduler via `@fastify/schedule`) for expired tokens — `clearExpiredActivationTokens.job.ts`, `clearExpiredRefreshTokens.job.ts`, `clearPasswordResetTokens.job.ts`. Registered on `app.ready`.
- **commons/schemas/**: Zod validation schemas shared across controllers (auth, chart config, prompts, env, dataset generation request, etc.).
- **commons/types/**: TypeScript type/interface declarations (Fastify augmentations, domain types — `error.d.ts`, `fastify.d.ts`, `googleResponse.d.ts`, `idToken.d.ts`, `pendingUser.d.ts`, `user.d.ts`, `dataset.d.ts`).
- **utils/**: Shared utilities — `validateRequest.ts` runs a Zod schema against `request.body | params | query` and throws a Fastify `badRequest` with `details`.
- **prompts/**: Gemini system instruction (`system-instruction.txt`) and `test-prompts.txt`.
- **generated/**: Prisma client output (`src/generated/prisma`, configured in `schema.prisma`).
- **Entry points**: `app.ts` builds the Fastify instance (env, plugins, routes, scheduler); `server.ts` starts the HTTP server. App-level error handler in `app.ts` masks 5xx messages as "Internal server error".

### Auth flow
- JWT access tokens (short-lived, in Authorization header) + refresh tokens (long-lived, in HttpOnly cookies)
- Separate service files for each token type: `refreshToken.service.ts`, `activationToken.service.ts`, `auth.service.ts`
- Password reset via email token: `resetPassword.schema.ts` + `clearPasswordResetTokens` job
- Google OAuth via ID token validation in `oauth.service.ts` + `googleAuth.ts` plugin

### Frontend structure
- **Pages** (`pages/`): Split into `auth/` (login, signup, activate-account, forgot-password, password-reset, google-login) and `chart/` (ai-chart, chart, manual-chart, new-chart, dataset-chart), plus root pages `home.tsx`, `dashboard.tsx`, `error.tsx`.
- **Components** (`components/`):
  - `layout/` — `header.tsx`, `header2.tsx`, `footer.tsx`, `logo.tsx`, `protected-route.tsx`
  - `ui/` — shadcn-style primitives (button, input, field, label, textarea, dropdown-menu, avatar, separator) plus app-specific UI (`chart-card`, `chart-options-showcase`, `confirm-dialog`, `dashboard-empty-state`, `dashboard-no-match-state`, `feature-image`, `workflow-choice-card`, `animated-group`, `text-effect`).
- **commons/**:
  - `schemas/` — Zod schemas (`authSchema.ts`, `chartConfig.schema.ts`, `promptSchema.ts`)
  - `interfaces/` — TS interfaces (`authInterfaces.ts`, `chartInterfaces.ts`, `fetchInterfaces.ts`); dataset-specific types (`DatasetChartType`, `DatasetField`, `DatasetGenerationResult`, `DatasetChartProps`) live in `chartInterfaces.ts`

### Frontend API client
`lib/fetchClient.ts` is a custom HTTP client with interceptors (`lib/interceptors.ts`) that automatically attach JWT tokens and handle 401 refresh via `lib/handleUnauthorized.ts`. Services in `services/` (`authService.ts`, `chartService.ts`, `googleAuthService.ts`) wrap the fetch client per domain. Other `lib/` helpers: `validateJWTToken.ts`, `parseChartToken.ts`, `parseManualChartState.ts`, `utils.ts` (Tailwind `cn`).

### Database schema highlights
- `Chart.token` — unique share/access token (UUID), separate from the primary `id`. Also stores `name`, `config` (JSON), `manualType` (nullable, set when chart was built via the manual editor), and `datasetMeta` (nullable JSON, stores field/type metadata from the last dataset upload).
- `PendingUser` — temporary record holding a hashed password during email-confirmation registration when the email already has a Google-OAuth-only account. Deleted on activation.
- `User.password` and `User.sub` are both nullable to support either email/password or Google OAuth (or both linked).
- All token tables (`RefreshToken`, `AccountActivationToken`, `ResetPasswordToken`) have `expiresAt` and are cleaned by scheduled jobs.
- Prisma client is generated to `backend/src/generated/prisma` (not `node_modules/@prisma/client`).

## Testing

- Tests live in `backend/test/`: `auth.test.ts`, `chart.test.ts`, `oauth.test.ts`, `dataset.test.ts`.
- Each test file runs `prisma migrate reset --force` in a `before()` hook — tests require a running test database configured in `.env.test`.
- Tests run with `--test-concurrency=1` (sequential) since they share the database.
- No frontend tests currently exist.

## Code Style

- **Backend**: Prettier with single quotes, no arrow-function parentheses
- **Frontend**: ESLint via `eslint.config.js`
- Both use TypeScript with ESM (`"type": "module"`)
- Path alias `@/*` → `src/*` in frontend
