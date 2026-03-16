# AGENTS.md - ChartAlchemy project Guide

## Project Overview

A web application that allows to visualize data with AI by writing a prompt or by uploading a dataset. There is also an ability to manually edit an already generated graph or build it from scratch using a convenient interface.

## Tech Stack

### Backend
 - Node.js(Fastify) + Typescript
 - Auth: JWT + OAuth 2.0
 - DB: PostgreSQL + Prisma
 - OpenAI/Gemini/... SDK
 - Test: Jest

### Frontend
 - TypeScript
 - React.js
 - TailwindCSS
 - Plotting Library: Apache ECharts

### Deploy
 - Docker
 - Heroku

## Quick Commands
```bash
npm run dev          # Start both backend & frontend web servers
```

## Project Structure

```
chart-alchemy/
├── package.json                # Root package (workspaces, shared scripts)
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   ├── prisma.config.ts
│   ├── postgres/
│   │   └── docker-compose.yml  # Local PostgreSQL via Docker
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── app.ts              # Fastify app setup
│       ├── server.ts           # Entry point
│       ├── commons/
│       │   ├── schemas/        # Zod request/env schemas
│       │   └── types/          # TypeScript type declarations
│       ├── controllers/        # Route handlers
│       ├── services/           # Business logic
│       ├── routes/             # Fastify route definitions
│       ├── plugins/            # Fastify plugins
│       ├── hooks/              # Fastify hooks
│       ├── jobs/               # Scheduled cleanup jobs
│       ├── utils/
│       └── generated/          # Prisma client output
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── components.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── index.css           # Global styles
│       ├── assets/             # Static images & icons
│       ├── commons/
│       │   ├── interfaces/     # TS interfaces
│       │   └── schemas/        # Zod validation schemas
│       ├── components/
│       │   ├── layout/         # Header, Footer, Logo
│       │   └── ui/             # Reusable UI components
│       ├── pages/
│       │   ├── home.tsx
│       │   ├── error.tsx
│       │   ├── loading.tsx
│       │   └── auth/           # Login, Signup, OAuth, Password reset
│       ├── services/           # API client & interceptors
│       └── lib/                # Fetch client, utils
```

## Code Style

### Backend
 - **Prettier**: Single quotes, avoid arrow parents

### Frontend
 - **ESLint**: eslint.config.js configuration file