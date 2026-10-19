"""M056-M063 science unit fixtures only; no test values published as ocean data."""
from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
import json
import math

import pytest

from src.universal_ocean_matchup import (
    compare_profile, matchup_artifacts, convert_argo_insitu_to_potential,
)


def model():
    return {
        "source_id": "TEST-ONLY-MODEL", "original_source_sha256": "a"*64,
        "source_verified": True, "variable": "thetao", "units": "degree_Celsius",
        "basis": "potential_temperature_at_0dbar",
        "longitudes": [67.6, 67.65], "latitudes": [12.8, 12.85],
        "depths_m": [1.0, 50.0, 100.0, 250.0],
        "wet_mask": [[True, False], [True, True]],
        "cube": [
            [[25., None], [24., 24.]], [[24., None], [23., 23.]],
            [[23., None], [22., 22.]], [[20., None], [19., 19.]]
        ],
        "time_semantics": "daily_mean",
        "valid_start_utc": "2024-01-02T00:00:00Z",
        "valid_end_exclusive_utc": "2024-01-03T00:00:00Z",
    }


def observation():
    return {
        "source_id": "TEST-ONLY-ARGO", "original_source_sha256": "b"*64,
        "source_verified": True, "sensor_type": "argo", "platform_id": "TEST-ONLY",
        "cycle": 13, "data_mode": "D", "position_qc": "1", "time_qc": "1",
        "longitude": 67.601, "latitude": 12.801,
        "time_utc": "2024-01-02T14:46:00Z", "variable": "temperature",
        "units": "degree_Celsius", "basis": "potential_temperature_at_0dbar",
        "levels": [
            {"depth_m": 1., "value": 24., "qc_flag": "1", "parameter_data_mode": "D",
             "uncertainty": 0.05},
            {"depth_m": 50., "value": 23., "qc_flag": "1", "parameter_data_mode": "D"},
            {"depth_m": 75., "value": 22.5, "qc_flag": "1", "parameter_data_mode": "D"},
            {"depth_m": 99., "value": 22., "qc_flag": "9", "parameter_data_mode": "D"},
            {"depth_m": 300., "value": 18., "qc_flag": "1", "parameter_data_mode": "D"}
        ]
    }


def test_m056_057_native_argo_qc_nearest_wet_cell_coast_mask():
    got = compare_profile(model(), observation())
    assert got["status"] == "DIAGNOSTIC_ONLY"
    assert got["spatial"]["wet_mask_verified"] is True
    assert got["spatial"]["model_cell_indices"] == {"lat": 0, "lon": 0}
    assert got["metrics"]["count"] == 3
    assert got["exclusions"] == {"QC_REJECTED": 1, "NO_MODEL_DEPTH_COVERAGE": 1}
    assert got["independently_validated"] is False


def test_m058_source_daily_mean_support_and_wrong_year_fail():
    obs = observation()
    obs["time_utc"] = "2004-03-15T12:00:00Z"
    with pytest.raises(ValueError, match="outside actual source"):
        compare_profile(model(), obs)
    obs["time_utc"] = "2024-01-03T00:00:00Z"
    with pytest.raises(ValueError, match="outside actual source"):
        compare_profile(model(), obs)
    got = compare_profile(model(), observation())
    assert got["time"]["semantics"] == "daily_mean"
    assert got["time"]["offset_from_midpoint_hours"] == pytest.approx(2.76666666667)


def test_m058_instantaneous_source_time_tolerance():
    m = model()
    del m["valid_start_utc"]
    del m["valid_end_exclusive_utc"]
    m["time_semantics"] = "instantaneous"
    m["valid_time_utc"] = "2024-01-02T14:00:00Z"
    assert compare_profile(m, observation(),
             instantaneous_tolerance_hours=1)["time"]["offset_hours"] == pytest.approx(46/60)
    with pytest.raises(ValueError, match="outside justified"):
        compare_profile(m, observation(), instantaneous_tolerance_hours=0.5)


def test_m059_no_deep_extrapolation_or_cross_gap_fill():
    m = model()
    m["cube"][1][0][0] = None
    got = compare_profile(m, observation())
    statuses = {p["depth_m"]: p["status"] for p in got["points"]}
    assert statuses[50.0] == "MODEL_MASKED"
    assert statuses[75.0] == "MODEL_MASKED"
    assert statuses[300.0] == "NO_MODEL_DEPTH_COVERAGE"


