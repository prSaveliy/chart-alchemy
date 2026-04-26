# ChartAlchemy - Web application for AI data visualization

<p align="center">
  <img src="assets/banner.svg" alt="ChartAlchemy" width="900"/>
</p>

---

**ChartAlchemy** is a web application for AI-powered data visualization. Describe your data in plain language and get a chart back — or build and edit charts manually with a full configuration editor.

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
