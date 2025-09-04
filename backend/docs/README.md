# Sanvi Backend Docs

This document covers running the backend locally without Docker, seeded credentials, and common troubleshooting.

## Getting Started (No Docker)

1) Prerequisites
   - Node.js 20+
   - PostgreSQL running locally on `localhost:5432`

2) `.env`
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/sanvi_db?schema=public"
```

3) Install, migrate, seed, run
```
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

- Swagger: http://localhost:3001/api/docs
- Health (if enabled): http://localhost:3001/api/health
- CORS is enabled for `http://localhost:3000` in `src/main.ts`

### Seeded Admin
- Email: `admin@sanvi.local`
- Password: `Admin@12345`

## Troubleshooting

### P1000: Authentication failed
Your local Postgres user may not be `sanvi`. Use your local user (often `postgres`) in `DATABASE_URL`, or create the `sanvi` role:
```sql
CREATE ROLE sanvi WITH LOGIN PASSWORD 'password';
CREATE DATABASE sanvi_db OWNER sanvi;
GRANT ALL PRIVILEGES ON DATABASE sanvi_db TO sanvi;
```

### Prisma shutdown hook
We use `process.on('beforeExit')` in `src/prisma/prisma.service.ts` to gracefully close the Nest app. This avoids type issues with `PrismaClient.$on`.

### CORS issues from the frontend
If your frontend runs from a different origin, update allowed origins in `src/main.ts`:
```ts
app.enableCors({
  origin: ["http://localhost:3000"],
  credentials: true,
});
```

## Notes
- DTOs and validation are enabled via global `ValidationPipe` in `src/main.ts`.
- Prisma schema and migrations live under `prisma/`.
