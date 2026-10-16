from app.sources.find_a_tender import normalize


def test_normalize_release():
    release = {
        "ocid": "ocds-h6vhtk-0abc12",
        "id": "087858-2026",
        "date": "2026-10-15T09:00:00Z",
        "buyer": {"name": "Example Council"},
        "tender": {
            "title": "Website redesign",
            "description": "New council website",
            "value": {"amount": 45000, "currency": "GBP"},
            "tenderPeriod": {"endDate": "2026-11-03T12:00:00Z"},
            "classification": {"scheme": "CPV", "id": "72413000"},
            "items": [{"deliveryAddresses": [{"region": "UKD34"}]}],
        },
    }
    row = normalize(release)
    assert row["id"] == "ocds-h6vhtk-0abc12"
    assert row["url"] == "https://www.find-tender.service.gov.uk/Notice/087858-2026"
    assert row["cpv_codes"] == ["72413000"]
    assert row["regions"] == ["UKD34"]
    assert row["buyer"] == "Example Council"


def test_normalize_skips_untitled():
    assert normalize({"ocid": "x", "tender": {}}) is None
