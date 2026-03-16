# ProjectMgmt — Mobile

Flutter 3 mobile application for ProjectMgmt. Runs on iOS and Android, providing full feature parity with the web app: Kanban boards, real-time notifications, file attachments, and team management.

## Tech Stack

| Concern | Package |
|---|---|
| Framework | Flutter 3 / Dart |
| State Management | flutter_bloc 8 + Equatable |
| GraphQL | graphql_flutter 5 |
| Navigation | go_router 13 |
| Dependency Injection | get_it 7.6 |
| Secure Storage | flutter_secure_storage 9 |
| File Picker | file_picker 6 |
| HTTP | http 1.2 |
| Testing | flutter_test, bloc_test 9, mocktail |

## Getting Started

### Prerequisites

- Flutter SDK 3.x (`flutter --version` to verify)
- Dart SDK (bundled with Flutter)
- Xcode 15+ (iOS builds)
- Android Studio / JDK 17 (Android builds)
- API running (see [apps/api/README.md](../api/README.md))

### Install dependencies

```bash
cd apps/mobile
flutter pub get
```

### Run

```bash
flutter run                    # prompts to choose a device
flutter run -d "iPhone 15"     # iOS simulator
flutter run -d emulator-5554   # Android emulator
```

### Emulator / Simulator network

The app resolves the API host at runtime:

| Platform | Host used |
|---|---|
| Android emulator | `10.0.2.2` (maps to host `localhost`) |
| iOS simulator / macOS | `localhost` |
| Web | `localhost` |

This is configured in `lib/core/config/api_config.dart`.

## Project Structure

```
lib/
├── main.dart                       App entry point
├── app/
│   └── router.dart                 go_router configuration + auth redirect
├── core/
│   ├── config/
│   │   └── api_config.dart         API base URLs (platform-aware)
│   ├── di/
│   │   └── service_locator.dart    GetIt DI setup
│   ├── graphql/
│   │   └── graphql_client.dart     GraphQL client (HTTP + WS + auth link)
│   └── storage/
│       └── token_storage.dart      Secure token + user data storage
└── features/
    ├── auth/
    │   ├── data/                   GraphQL mutations (login, register, refresh, logout)
    │   ├── domain/                 AuthBloc, AuthEvent, AuthState, AuthUser
    │   └── presentation/           LoginScreen, RegisterScreen
    ├── dashboard/
    │   └── presentation/           DashboardScreen
    ├── organizations/
    │   ├── data/                   GraphQL queries
    │   ├── domain/                 OrganizationsBloc, Organization, OrganizationMember
    │   └── presentation/           OrganizationsScreen, OrganizationDetailScreen
    ├── projects/
    │   ├── data/                   GraphQL queries
    │   └── domain/                 Project model
    ├── tasks/
    │   ├── data/                   GraphQL queries + mutations (tasks, attachments)
    │   ├── domain/                 KanbanBloc, Task, TaskColumn
    │   └── presentation/           KanbanScreen, TaskDetailScreen,
    │                               AttachmentUploadWidget, AttachmentListWidget
    └── notifications/
        ├── domain/                 NotificationsBloc, Notification
        └── presentation/           NotificationsScreen
```

## Architecture

The app follows a layered architecture per feature:

```
Presentation (Widgets / Screens)
       │  dispatches events / rebuilds on state
       ▼
    BLoC (Domain)
       │  calls GraphQL / storage
       ▼
Data (GraphQL queries + mutations) + Core (storage, DI, config)
```

Dependencies are wired in `core/di/service_locator.dart` using `get_it`. BLoCs and services are registered as factories or singletons and resolved throughout the app.

## Authentication & Session Persistence

Users stay logged in until they explicitly sign out.

- Tokens and user data are stored in **Flutter Secure Storage** (encrypted on-device keychain/keystore).
- On every app launch `AuthCheckRequested` is dispatched:
  - Access token valid → load user from storage → emit `AuthAuthenticated`
  - Access token expired, refresh token valid → `TokenStorage.refreshIfNeeded()` exchanges tokens silently → emit `AuthAuthenticated`
  - Both tokens expired → emit `AuthUnauthenticated` → redirect to login
