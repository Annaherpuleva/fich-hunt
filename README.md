# fich-hunt

Fish Hunt / HODL Ocean TON.

## Architecture
- **Frontend:** React/Vite client (`client/`) with server-driven data access via `/api/v1/...`.
- **Backend:** Express + domain modules (`server/`).
- **Database:** PostgreSQL + Drizzle schema/migrations (`shared/schema.ts`, `drizzle/`).

## Local SQL database

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Configure environment:

```bash
export DATABASE_URL=postgres://fich_hunt:fich_hunt@localhost:5432/fich_hunt
```

3. Apply schema:

```bash
pnpm db:push
```

## Run application

```bash
pnpm dev
```
