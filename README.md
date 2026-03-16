# ProjectMgmt

A full-stack, real-time project management platform — Kanban boards, team collaboration, file attachments, and instant notifications — available as a web app and a native mobile app.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│   Next.js 15 (Web)          Flutter 3 (iOS + Android)   │
│   Apollo Client             graphql_flutter              │
└────────────────┬────────────────────┬────────────────────┘
                 │    GraphQL + WS    │
┌────────────────▼────────────────────▼────────────────────┐
│                   API Layer (NestJS 10)                   │
│   GraphQL (Apollo Server)   JWT Auth   Rate Limiting      │
│   TypeORM     Subscriptions (graphql-ws)                  │
└──────────┬──────────────────────────────┬────────────────┘
           │                              │
┌──────────▼──────────┐    ┌─────────────▼──────────────────┐
│  PostgreSQL 16       │    │  Redis 7                        │
│  Primary data store  │    │  Refresh tokens + PubSub        │
└─────────────────────┘    └────────────────────────────────┘
                                   │
                    ┌──────────────▼─────────────┐
                    │  MinIO / AWS S3              │
                    │  File attachments            │
                    └────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10, GraphQL (code-first), TypeORM 0.3 |
| Web Frontend | Next.js 15 (App Router), React 19, Apollo Client 3 |
| Mobile | Flutter 3, flutter_bloc, graphql_flutter, go_router |
| Database | PostgreSQL 16 |
| Cache / PubSub | Redis 7 |
| File Storage | MinIO (dev) · AWS S3 (prod) |
| Auth | JWT access tokens (15 min) + refresh tokens (7 days) |
| Real-time | GraphQL subscriptions over WebSocket (graphql-ws) |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions + Fastlane (mobile) |

## Features

- **Authentication** — Register, login, persistent sessions with silent token refresh, token rotation
- **Organizations** — Create orgs, invite members by email, role management (Owner / Admin / Member / Viewer)
- **Projects** — Project-level roles (Lead / Member / Viewer), archive projects
- **Kanban Boards** — Drag-and-drop columns and tasks, custom column colours
- **Tasks** — Priority levels, assignees, due dates, rich comments, @mention notifications
- **File Attachments** — Presigned S3 URL upload (client → storage direct), attachment management
- **Real-time Notifications** — Task assignments, comments, @mentions via GraphQL subscriptions
- **Mobile** — Full feature parity on iOS and Android (Flutter)

## Repository Layout

```
project-management/
├── apps/
│   ├── api/          NestJS GraphQL API          → apps/api/README.md
│   ├── web/          Next.js web app             → apps/web/README.md
│   └── mobile/       Flutter mobile app          → apps/mobile/README.md
├── packages/
│   └── graphql-types/    Shared generated types
├── docker-compose.yml         Alias for dev compose
├── docker-compose.dev.yml     Local infrastructure
├── docker-compose.prod.yml    Production stack
├── nginx/
│   └── nginx.prod.conf        Reverse proxy config
├── .github/
│   └── workflows/             CI/CD pipelines
└── docs/
    └── SECRETS.md             Required GitHub secrets
```

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20+ |
| pnpm | 9+ |
| Docker + Docker Compose | Latest |
| Flutter SDK | 3.x |

## Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd project-management

# 2. Environment
cp .env.example .env
# Edit .env — at minimum set JWT secrets for production

# 3. Start infrastructure (Postgres, Redis, MinIO)
docker compose -f docker-compose.dev.yml up -d

# 4. Install JS/TS dependencies
pnpm install

# 5. Run database migrations
pnpm --filter api migration:run

# 6. (Optional) Seed demo data
pnpm --filter api seed:run

# 7. Start all apps in watch mode
pnpm dev
```

### Service URLs

| Service | URL |
|---|---|
| GraphQL API + Playground | http://localhost:4000/graphql |
| Web App | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Mobile

```bash
cd apps/mobile
flutter pub get
flutter run          # choose device when prompted
```

See [apps/mobile/README.md](apps/mobile/README.md) for emulator setup.

## Root Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in watch mode (Turborepo) |
| `pnpm build` | Build all apps |
| `pnpm test` | Run all test suites |
| `pnpm lint` | Lint all packages |
| `pnpm --filter api migration:run` | Apply DB migrations |
| `pnpm --filter api seed:run` | Seed demo data |
| `pnpm --filter web generate` | Regenerate GraphQL types |

## Environment Variables

Copy `.env.example` to `.env`. Required variables:

```bash
# Database
DATABASE_URL=postgres://pguser:pgpassword@localhost:5432/projectmgmt

# Redis
REDIS_URL=redis://localhost:6379

# JWT — change these in production!
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me

# Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=project-management

# Web (Next.js public vars)
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

## Production Deployment

The production stack uses Docker Compose + Nginx as a reverse proxy.

```bash
# Build and start
IMAGE_TAG=latest docker compose -f docker-compose.prod.yml up -d
```

See [docs/SECRETS.md](docs/SECRETS.md) for the full list of GitHub secrets required by the CI/CD pipeline.

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `ci-backend.yml` | Push to `api/` | Lint → Test → Build → Push to GHCR |
| `ci-frontend.yml` | Push to `web/` | Lint → Test → Build → Push to GHCR |
| `ci-mobile.yml` | Push to `mobile/` | Analyze → Test → Fastlane deploy |
| `cd.yml` | Tag `v*` | SSH deploy API + Web; iOS TestFlight + Android Play Store |
