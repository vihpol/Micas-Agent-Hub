import os
from typing import Any

from app.schemas import AnalyzeResponse, AgentTraceItem, Category, OutputType


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
        timeout=60,
        max_tokens=180,
    )

    analyzer = Agent(
        role="Analyzer Agent",
        goal="Classify the request and extract the core intent, urgency, and context.",
        backstory="You are careful at turning messy business requests into concise intake notes.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=1,
        max_retry_limit=0,
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
        max_iter=1,
        max_retry_limit=0,
    )
    risk = Agent(
        role="Risk Agent",
        goal="Find missing information, blockers, risks, and assumptions.",
        backstory="You are skeptical in a useful way and look for gaps before work begins.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=1,
        max_retry_limit=0,
    )
    writer = Agent(
        role="Writer Agent",
        goal=f"Draft the requested {output_type} output clearly and professionally.",
        backstory="You turn analysis into concise, usable business writing.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=1,
        max_retry_limit=0,
    )
    reviewer = Agent(
        role="Reviewer Agent",
        goal="Validate the final response and return only structured JSON.",
        backstory="You enforce schema compliance and make sure the answer is ready for the UI.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=1,
        max_retry_limit=0,
    )

    analyzer_task = Task(
        description=(
            "Analyze this pasted request for the Micas AgentHub UI.\n"
            f"Department category: {category}\n"
            f"Requested output type: {output_type}\n"
            f"Request:\n{request}\n\n"
            "Return 2 short sentences: core ask, context, urgency, and intent."
        ),
        expected_output="Two short sentences with the core ask and urgency.",
        agent=analyzer,
    )
    specialist_task = Task(
        description=(
            f"Using the analyzer findings, add {category} department-specific guidance. "
            "Return 2 short sentences on what the owner should understand before acting."
        ),
        expected_output=f"Two short sentences of {category} guidance.",
        agent=specialist,
        context=[analyzer_task],
    )
    risk_task = Task(
        description=(
            "Review the analyzer and specialist findings. Identify missing information, "
            "risks, blockers, and assumptions. Return 3 short bullet lines."
        ),
        expected_output="Three short bullet lines with missing information or risks.",
        agent=risk,
        context=[analyzer_task, specialist_task],
    )
    writer_task = Task(
        description=(
            f"Draft the requested {output_type}. Keep it practical, clear, and suitable "
            "for an internal SaaS dashboard output. Return one compact paragraph."
        ),
        expected_output=f"One compact paragraph for the {output_type}.",
        agent=writer,
        context=[analyzer_task, specialist_task, risk_task],
    )
    reviewer_task = Task(
        description=(
            "Review the prior outputs for clarity and readiness. Return one sentence "
            "stating whether the response is ready and what to verify next."
        ),
        expected_output="One short review sentence.",
        agent=reviewer,
        context=[analyzer_task, specialist_task, risk_task, writer_task],
    )

    crew = Crew(
        agents=[analyzer, specialist, risk, writer, reviewer],
        tasks=[analyzer_task, specialist_task, risk_task, writer_task, reviewer_task],
        process=Process.sequential,
        verbose=False,
    )

    try:
        crew.kickoff()
    except Exception as exc:
        raise CrewAIWorkflowError(f"CrewAI kickoff failed: {exc}") from exc

    analyzer_output = _task_output(analyzer_task)
    specialist_output = _task_output(specialist_task)
    risk_output = _task_output(risk_task)
    writer_output = _task_output(writer_task)
    reviewer_output = _task_output(reviewer_task)

    return AnalyzeResponse(
        summary=analyzer_output,
        analysis=specialist_output,
        missing_information=_lines_or_default(
            risk_output,
            [
                "Confirm deadline and owner.",
                "Confirm customer or internal stakeholder context.",
                "Confirm any constraints before taking action.",
            ],
        ),
        recommended_next_steps=_recommended_steps(category, output_type, reviewer_output),
        draft_output=writer_output,
        assumptions=[
            "CrewAI ran against the configured Ollama model.",
            "The response is based only on the pasted request.",
            reviewer_output,
        ],
        agent_trace=[
            AgentTraceItem(
                agent="Analyzer Agent",
                role="Classifies the request and extracts intent, urgency, and context.",
                output=analyzer_output,
            ),
            AgentTraceItem(
                agent="Specialist Agent",
                role=f"Applies {category} department expertise to the request.",
                output=specialist_output,
            ),
            AgentTraceItem(
                agent="Risk Agent",
                role="Checks missing information, blockers, risks, and assumptions.",
                output=risk_output,
            ),
            AgentTraceItem(
                agent="Writer Agent",
                role=f"Drafts the selected {output_type} output.",
                output=writer_output,
            ),
            AgentTraceItem(
                agent="Reviewer Agent",
                role="Reviews clarity and readiness before returning the result.",
                output=reviewer_output,
            ),
        ],
    )


def _task_output(task: Any) -> str:
    output = getattr(task, "output", None)
    raw = getattr(output, "raw", None)
    if isinstance(raw, str) and raw.strip():
        return _compact(raw)

    if output is not None:
        text = str(output).strip()
        if text:
            return _compact(text)

    return "Agent completed, but did not return text."


def _compact(text: str, limit: int = 700) -> str:
    compacted = " ".join(text.replace("```", "").split())
    if len(compacted) <= limit:
        return compacted

    return f"{compacted[: limit - 3]}..."


def _lines_or_default(text: str, default: list[str]) -> list[str]:
    lines = [
        line.strip(" -•\t")
        for line in text.splitlines()
        if line.strip(" -•\t")
    ]
    if not lines:
        lines = [item.strip(" -•\t") for item in text.split(".") if item.strip(" -•\t")]

    return lines[:4] or default


def _recommended_steps(
    category: Category,
    output_type: OutputType,
    reviewer_output: str,
) -> list[str]:
    return [
        f"Review the generated {output_type.lower()} for {category.lower()} context.",
        "Fill in any missing details before sending or assigning the work.",
        reviewer_output,
    ]
