"""UK Find a Tender Service: official OCDS API, free, no key required.

Docs: https://www.find-tender.service.gov.uk/apidocumentation/1.0/GET-ocdsReleasePackages
Data is published under the Open Government Licence v3.0.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any
from urllib.parse import quote_plus

import httpx

log = logging.getLogger(__name__)

BASE_URL = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages"
NOTICE_ID = re.compile(r"^\d{6}-\d{4}$")


def fetch_since(since: datetime, max_pages: int = 30) -> list[dict[str, Any]]:
    """Fetch open-tender notices updated since `since`, following pagination."""
    params: dict[str, Any] | None = {
        "updatedFrom": since.strftime("%Y-%m-%dT%H:%M:%S"),
        "stages": "tender",
        "limit": 100,
    }
    url = BASE_URL
    tenders: list[dict[str, Any]] = []

    with httpx.Client(timeout=30, headers={"User-Agent": "BidRadar/0.1"}) as client:
        for _ in range(max_pages):
            resp = client.get(url, params=params)
            resp.raise_for_status()
            package = resp.json()
            for release in package.get("releases", []):
                tender = normalize(release)
                if tender:
                    tenders.append(tender)
            next_url = (package.get("links") or {}).get("next")
            if not next_url:
                break
            url, params = next_url, None

    log.info("Find a Tender: fetched %d notices", len(tenders))
    return tenders


def normalize(release: dict[str, Any]) -> dict[str, Any] | None:
    """Flatten one OCDS release into a row for the `tenders` table."""
    tender = release.get("tender") or {}
    title = (tender.get("title") or "").strip()
    ocid = release.get("ocid")
    if not title or not ocid:
        return None

    buyer = (release.get("buyer") or {}).get("name")
    if not buyer:
        buyer = next(
            (p.get("name") for p in release.get("parties") or [] if "buyer" in (p.get("roles") or [])),
            None,
        )

    cpv_codes: set[str] = set()
    regions: set[str] = set()
    classification = tender.get("classification") or {}
    if classification.get("scheme") == "CPV" and classification.get("id"):
        cpv_codes.add(str(classification["id"]))
    for item in tender.get("items") or []:
        for cls in [item.get("classification")] + (item.get("additionalClassifications") or []):
            if cls and cls.get("scheme") == "CPV" and cls.get("id"):
                cpv_codes.add(str(cls["id"]))
        for address in item.get("deliveryAddresses") or []:
            if address.get("region"):
                regions.add(str(address["region"]))

    notice_id = str(release.get("id") or "")
    if NOTICE_ID.match(notice_id):
        url = f"https://www.find-tender.service.gov.uk/Notice/{notice_id}"
    else:
        url = f"https://www.find-tender.service.gov.uk/Search/Results?keywords={quote_plus(title)}"

    value = tender.get("value") or {}
    return {
        "id": ocid,
        "source": "uk-find-a-tender",
        "notice_id": notice_id or None,
        "title": title[:500],
        "description": (tender.get("description") or "")[:8000] or None,
        "buyer": buyer,
        "value_amount": value.get("amount"),
        "currency": value.get("currency"),
        "deadline": (tender.get("tenderPeriod") or {}).get("endDate"),
        "published_at": release.get("date"),
        "url": url,
        "cpv_codes": sorted(cpv_codes),
        "regions": sorted(regions),
    }
