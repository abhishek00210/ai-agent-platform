# Local Development Guide

## Running With pnpm

```bash
pnpm install
pnpm dev
```

Turbo starts the web and API apps in parallel.

## Running With Docker

```bash
cp .env.example .env
docker-compose up
```

Docker Compose is optimized for development hot reload. Source code is mounted into both app containers.

## Health Check

```bash
curl http://localhost:4000/api/v1/health
```

The health endpoint checks the API process, PostgreSQL query path, and Redis ping path.

## Code Quality

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Husky and lint-staged are configured for future git hooks.
