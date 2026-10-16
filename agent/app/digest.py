"""Daily email digest via Resend (optional). Skipped if RESEND_API_KEY is not set."""

from __future__ import annotations

import html
import logging
from typing import Any

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)


def send_digest(profile: dict[str, Any], matches: list[dict[str, Any]], tenders: dict[str, dict[str, Any]]) -> None:
    settings = get_settings()
    if not settings.resend_api_key or not profile.get("email") or not matches:
        return

    rows = []
    for m in sorted(matches, key=lambda x: x["score"], reverse=True):
        t = tenders.get(m["tender_id"], {})
        link = f"{settings.app_url}/dashboard/tenders/{m['id']}"
        rows.append(
            f'<tr><td style="padding:12px 0;border-bottom:1px solid #CBD5E1">'
            f'<a href="{html.escape(link)}" style="color:#16243A;font-weight:600;text-decoration:none">'
            f'{html.escape(t.get("title", "Tender"))}</a><br>'
            f'<span style="color:#4A5A70;font-size:14px">{html.escape(t.get("buyer") or "")} '
            f'&nbsp; Fit {m["score"]}</span></td></tr>'
        )

    count = len(matches)
    body = (
        '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#16243A">'
        f'<h2 style="margin:0 0 8px">{count} tender{"s" if count != 1 else ""} worth a look</h2>'
        '<p style="color:#4A5A70;margin:0 0 16px">Your BidRadar shortlist for today.</p>'
        f'<table style="width:100%;border-collapse:collapse">{"".join(rows)}</table>'
        f'<p style="margin-top:24px"><a href="{html.escape(settings.app_url)}/dashboard" '
        'style="background:#16243A;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">'
        'Open your shortlist</a></p></div>'
    )

    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.digest_from,
                "to": [profile["email"]],
                "subject": f"BidRadar: {count} tender{'s' if count != 1 else ''} worth a look",
                "html": body,
            },
            timeout=15,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        log.warning("Digest email failed for %s: %s", profile.get("id"), exc)
