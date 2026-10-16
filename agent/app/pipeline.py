"""Jobs: collect new tenders, run the agent for each user, save matches, send digests."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.agent.graph import build_graph
from app.db import get_db
from app.digest import send_digest
from app.sources import find_a_tender

log = logging.getLogger(__name__)
CHUNK = 200


def _now() -> datetime:
    return datetime.now(timezone.utc)


def ingest(hours: int = 26) -> int:
    """Fetch tenders updated in the last `hours` and upsert them."""
    tenders = find_a_tender.fetch_since(_now() - timedelta(hours=hours))
    db = get_db()
    for i in range(0, len(tenders), CHUNK):
        rows = [{**t, "updated_at": _now().isoformat()} for t in tenders[i:i + CHUNK]]
        db.table("tenders").upsert(rows, on_conflict="id").execute()
    return len(tenders)


def _open_tenders(created_within_hours: int) -> list[dict[str, Any]]:
    since = (_now() - timedelta(hours=created_within_hours)).isoformat()
    now = _now().isoformat()
    resp = (
        get_db().table("tenders").select("*")
        .gte("created_at", since)
        .or_(f"deadline.gt.{now},deadline.is.null")
        .limit(1000)
        .execute()
    )
    return resp.data or []


def _eligible(profile: dict[str, Any]) -> bool:
    status = profile.get("subscription_status")
    if status == "active":
        return True
    if status == "trialing":
        ends = profile.get("trial_ends_at")
        return bool(ends) and datetime.fromisoformat(ends.replace("Z", "+00:00")) > _now()
    return False


def _profiles(user_id: str | None = None) -> list[dict[str, Any]]:
    query = get_db().table("profiles").select("*").eq("onboarded", True)
    if user_id:
        query = query.eq("id", user_id)
    return [p for p in (query.execute().data or []) if _eligible(p)]


def run_for_profile(profile: dict[str, Any], tenders: list[dict[str, Any]]) -> list[dict[str, Any]]:
    db = get_db()
    existing = db.table("matches").select("tender_id").eq("user_id", profile["id"]).execute().data or []
    seen = {row["tender_id"] for row in existing}
    fresh = [t for t in tenders if t["id"] not in seen]
    if not fresh:
        return []

    state = build_graph().invoke({"profile": profile, "tenders": fresh})
    rows = [
        {
            "user_id": profile["id"],
            "tender_id": tender_id,
            "score": r["score"],
            "verdict": r["verdict"],
            "reasons": r.get("reasons", []),
            "risks": r.get("risks", []),
            "summary": r.get("summary"),
            "requirements": r.get("requirements", []),
            "draft": r.get("draft"),
        }
        for tender_id, r in (state.get("results") or {}).items()
    ]
    if not rows:
        return []
    resp = db.table("matches").upsert(rows, on_conflict="user_id,tender_id", ignore_duplicates=True).execute()
    return resp.data or []


def _log_run(kind: str, stats: dict[str, Any], started: datetime) -> None:
    get_db().table("agent_runs").insert(
        {"kind": kind, "started_at": started.isoformat(), "finished_at": _now().isoformat(), "stats": stats}
    ).execute()


def run_daily() -> dict[str, Any]:
    started = _now()
    stats: dict[str, Any] = {"ingested": 0, "users": 0, "matches": 0, "errors": 0}
    try:
        stats["ingested"] = ingest(hours=26)
    except Exception:
        log.exception("Ingest failed")
        stats["errors"] += 1

    tenders = _open_tenders(created_within_hours=26)
    tender_map = {t["id"]: t for t in tenders}
    for profile in _profiles():
        try:
            matches = run_for_profile(profile, tenders)
            stats["users"] += 1
            stats["matches"] += len(matches)
            send_digest(profile, matches, tender_map)
        except Exception:
            log.exception("Agent failed for user %s", profile["id"])
            stats["errors"] += 1

    _log_run("daily", stats, started)
    return stats


def run_user(user_id: str) -> dict[str, Any]:
    """First run after onboarding: look back a week so the dashboard isn't empty."""
    started = _now()
    stats: dict[str, Any] = {"user": user_id, "matches": 0}
    tenders = _open_tenders(created_within_hours=24 * 7)
    if not tenders:
        ingest(hours=24 * 7)
        tenders = _open_tenders(created_within_hours=24 * 7)
    for profile in _profiles(user_id):
        stats["matches"] = len(run_for_profile(profile, tenders))
    _log_run("user", stats, started)
    return stats
