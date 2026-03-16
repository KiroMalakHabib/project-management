# Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions** before running the CD pipeline.

## Server Deployment

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | SSH hostname or IP of your production server |
| `DEPLOY_USER` | SSH username (e.g. `deploy`) |
| `DEPLOY_SSH_KEY` | Private SSH key (the server must have the matching public key in `~/.ssh/authorized_keys`) |
| `DEPLOY_PATH` | Absolute path to the project on the server (e.g. `/srv/project-management`) |
| `NEXT_PUBLIC_GRAPHQL_URL` | Public GraphQL HTTP URL (e.g. `https://api.example.com/graphql`) |
| `NEXT_PUBLIC_GRAPHQL_WS_URL` | Public GraphQL WebSocket URL (e.g. `wss://api.example.com/graphql`) |

## iOS / TestFlight

| Secret | Description |
|--------|-------------|
| `APPLE_ID` | Apple ID email used for App Store Connect |
| `ITC_TEAM_ID` | App Store Connect team ID (numeric) |
| `TEAM_ID` | Apple Developer team ID (alphanumeric, e.g. `ABCDE12345`) |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID from App Store Connect → Users & Access → API Keys |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from the same page |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | Contents of the `.p8` file, **base64-encoded**: `base64 -i AuthKey_XYZ.p8 \| tr -d '\n'` |
| `MATCH_GIT_URL` | Private git repo URL for fastlane match certificates (e.g. `git@github.com:org/certs.git`) |
| `MATCH_PASSWORD` | Passphrase used to encrypt the match certificates repo |

## Android / Google Play

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Release keystore file base64-encoded: `base64 -i keystore.jks \| tr -d '\n'` |
| `ANDROID_KEY_ALIAS` | Key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_STORE_PASSWORD` | Keystore password |
| `GOOGLE_PLAY_JSON_KEY` | Full JSON contents of the Google Play service account key |

## CodeCov (optional)

| Secret | Description |
|--------|-------------|
| `CODECOV_TOKEN` | Token from codecov.io for coverage uploads |

---

## Server Setup

On your production server run:

```bash
# 1. Install Docker + Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Clone the repo
git clone https://github.com/KiroMalakHabib/project-management.git /srv/project-management
cd /srv/project-management

# 3. Create .env from template
cp .env.example .env
# Edit .env with production values

# 4. Copy TLS certificates
mkdir -p nginx/certs
# Place fullchain.pem and privkey.pem in nginx/certs/
# (e.g. from Let's Encrypt: certbot certonly ...)

# 5. First-time startup
docker compose -f docker-compose.prod.yml up -d
```
