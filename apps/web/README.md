# ProjectMgmt — Web

Next.js 15 web application for ProjectMgmt. Provides Kanban boards, organization management, real-time notifications, and file management in a responsive browser interface.

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 3.4 |
| GraphQL Client | Apollo Client 3.11 |
| State Management | Zustand 5 |
| Drag & Drop | @dnd-kit |
| Forms | React Hook Form 7 + Zod |
| Icons | Lucide React |
| Testing | Vitest 1 + React Testing Library |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- API running at `http://localhost:4000` (see [apps/api/README.md](../api/README.md))

### Environment

```bash
# apps/web/.env.local
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

### Run

```bash
pnpm install
pnpm --filter web dev
```

App: **http://localhost:3000**

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/           Sign-in page
│   │   └── register/        Sign-up page
│   └── (dashboard)/         Protected routes
│       ├── dashboard/        Overview
│       ├── organizations/
│       │   └── [id]/         Org detail (projects + members tabs)
│       └── projects/
│           └── [id]/         Kanban board
├── components/
│   ├── ui/                  Base components (Button, Badge, Modal, Avatar…)
│   ├── layout/              Sidebar, TopNav
│   ├── kanban/              Board, Column, TaskCard, drag-and-drop
│   ├── tasks/               TaskDetailModal, CreateTaskSheet
│   ├── notifications/       NotificationPanel, NotificationItem
│   └── uploads/             FileUpload, AttachmentList
├── graphql/
│   ├── queries/             GraphQL query documents
│   ├── mutations/           GraphQL mutation documents
│   └── subscriptions/       GraphQL subscription documents
├── hooks/
│   ├── useAuth.ts           Sign-in / sign-up / sign-out logic
│   └── useNotifications.ts  Real-time notification subscription
├── lib/
│   ├── apollo/client.ts     Apollo Client setup (auth link + WS link)
│   └── utils/               Priority helpers, file utilities
├── stores/
│   └── auth.store.ts        Zustand auth state (persisted)
└── middleware.ts             Route protection (checks accessToken cookie)
```

## Authentication

Authentication uses JWT access tokens (15 min) + refresh tokens (7 days).

- On **login / register**: tokens are saved to `localStorage` and a cookie is set so the Next.js middleware can protect routes server-side.
- The **Apollo auth link** is async — before every GraphQL request it checks whether the access token is expired and silently calls `refreshToken` if needed.
- On **logout**: tokens are cleared from `localStorage` and the cookie is deleted. The backend invalidates the refresh token in Redis.
- If the refresh token is also expired, the user is redirected to `/login`.

```
Every Apollo request
  └─ authLink checks token expiry
       ├─ valid  → attach Authorization header
       └─ expired → fetch /graphql refreshToken mutation
            ├─ success → update localStorage + cookie → retry
            └─ failure → clear credentials → redirect /login
```

## Routing

| Path | Description | Protected |
|---|---|---|
| `/` | Redirects to `/dashboard` | Yes |
| `/login` | Sign-in | No |
| `/register` | Sign-up | No |
| `/dashboard` | Overview | Yes |
| `/organizations` | Org list | Yes |
| `/organizations/[id]` | Org detail | Yes |
| `/projects` | Project list | Yes |
| `/projects/[id]` | Kanban board | Yes |

Route protection is enforced by `middleware.ts` which reads the `accessToken` cookie. Client-side navigation is additionally gated by Zustand `isAuthenticated` state.

## GraphQL Integration

The Apollo Client is configured with:

- **HTTP link** — standard queries and mutations
- **WebSocket link** — GraphQL subscriptions (task events, comments, notifications)
- **Auth link** — async, proactively refreshes expired access tokens before each request
- **Split link** — routes subscriptions to WS, everything else to HTTP

WebSocket subscriptions reconnect automatically. The connection params are refreshed on each reconnect.

## Real-time Features

Subscriptions are active while the user is on a project board:

| Subscription | Trigger |
|---|---|
| `taskEvents(projectId)` | Task created, updated, moved, or deleted by another user |
| `commentAdded(taskId)` | Comment added to an open task |
| `notificationReceived` | Assignment, comment, or @mention notification |

## File Uploads

Files are uploaded directly from the browser to S3/MinIO using presigned URLs:

1. Client calls `generatePresignedUrl` mutation → receives a one-time PUT URL
2. Client PUT-uploads the file directly to storage
3. Client calls `confirmAttachment` to record the attachment in the database

Supported types: PDF, Word, Excel, images (PNG/JPG/GIF/WebP). Maximum size: 10 MB.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm test` | Run Vitest test suite |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm lint` | ESLint check |
| `pnpm generate` | Regenerate GraphQL types from schema |

## Testing

```bash
pnpm --filter web test          # run all tests
pnpm --filter web test:watch    # watch mode
```

Tests use **Vitest** + **React Testing Library** + `@testing-library/jest-dom`. The test environment is `jsdom`. Setup file at `src/test/setup.ts` imports `@testing-library/jest-dom` matchers.

Coverage includes:
- Auth store (Zustand state transitions)
- Utility functions (priority labels/colours, file type helpers)
- UI components (Avatar, Badge, Modal)
- Kanban components (TaskCard rendering)

## Production Build

```bash
pnpm --filter web build
pnpm --filter web start
```

The app outputs a **standalone** Next.js bundle (`output: 'standalone'` in `next.config.js`) suitable for containerisation. The Docker image is built by CI and pushed to GHCR.
