# PharmaFlow ERP — Monorepo

> Offline-first Indian Pharmacy ERP built with Electron + React + Node.js + PostgreSQL

---

## Architecture

```
pharmflow-erp/
├── apps/
│   ├── desktop/          ← Electron + React (Windows App)
│   └── cloud-backend/    ← Node.js Sync Server (Docker)
├── packages/
│   └── shared-types/     ← Shared TypeScript types
├── nginx/                ← Reverse proxy config
└── .github/workflows/    ← CI/CD pipelines
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Docker Desktop
- Git

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Database
```bash
make dev-db
# OR
docker compose -f docker-compose.dev.yml up -d
```

### 3. Setup Backend
```bash
cd apps/cloud-backend
cp .env.example .env
npm run migrate
npm run dev
```

### 4. Start Desktop App
```bash
cd apps/desktop
cp .env.example .env
npm run dev
```

## Deployment

### Cloud Backend
Push to `main` branch → GitHub Actions builds Docker image → deploys to server automatically.

### Desktop App (.exe)
Create a git tag → GitHub Actions builds .exe on Windows VM → uploads to public releases repo.

```bash
git tag v1.0.0
git push origin v1.0.0
```

## GitHub Secrets Required

| Secret | Purpose |
|---|---|
| `SERVER_HOST` | Production server IP |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | SSH private key |
| `POSTGRES_USER` | DB username |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_DB` | DB name |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `ADMIN_EMAIL` | Super admin email |
| `ADMIN_PASSWORD` | Super admin password |
| `RELEASES_REPO_TOKEN` | GitHub token with write access to public releases repo |
| `BREVO_API_KEY` | Email service |
| `TELEGRAM_BOT_TOKEN` | Deployment notifications |
| `TELEGRAM_CHAT_ID` | Telegram chat for notifications |

## Database

### Cloud (PostgreSQL via Prisma)
```bash
cd apps/cloud-backend
npx prisma migrate dev    # Create migration
npx prisma studio         # Visual DB editor
```

### Local (SQLite — auto-managed)
The SQLite database is automatically created at:
`C:\Users\<username>\AppData\Roaming\PharmaFlow ERP\pharmaflow.db`

Migrations in `apps/desktop/electron/migrations/` are applied automatically on app startup.
