# ProjectMgmt — API

NestJS 10 GraphQL API powering the web and mobile clients. Features JWT authentication with token rotation, real-time subscriptions, role-based access control, and presigned S3 file uploads.

## Tech Stack

| Concern | Library |
|---|---|
| Framework | NestJS 10 |
| API | GraphQL (Apollo Server, code-first schema generation) |
| Database | PostgreSQL 16 + TypeORM 0.3 |
| Cache / PubSub | Redis 7 + ioredis |
| Auth | Passport + @nestjs/jwt (access + refresh tokens) |
| File Storage | AWS S3 SDK v3 / MinIO |
| Rate Limiting | @nestjs/throttler |
| Real-time | graphql-ws subscriptions |
| Validation | class-validator + class-transformer |
| Testing | Jest + ts-jest |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 running (or use Docker)
- Redis 7 running (or use Docker)

### Start with Docker (recommended)

```bash
# From the repo root — starts Postgres, Redis, and MinIO
docker compose -f docker-compose.dev.yml up -d
```

### Environment

```bash
cp .env.example .env   # or create apps/api/.env
```

Minimum required variables:

```bash
NODE_ENV=development
APP_PORT=4000
DATABASE_URL=postgres://pguser:pgpassword@localhost:5432/projectmgmt
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=dev-access-secret-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_REFRESH_EXPIRY=7d
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=project-management
S3_REGION=us-east-1
S3_PUBLIC_URL=http://localhost:9000/project-management
```

### Run

```bash
pnpm install
pnpm --filter api migration:run   # apply migrations
pnpm --filter api seed:run        # optional: seed demo data
pnpm --filter api dev             # start in watch mode
```

GraphQL Playground: **http://localhost:4000/graphql**

## Project Structure

```
src/
├── common/
│   ├── decorators/       @CurrentUser, @Public
│   ├── enums/            OrgRole, ProjectRole, TaskPriority, NotificationType
│   └── guards/           JwtAuthGuard
├── database/
│   ├── migrations/       TypeORM migration files
│   └── seeds/            Demo data seeder
└── modules/
    ├── auth/             Registration, login, JWT refresh, logout
    ├── users/            User lookup and profile
    ├── organizations/    Orgs, member management, invite tokens
    ├── projects/         Projects and project members
    ├── tasks/            Columns, tasks, comments, attachments
    ├── notifications/    Real-time notification delivery
    ├── uploads/          Presigned URL generation and confirmation
    ├── redis/            Shared Redis provider
    └── pubsub/           GraphQL PubSub provider (Redis-backed)
```

## GraphQL Schema

### Authentication

| Operation | Type | Auth |
|---|---|---|
| `register(input)` | Mutation | Public |
| `login(input)` | Mutation | Public |
| `refreshToken(token)` | Mutation | Public |
| `logout(tokenId)` | Mutation | Required |
| `me` | Query | Required |

### Organizations

| Operation | Type |
|---|---|
| `myOrganizations` | Query |
| `organization(id)` | Query |
| `organizationMembers(organizationId)` | Query |
| `createOrganization(input)` | Mutation |
| `inviteMember(organizationId, input)` | Mutation |
| `acceptInvite(token)` | Mutation |
| `updateMemberRole(organizationId, userId, role)` | Mutation |
| `removeMember(organizationId, userId)` | Mutation |

### Projects

| Operation | Type |
|---|---|
| `projects(organizationId)` | Query |
| `project(id)` | Query |
| `projectMembers(projectId)` | Query |
| `createProject(input)` | Mutation |
| `archiveProject(projectId)` | Mutation |
| `addProjectMember(projectId, userId, role)` | Mutation |

### Tasks & Columns

| Operation | Type |
|---|---|
| `projectColumns(projectId)` | Query |
| `projectTasks(projectId)` | Query |
| `task(id)` | Query |
| `createColumn(input)` | Mutation |
| `seedDefaultColumns(projectId)` | Mutation |
| `createTask(input)` | Mutation |
| `updateTask(input)` | Mutation |
| `moveTask(input)` | Mutation |
| `deleteTask(id)` | Mutation |

