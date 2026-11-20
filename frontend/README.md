# Chattie frontend

React 19 + Vite + Ant Design client for the Chattie chat app.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Environment variables (`frontend/.env`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api` | REST API base URL |
| `VITE_SOCKET_URL` | `http://localhost:3000` | Socket.IO server URL |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server (http://localhost:5173) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

See the [root README](../README.md) for full-stack setup and the
[backend README](../backend/README.md) for API and socket event documentation.
