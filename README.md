# Personal Finance Tracker

Full-stack app for tracking expenses and income, budgets, recurring bills, spending insights, and an AI assistant.

**Stack:** React + TypeScript · Node.js + Express + TypeScript · PostgreSQL + Prisma · Zod · AWS

> Status: Milestone 2 (database schema) complete.

## Prerequisites

- Node.js 22.12 or newer
- Docker Desktop (for the local PostgreSQL database)

## Getting started

```bash
# 1. Start PostgreSQL (from the project root)
docker compose up -d

# 2. Install backend dependencies
cd server
npm install

# 3. Create your local env file
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 4. Create the database tables and load starter data
npm run db:migrate          # applies migrations in prisma/migrations
npm run db:seed             # demo user + default categories

# 5. Run the API in watch mode
npm run dev
```

Check it: open <http://localhost:4000/health>, which should return `{"status":"ok","database":"up", ...}`.
If Postgres is not running it returns HTTP 503 with `"database":"down"`.

## Backend scripts (`server/`)

| Script                        | What it does                                  |
| ----------------------------- | --------------------------------------------- |
| `npm run dev`                 | Start the API with auto-reload (tsx)          |
| `npm run build` / `npm start` | Compile to `dist/` and run the compiled build |
| `npm run typecheck`           | TypeScript type check without emitting files  |
| `npm run lint`                | ESLint                                        |
| `npm run format`              | Prettier (`format:check` to only check)       |
| `npm run db:migrate`          | Create and apply Prisma migrations            |
| `npm run db:studio`           | Open Prisma Studio to browse the database     |

## Project structure

```
finance-tracker/
├── server/            # Express API
│   ├── prisma/        # schema.prisma, migrations/, seed.ts
│   ├── prisma.config.ts
│   └── src/
│       ├── app.ts     # builds the Express app (imported by tests)
│       ├── server.ts  # starts the HTTP server
│       ├── config/    # validated environment variables
│       ├── constants/ # default categories
│       ├── lib/       # shared Prisma client
│       ├── generated/ # Prisma client code (generated, not committed)
│       └── routes/
├── client/            # React app (added in M11)
├── docker/            # Postgres init script
└── docker-compose.yml
```
