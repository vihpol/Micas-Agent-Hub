import json
import os
from typing import Any

from pydantic import ValidationError

from app.schemas import AnalyzeResponse, Category, OutputType


class CrewAIWorkflowError(RuntimeError):
    """Raised when CrewAI cannot produce the expected structured response."""


def run_crewai_department_workflow(
    category: Category,
    output_type: OutputType,
    request: str,
) -> AnalyzeResponse:
    """Run the real CrewAI workflow and return the existing API response shape."""

    try:
        from crewai import Agent, Crew, LLM, Process, Task
    except ImportError as exc:
        raise CrewAIWorkflowError(
            "CrewAI is not installed. Install backend/requirements-agents.txt "
            "or build Docker with INSTALL_CREWAI=true."
        ) from exc

    ollama_base_url = os.getenv("OLLAMA_API_BASE", "http://ollama:11434")
    model_name = os.getenv("CREWAI_LLM_MODEL", "ollama_chat/tinyllama")
    llm = LLM(
        model=model_name,
        base_url=ollama_base_url,
        temperature=0.2,
        timeout=180,
    )

    analyzer = Agent(
        role="Analyzer Agent",
        goal="Classify the request and extract the core intent, urgency, and context.",
        backstory="You are careful at turning messy business requests into concise intake notes.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=3,
        max_retry_limit=1,
    )
    specialist = Agent(
        role="Specialist Agent",
        goal=f"Apply {category} department expertise to the request.",
        backstory=(
            f"You understand {category} work and can identify the practical next "
            "steps a department owner would need."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=3,
        max_retry_limit=1,
    )
    risk = Agent(
        role="Risk Agent",
        goal="Find missing information, blockers, risks, and assumptions.",
        backstory="You are skeptical in a useful way and look for gaps before work begins.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=3,
        max_retry_limit=1,
    )
    writer = Agent(
        role="Writer Agent",
        goal=f"Draft the requested {output_type} output clearly and professionally.",
        backstory="You turn analysis into concise, usable business writing.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=3,
        max_retry_limit=1,
    )
    reviewer = Agent(
        role="Reviewer Agent",
        goal="Validate the final response and return only structured JSON.",
        backstory="You enforce schema compliance and make sure the answer is ready for the UI.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=3,
        max_retry_limit=1,
    )

    analyzer_task = Task(
        description=(
            "Analyze this pasted request for the Micas AgentHub UI.\n"
            f"Department category: {category}\n"
            f"Requested output type: {output_type}\n"
            f"Request:\n{request}\n\n"
            "Identify the core ask, relevant context, urgency, and intent."
        ),
        expected_output="A concise intake analysis with core ask, context, urgency, and intent.",
        agent=analyzer,
    )
    specialist_task = Task(
        description=(
            f"Using the analyzer findings, add {category} department-specific guidance. "
            "Focus on what the department owner should understand before acting."
        ),
        expected_output=f"Department-specific {category} guidance for the selected output type.",
        agent=specialist,
        context=[analyzer_task],
    )
    risk_task = Task(
        description=(
            "Review the analyzer and specialist findings. Identify missing information, "
            "risks, blockers, and assumptions that should be surfaced to the user."
        ),
        expected_output="A list of missing information, risks, blockers, and assumptions.",
        agent=risk,
        context=[analyzer_task, specialist_task],
    )
    writer_task = Task(
        description=(
            f"Draft the requested {output_type}. Keep it practical, clear, and suitable "
            "for an internal SaaS dashboard output."
        ),
        expected_output=f"A polished {output_type} draft plus recommended next steps.",
        agent=writer,
        context=[analyzer_task, specialist_task, risk_task],
    )
    reviewer_task = Task(
        description=(
            "Create the final response as structured JSON only. It must match this exact shape:\n"
            "{\n"
            '  "summary": "string",\n'
            '  "analysis": "string",\n'
            '  "missing_information": ["string"],\n'
            '  "recommended_next_steps": ["string"],\n'
            '  "draft_output": "string",\n'
            '  "assumptions": ["string"],\n'
            '  "agent_trace": [\n'
            '    {"agent": "Analyzer Agent", "role": "string", "output": "string"},\n'
            '    {"agent": "Specialist Agent", "role": "string", "output": "string"},\n'
            '    {"agent": "Risk Agent", "role": "string", "output": "string"},\n'
            '    {"agent": "Writer Agent", "role": "string", "output": "string"},\n'
            '    {"agent": "Reviewer Agent", "role": "string", "output": "string"}\n'
            "  ]\n"
            "}\n\n"
            "The agent_trace must contain exactly those five agents in that order. "
            "Do not include Markdown fences or explanatory text outside the JSON."
        ),
        expected_output="A valid JSON object matching the AnalyzeResponse schema.",
        agent=reviewer,
        context=[analyzer_task, specialist_task, risk_task, writer_task],
        output_pydantic=AnalyzeResponse,
    )

    crew = Crew(
        agents=[analyzer, specialist, risk, writer, reviewer],
        tasks=[analyzer_task, specialist_task, risk_task, writer_task, reviewer_task],
        process=Process.sequential,
        verbose=False,
    )

    try:
        result = crew.kickoff()
    except Exception as exc:
        raise CrewAIWorkflowError(f"CrewAI kickoff failed: {exc}") from exc

    return _coerce_crewai_result(result)


def _coerce_crewai_result(result: Any) -> AnalyzeResponse:
    pydantic_result = getattr(result, "pydantic", None)
    if isinstance(pydantic_result, AnalyzeResponse):
        return pydantic_result

    json_dict = getattr(result, "json_dict", None)
    if isinstance(json_dict, dict):
        return _validate_response(json_dict)

    if isinstance(result, dict):
        return _validate_response(result)

    raw = getattr(result, "raw", None)
    if isinstance(raw, str):
        try:
            return _validate_response(json.loads(raw))
        except json.JSONDecodeError as exc:
            raise CrewAIWorkflowError(
                "CrewAI returned text that was not valid JSON."
            ) from exc

    try:
        return _validate_response(json.loads(str(result)))
    except (json.JSONDecodeError, TypeError) as exc:
        raise CrewAIWorkflowError(
            "CrewAI did not return a parseable structured response."
        ) from exc


def _validate_response(data: dict[str, Any]) -> AnalyzeResponse:
    try:
        return AnalyzeResponse.model_validate(data)
    except ValidationError as exc:
        raise CrewAIWorkflowError(
            "CrewAI returned JSON that did not match the /analyze response schema."
        ) from exc
