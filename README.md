# Micas AgentHub

Micas AgentHub is a simple starter app with:

- `frontend`: Next.js + TypeScript + Tailwind
- `backend`: FastAPI + Python
- `docker-compose.yml`: runs both services together

The backend exposes `/health` and `/analyze`. Mocked workflow data is used by default. Optional CrewAI support can be enabled with environment variables when you are ready to use real LLM-backed agents.

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
INSTALL_CREWAI=false
USE_REAL_AGENTS=false
CREWAI_LLM_MODEL=ollama_chat/tinyllama
OLLAMA_API_BASE=http://ollama:11434
OLLAMA_IMAGE=ollama/ollama:0.1.48
OLLAMA_MODEL=tinyllama
```

For normal local development, you do not need to set anything.

If you are running the app on another machine or VM and opening it from your laptop, set both values to the machine's reachable IP or hostname:

```bash
NEXT_PUBLIC_API_URL=http://192.168.1.174:8000 \
CORS_ORIGINS=http://192.168.1.174:3000,http://localhost:3000 \
docker compose up --build
```

Important: `NEXT_PUBLIC_API_URL` is baked into the Next.js browser bundle during build. If you change it, rebuild with `docker compose up --build`.

## Real CrewAI Agents With Ollama

`/analyze` keeps the same request and response contract whether it uses mock data or real agents.

By default, real agents are off:

```bash
docker compose up --build
```

To run real CrewAI agents against an Ollama container:

```bash
COMPOSE_PROFILES=agents \
INSTALL_CREWAI=true \
USE_REAL_AGENTS=true \
docker compose up --build
```

This starts:

- `backend`
- `frontend`
- `ollama`
- `ollama-pull`, which downloads `tinyllama` by default

The Ollama service is available to the backend inside Docker at `http://ollama:11434`. It is not published to the host by default, which avoids conflicts if your machine or VM already has Ollama running on port `11434`.

The first run can take several minutes because Docker must pull the Ollama image and Ollama must download the model.

Optional model override:

```bash
OLLAMA_MODEL=llama3.2:3b
CREWAI_LLM_MODEL=ollama_chat/llama3.2:3b
OLLAMA_IMAGE=ollama/ollama:latest
```

The default uses a smaller pinned Ollama image and `tinyllama` so small VMs can run real-agent mode without immediately filling the disk. Use the optional override above if you have more disk and want a stronger model.

Fallback behavior:

- If `USE_REAL_AGENTS=false`, the backend uses the mock workflow.
- If `USE_REAL_AGENTS=true` but CrewAI is not installed, the backend uses the mock fallback response.
- If `USE_REAL_AGENTS=true` but Ollama is unavailable or the model is not ready, the backend uses the mock fallback response.
- If CrewAI or the LLM fails, the backend returns the same structured `/analyze` response shape with a clear fallback note instead of breaking the frontend.

For a VM or remote host:

```bash
COMPOSE_PROFILES=agents \
INSTALL_CREWAI=true \
USE_REAL_AGENTS=true \
NEXT_PUBLIC_API_URL=http://YOUR_HOST_OR_IP:8000 \
CORS_ORIGINS=http://YOUR_HOST_OR_IP:3000,http://localhost:3000 \
docker compose up --build
```

For local Python development with real agents and a separately running Ollama server:

```bash
cd backend
pip install -r requirements.txt
pip install -r requirements-agents.txt
USE_REAL_AGENTS=true \
OLLAMA_API_BASE=http://localhost:11434 \
CREWAI_LLM_MODEL=ollama_chat/tinyllama \
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

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
