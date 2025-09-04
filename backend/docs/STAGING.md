# Staging Guide

## Scope
Prepare a staging API and frontend with mobile subdomain support.

## Services
- Backend API: `api.staging.irongrid.com` -> NestJS
- Frontend: `staging.irongrid.com` and `m.staging.irongrid.com` -> Next.js

## Environment
- Backend
  - PORT=3001
  - DATABASE_URL=postgres://...
  - ALLOWED_ORIGINS=https://staging.irongrid.com,https://m.staging.irongrid.com,http://localhost:3000
  - COMPANY_LOGO_URL=https://.../logo.png
  - COMPANY_SIGN_NAME=Sanvi Authorized
  - SMTP_* (when ready)
- Frontend
  - NEXT_PUBLIC_API_BASE=https://api.staging.irongrid.com

## DNS
- Create records for: `staging.irongrid.com`, `m.staging.irongrid.com`, `api.staging.irongrid.com`

## Reverse Proxy (NGINX sketch)
```
server {
  server_name api.staging.irongrid.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  server_name staging.irongrid.com m.staging.irongrid.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Certificates
Use Let’s Encrypt (Certbot) or platform-managed TLS.

## Database
- Local: `docker/docker-compose.yml`
- Staging: managed Postgres or VM with backups

## Deploy
- Backend: build and run Node service (pm2/systemd), bind 3001
- Frontend: Next.js build and run (or deploy to Vercel/Netlify); set `NEXT_PUBLIC_API_BASE`

## Frontend integration and timeline
- Ready now: Auth, Customers, Quotations CRUD, PDF generation endpoints
- CORS via `ALLOWED_ORIGINS`; include `https://irongrid.com` and `https://m.irongrid.com` (and staging equivalents)
- Estimates
  - Auth + API client + cookie handling: 0.5 day
  - Customers CRUD UI: 0.5–1 day
  - Quotations CRUD + PDF button (pdf-lib): 0.5–1 day
  - HTML → PDF polish with branding: 0.5 day

## Notes for Frontend
- Use `fetch` with `credentials: 'include'`
- Base path: `/api`
- PDF (HTML): `POST /api/quotations/:id/pdf?format=html` -> returns a file record with `downloadUrl`
- Files: `GET /api/files/:id` -> streams stored file (JWT protected)

## Mobile subdomain (`m.irongrid.com`)
- DNS: add CNAME `m` -> main frontend host
- App: prefer responsive UI; optionally serve mobile routes under `app/(mobile)/`
- Backend: ensure `ALLOWED_ORIGINS` includes `https://m.irongrid.com`
- Proxy/CDN: route `m.irongrid.com` to the same Next.js deployment or a separate mobile-optimized deployment
