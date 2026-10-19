"""M010 genuine CCHDO CTD request, QC, coordinate, and no-data tests.

Only tiny TEST-ONLY fixtures are used. No profile is published, downloaded
or presented as a genuine sampled Indian Ocean observation by this suite.
"""
from __future__ import annotations

import pytest
from scripts import fetch_verified_observation_breadth as source


CTD_CANDIDATE = {
    "profile_id": "TEST-ONLY-CTD",
    "time": "2016-04-01T00:00:00Z",
    "latitude": "-10",
    "longitude": "95",
}


def _ctd_row(**changes):
    row = {
        "profile_id": "TEST-ONLY-CTD",
        "expocode": "TEST-ONLY-CRUISE",
        "time": CTD_CANDIDATE["time"],
        "latitude": "-10",
        "longitude": "95",
        "pressure": "100",
        "ctd_temperature": "21.0",
        "ctd_temperature_qc": "2",
        "ctd_salinity": "35.2",
        "ctd_salinity_qc": "2",
    }
    return {**row, **changes}


def test_native_ctd_schema_is_used_and_qc2_measures_only(monkeypatch):
    requests = []
    def source_rows(url):
        requests.append(url)
        return [
            _ctd_row(),
            _ctd_row(ctd_temperature_qc="9", ctd_salinity_qc="2"),
            _ctd_row(ctd_temperature_qc="2", ctd_salinity_qc="9"),
            _ctd_row(ctd_temperature="NaN", ctd_salinity="NaN"),
            _ctd_row(ctd_temperature="60", ctd_salinity="-3"),
            _ctd_row(profile_id="DIFFERENT-PROFILE"),
            _ctd_row(pressure="-30"),
            _ctd_row(time="invalid"),
        ]

    monkeypatch.setattr(source, "_csv_rows", source_rows)
    records, url = source._fetch_ctd_profile(CTD_CANDIDATE)
    assert len(requests) == 1 and url == requests[0]
    assert url.startswith(source.CCHDO_BASE + "?")
    assert "ctd_temperature_qc" in url and "ctd_salinity_qc" in url
    assert [item["variable"] for item in records] == [
        "temperature", "salinity", "salinity", "temperature"
    ]
    assert all(item["sensor_type"] == "ctd" for item in records)
    assert all(item["qc_flag"] == "2" for item in records)
    assert all(0 < item["depth_m"] < 1000 for item in records)
    assert all(item["platform_id"].startswith("GO-SHIP TEST-ONLY") for item in records)


def test_genuine_no_match_404_triggers_older_source_windows_only(monkeypatch):
    observed_windows = []
    def fixture_provider(url):
        observed_windows.append(url)
        if len(observed_windows) < 3:
            raise RuntimeError(
                f"HTTP 404 for {url}: Your query produced no matching results. (nRows = 0)"
            )
        return [CTD_CANDIDATE]

    monkeypatch.setattr(source, "_csv_rows", fixture_provider)
    profiles = source._candidate_ctd_profiles()
    assert len(profiles) == 1
    assert len(observed_windows) == 3
    assert "2018-01-01" in observed_windows[0]
    assert "2015-01-01" in observed_windows[1]
    assert "2005-01-01" in observed_windows[2]


@pytest.mark.parametrize("provider_message", [
    "HTTP 401 for test URL: authentication required",
    "HTTP 404 for test URL: dataset does not exist",
    "HTTP 429 for test URL: retry after rate limit",
    "HTTP 500 for test URL: service error",
])
def test_nonempty_or_nonmatching_provider_errors_are_never_classified_as_empty(monkeypatch, provider_message):
    monkeypatch.setattr(source, "_csv_rows", lambda _url: (_ for _ in ()).throw(RuntimeError(provider_message)))
    with pytest.raises(RuntimeError, match="HTTP"):
        source._candidate_ctd_profiles()


def test_no_eligible_erddap_profiles_uses_only_official_archive(monkeypatch):
    calls = []
    def no_real_rows():
        raise RuntimeError(
            "CCHDO discovery returned no eligible source-backed Indian Ocean CTD "
            "profiles for any inspected authentic provider time window (2005–2026)."
        )
    def official_archive():
        calls.append("official-netcdf")
        return ([{"sensor_type": "ctd", "value": "TEST-ONLY"}], {"service": "TEST-ONLY"})
    monkeypatch.setattr(source, "_candidate_ctd_profiles", no_real_rows)
    monkeypatch.setattr(source, "_fetch_official_cchdo_cf_netcdf", official_archive)
    records, metadata = source.fetch_cchdo_ctd()
    assert calls == ["official-netcdf"]
    assert metadata["service"] == "TEST-ONLY"
    assert records[0]["sensor_type"] == "ctd"


def test_provider_failure_is_not_silently_substituted_by_official_archive(monkeypatch):
    calls = []
    def failed_provider():
        raise RuntimeError("HTTP 403 for actual CCHDO endpoint: licence/access unavailable")
    monkeypatch.setattr(source, "_candidate_ctd_profiles", failed_provider)
    monkeypatch.setattr(source, "_fetch_official_cchdo_cf_netcdf", lambda: calls.append("unexpected"))
    with pytest.raises(RuntimeError, match="HTTP 403"):
        source.fetch_cchdo_ctd()
    assert calls == []
