## Vaatsip Web

Chat web application with a React (Vite + TypeScript + Tailwind) client and a Node.js (Express + Prisma + WebSocket) server. Includes Google OAuth, JWT auth, and CORS hardening.

### Repository layout

```
vaatsip-web/
  client/   # React + Vite + Tailwind UI
  server/   # Express API + WebSocket + Prisma ORM
```

### Tech stack

- **Client**: React 19, React Router, Vite 7, Tailwind CSS 4, Lucide Icons
- **Server**: Node.js (ESM), Express, Prisma, JWT, Google OAuth, Socket.IO/WS, Redis (optional)

### Browser support

This is a web‑first application. Some features rely on modern Web APIs and cookie/CORS behaviors that can differ across browsers. You may experience issues on Firefox (e.g., stricter third‑party cookie policies, OAuth popup flows, local HTTPS with self‑signed certs, or WebSocket+CORS interactions).

- For the smoothest experience, use a Chromium‑based browser (Chrome, Edge, Brave) during development.
- If using Firefox locally, consider disabling Enhanced Tracking Protection for `https://localhost` or adding site exceptions, and ensure the dev certificates are trusted.

### Prerequisites

- Node.js 18+ (recommended 20+)
- npm 9+
- A PostgreSQL (or compatible) database connection URL for Prisma (`CLOUD_DB_URI`)
- Google OAuth credentials (Client ID/Secret)

### Quick start

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

# Database (Prisma will use this)
CLOUD_DB_URI=postgresql://user:password@host:5432/dbname?schema=public

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_AUTH_CALLBACK=https://localhost:50136/api/auth/google/callback

# CORS (optional extra allowed origin)
FRONTEND_URI=https://localhost:5173
```

3) Generate local HTTPS certs for dev (server)

The dev server uses HTTPS when `NODE_ENV=development` and expects certs in `server/certs/`:

- `server/certs/localhost-key.pem`
- `server/certs/localhost.pem`

You can create them with mkcert (recommended):

```bash
cd server
mkcert -install
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost
```

Or with OpenSSL (self-signed):

```bash
cd server
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

### Environment variables (server)

Required at startup (process will exit if missing):

- `JWT_SECRET`
- `CLOUD_DB_URI`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_AUTH_CALLBACK`

Optional:

- `PORT` (default: `50136`)
- `FRONTEND_URI` (adds an allowed CORS origin)

Files read are `.env.${NODE_ENV}` (e.g., `.env.development`, `.env.production`).

### CORS and origins

- Development allowed origins include:
  - `https://localhost:5173`, `https://localhost:3000`, `https://localhost:4173`
- Production allows Vercel deployments for the client plus `FRONTEND_URI` if set.

If you see "Not allowed by CORS", ensure your frontend origin matches an allowed origin or set `FRONTEND_URI` appropriately.

### API overview

- Health check: `GET /api/health`
  - Returns server status, environment, and WebSocket availability
- Auth routes: `GET /api/auth/google`, `GET /api/auth/google/callback`
- Users routes: `GET /api/users/...`
- Comm routes: `GET|POST /api/comm/...`

WebSocket is initialized by the server; see `server/src/config/websocket.config.js`.

### Client scripts

```bash
# client/
npm run dev       # start Vite dev server (https://localhost:5173)
npm run build     # type-check + production build to client/dist
npm run preview   # preview built client
npm run lint      # lint client code
```

### Server scripts

```bash
# server/
npm run dev         # start dev server with nodemon
npm run start       # start server
npm run build       # prisma generate
npm run db:migrate  # prisma migrate deploy
```

### Build and deploy

- Client
  - `cd client && npm run build` → outputs to `client/dist/`
  - The repo includes `client/vercel.json` for Vercel deploys.

- Server
  - Ensure all required env vars are set in your hosting platform
  - Run `npm run build` (generates Prisma client)
  - Run `npm run start`
  - Run `npm run db:migrate` on deploy to apply migrations

### Troubleshooting

- **Missing required environment variable**: The server exits on startup if any required env var is not set. Check `.env.${NODE_ENV}`.
- **CORS blocked origin**: Ensure your frontend URL is in the allowed list or set `FRONTEND_URI`.
- **HTTPS certificate errors (dev)**: Trust the mkcert root CA or add exceptions for the self-signed certs. Confirm cert files exist at `server/certs/`.
- **Database connectivity**: Verify `CLOUD_DB_URI` and that the database is reachable from your machine/host.


