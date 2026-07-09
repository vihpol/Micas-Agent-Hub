import os
from typing import TypedDict

from app.schemas import AnalyzeResponse, AgentTraceItem, Category, OutputType


class AnalyzerResult(TypedDict):
    request_preview: str
    trace: AgentTraceItem


class SpecialistResult(TypedDict):
    focus: str
    output_guidance: str
    trace: AgentTraceItem


class RiskResult(TypedDict):
    missing_information: list[str]
    trace: AgentTraceItem


class WriterResult(TypedDict):
    recommended_next_steps: list[str]
    draft_output: str
    trace: AgentTraceItem


class ReviewerResult(TypedDict):
    assumptions: list[str]
    trace: AgentTraceItem


CATEGORY_CONTEXT = {
    "Sales": {
        "focus": "customer intent, urgency, account context, and next commercial step",
        "specialist": "Sales Specialist Agent",
        "specialist_role": "Qualifies the request and identifies revenue-facing follow-up.",
    },
    "Operations": {
        "focus": "workflow ownership, blockers, timing, and process handoff",
        "specialist": "Operations Specialist Agent",
        "specialist_role": "Organizes the request into an actionable internal workflow.",
    },
    "Networking": {
        "focus": "technical scope, affected systems, risks, and validation steps",
        "specialist": "Networking Specialist Agent",
        "specialist_role": "Frames the issue for infrastructure review and troubleshooting.",
    },
    "Marketing": {
        "focus": "audience, message, channel, timeline, and campaign intent",
        "specialist": "Marketing Specialist Agent",
        "specialist_role": "Turns the request into a clear marketing brief and content direction.",
    },
}


OUTPUT_GUIDANCE = {
    "Summary": "Return a concise overview that captures the core ask.",
    "Reply Draft": "Prepare a polished response draft that can be edited before sending.",
    "Checklist": "Break the work into a practical checklist.",
    "Follow-up Questions": "List the questions needed to remove ambiguity.",
    "Action Plan": "Create a step-by-step action plan with ownership cues.",
}


def run_department_workflow(
    category: Category,
    output_type: OutputType,
    request: str,
) -> AnalyzeResponse:
    """Run the configured department workflow.

    Mock responses remain the default so local Docker development works without
    agent dependencies or API keys. Set USE_REAL_AGENTS=true and provide an
    OPENAI_API_KEY to attempt the CrewAI workflow.
    """

    if not _should_use_real_agents():
        return run_mock_department_workflow(category, output_type, request)

    try:
        from app.workflows.crewai_department_workflow import (
            run_crewai_department_workflow,
        )

        return run_crewai_department_workflow(category, output_type, request)
    except Exception as exc:
        return _mock_response_with_agent_error(
            category=category,
            output_type=output_type,
            request=request,
            error=str(exc),
        )


def run_mock_department_workflow(
    category: Category,
    output_type: OutputType,
    request: str,
) -> AnalyzeResponse:
    """Mock department workflow.

    The agent step functions below are intentionally small and isolated so they
    can be replaced by CrewAI agents or tasks without changing the API route.
    """

    analyzer_result = _run_analyzer_agent(request)
    specialist_result = _run_specialist_agent(category, output_type)
    risk_result = _run_risk_missing_info_agent(category)
    writer_result = _run_writer_agent(category, output_type)
    reviewer_result = _run_reviewer_agent()

    return AnalyzeResponse(
        summary=(
            f"{category} request received for output type: {output_type}. "
            f"Initial read: {analyzer_result['request_preview']}"
        ),
        analysis=(
            f"This mock analysis focuses on {specialist_result['focus']}. "
            f"The selected output type suggests this response should: "
            f"{specialist_result['output_guidance']}"
        ),
        missing_information=risk_result["missing_information"],
        recommended_next_steps=writer_result["recommended_next_steps"],
        draft_output=writer_result["draft_output"],
        assumptions=reviewer_result["assumptions"],
        agent_trace=[
            analyzer_result["trace"],
            specialist_result["trace"],
            risk_result["trace"],
            writer_result["trace"],
            reviewer_result["trace"],
        ],
    )


def _should_use_real_agents() -> bool:
    use_real_agents = os.getenv("USE_REAL_AGENTS", "false").strip().lower()
    has_api_key = bool(os.getenv("OPENAI_API_KEY", "").strip())

    return use_real_agents in {"1", "true", "yes", "on"} and has_api_key


