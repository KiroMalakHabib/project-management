# ProjectMgmt

A full-stack SaaS project management tool built with Next.js, NestJS, Flutter, PostgreSQL, Redis, and GraphQL.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) |
| Backend | NestJS + GraphQL |
| Mobile | Flutter |
| Database | PostgreSQL 16 |
| Cache/PubSub | Redis 7 |
| File Storage | MinIO (dev) / AWS S3 (prod) |
| Auth | JWT + Refresh Tokens |
| Realtime | GraphQL Subscriptions (graphql-ws) |

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Flutter SDK 3.x

### Setup

1. Clone the repository
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Start infrastructure services:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Run database migrations:
   ```bash
   pnpm db:migrate
   ```
6. Start all apps:
   ```bash
   pnpm dev
   ```

### Services

| Service | URL |
|---------|-----|
| API (GraphQL Playground) | http://localhost:4000/graphql |
| Web App | http://localhost:3000 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Project Structure

```
apps/
  api/        NestJS GraphQL API
  web/        Next.js frontend
  mobile/     Flutter mobile app
packages/
  graphql-types/  Shared generated types
infrastructure/
  docker/     Docker configurations
  scripts/    Utility scripts
```

## Development

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all packages

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