### Comments & Files

| Operation | Type |
|---|---|
| `taskComments(taskId)` | Query |
| `taskAttachments(taskId)` | Query |
| `addComment(taskId, body)` | Mutation |
| `updateComment(id, body)` | Mutation |
| `deleteComment(id)` | Mutation |
| `generatePresignedUrl(input)` | Mutation |
| `confirmAttachment(input)` | Mutation |
| `deleteAttachment(id)` | Mutation |

### Notifications

| Operation | Type |
|---|---|
| `myNotifications` | Query |
| `unreadNotificationCount` | Query |
| `markNotificationRead(id)` | Mutation |
| `markAllNotificationsRead` | Mutation |
| `deleteNotification(id)` | Mutation |

### Subscriptions

| Subscription | Payload |
|---|---|
| `taskEvents(projectId)` | Task created / updated / moved / deleted |
| `commentAdded(taskId)` | New comment on a task |
| `notificationReceived` | Notification for the current user |

## Authentication Flow

```
Client                             API                     Redis
  │                                 │                        │
  │── register / login ────────────▶│                        │
  │                                 │── store refresh hash ─▶│
  │◀── { accessToken, refreshToken }│                        │
  │                                 │                        │
  │  (15 min later, access expired) │                        │
  │                                 │                        │
  │── refreshToken(token) ─────────▶│── verify hash ────────▶│
  │                                 │◀── match ──────────────│
  │                                 │── delete old hash ─────▶│
  │                                 │── store new hash ──────▶│
  │◀── { new accessToken,           │                        │
  │      new refreshToken }         │                        │
```

- Access tokens: **15 minutes** TTL, signed with `JWT_ACCESS_SECRET`
- Refresh tokens: **7 days** TTL, signed with `JWT_REFRESH_SECRET`, stored as bcrypt hashes in Redis
- Token rotation: each refresh invalidates the previous refresh token (prevents replay attacks)

## Role-Based Access Control

### Organization Roles

| Role | Create projects | Manage members | Invite | View |
|---|---|---|---|---|
| OWNER | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ |
| MEMBER | ✅ | | | ✅ |
| VIEWER | | | | ✅ |

### Project Roles

| Role | Manage tasks | Add members | View |
|---|---|---|---|
| LEAD | ✅ | ✅ | ✅ |
| MEMBER | ✅ | | ✅ |
| VIEWER | | | ✅ |

## File Upload Flow

Files are uploaded directly from the client to S3/MinIO — the API never proxies file bytes.

```
Client                    API                 S3 / MinIO
  │                        │                      │
  │── generatePresignedUrl ▶│                      │
  │                        │── presign PUT URL ───▶│
  │◀── { uploadUrl, key } ─│                      │
  │                        │                      │
  │── PUT file ────────────────────────────────────▶│
  │◀── 200 ────────────────────────────────────────│
  │                        │                      │
  │── confirmAttachment ───▶│                      │
  │◀── Attachment record ──│                      │
```

## Database Migrations

```bash
# Run pending migrations
pnpm --filter api migration:run

# Generate a new migration from entity changes
pnpm --filter api migration:generate -- -n MigrationName

# Revert last migration
pnpm --filter api migration:revert
```

Migrations live in `src/database/migrations/`. In development, `synchronize: true` is active as a fallback.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start in watch mode |
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Run compiled output |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm test:cov` | Run tests with coverage |
| `pnpm lint` | ESLint check |
| `pnpm migration:run` | Apply migrations |
| `pnpm migration:generate` | Generate migration |
| `pnpm seed:run` | Seed demo data |

## Testing

```bash
pnpm --filter api test          # unit tests
pnpm --filter api test:e2e      # e2e tests (needs running Postgres + Redis)
pnpm --filter api test:cov      # with coverage report
```

Tests use Jest with ts-jest. Unit tests mock all external dependencies. E2E tests spin up the full NestJS application and hit a real test database.
