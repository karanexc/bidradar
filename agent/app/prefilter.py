"""Cheap, deterministic filtering before any AI call.

This keeps AI costs to pennies: only the most promising tenders for each
user are sent to the model for scoring.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


def _parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        try:
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _clean(values: list[str] | None) -> list[str]:
    return [v.strip().lower() for v in values or [] if v and v.strip()]


def rank_candidates(
    profile: dict[str, Any],
    tenders: list[dict[str, Any]],
    limit: int,
    now: datetime | None = None,
) -> list[dict[str, Any]]:
    now = now or datetime.now(timezone.utc)
    keywords = _clean(profile.get("keywords"))
    excludes = _clean(profile.get("exclude_keywords"))
    cpv_prefixes = [p.strip() for p in profile.get("cpv_prefixes") or [] if p.strip()]
    regions = [r.strip().upper() for r in profile.get("regions") or [] if r.strip()]
    min_value = profile.get("min_value")
    max_value = profile.get("max_value")

    ranked: list[dict[str, Any]] = []
    for tender in tenders:
        title = (tender.get("title") or "").lower()
        text = f"{title} {(tender.get('description') or '').lower()}"

        deadline = _parse_dt(tender.get("deadline"))
        if deadline and deadline <= now:
            continue
        if any(word in text for word in excludes):
            continue

        # Value bounds are soft: notices often state ranges or estimates.
        value = tender.get("value_amount")
        if value is not None:
            if min_value and value < float(min_value) * 0.5:
                continue
            if max_value and value > float(max_value) * 2:
                continue

        tender_regions = tender.get("regions") or []
        if regions and "UK" not in regions and tender_regions:
            if not any(tr.upper().startswith(r) or tr.upper() == "UK" for tr in tender_regions for r in regions):
                continue

        keyword_hits = sum(1 for k in keywords if k in text)
        title_hits = sum(1 for k in keywords if k in title)
        cpv_hit = any(code.startswith(p) for code in tender.get("cpv_codes") or [] for p in cpv_prefixes)
        if not keyword_hits and not cpv_hit:
            continue

        score = keyword_hits * 2 + title_hits * 3 + (4 if cpv_hit else 0)
        ranked.append({"tender": tender, "prefilter_score": score})

    ranked.sort(key=lambda c: c["prefilter_score"], reverse=True)
    return ranked[:limit]
