import json
import os
import urllib.error
import urllib.request

from app.schemas import AnalyzeResponse, AgentTraceItem, Category, OutputType


class OllamaWorkflowError(RuntimeError):
    """Raised when Ollama cannot produce the expected agent outputs."""


AGENT_STEPS = [
    (
        "Analyzer Agent",
        "Classifies the request and extracts intent, urgency, and context.",
        "Return two short sentences that identify the core ask, context, and urgency.",
    ),
    (
        "Specialist Agent",
        "Applies department expertise to the request.",
        "Return two short sentences with department-specific guidance.",
    ),
    (
        "Risk Agent",
        "Checks missing information, blockers, risks, and assumptions.",
        "Return three short missing-information or risk items.",
    ),
    (
        "Writer Agent",
        "Drafts the selected output.",
        "Return one compact paragraph for the requested output type.",
    ),
    (
        "Reviewer Agent",
        "Reviews clarity and readiness before returning the result.",
        "Return one sentence with what should be verified before using this output.",
    ),
]


def run_ollama_department_workflow(
    category: Category,
    output_type: OutputType,
    request: str,
) -> AnalyzeResponse:
    """Run a lightweight local Ollama workflow with five sequential agent calls."""

    outputs: dict[str, str] = {}
    prior_context = ""

    for agent, role, instruction in AGENT_STEPS:
        output = _run_ollama_agent(
            agent=agent,
            role=role,
            instruction=instruction,
            category=category,
            output_type=output_type,
            request=request,
            prior_context=prior_context,
        )
        outputs[agent] = output
        prior_context = f"{prior_context}\n{agent}: {output}".strip()

    risk_output = outputs["Risk Agent"]
    reviewer_output = outputs["Reviewer Agent"]

    return AnalyzeResponse(
        summary=outputs["Analyzer Agent"],
        analysis=outputs["Specialist Agent"],
        missing_information=_lines_or_default(
            risk_output,
            [
                "Confirm deadline and owner.",
                "Confirm customer or internal stakeholder context.",
                "Confirm any constraints before taking action.",
            ],
        ),
        recommended_next_steps=[
            f"Review the generated {output_type.lower()} for {category.lower()} context.",
            "Fill in missing details before sending or assigning the work.",
            reviewer_output,
        ],
        draft_output=outputs["Writer Agent"],
        assumptions=[
            "Ollama ran locally in Docker.",
            "The response is based only on the pasted request.",
            reviewer_output,
        ],
        agent_trace=[
            AgentTraceItem(agent=agent, role=role, output=outputs[agent])
            for agent, role, _instruction in AGENT_STEPS
        ],
    )


def _run_ollama_agent(
    agent: str,
    role: str,
    instruction: str,
    category: Category,
    output_type: OutputType,
    request: str,
    prior_context: str,
) -> str:
    base_url = os.getenv("OLLAMA_API_BASE", "http://ollama:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", os.getenv("CREWAI_LLM_MODEL", "tinyllama"))
    if model.startswith("ollama_chat/"):
        model = model.removeprefix("ollama_chat/")

    prompt = (
        "You are working inside Micas AgentHub.\n"
        f"Agent: {agent}\n"
        f"Role: {role}\n"
        f"Department: {category}\n"
        f"Output type: {output_type}\n"
        f"Request: {request}\n"
        f"Prior agent context: {prior_context or 'None yet.'}\n\n"
        f"{instruction}\n"
        "Keep the answer concise. Do not use Markdown tables."
    )
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 90,
            "temperature": 0.2,
        },
    }
    body = json.dumps(payload).encode("utf-8")
    request_obj = urllib.request.Request(
        f"{base_url}/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request_obj, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise OllamaWorkflowError(f"{agent} failed to call Ollama: {exc}") from exc

    text = str(data.get("response", "")).strip()
    if not text:
        raise OllamaWorkflowError(f"{agent} returned an empty Ollama response.")

    return _compact(text)


def _compact(text: str, limit: int = 700) -> str:
    compacted = " ".join(text.replace("```", "").split())
    if len(compacted) <= limit:
        return compacted

    return f"{compacted[: limit - 3]}..."


def _lines_or_default(text: str, default: list[str]) -> list[str]:
    lines = [
        line.strip(" -•\t0123456789.")
        for line in text.splitlines()
        if line.strip(" -•\t0123456789.")
    ]
    if not lines:
        lines = [
            item.strip(" -•\t0123456789.")
            for item in text.split(".")
            if item.strip(" -•\t0123456789.")
        ]

    return lines[:4] or default
