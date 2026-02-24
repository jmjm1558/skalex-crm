# WhatsApp Web CRM Monorepo

Monorepo scaffold using **pnpm workspaces**:

- `apps/extension`: MV3 + Vite + React + TypeScript + Tailwind.
- `apps/backend`: NestJS + Prisma + PostgreSQL (`docker-compose`).
- `packages/shared`: Shared TypeScript contracts (+ Zod optional validators).

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop

## Install dependencies (PowerShell)

```powershell
pnpm install
```

## Run extension (PowerShell)

Dev server (UI playground):

```powershell
pnpm --filter @skalex/extension dev
```

Build extension bundle (content script + service worker + assets):

```powershell
pnpm --filter @skalex/extension build
```

Load unpacked extension from:

```text
apps/extension/dist
```

## Run backend + Postgres (PowerShell)

Start PostgreSQL:

```powershell
docker compose -f apps/backend/docker-compose.yml up -d
```

Run Prisma migration:

```powershell
pnpm --filter @skalex/backend prisma:migrate
```

Start backend:

```powershell
pnpm --filter @skalex/backend dev
```

Health check:

```text
GET http://localhost:3000/api/health
```

## Workspace scripts (PowerShell)

```powershell
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm format
```

## Manual QA for F1 (read-only WhatsApp DOM adapter)

1. Build extension: `pnpm --filter @skalex/extension build`.
2. Open Chrome extensions page and load unpacked from `apps/extension/dist`.
3. Open `https://web.whatsapp.com/` and log in.
4. Verify CRM panel appears on the right and WhatsApp UI remains usable.
5. Switch chats manually:
   - Overview shows active chat display name + fingerprint updates.
   - Message list updates with direction (`in/out/unknown`) and text.
6. Scroll chat history manually (optional):
   - Messages may refresh.
   - Extension does not auto-scroll WhatsApp chat.
7. Verify **NO sending behavior**:
   - No messages are auto-sent.
   - Extension does not focus or write to composer.
8. Verify browser console has no repeating errors and CPU usage stays stable.
