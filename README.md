# Chattie

A realtime chat app with authentication, friends, direct/group conversations,
and Socket.IO messaging.

## Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js, Express 5, Mongoose 9, Socket.IO 4 |
| Auth | JWT access tokens (15m) + rotating refresh tokens in an HTTP-only cookie, bcrypt |
| Frontend | React 19, Vite, Ant Design 6, React Router 7, axios |

## Features

- Username/password auth with refresh token rotation and revocation
- Friend requests (send, accept, reject) and friend list
- User search, profile editing (bio, phone) and avatar upload (JPEG/PNG/WebP, resized to 256×256 WebP)
- Direct and group conversations
- Realtime messaging, message deletion, conversation deletion
- Realtime conversation list updates (per-user socket rooms)

## Project structure

```
backend/    Express API, Mongoose models, JWT auth, Socket.IO server
frontend/   React SPA (Vite), Ant Design UI, API/socket clients
```

## Prerequisites

- Node.js 20+
- MongoDB running locally (or a connection string)

## Setup

### Backend

```bash
cd backend
cp .env.example .env    # then set MONGODB_URL and both JWT secrets
npm install
npm run dev             # http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

MongoDB and the backend must be running before the frontend can sign in.

## Environment

Backend (`backend/.env`):

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 3000) |
| `MONGODB_URL` | MongoDB connection string |
| `JWT_SECRET` | Access token signing secret |
| `REFRESH_TOKEN_SECRET` | Refresh token signing secret (must differ) |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | Token lifetimes (default `15m` / `7d`) |
| `CLIENT_URL` | Allowed CORS origin(s), comma separated |

Frontend (`frontend/.env`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | REST API base URL |
| `VITE_SOCKET_URL` | Socket.IO server URL |

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| backend | `npm run dev` | Start API with nodemon |
| backend | `npm start` | Start API |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build |
| frontend | `npm run lint` | ESLint |

## API and realtime docs

- REST endpoints and password rules: [backend/README.md](backend/README.md)
- Socket events (`conversation:new`, `message:new`, etc.): same file, Socket.IO section

## Security notes

- Email and phone are only returned for the authenticated user themselves.
- Avatars are validated, re-encoded by sharp and stored under `backend/uploads/`
  (git-ignored); uploads are capped at 2 MB and rate limited.
- Signup/signin are rate limited per IP; helmet security headers are enabled.
- Refresh tokens are stored hashed and rotated on every refresh.
- `.env` files are git-ignored. Generate long random values for both JWT secrets
  and never reuse the development values in production.
- In production set `NODE_ENV=production` and `CLIENT_URL`; if the API runs behind
  a reverse proxy, configure Express `trust proxy` so rate limiting sees client IPs.
