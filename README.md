# ChartAlchemy - Web application for AI data visualization

<p align="center">
  <img src="assets/banner.svg" alt="ChartAlchemy" width="900"/>
</p>

---

**ChartAlchemy** is a web application for AI-powered data visualization. Three ways to create a chart:

- **Generate with AI** — describe your data in plain language and get a chart back, then refine it with follow-up prompts.
- **Generate from a dataset** — upload a CSV or XLSX file (up to 5 MB) and have the chart built from your data automatically. Switch between bar, line, pie, and scatter and review the detected fields in real time.
- **Build manually** — configure every chart field by hand and watch the chart update live.

Authentication supports email/password (with email confirmation) and Google sign-in.

## Installation

### Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose

### Install dependencies

Install all workspace dependencies from the repository root:

```bash
npm install
```

### Configure environment variables

Each package has an example env file listing the required variables:

- `backend/.env.example` — server config (database, JWT, SMTP, OAuth credentials, AI API key)
- `backend/.env.test.example` — test database config
- `frontend/.env.example` — API URLs for the Vite dev server

Create the env files before running the app:

```bash
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
cp frontend/.env.example frontend/.env
```

Then fill in the values before running.

## Running locally

**Option 1 — npm (recommended for development)**

Start Postgres and run backend migrations:

```bash
npm run db:up
```

Then start both the frontend and backend dev servers:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`.
The backend API will be available at `http://localhost:3000`.

### Running tests

Start the test database and make sure `backend/.env.test` points to it:

```bash
npm run db:up
npm test
```

Tests run against the backend workspace only.

**Option 2 — Docker Compose**

Starts the full stack (database, backend, frontend, and Adminer) in containers:

```bash
docker compose up -d
```

This exposes:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`
- Adminer: `http://localhost:8080`

## License

[MIT](LICENSE)
