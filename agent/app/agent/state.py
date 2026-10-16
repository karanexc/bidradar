from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    profile: dict[str, Any]
    tenders: list[dict[str, Any]]
    candidates: list[dict[str, Any]]
    # tender_id -> result fields (score, verdict, reasons, risks, summary, requirements, draft)
    results: dict[str, dict[str, Any]]
    # tender_id -> points the reviewer wants fixed
    needs_revision: dict[str, list[str]]
    revision_round: int
