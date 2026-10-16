"""The BidRadar agent, built with LangGraph.

    prefilter → score → brief → draft → review ─┐
                  │                    ▲         │
                  └─ (no fits) → END   └─ revise ┘ (max one revision) → END
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from langchain.chat_models import init_chat_model
from langgraph.graph import END, START, StateGraph

from app.agent.prompts import brief_messages, draft_messages, review_messages, score_messages
from app.agent.schemas import DraftResponse, DraftReview, FitAssessment, TenderBrief
from app.agent.state import AgentState
from app.config import get_settings
from app.prefilter import rank_candidates

log = logging.getLogger(__name__)
MAX_CONCURRENCY = 5
MAX_ROUNDS = 2  # first draft + one revision


@lru_cache
def _model(name: str):
    return init_chat_model(name, temperature=0)


def _structured(model_name: str, schema):
    return _model(model_name).with_structured_output(schema)


def _tender_map(state: AgentState) -> dict[str, dict[str, Any]]:
    return {c["tender"]["id"]: c["tender"] for c in state.get("candidates", [])}


def prefilter_node(state: AgentState) -> dict:
    settings = get_settings()
    candidates = rank_candidates(state["profile"], state.get("tenders", []), settings.max_candidates_per_user)
    log.info("Prefilter kept %d of %d tenders", len(candidates), len(state.get("tenders", [])))
    return {"candidates": candidates}


def score_node(state: AgentState) -> dict:
    settings = get_settings()
    candidates = state.get("candidates", [])
    if not candidates:
        return {"results": {}}

    llm = _structured(settings.llm_model, FitAssessment)
    outputs = llm.batch(
        [score_messages(state["profile"], c["tender"]) for c in candidates],
        config={"max_concurrency": MAX_CONCURRENCY},
        return_exceptions=True,
    )

    results: dict[str, dict[str, Any]] = {}
    for candidate, out in zip(candidates, outputs):
        if isinstance(out, Exception) or out is None:
            log.warning("Scoring failed for %s: %s", candidate["tender"]["id"], out)
            continue
        if out.verdict == "skip" or out.score < settings.match_threshold:
            continue
        results[candidate["tender"]["id"]] = {
            "score": out.score,
            "verdict": out.verdict,
            "reasons": out.reasons[:3],
            "risks": out.risks[:3],
        }
    return {"results": results}


def brief_node(state: AgentState) -> dict:
    settings = get_settings()
    tenders = _tender_map(state)
    ids = list(state["results"].keys())
    llm = _structured(settings.llm_model, TenderBrief)
    outputs = llm.batch(
        [brief_messages(tenders[i]) for i in ids],
        config={"max_concurrency": MAX_CONCURRENCY},
        return_exceptions=True,
    )
    results = {k: dict(v) for k, v in state["results"].items()}
    for tender_id, out in zip(ids, outputs):
        if isinstance(out, Exception) or out is None:
            continue
        results[tender_id]["summary"] = out.summary
        results[tender_id]["requirements"] = out.requirements[:8]
    return {"results": results}


def draft_node(state: AgentState) -> dict:
    settings = get_settings()
    tenders = _tender_map(state)
    results = {k: dict(v) for k, v in state["results"].items()}
    feedback = state.get("needs_revision") or {}

    if state.get("revision_round", 0) == 0:
        targets = [i for i, r in results.items() if r["score"] >= settings.draft_threshold]
    else:
        targets = list(feedback.keys())
    if not targets:
        return {"results": results}

    llm = _structured(settings.draft_model, DraftResponse)
    outputs = llm.batch(
        [draft_messages(state["profile"], tenders[i], results[i].get("requirements", []), feedback.get(i))
         for i in targets],
        config={"max_concurrency": MAX_CONCURRENCY},
        return_exceptions=True,
    )
    for tender_id, out in zip(targets, outputs):
        if not isinstance(out, Exception) and out is not None:
            results[tender_id]["draft"] = out.draft
            results[tender_id]["_drafted_round"] = state.get("revision_round", 0)
    return {"results": results}


def review_node(state: AgentState) -> dict:
    settings = get_settings()
    tenders = _tender_map(state)
    current_round = state.get("revision_round", 0)
    ids = [i for i, r in state["results"].items() if r.get("draft") and r.get("_drafted_round") == current_round]
    needs: dict[str, list[str]] = {}

    if ids:
        llm = _structured(settings.llm_model, DraftReview)
        outputs = llm.batch(
            [review_messages(tenders[i], state["results"][i].get("requirements", []), state["results"][i]["draft"])
             for i in ids],
            config={"max_concurrency": MAX_CONCURRENCY},
            return_exceptions=True,
        )
        for tender_id, out in zip(ids, outputs):
            if not isinstance(out, Exception) and out is not None and not out.approved and out.missing:
                needs[tender_id] = out.missing[:6]

    return {"needs_revision": needs, "revision_round": current_round + 1}


def after_score(state: AgentState) -> str:
    return "brief" if state.get("results") else END


def after_review(state: AgentState) -> str:
    if state.get("needs_revision") and state.get("revision_round", 0) < MAX_ROUNDS:
        return "draft"
    return END


@lru_cache
def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("prefilter", prefilter_node)
    graph.add_node("score", score_node)
    graph.add_node("brief", brief_node)
    graph.add_node("draft", draft_node)
    graph.add_node("review", review_node)

    graph.add_edge(START, "prefilter")
    graph.add_edge("prefilter", "score")
    graph.add_conditional_edges("score", after_score, ["brief", END])
    graph.add_edge("brief", "draft")
    graph.add_edge("draft", "review")
    graph.add_conditional_edges("review", after_review, ["draft", END])
    return graph.compile()
