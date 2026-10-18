"""M040-M047 development-only IO-087 eligibility, true-source verifier regressions.

NetCDF in tmp_path is SYNTHETIC TEST-ONLY SHAPE DATA, never a source product,
production ocean sample, new IO-087 model frame or public evidence.
"""
from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path

import numpy as np
import pytest

from src.io087_source_wave import (
    MODEL_DATASET_ID, MODEL_DATE, BOUNDS, ORIGINAL_ARGO_PROFILE_IDS,
    canonical_request, verify_original_inventory, raw_sha256,
    inspect_native_netcdf, confirm_source_receipt, assess_argo_context,
    io087_user_view_state, request_status,
)
from scripts.build_io087_candidate import _safe_private_output, _acquire

ROOT = Path(__file__).resolve().parents[1]


def test_m040_original_io087_remains_planned():
    j = json.loads((ROOT / "frontend/public/main-blocks/manifest.json").read_text())
    verify_original_inventory(j)
    block = next(x for x in j["blocks"] if x["id"] == "IO-087")
    assert [block[k] for k in ("west", "east", "south", "north")] == [66, 69, 11, 13]


def test_m041_native_2024_request_no_2004_or_2024_reference_relabel():
    q = canonical_request()
    assert q["dataset_id"] == MODEL_DATASET_ID
    assert q["variables"] == ["thetao", "so", "uo", "vo"]
    assert q["start_datetime"] == q["end_datetime"] == "2024-01-02"
    assert q["minimum_longitude"] == BOUNDS["west"]
    assert q["maximum_latitude"] == BOUNDS["north"]
    with pytest.raises(ValueError, match="2024"):
        canonical_request(date="2004-03-15")
    with pytest.raises(ValueError, match="version"):
        canonical_request(dataset_version="../../private")


def test_m042_missing_remote_source_is_explicit_blocker(tmp_path):
    path = tmp_path / "not-downloaded.nc"
    assert request_status(path)["status"] == "BLOCKED_SOURCE_NOT_ACQUIRED"
    with pytest.raises(ValueError, match="absent or unsafe"):
        # These tests must not make a network request. Test only missing
        # dependency/source-check path by inspecting instead of calling _acquire.
        inspect_native_netcdf(path)


def _testonly_nc(path: Path, *, source_date="2024-01-02", missing_u=False):
    from netCDF4 import Dataset, date2num
    from datetime import datetime, timezone
    with Dataset(path, "w", format="NETCDF4") as nc:
        for dim, count in (("time", 1), ("depth", 3), ("latitude", 2), ("longitude", 2)):
            nc.createDimension(dim, count)
        for axis, values in (
            ("depth", [0.5, 50, 455]),
            ("latitude", [11.2, 12.8]),
            ("longitude", [66.1, 68.9]),
        ):
            v = nc.createVariable(axis, "f8", (axis,))
            v[:] = values
            v.units = "metres" if axis == "depth" else "degrees"
        nc.variables["depth"].positive = "down"
        t = nc.createVariable("time", "f8", ("time",))
        t.units = "hours since 2000-01-01 00:00:00"
        t[0] = date2num(datetime.fromisoformat(source_date + "T12:00:00+00:00"), t.units)
        for name in ("thetao", "so", "uo", "vo"):
            if missing_u and name == "uo":
                continue
            v = nc.createVariable(name, "f8",
               ("time", "depth", "latitude", "longitude"), fill_value=-9999.)
            v.units = "degree_C" if name == "thetao" else "source-native-unit"
            v[:] = np.full((1, 3, 2, 2), 1.5)
            v[0, 2, 0, 0] = np.ma.masked


def test_m043_044_model_checksum_native_axes_time_depth_and_masks(tmp_path):
    raw = tmp_path / "TEST-ONLY-DO-NOT-PUBLISH.nc"
    _testonly_nc(raw)
    report = inspect_native_netcdf(raw)
    assert report["raw_sha256"] == sha256(raw.read_bytes()).hexdigest()
    assert report["model_date"] == MODEL_DATE
    assert set(report["variable_evidence"]) == {"thetao", "so", "uo", "vo"}
    assert report["variable_evidence"]["thetao"]["masked_or_missing_cells"] == 1
    assert report["ui_materialization"] == "PLANNED"
    assert report["new_model_observation_residuals_computed"] is False
    with pytest.raises(ValueError, match="absent or unsafe"):
        raw_sha256(tmp_path / "absent.nc")


@pytest.mark.parametrize("bad_day,missing,reason", [
    ("2004-03-15", False, "not the contemporaneous"),
    ("2024-01-02", True, "lacks native axes"),
])
def test_m043_044_reject_bad_year_and_missing_native_variable(
        tmp_path, bad_day, missing, reason):
    raw = tmp_path / "TEST-ONLY.nc"
    _testonly_nc(raw, source_date=bad_day, missing_u=missing)
    with pytest.raises(ValueError, match=reason):
        inspect_native_netcdf(raw)


def test_m043_receipt_must_refer_to_true_same_raw_bytes(tmp_path):
    raw = tmp_path / "testonly.nc"
    _testonly_nc(raw)
    report = inspect_native_netcdf(raw)
    receipt = {"schema": "oceancanvas-io087-toolbox-receipt-v1",
       "block_id": "IO-087", "dataset_id": MODEL_DATASET_ID,
       "request_date": MODEL_DATE, "sha256": report["raw_sha256"],
       "method": "copernicusmarine.subset"}
    assert confirm_source_receipt(report, receipt)
    assert not confirm_source_receipt(report, {**receipt, "sha256": "0"*64})
    assert not confirm_source_receipt(report, {**receipt, "method": "unknown"})


def test_m045_argo_spatial_context_cannot_reuse_baseline_99(tmp_path):
    p = json.loads((ROOT / "data/comparison/profile_5907092_cycle013_D_summary.json").read_text())
    assert p["matched_level_count"] == ORIGINAL_ARGO_PROFILE_IDS[p["profile_id"]][2]
    state = assess_argo_context(None, p)
    assert state["status"] == "SPATIAL_CONTEXT_ONLY"
    assert "no" in state["reason"].lower()
    assert assess_argo_context(None, {**p, "cycle": 99})["status"] == "INELIGIBLE"
    raw = tmp_path / "TEST-ONLY.nc"
    _testonly_nc(raw)
    got = assess_argo_context(inspect_native_netcdf(raw), p)
    assert got["status"] == "POTENTIAL_TEMPORAL_AND_GEOGRAPHIC_OVERLAP"
    assert got["fresh_io087_residual_count"] == 0


def test_m046_047_cannot_claim_model_metrics_3d_or_published_without_real_source():
    empty = io087_user_view_state(source_report=None, receipt_verified=False)
    assert empty["status"] == "PLANNED"
    assert empty["model_volume_render_ready"] is False
    assert empty["new_model_observation_residuals"] is None
    assert empty["visible_canvas_count_for_unmaterialized_block"] == 0
    mock = {"raw_sha256": "a" * 64}
    for flag in (False, True):
        state = io087_user_view_state(
            source_report=mock, receipt_verified=flag, new_matchup_verified=True)
        assert not state["model_volume_render_ready"]


def test_m042_acquisition_cannot_write_into_public_source_assets(tmp_path):
    with pytest.raises(ValueError, match="frontend/public"):
        _safe_private_output(ROOT / "frontend/public/main-blocks")
    assert _safe_private_output(tmp_path) == tmp_path.resolve()
