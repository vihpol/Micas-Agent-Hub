import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.workflows.department_workflows import run_department_workflow

app = FastAPI(title="Micas AgentHub API")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.174:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    return run_department_workflow(
        category=payload.category,
        output_type=payload.output_type,
        request=payload.request,
    )