def test_m057_nearest_looks_wet_only_reject_bad_mask_and_unsupported_distance():
    m = model()
    m["wet_mask"] = [[False, False], [False, False]]
    with pytest.raises(ValueError, match="No verified wet model cell"):
        compare_profile(m, observation())
    with pytest.raises(ValueError, match="distance"):
        compare_profile(model(), observation(), max_distance_km=0)
    m = model()
    m["wet_mask"] = [[True]]
    with pytest.raises(ValueError, match="wet mask"):
        compare_profile(m, observation())


def test_m060_basis_and_units_incompatible_are_rejected():
    bad = observation()
    bad["basis"] = "in_situ_temperature"
    with pytest.raises(ValueError, match="potential T"):
        compare_profile(model(), bad)
    bad = observation()
    bad["units"] = "kelvin"
    with pytest.raises(ValueError, match="units"):
        compare_profile(model(), bad)
    with pytest.raises(ValueError, match="defensible bounds"):
        convert_argo_insitu_to_potential(
            in_situ_temperature_c=20., practical_salinity=34.5,
            pressure_dbar=-10., lon=67.6, lat=12.8)


def test_m061_signed_bias_and_exclusions_and_depth_bands():
    got = compare_profile(model(), observation())
    assert got["metrics"]["mean_bias"] == pytest.approx(1.)
    assert got["metrics"]["mae"] == pytest.approx(1.)
    assert got["metrics"]["rmse"] == pytest.approx(1.)
    assert got["depth_bands"]["0-50m"]["count"] == 1
    assert got["depth_bands"]["50-200m"]["count"] == 2
    assert got["depth_bands"]["200m-plus"]["count"] == 0
    assert got["depth_bands"]["200m-plus"]["rmse"] is None


def test_m062_model_assimilation_and_uncertainty_caveats_not_erased():
    got = compare_profile(model(), observation())
    assert got["uncertainty"]["assimilation_independence"] == "NOT_ESTABLISHED"
    assert got["uncertainty"]["missing_uncertainty_imputed"] is False
    assert got["uncertainty"]["depth_samples_not_independent"]
    assert got["uncertainty"]["forecast_or_model_skill_verified"] is False
    assert got["points"][0]["instrument_uncertainty"] == 0.05
    assert got["points"][1]["instrument_uncertainty"] is None


def test_m063_reproducible_chart_series_csv_and_sha_linkage():
    got = compare_profile(model(), observation())
    a, b = matchup_artifacts(got), matchup_artifacts(compare_profile(model(), observation()))
    assert a == b
    assert sorted(a) == ["chart-series.json", "matchup-provenance.json", "profile.csv"]
    series = json.loads(a["chart-series.json"])
    assert series["model_source_sha256"] == "a"*64
    assert series["observation_source_sha256"] == "b"*64
    assert series["not_independent_validation"] is True
    assert len(series["series"]) == 5
    assert "residual_model_minus_observation" in a["profile.csv"].decode()


def test_no_genuine_model_or_observation_source_is_never_compared():
    bad = model()
    bad["source_verified"] = False
    with pytest.raises(ValueError, match="source SHA"):
        compare_profile(bad, observation())
    bad = observation()
    bad["original_source_sha256"] = "none"
    with pytest.raises(ValueError, match="source SHA"):
        compare_profile(model(), bad)


def test_qc_cannot_turn_null_into_reliable_comparison():
    obs = observation()
    obs["position_qc"] = "9"
    with pytest.raises(ValueError, match="Native position"):
        compare_profile(model(), obs)
    obs = observation()
    for level in obs["levels"]:
        level["qc_flag"] = "9"
    got = compare_profile(model(), obs)
    assert got["status"] == "NO_ELIGIBLE_MATCHES"
    assert got["metrics"]["count"] == 0
    assert got["metrics"]["mean_bias"] is None
    assert got["metrics"]["rmse"] is None


def test_m095_native_source_fill_sentinels_are_missing_not_readings():
    fake = model()
    fake["cube"][1][0][0] = -9999.0
    got = compare_profile(fake, observation())
    statuses = {p["depth_m"]: p["status"] for p in got["points"]}
    assert statuses[50.0] == "MODEL_MASKED"
    assert statuses[75.0] == "MODEL_MASKED"
    bad_obs = observation()
    bad_obs["levels"][0]["value"] = -9999.0
    got = compare_profile(model(), bad_obs)
    assert got["points"][0]["status"] == "QC_REJECTED"
    assert got["points"][0]["residual_model_minus_observation"] is None


def test_m095_invalid_native_fill_registry_is_rejected():
    bad = model()
    bad["fill_values"] = [None]
    with pytest.raises(ValueError, match="fill metadata"):
        compare_profile(bad, observation())
