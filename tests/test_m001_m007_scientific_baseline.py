"""M001–M007: immutable scientific source + CTD provider discovery regression.

This suite never downloads, substitutes, or modifies scientific measurements.
"""
from __future__ import annotations

import csv
import hashlib
import json
from math import sqrt
from pathlib import Path

import pytest
from scripts import fetch_verified_observation_breadth as source

ROOT = Path(__file__).resolve().parents[1]
BLOCKS = ROOT / "frontend/public/main-blocks"


def test_all_41_source_frames_and_140_geographic_cells_are_immutable():
    manifest = json.loads((BLOCKS / "manifest.json").read_text())
    audit = json.loads((BLOCKS / "capability-audit.json").read_text())
    cells = audit["blocks"]
    assert len(cells) == len(manifest["blocks"]) == 140
    assert len({cell["id"] for cell in cells}) == 140
    assert len(manifest["payloads"]) == 41
    assert len({(frame["block_id"], frame["date"]) for frame in manifest["payloads"]}) == 41
    assert sum(cell["materialized"] for cell in cells) == 35
    assert sum(not cell["materialized"] for cell in cells) == 105
    assert sum(not cell["materialized"] and cell["geographicallyEligibleForMaterialization"] for cell in cells) == 70
    assert sum(not cell["materialized"] and not cell["geographicallyEligibleForMaterialization"] for cell in cells) == 35
    assert sum(len(cell["availableDates"]) > 1 for cell in cells) == 6
    assert not any(cell["materialized"] and cell["oceanRelevance"] == "land" for cell in cells)
    assert all(cell["independentModelObservationValidated"] is False for cell in cells)
    assert audit["verifiedBaselineSeparateFrom140"]["id"] == "BASE-GLORYS-001"
    indexed = {(block["id"], p["date"]): p for block in cells for p in block["sourcePayloads"]}
    assert len(indexed) == 41
    for frame in manifest["payloads"]:
        name = (frame["block_id"], frame["date"])
        assert indexed[name]["sha256"] == frame["sha256"]
        actual = hashlib.sha256((BLOCKS / frame["path"]).read_bytes()).hexdigest()
        assert actual == frame["sha256"], frame["path"]


def test_frozen_argo_5907092_statistics_reproduced_from_true_residuals():
    cases = (
        ("013_D", 50, "20240102_indian_ocean_prof:23"),
        ("012_A", 49, "20240102_indian_ocean_prof:26"),
    )
    total = 0
    for cycle, count, pid in cases:
        prefix = ROOT / f"data/comparison/profile_5907092_cycle{cycle}"
        with (prefix.parent / (prefix.name + "_level_comparison.csv")).open(
            encoding="utf-8-sig", newline=""
        ) as handle:
            rows = list(csv.DictReader(handle))
        summary = json.loads((prefix.parent / (prefix.name + "_summary.json")).read_text())
        residuals = [float(row["signed_bias_celsius"]) for row in rows]
        assert all(row["profile_id"] == pid for row in rows)
        assert len(residuals) == summary["matched_level_count"] == count
        assert summary["comparison_status"].startswith("diagnostic_only")
        assert sum(residuals) / count == pytest.approx(summary["mean_bias_celsius"], abs=1e-12)
        assert sum(abs(e) for e in residuals) / count == pytest.approx(summary["mae_celsius"], abs=1e-12)
        assert sqrt(sum(e * e for e in residuals) / count) == pytest.approx(summary["rmse_celsius"], abs=1e-12)
        assert max(map(abs, residuals)) == pytest.approx(summary["maximum_absolute_error_celsius"], abs=1e-12)
        total += count
    assert total == 99


def test_ctd_discovery_uses_real_2016_records_after_2018_no_data(monkeypatch):
    requests = []
    def source_rows(url):
        requests.append(url)
        if "2018-01-01" in url:
            raise RuntimeError(
                f"HTTP 404 for {url}: Error {{ message=\"Not Found: "
                "Your query produced no matching results. (nRows = 0)\"; }"
            )
        assert "2015-01-01" in url
        return [
            {"profile_id": "REAL-CTD-ID", "time": "2016-04-01T00:00:00Z",
             "latitude": "-10.0", "longitude": "95.0"},
            {"profile_id": "", "time": "2016-04-01T00:00:00Z",
             "latitude": "-10.0", "longitude": "95.0"},
        ]
    monkeypatch.setattr(source, "_csv_rows", source_rows)
    rows = source._candidate_ctd_profiles()
    assert len(requests) == 2
    assert len(rows) == 1 and rows[0]["profile_id"] == "REAL-CTD-ID"


def test_ctd_discovery_must_fail_closed_on_no_real_data(monkeypatch):
    def no_rows(url):
        raise RuntimeError(
            f"HTTP 404 for {url}: Your query produced no matching results. (nRows = 0)"
        )
    monkeypatch.setattr(source, "_csv_rows", no_rows)
    with pytest.raises(RuntimeError, match="no eligible source-backed"):
        source._candidate_ctd_profiles()


def test_ctd_discovery_does_not_hide_provider_errors(monkeypatch):
    def bad_provider(url):
        raise RuntimeError(f"HTTP 404 for {url}: dataset does not exist")
    monkeypatch.setattr(source, "_csv_rows", bad_provider)
    with pytest.raises(RuntimeError, match="dataset does not exist"):
        source._candidate_ctd_profiles()


def test_frozen_theme_registry_remains_16_until_separately_released():
    text = (ROOT / "frontend/src/theme.ts").read_text(encoding="utf-8")
    import re
    theme_block = text.split("GLASS_THEME_IDS = [", 1)[1].split("] as const;", 1)[0]
    ids = re.findall(r'"([a-z][a-z-]+)"', theme_block)
    assert len(ids) == len(set(ids)) == 16
    assert "arctic-mist" in ids
    assert 'DEFAULT_GLASS_THEME: GlassThemeId = "arctic-mist"' in text
