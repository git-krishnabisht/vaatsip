# Vaatsip Web

Desktop first Web application with a React (Vite + TypeScript + Tailwind) client and a Node.js (Express + Prisma + WebSocket) server. Includes Google OAuth, JWT auth, and CORS hardening.

## Repository layout

```
vaatsip-web/
  client/   # React + Vite + Tailwind UI
  server/   # Express API + WebSocket + Prisma ORM
```

## Features

- Real‑time messaging over WebSocket (WS path: `/ws`)
- JWT authentication and cookie support
- Google OAuth sign-in flow
- Secure CORS configuration for dev and production
- File uploads (profile images, memory storage)
- PostgreSQL via Prisma ORM with migrations
- TypeScript React client with Tailwind CSS
- Local HTTPS for both client and server (mkcert/self-signed)

## Tech stack

- **Client**: React 19, React Router, Vite 7, Tailwind CSS 4, Lucide Icons
- **Server**: Node.js (ESM), Express, Prisma, JWT, Google OAuth, ws (WebSocket), Socket.IO (dep present), Multer
- **Database**: PostgreSQL (connection via `CLOUD_DB_URI`)
- **Deploy**: Vercel (client), Render/Node host (server)

## Prerequisites

- Node.js 18+ (recommended 20+)
- npm 9+
- A PostgreSQL database URL for Prisma (`CLOUD_DB_URI`)
- Google OAuth credentials (Client ID/Secret)

## Quick start (local)

1) Install dependencies

```bash
cd client && npm i
cd ../server && npm i
```

2) Configure environment variables (server)

The server loads env from `.env.${NODE_ENV}`. For local dev create `server/.env.development`:

```bash
# server/.env.development
NODE_ENV=development
PORT=50136

# Auth / security
JWT_SECRET=replace-with-a-strong-secret

# Database (Prisma)
CLOUD_DB_URI=postgresql://user:password@host:5432/dbname?schema=public

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_AUTH_CALLBACK=https://localhost:50136/api/auth/google/callback

# CORS (optional extra allowed origin)
FRONTEND_URI=https://localhost:5173
```

3) Generate local HTTPS certs for dev

The dev servers use HTTPS and expect certs in `client/certs/` and `server/certs/`.

Required files:
- `client/certs/localhost-key.pem`
- `client/certs/localhost.pem`
- `server/certs/localhost-key.pem`
- `server/certs/localhost.pem`

Create with mkcert (recommended):

```bash
# client
cd client
mkcert -install
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost

# server
cd ../server
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost
```

Or with OpenSSL (self‑signed):

```bash
# client
cd client
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/localhost-key.pem -out certs/localhost.pem \
  -subj "/C=US/ST=Dev/L=Local/O=Vaatsip/OU=Dev/CN=localhost"

# server
cd ../server
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/localhost-key.pem -out certs/localhost.pem \
  -subj "/C=US/ST=Dev/L=Local/O=Vaatsip/OU=Dev/CN=localhost"
```

4) Prepare the database (server)

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

5) Run in development

Terminal A (server):

```bash
cd server
NODE_ENV=development npm run dev
```

Terminal B (client):

```bash
cd client
npm run dev
```

- Client runs at `https://localhost:5173`
- API/WebSocket runs at `https://localhost:50136`

## Environment variables (server)

Required at startup (process exits if missing):
- `JWT_SECRET`
- `CLOUD_DB_URI`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_AUTH_CALLBACK`

Optional:
- `PORT` (default: `50136`)
- `FRONTEND_URI` (adds an allowed CORS origin)

Files read are `.env.${NODE_ENV}` (e.g., `.env.development`, `.env.production`).

## CORS and origins

- Development allowed origins include:
  - `https://localhost:5173`, `https://localhost:3000`, `https://localhost:4173`
- Production allows Vercel deployments for the client plus `FRONTEND_URI` if set.