- The **GraphQL auth link** also calls `refreshIfNeeded()` before every request, so any in-flight request transparently gets a fresh token without the user noticing.

## Navigation

Routing uses **go_router** with a `redirect` callback wired to the `AuthBloc` stream.

| Route | Screen | Auth |
|---|---|---|
| `/login` | LoginScreen | Public |
| `/register` | RegisterScreen | Public |
| `/dashboard` | DashboardScreen | Required |
| `/organizations` | OrganizationsScreen | Required |
| `/organizations/:id` | OrganizationDetailScreen | Required |
| `/projects/:id` | KanbanScreen | Required |
| `/notifications` | NotificationsScreen | Required |

Unauthenticated users are automatically redirected to `/login`. After login the router redirects to `/dashboard`.

## Real-time

GraphQL subscriptions are routed to the WebSocket link. The split condition uses an explicit AST check (`OperationDefinitionNode.type == subscription`) rather than the unreliable `request.isSubscription` flag from graphql_flutter 5.x, which prevents mutations being accidentally routed to the WS connection.

| Subscription | Used in |
|---|---|
| `taskEvents(projectId)` | KanbanScreen |
| `commentAdded(taskId)` | TaskDetailScreen |
| `notificationReceived` | NotificationsScreen |

The WebSocket reconnects automatically (`autoReconnect: true`, 30 s inactivity timeout).

## File Attachments

`AttachmentUploadWidget` provides in-app file upload via presigned S3 URLs:

1. `FilePicker.platform.pickFiles()` — user selects a file
2. `generatePresignedUrl` mutation — API returns a one-time PUT URL
3. `http.put(uploadUrl, body: fileBytes)` — file is uploaded directly to MinIO/S3
4. `confirmAttachment` mutation — attachment record is created in the database

Allowed types: PDF, Word, Excel, PNG, JPG, GIF, WebP. Maximum size: 10 MB.

## Testing

```bash
flutter test                      # all tests
flutter test --coverage           # with coverage (lcov)
```

Test files live in `test/`. The test suite covers:

| Suite | File |
|---|---|
| Organisations BLoC | `test/features/organizations/organizations_bloc_test.dart` |
| Kanban BLoC | `test/features/tasks/kanban_bloc_test.dart` |
| Notifications BLoC | `test/features/notifications/notifications_bloc_test.dart` |
| Widget smoke test | `test/widget_test.dart` |

BLoC tests use `bloc_test` + `mocktail`. `FakeQueryOptions` and `FakeMutationOptions` are registered with `registerFallbackValue` so `any()` matchers work correctly.

## CI/CD (Fastlane)

Mobile releases are automated via Fastlane.

### iOS

```bash
cd apps/mobile
bundle exec fastlane ios beta     # build IPA → upload to TestFlight
bundle exec fastlane ios release  # promote to App Store
```

### Android

```bash
bundle exec fastlane android internal  # build AAB → upload to Play Store (internal track)
bundle exec fastlane android promote   # promote internal → production
```

### Required secrets

See [docs/SECRETS.md](../../docs/SECRETS.md) for the complete list. Key secrets:

| Secret | Purpose |
|---|---|
| `APPLE_KEY_ID` | App Store Connect API key ID |
| `APPLE_ISSUER_ID` | App Store Connect API issuer |
| `APPLE_KEY_CONTENT` | App Store Connect API private key (.p8) |
| `MATCH_GIT_URL` | Private repo holding signing certificates |
| `MATCH_PASSWORD` | Encryption password for Match |
| `GOOGLE_PLAY_JSON` | Service account JSON for Play Store |
| `KEYSTORE_FILE` | Base64-encoded Android keystore |
| `KEYSTORE_PASSWORD` | Keystore password |

## Useful Commands

```bash
flutter analyze                   # static analysis
flutter pub outdated              # check for dependency updates
flutter pub upgrade               # upgrade dependencies
flutter build apk                 # debug APK
flutter build appbundle           # release AAB (Play Store)
flutter build ipa                 # release IPA (TestFlight)
flutter clean                     # clear build cache
```
