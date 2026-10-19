"""M009 deterministic NOAA AOML glider source contract tests.

These are deliberately TEST-ONLY fabricated dictionaries used to exercise
input/QC rejection, not product scientific samples or public observation data.
Network evidence and provider rights must be verified separately.
"""
from __future__ import annotations

import pytest

from scripts import fetch_verified_observation_breadth as source


def _fixture_row(*, temp_qc="1", sal_qc="2", oxygen_qc="1", latitude="15.0"):
    return {
        "profile_id": "1414",
        "trajectory": "TEST-ONLY-PLATFORM-NOT-FOR-PRODUCTION",
        "profile_time": "2025-09-15T10:30:00Z",
        "profile_lon": "-66.0",
        "profile_lat": latitude,
        "depth": "31.2",
        "temperature": "22.1",
        "temperature_qc": temp_qc,
        "salinity": "35.1",
        "salinity_qc": sal_qc,
        "aanderaa4831_dissolved_oxygen": "198.2",
        "aanderaa4831_dissolved_oxygen_qc": oxygen_qc,
    }


def test_aoml_source_contract_retains_actual_provider_schema(monkeypatch):
    requests = []

    def fake_source_rows(url):
        requests.append(url)
        return [_fixture_row()]

    monkeypatch.setattr(source, "_csv_rows", fake_source_rows)
    glider, bgc, url = source._fetch_aoml_profile(1414)

    assert len(requests) == 1 and requests[0] == url
    assert url.startswith(source.AOML_BASE + "?")
    assert "profile_id=1414" in url
    assert len(glider) == 2
    assert len(bgc) == 1
    assert {record["variable"] for record in glider} == {"temperature", "salinity"}
    assert bgc[0]["variable"] == "dissolved_oxygen"
    assert all(record["dataset_id"] == source.AOML_DATASET for record in glider + bgc)
    assert all(record["qc_flag"] in {"1", "2"} for record in glider + bgc)
    assert all(record["timestamp"] == "2025-09-15T10:30:00Z" for record in glider + bgc)
    assert all(record["platform_id"].startswith("TEST-ONLY") for record in glider + bgc)


@pytest.mark.parametrize("row", [
    _fixture_row(temp_qc="9", sal_qc="9", oxygen_qc="9"),
    _fixture_row(temp_qc="", sal_qc="", oxygen_qc=""),
    {**_fixture_row(), "profile_time": "invalid"},
    {**_fixture_row(), "depth": "-1"},
    {**_fixture_row(), "profile_id": "999"},
    _fixture_row(latitude="not-a-number"),
])
def test_invalid_qc_coordinates_time_depth_and_profile_id_never_emit_observations(monkeypatch, row):
    monkeypatch.setattr(source, "_csv_rows", lambda _url: [row])
    physical, bgc, _ = source._fetch_aoml_profile(1414)
    assert physical == [] and bgc == []


def test_aoml_returns_no_demo_values_when_all_real_candidate_fetches_fail(monkeypatch):
    requested_ids = []

    def unavailable(profile_id):
        requested_ids.append(profile_id)
        raise RuntimeError("Provider HTTP 503: no verified measurements downloaded")

    monkeypatch.setattr(source, "_fetch_aoml_profile", unavailable)
    with pytest.raises(RuntimeError, match="No pinned AOML profile satisfied") as error:
        source.fetch_aoml_glider_and_bgc()

    assert requested_ids == list(range(1414, 1398, -1))
    assert "1414: Provider HTTP 503" in str(error.value)
    assert "1399: Provider HTTP 503" in str(error.value)


def test_aoml_provider_does_not_fabricate_missing_bgc_from_good_glider(monkeypatch):
    def only_physical(profile_id):
        return [
            {"platform_id": "SOURCE-VALIDATED-BUT-TEST-ONLY",
             "sensor_type": "glider", "variable": "temperature"}
            for _ in range(25)
        ], [], "https://example.invalid/test-only"

    monkeypatch.setattr(source, "_fetch_aoml_profile", only_physical)
    with pytest.raises(RuntimeError, match="bgc=0 accepted records"):
        source.fetch_aoml_glider_and_bgc()
