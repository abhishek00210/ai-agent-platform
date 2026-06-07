# Setup Instructions

## Requirements

- Node.js 22+
- pnpm 10+
- Docker and Docker Compose

## Local Development

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm dev
```

The web app runs on `http://localhost:3000`.
The API runs on `http://localhost:4000/api/v1`.

## Database

Prisma uses PostgreSQL and reads `DATABASE_URL` from `prisma.config.ts`.

```bash
pnpm db:generate
pnpm db:migrate
```

## Environment

Backend environment validation lives in `apps/api/src/config/env.schema.ts`.
Frontend environment validation lives in `apps/web/src/config/env.ts`.

Copy `.env.example` to `.env` before running the stack.
