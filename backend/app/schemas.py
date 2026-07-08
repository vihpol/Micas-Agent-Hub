from typing import Literal

from pydantic import BaseModel, Field


Category = Literal["Sales", "Operations", "Networking", "Marketing"]
OutputType = Literal[
    "Summary",
    "Reply Draft",
    "Checklist",
    "Follow-up Questions",
    "Action Plan",
]


class AnalyzeRequest(BaseModel):
    category: Category
    output_type: OutputType
    request: str = Field(..., min_length=1)


class AgentTraceItem(BaseModel):
    agent: str
    role: str
    output: str


class AnalyzeResponse(BaseModel):
    summary: str
    analysis: str
    missing_information: list[str]
    recommended_next_steps: list[str]
    draft_output: str
    assumptions: list[str]
    agent_trace: list[AgentTraceItem]
