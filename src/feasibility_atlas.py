"""M048-M055 evidence-honest atlas for 105 geographically planned Ocean Canvas blocks.

Outputs have NO scientific measurements, arbitrary observation profiles, source
request successes, timestamp interpolation or new source-backed 3D frames.
Every row is derived from the current immutable manifest/capability register.
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
from typing import Any, Mapping

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "frontend/public/main-blocks/manifest.json"
CAPABILITIES = ROOT / "frontend/public/main-blocks/capability-audit.json"
BATCHES = tuple(f"M{phase:03d}" for phase in range(49, 56))
SCHEMA = "oceancanvas-105-planned-block-source-feasibility-v1"


def _read_snapshot(path: Path) -> tuple[dict, str]:
    raw = path.read_bytes()
    return json.loads(raw), sha256(raw).hexdigest()


def build_feasibility_atlas(
    manifest: Mapping[str, Any], capabilities: Mapping[str, Any], *,
    manifest_sha256: str, capabilities_sha256: str,
) -> dict[str, Any]:
    """M048/049-055 deterministic 7x15 atlas, source access NOT inferred."""
    for digest in (manifest_sha256, capabilities_sha256):
        if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
            raise ValueError("Original manifest SHA256 fingerprints are required")
    raw_blocks = manifest.get("blocks")
    audit_blocks = capabilities.get("blocks")
    if not isinstance(raw_blocks, list) or not isinstance(audit_blocks, list):
        raise ValueError("Source manifest/capability inventory must have block arrays")
    if len(raw_blocks) != 140 or len(audit_blocks) != 140:
        raise ValueError("Expected immutable 140-block source coverage")
    if len(manifest.get("payloads", [])) != 41 or len(manifest.get("pilot_ids", [])) != 35:
        raise ValueError("Original 41 source-backed frames / 35 pilots changed")
    m_ids = [b.get("id") for b in raw_blocks]
    a_ids = [b.get("id") for b in audit_blocks]
    if len(set(m_ids)) != 140 or set(m_ids) != set(a_ids):
        raise ValueError("Duplicate or mismatched canonical geographic block IDs")
    expected_summary = capabilities.get("summary", {})
    if (expected_summary.get("sourceBackedPilots") != 35 or
            expected_summary.get("plannedBlocks") != 105 or
            expected_summary.get("geographicallyEligiblePlannedBlocks") != 70 or
            expected_summary.get("geographicallyIneligiblePlannedBlocks") != 35):
        raise ValueError("Source capability audit has drifted from frozen 35/70/35")
    audit = {b["id"]: b for b in audit_blocks}
    planned = [b for b in raw_blocks if b.get("materialization") == "planned"]
    if len(planned) != 105:
        raise ValueError("Expected exactly 105 unmaterialized geographic blocks")
    actual = []
    for position, b in enumerate(planned, start=1):
        cap = audit[b["id"]]
        if (b.get("available_dates") or b.get("payloads") or
                cap.get("sourcePayloads") or cap.get("availableDates") or
                cap.get("materialized") is not False):
            raise ValueError(f"{b['id']} cannot be marked planned with model payload/date")
        bounds = {axis: b[axis] for axis in ("west", "east", "south", "north")}
        if cap.get("bounds") != bounds:
            raise ValueError(f"{b['id']} source geographic bounds contradict capability audit")
        relevance = str(b.get("ocean_relevance"))
        fraction = float(b.get("ocean_fraction"))
        eligible = cap.get("geographicallyEligibleForMaterialization")
        if (eligible is not True and eligible is not False) or (
                eligible != (relevance in {"ocean", "coastal"} and fraction >= 0.20)
        ):
            raise ValueError(f"{b['id']} source geographic feasibility mismatch")
        batch = BATCHES[(position - 1) // 15]
        actual.append({
            "id": b["id"],
            "planned_position": position,
            "microphase": batch,
            "geography": {"bounds": bounds, "region": b.get("region"),
                          "ocean_fraction": fraction, "ocean_relevance": relevance},
            "geographical_materialization_eligibility": bool(eligible),
            "source_discovery": "NOT_QUERIED",
            "raw_model_data": "NOT_ACQUIRED",
            "source_time_coverage": "UNKNOWN",
            "observation_availability": "NOT_QUERIED",
            "independent_model_observation_matchup": "NOT_ESTABLISHED",
            "source_frame_sha256": None,
            "new_materialized_frames": 0,
            "true_3d_render_certified": False,
            "action": ("CHECK_AUTHENTIC_MODEL_SOURCE_AND_NATIVE_WET_MASK"
                       if eligible else "DO_NOT_MATERIALIZE_GEOGRAPHICALLY_INELIGIBLE"),
        })
    if len(actual) != 105 or len({r["id"] for r in actual}) != 105:
        raise ValueError("Source inventory cannot supply 105 distinct planned positions")
    eligible_count = sum(r["geographical_materialization_eligibility"] for r in actual)
    if eligible_count != 70:
        raise ValueError("Expected exactly 70 geographically eligible planned blocks")
    batches = [
        {"phase": name, "position_start": i * 15 + 1, "position_end": (i + 1) * 15,
         "block_ids": [r["id"] for r in actual[i * 15:(i + 1) * 15]],
         "new_source_queries_executed": 0,
         "observation_matches_verified": 0}
        for i, name in enumerate(BATCHES)
    ]
    if any(len(group["block_ids"]) != 15 for group in batches):
        raise ValueError("Each evidence batch must have exactly 15 planned cells")
    return {
        "schema": SCHEMA,
        "source_manifest_sha256": manifest_sha256,
        "capability_audit_sha256": capabilities_sha256,
        "scope": "105 planned geographic cells, not 105 real source-backed ocean volumes",
        "summary": {
            "original_logical_cells": 140, "original_pilots": 35, "original_pilot_frames": 41,
            "remaining_planned": len(actual),
            "geographically_eligible_unmaterialized": eligible_count,
            "geographically_ineligible": len(actual) - eligible_count,
            "new_source_acquisitions_verified": 0, "new_model_frames_materialized": 0,
            "new_observation_matches_verified": 0,
        },
        "batches": batches, "blocks": actual,
    }


def build_from_original_files(manifest_path: Path = MANIFEST,
                              capability_path: Path = CAPABILITIES) -> dict:
    manifest, mh = _read_snapshot(Path(manifest_path))
    capabilities, ch = _read_snapshot(Path(capability_path))
    return build_feasibility_atlas(manifest, capabilities,
                                   manifest_sha256=mh, capabilities_sha256=ch)


def serialized_atlas(atlas: dict) -> bytes:
    """Identical bytes for identical exact original manifest/capability hashes."""
    return (json.dumps(atlas, ensure_ascii=False, sort_keys=True, indent=2,
                       allow_nan=False) + "\n").encode("utf-8")
