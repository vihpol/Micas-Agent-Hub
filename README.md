# Micas AgentHub

Micas AgentHub is a simple starter app with:

- `frontend`: Next.js + TypeScript + Tailwind
- `backend`: FastAPI + Python
- `docker-compose.yml`: runs both services together

The backend currently exposes `/health` and `/analyze` with mocked workflow data. No database, auth, or real LLM calls are included yet.

## Quick Start

From the project root, run:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

Expected health response:

```json
{"status":"ok"}
```

The frontend is configured to call the backend at `http://localhost:8000` by default.

## Verify Everything Works

In another terminal, run:

```bash
curl http://localhost:8000/health
```

You should see:

```json
{"status":"ok"}
```

Then open http://localhost:3000. The sidebar should show `Backend connected`. Paste a request, click `Run Agents`, and the output cards should populate.

## Environment Variables

Docker Compose uses these defaults:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

For normal local development, you do not need to set anything.

If you are running the app on another machine or VM and opening it from your laptop, set both values to the machine's reachable IP or hostname:

```bash
NEXT_PUBLIC_API_URL=http://192.168.1.174:8000 \
CORS_ORIGINS=http://192.168.1.174:3000,http://localhost:3000 \
docker compose up --build
```

Important: `NEXT_PUBLIC_API_URL` is baked into the Next.js browser bundle during build. If you change it, rebuild with `docker compose up --build`.

## Ports

The app expects:

- Frontend: `3000`
- Backend: `8000`

If either port is already in use, stop the other process or change the port mapping in `docker-compose.yml`.

To find common port conflicts:

```bash
lsof -i :3000
lsof -i :8000
```

## Troubleshooting

### Frontend says `Backend disconnected`

Check the backend first:

```bash
curl http://localhost:8000/health
```

If this fails, the backend container is not running or port `8000` is blocked.

If the health check works but the frontend still cannot connect, rebuild the frontend with the correct API URL:

```bash
docker compose down
docker compose up --build
```

For a VM or remote host, use:

```bash
NEXT_PUBLIC_API_URL=http://YOUR_HOST_OR_IP:8000 \
CORS_ORIGINS=http://YOUR_HOST_OR_IP:3000,http://localhost:3000 \
docker compose up --build
```

### Browser shows a CORS error

Make sure the frontend origin is included in `CORS_ORIGINS`.

Examples:

```bash
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 docker compose up --build
```

For a VM:

```bash
CORS_ORIGINS=http://192.168.1.174:3000 docker compose up --build
```

### Changes are not showing up

Rebuild the containers:

```bash
docker compose down
docker compose up --build
```

If Docker is still using stale layers:

```bash
docker compose build --no-cache
docker compose up
```

### View logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop the app

```bash
docker compose down
```

## Local Development Without Docker

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000.
