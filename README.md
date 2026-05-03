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

## Environment variables

Each package has an `.env.example` file listing the required variables:

- `backend/.env.example` — server config (database, JWT, SMTP, OAuth credentials, AI API key)
- `backend/.env.test.example` — test database config
- `frontend/.env.example` — API URLs for the Vite dev server

Copy each example to a `.env` file in the same directory and fill in the values before running.

## Running locally

**Option 1 — npm (recommended for development)**

Requires Node.js and a running PostgreSQL instance. Start Postgres and run migrations first:

```bash
npm run db:up
```

Then start both the frontend and backend dev servers:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`.

**Option 2 — Docker Compose**

Starts the full stack (database, backend, frontend, and Adminer) in containers:

```bash
docker compose up -d
```

## License

[MIT](LICENSE)
