from datetime import datetime, timezone

from app.prefilter import rank_candidates

NOW = datetime(2026, 10, 16, tzinfo=timezone.utc)

PROFILE = {
    "keywords": ["website", "hosting"],
    "exclude_keywords": ["furniture"],
    "regions": ["UKD"],
    "min_value": 10000,
    "max_value": 100000,
}


def tender(**overrides):
    base = {
        "id": "t1",
        "title": "Website redesign and hosting",
        "description": "Council website",
        "value_amount": 45000,
        "deadline": "2026-11-03T12:00:00Z",
        "regions": ["UKD34"],
        "cpv_codes": [],
    }
    base.update(overrides)
    return base


def test_keeps_matching_tender():
    assert len(rank_candidates(PROFILE, [tender()], 10, NOW)) == 1


def test_drops_closed_tender():
    assert rank_candidates(PROFILE, [tender(deadline="2026-10-01T00:00:00Z")], 10, NOW) == []


def test_drops_excluded_keyword():
    assert rank_candidates(PROFILE, [tender(description="Website for furniture supply")], 10, NOW) == []


def test_drops_other_region():
    assert rank_candidates(PROFILE, [tender(regions=["UKI"])], 10, NOW) == []


def test_drops_far_too_large():
    assert rank_candidates(PROFILE, [tender(value_amount=5_000_000)], 10, NOW) == []


def test_ranks_title_matches_first():
    weak = tender(id="weak", title="Annual services contract", description="Includes some hosting")
    strong = tender(id="strong")
    ranked = rank_candidates(PROFILE, [weak, strong], 10, NOW)
    assert [c["tender"]["id"] for c in ranked] == ["strong", "weak"]
