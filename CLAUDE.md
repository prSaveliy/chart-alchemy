# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChartAlchemy is a full-stack web app for AI-powered data visualization. Users can generate charts via natural language prompts (Google Gemini) or build/edit charts manually. Authentication supports email/password and Google OAuth 2.0.

## Tech Stack

- **Backend**: Node.js + Fastify (TypeScript, ESM), PostgreSQL + Prisma ORM, Google Gemini API (`@google/genai`), JWT auth, Nodemailer, Zod + TypeBox validation
- **Frontend**: React 19, TailwindCSS v4, Apache ECharts, React Router v7, Vite 7, Radix UI (via shadcn), Motion
- **Testing**: Node.js native `node:test` + Supertest (backend only)
- **Deploy**: Docker (local Postgres), Heroku

## Commands

```bash
# Root (runs both frontend & backend)
npm run dev              # Start both dev servers
npm run dev:test         # Start both dev servers using test env (backend)
npm run build            # Build frontend (tsc + vite) and backend (tsc)
npm run lint             # Lint both
npm run lint:fix         # Auto-fix ESLint in both
npm run format           # Prettier format (backend)
npm run format:check     # Check Prettier formatting (backend)
npm run test             # Run backend tests (uses .env.test)

# Backend only (from backend/)
npm run dev              # nodemon watching src/
npm run test             # Node.js test runner with .env.test
npm run lint:fix         # Auto-fix ESLint

# Frontend only (from frontend/)
npm run dev              # Vite dev server on http://localhost:5173
npm run build            # tsc -b && vite build
```

To run a single backend test file:
```bash
cd backend && node --import tsx --test test/auth.test.ts
```

Local Postgres via Docker:
```bash
cd backend/postgres && docker compose up -d
```

## Architecture

### Request flow (backend)
Routes (`routes/`) → Controllers (`controllers/`) → Services (`services/`) → Prisma

- **Routes**: Define paths, apply rate-limit hooks, attach controller handlers
- **Controllers**: Validate request body with Zod schemas (`commons/schemas/`), call services, return responses
- **Services**: Business logic only — no HTTP concerns
- **Plugins** (`plugins/`): Fastify plugins for JWT auth, Prisma client, and Gemini setup
- **Hooks** (`hooks/`): Custom rate limiting per IP or email
- **Jobs** (`jobs/`): Scheduled cleanup tasks (toad-scheduler) for expired tokens, registered on `app.ready`
- **commons/schemas/**: Zod validation schemas shared across controllers
- **commons/types/**: TypeScript type/interface declarations (Fastify augmentations, domain types)
- **utils/**: Shared utilities (e.g., `validateSchema.ts`)
- **prompts/**: Gemini system instruction and test prompt files
- **Entry points**: `app.ts` builds the Fastify instance; `server.ts` starts the HTTP server

### Auth flow
- JWT access tokens (short-lived, in Authorization header) + refresh tokens (long-lived, in HttpOnly cookies)
- Separate service files for each token type: `refreshToken.service.ts`, `activationToken.service.ts`, `auth.service.ts`
- Password reset via email token: `resetPassword` schema + `clearPasswordResetTokens` job
- Google OAuth via ID token validation in `oauth.service.ts`

### Frontend structure
- **Pages** (`pages/`): Split into `auth/` (login, signup, activate-account, forgot-password, password-reset, google-login) and `chart/` (ai-chart, chart, manual-chart, new-chart), plus root pages (home, error, loading)
- **Components** (`components/`): `layout/` (header, footer, logo, protected-route) and `ui/` (shadcn-style primitives: button, input, field, textarea, dropdown-menu, avatar, etc.)
- **commons/schemas/**: Zod schemas for auth and chart forms

### Frontend API client
`lib/fetchClient.ts` is a custom HTTP client with interceptors (`lib/interceptors.ts`) that automatically attach JWT tokens and handle 401 refresh. Services in `services/` wrap the fetch client per domain (auth, chart, googleAuth).

### Database schema highlights
- `Chart.token` — unique share/access token (UUID), separate from the primary `id`
- `PendingUser` — temporary record during OAuth email confirmation, deleted on activation
- All token tables (`RefreshToken`, `AccountActivationToken`, `ResetPasswordToken`) have `expiresAt` and are cleaned by scheduled jobs

## Testing

- Tests live in `backend/test/`
- Currently one test file: `auth.test.ts`
- Each test file runs `prisma migrate reset --force` in a `before()` hook — tests require a running test database configured in `.env.test`
- No frontend tests currently exist

## Code Style

- **Backend**: Prettier with single quotes, no arrow-function parentheses
- **Frontend**: ESLint via `eslint.config.js`
- Both use TypeScript with ESM (`"type": "module"`)
- Path alias `@/*` → `src/*` in frontend