def _mock_response_with_agent_error(
    category: Category,
    output_type: OutputType,
    request: str,
    error: str,
) -> AnalyzeResponse:
    response = run_mock_department_workflow(category, output_type, request)
    response.summary = f"Real agent workflow failed; mock fallback used. {response.summary}"
    response.analysis = (
        "CrewAI could not complete the real-agent workflow, so the backend "
        f"returned the mock workflow response instead. Error: {_preview_text(error)}"
    )
    response.assumptions = [
        *response.assumptions,
        "Real agent execution was requested but failed before a valid structured response was returned.",
    ]
    response.agent_trace.append(
        AgentTraceItem(
            agent="Workflow Error Handler",
            role="Catches real-agent failures and preserves the /analyze response contract.",
            output=f"Returned mock fallback after CrewAI error: {_preview_text(error)}",
        )
    )

    return response


def _run_analyzer_agent(request: str) -> AnalyzerResult:
    request_preview = _preview_text(request)

    return {
        "request_preview": request_preview,
        "trace": AgentTraceItem(
            agent="Analyzer Agent",
            role="Reads the pasted request and extracts the initial context.",
            output=f"Captured request preview: {request_preview}",
        ),
    }


def _run_specialist_agent(
    category: Category,
    output_type: OutputType,
) -> SpecialistResult:
    category_context = CATEGORY_CONTEXT[category]
    output_guidance = OUTPUT_GUIDANCE[output_type]

    return {
        "focus": category_context["focus"],
        "output_guidance": output_guidance,
        "trace": AgentTraceItem(
            agent=category_context["specialist"],
            role=category_context["specialist_role"],
            output=f"Prepared {category} guidance for {output_type}.",
        ),
    }


def _run_risk_missing_info_agent(category: Category) -> RiskResult:
    missing_information = _missing_information_for(category)

    return {
        "missing_information": missing_information,
        "trace": AgentTraceItem(
            agent="Risk/Missing Info Agent",
            role="Identifies blockers, missing details, and context gaps.",
            output=f"Found {len(missing_information)} missing-information items.",
        ),
    }


def _run_writer_agent(
    category: Category,
    output_type: OutputType,
) -> WriterResult:
    return {
        "recommended_next_steps": _next_steps_for(category, output_type),
        "draft_output": _draft_output_for(category, output_type),
        "trace": AgentTraceItem(
            agent="Writer Agent",
            role="Creates the mocked user-facing output.",
            output=f"Drafted response content for {output_type}.",
        ),
    }


def _run_reviewer_agent() -> ReviewerResult:
    assumptions = [
        "The pasted request is the full available context.",
        "No customer, system, or campaign records have been queried yet.",
        "This is mocked backend output and does not call an LLM.",
    ]

    return {
        "assumptions": assumptions,
        "trace": AgentTraceItem(
            agent="Reviewer Agent",
            role="Checks the mock output for structure and handoff readiness.",
            output="Confirmed the response matches the /analyze contract.",
        ),
    }


def _preview_text(request: str) -> str:
    compact_request = " ".join(request.split())
    if len(compact_request) <= 140:
        return compact_request

    return f"{compact_request[:137]}..."


def _missing_information_for(category: Category) -> list[str]:
    common_items = [
        "Requested deadline or urgency",
        "Primary owner or point of contact",
    ]

    category_items = {
        "Sales": ["Customer account name", "Deal stage or opportunity context"],
        "Operations": ["Current process owner", "Known blockers or dependencies"],
        "Networking": [
            "Affected device, service, or environment",
            "Recent changes or error details",
        ],
        "Marketing": ["Target audience", "Preferred channel or campaign goal"],
    }

    return [*common_items, *category_items[category]]


def _next_steps_for(category: Category, output_type: OutputType) -> list[str]:
    return [
        f"Review the pasted request with the {category} owner.",
        f"Confirm the desired {output_type.lower()} format before sending externally.",
        "Fill in missing context before treating this as final output.",
    ]


def _draft_output_for(category: Category, output_type: OutputType) -> str:
    if output_type == "Reply Draft":
        return (
            f"Hi, thanks for sending this over. I reviewed the {category.lower()} "
            "request and will confirm the missing details before proposing next steps."
        )

    if output_type == "Checklist":
        return (
            "- Confirm owner and deadline\n"
            f"- Review {category.lower()} context\n"
            "- Resolve missing information\n"
            "- Prepare final response"
        )

    if output_type == "Follow-up Questions":
        return (
            "1. Who owns the next decision?\n"
            "2. What deadline should this be handled against?\n"
            "3. What context is missing from the pasted request?"
        )

    if output_type == "Action Plan":
        return (
            f"1. Triage the request with the {category} team.\n"
            "2. Collect missing information.\n"
            "3. Draft the response or task plan.\n"
            "4. Review and send once validated."
        )

    return (
        f"This {category.lower()} request needs review, missing-context checks, "
        "and a clear next-step recommendation before it is finalized."
    )
