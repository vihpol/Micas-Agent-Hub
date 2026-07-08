from app.schemas import AnalyzeRequest, AnalyzeResponse, AgentTraceItem


CATEGORY_CONTEXT = {
    "Sales": {
        "focus": "customer intent, urgency, account context, and next commercial step",
        "agent": "Sales Intake Agent",
        "role": "Qualifies the request and identifies revenue-facing follow-up.",
    },
    "Operations": {
        "focus": "workflow ownership, blockers, timing, and process handoff",
        "agent": "Operations Triage Agent",
        "role": "Organizes the request into an actionable internal workflow.",
    },
    "Networking": {
        "focus": "technical scope, affected systems, risks, and validation steps",
        "agent": "Networking Diagnostic Agent",
        "role": "Frames the issue for infrastructure review and troubleshooting.",
    },
    "Marketing": {
        "focus": "audience, message, channel, timeline, and campaign intent",
        "agent": "Marketing Brief Agent",
        "role": "Turns the request into a clear marketing brief and content direction.",
    },
}


OUTPUT_GUIDANCE = {
    "Summary": "Return a concise overview that captures the core ask.",
    "Reply Draft": "Prepare a polished response draft that can be edited before sending.",
    "Checklist": "Break the work into a practical checklist.",
    "Follow-up Questions": "List the questions needed to remove ambiguity.",
    "Action Plan": "Create a step-by-step action plan with ownership cues.",
}


def build_mock_analysis(payload: AnalyzeRequest) -> AnalyzeResponse:
    category_context = CATEGORY_CONTEXT[payload.category]
    output_guidance = OUTPUT_GUIDANCE[payload.output_type]
    request_preview = _preview_text(payload.request)

    return AnalyzeResponse(
        summary=(
            f"{payload.category} request received for output type: {payload.output_type}. "
            f"Initial read: {request_preview}"
        ),
        analysis=(
            f"This mock analysis focuses on {category_context['focus']}. "
            f"The selected output type suggests this response should: {output_guidance}"
        ),
        missing_information=_missing_information_for(payload.category),
        recommended_next_steps=_next_steps_for(payload.category, payload.output_type),
        draft_output=_draft_output_for(payload),
        assumptions=[
            "The pasted request is the full available context.",
            "No customer, system, or campaign records have been queried yet.",
            "This is mocked backend output and does not call an LLM.",
        ],
        agent_trace=[
            AgentTraceItem(
                agent="Request Router",
                role="Routes the request to the selected department workflow.",
                output=f"Selected {payload.category} based on the submitted category.",
            ),
            AgentTraceItem(
                agent=category_context["agent"],
                role=category_context["role"],
                output=f"Prepared mock guidance for {payload.output_type}.",
            ),
            AgentTraceItem(
                agent="Response Composer",
                role="Shapes the final response fields for the dashboard.",
                output="Returned structured mock output for frontend integration.",
            ),
        ],
    )


def _preview_text(request: str) -> str:
    compact_request = " ".join(request.split())
    if len(compact_request) <= 140:
        return compact_request

    return f"{compact_request[:137]}..."


def _missing_information_for(category: str) -> list[str]:
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


def _next_steps_for(category: str, output_type: str) -> list[str]:
    return [
        f"Review the pasted request with the {category} owner.",
        f"Confirm the desired {output_type.lower()} format before sending externally.",
        "Fill in missing context before treating this as final output.",
    ]


def _draft_output_for(payload: AnalyzeRequest) -> str:
    if payload.output_type == "Reply Draft":
        return (
            f"Hi, thanks for sending this over. I reviewed the {payload.category.lower()} "
            "request and will confirm the missing details before proposing next steps."
        )

    if payload.output_type == "Checklist":
        return (
            "- Confirm owner and deadline\n"
            f"- Review {payload.category.lower()} context\n"
            "- Resolve missing information\n"
            "- Prepare final response"
        )

    if payload.output_type == "Follow-up Questions":
        return (
            "1. Who owns the next decision?\n"
            "2. What deadline should this be handled against?\n"
            "3. What context is missing from the pasted request?"
        )

    if payload.output_type == "Action Plan":
        return (
            f"1. Triage the request with the {payload.category} team.\n"
            "2. Collect missing information.\n"
            "3. Draft the response or task plan.\n"
            "4. Review and send once validated."
        )

    return (
        f"This {payload.category.lower()} request needs review, missing-context checks, "
        "and a clear next-step recommendation before it is finalized."
    )
