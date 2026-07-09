from app.schemas import AnalyzeRequest, AnalyzeResponse
from app.workflows.department_workflows import run_department_workflow


def build_mock_analysis(payload: AnalyzeRequest) -> AnalyzeResponse:
    return run_department_workflow(
        category=payload.category,
        output_type=payload.output_type,
        request=payload.request,
    )
