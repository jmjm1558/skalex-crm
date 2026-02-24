# WhatsApp Web CRM Monorepo

Monorepo scaffold using **pnpm workspaces** with:

- `apps/extension`: Chrome Extension (MV3) with Vite + React + TypeScript + Tailwind.
- `apps/backend`: NestJS + Prisma + PostgreSQL (`docker-compose`).
- `packages/shared`: Shared TypeScript types and optional Zod schemas.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for PostgreSQL)

## Install dependencies (PowerShell)

```powershell
pnpm install
```

## Development (PowerShell)

Run all workspace dev scripts in parallel:

```powershell
pnpm dev
```

Run only extension dev server:

```powershell
pnpm --filter @skalex/extension dev
```

Run only backend in watch mode:

```powershell
pnpm --filter @skalex/backend dev
```

## Build extension (PowerShell)

```powershell
pnpm --filter @skalex/extension build
```

Load the unpacked extension from:

```text
apps/extension/dist
```

## Run backend + PostgreSQL (PowerShell)

Start PostgreSQL:

```powershell
docker compose -f apps/backend/docker-compose.yml up -d
```

Run Prisma migrations:

```powershell
pnpm --filter @skalex/backend prisma:migrate
```

Start backend:

```powershell
pnpm --filter @skalex/backend dev
```

## Monorepo scripts

```powershell
pnpm lint
pnpm typecheck
pnpm build
pnpm format
```

## Manual QA checklist

1. Install dependencies with `pnpm install`.
2. Run `docker compose -f apps/backend/docker-compose.yml up -d`.
3. Run backend: `pnpm --filter @skalex/backend dev` and verify `GET /health` returns `ok`.
4. Run extension dev server: `pnpm --filter @skalex/extension dev`.
5. Build extension and verify `apps/extension/dist` exists.
6. Ensure no auto-send behavior exists and send actions remain human-confirmed.
