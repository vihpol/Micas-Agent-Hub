# Micas AgentHub

Simple starter project with a Next.js frontend and FastAPI backend.

## Structure

```text
micas-agenthub/
  frontend/   Next.js + TypeScript + Tailwind
  backend/    FastAPI + Python
```

## Run With Docker Compose

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

## Run Locally

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
npm run dev
```

The frontend expects the backend at `http://localhost:8000` by default. Override it with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```