If you see "Not allowed by CORS", ensure your frontend origin matches an allowed origin or set `FRONTEND_URI` appropriately.

## API overview

Base URL: `https://<server-host>/api`

- Health check: `GET /api/health`
  - Returns server status, environment, and WebSocket availability

- Auth routes (`/api/auth`)
  - `GET /api/auth/google` (entry) → handled by OAuth entry
  - `GET /api/auth/google/callback` → Google callback
  - `GET /api/auth/oauth-signin` → controller: `oauth_signin`
  - `POST /api/auth/sign-in` → controller: `sign_in`
  - `POST /api/auth/sign-up` → controller: `sign_up`
  - `POST /api/auth/sign-out` → controller: `sign_out`

- Users routes (`/api/users`)
  - `POST /api/users/upload-profile` (multipart `image`, protected)
  - `GET /api/users/get-pictures/:id`
  - `GET /api/users/get-users` (protected)
  - `DELETE /api/users/user-delete`
  - `PUT /api/users/user-update`
  - `GET /api/users/user-details/:id` (protected)

- Comm routes (`/api/comm`)
  - `GET /api/comm/get-messages/:id` (protected)

Protected endpoints require a valid JWT (typically via cookie).

## WebSocket

- URL: `wss://<server-host>/ws`
- Auth: JWT required via query `?token=...` or cookie (`jwt`/`token`/`access_token`/`authToken`)
- Origin check: same CORS rules as HTTP; only allowed origins can open WS

Message types (examples):
- `send_message` → `{ receiverId: number, content: string, tempId?: string }`
- `message_delivered` → `{ messageId: number }`
- `message_read` → `{ messageId: number }`
- `typing_start` / `typing_stop` → `{ receiverId: number }`
- `get_online_users` → `{}`
- `ping` → `{}` → server replies with `pong`

Server emits:
- `connection_established`, `new_message`, `message_sent`, `message_delivered`, `message_read`, `user_typing`, `user_status_changed`, `online_users`, `error`

## Database schema (Prisma)

- Tables: `users`, `messages`, `attachments`
- Relations: `User` has many sent/received `Message`; `Message` has many `Attachment`

Run migrations and generate client with Prisma commands listed above.

## Scripts

Client (`client/`):
```bash
npm run dev       # start Vite dev server (https://localhost:5173)
npm run build     # type-check + production build to client/dist
npm run preview   # preview built client
npm run lint      # lint client code
```

Server (`server/`):
```bash
npm run dev         # start dev server with nodemon
npm run start       # start server
npm run build       # prisma generate
npm run db:migrate  # prisma migrate deploy
```

## Build and deploy

- Client
  - `cd client && npm run build` → outputs to `client/dist/`
  - Vercel config provided in `client/vercel.json`

- Server
  - Ensure all required env vars are set in your hosting platform
  - Run `npm run build` (generates Prisma client)
  - Run `npm run start`
  - Run `npm run db:migrate` on deploy to apply migrations
  - Sample `render.yaml` included for Render with health check `/api/health`

## Browser support notes

Some features rely on modern Web APIs and cookie/CORS behaviors. Firefox may require extra configuration for local HTTPS and third‑party cookie settings. For the smoothest dev experience, use a Chromium‑based browser (Chrome, Edge, Brave) and trust the local certs.

## Troubleshooting

- **Missing required environment variable**: The server exits on startup if any required env var is not set. Check `.env.${NODE_ENV}`.
- **CORS blocked origin**: Ensure your frontend URL is in the allowed list or set `FRONTEND_URI`.
- **HTTPS certificate errors (dev)**: Trust the mkcert root CA or add exceptions for the self‑signed certs. Confirm cert files exist at `client/certs/` and `server/certs/`.
- **Database connectivity**: Verify `CLOUD_DB_URI` and DB reachability; run migrations.
- **WebSocket not connecting**: Verify origin, provide JWT via query or cookie, confirm `/ws` is reachable.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add awesome feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request