"""3DB-14: deterministic, source-validated audit of every logical Indian Ocean block.

The public JSON is a build-time inventory snapshot, not proof that every pilot
has been individually rendered by a production GPU or deployed. Those remain
separate browser and GitHub Pages gates.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from scripts.main_block_materialization import (
    DEFAULT_BLOCK_ROOT,
    MaterializationContractError,
    load_manifest,
    validate_manifest,
)

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "frontend" / "src" / "main-block-runtime.ts"
REPORT = DEFAULT_BLOCK_ROOT / "capability-audit.json"
SCHEMA = "oceancanvas-3db14-block-capability-audit-v1"


def _runtime_ids(source: str, constant: str) -> list[str]:
    pattern = rf"export const {re.escape(constant)} = \[([^\]]+)\] as const;"
    match = re.search(pattern, source)
    if not match:
        raise MaterializationContractError(f"Missing runtime constant: {constant}")
    ids = re.findall(r'IO-\d{3}', match.group(1))
    if len(ids) != len(set(ids)):
        raise MaterializationContractError(f"Duplicate runtime block ID in {constant}")
    return ids


def assert_runtime_manifest_parity(manifest: dict[str, Any], source: str) -> None:
    pilots = _runtime_ids(source, "PHASE35B_PILOT_IDS")
    multi = _runtime_ids(source, "PHASE35B_MULTI_DATE_PILOT_IDS")
    if set(pilots) != set(manifest["pilot_ids"]):
        raise MaterializationContractError("Runtime pilot IDs disagree with canonical source manifest")
    if set(multi) != set(manifest["multi_date_pilot_ids"]):
        raise MaterializationContractError("Runtime multi-date IDs disagree with canonical source manifest")
    for block in manifest["blocks"]:
        dates = block["available_dates"]
        expected = (["2004-03-15", "2004-07-28"] if block["id"] in multi
                    else ["2004-03-15"] if block["id"] in pilots else [])
        if dates != expected:
            raise MaterializationContractError(f"Runtime date selector disagrees with {block['id']}")


def build_audit(block_root: Path = DEFAULT_BLOCK_ROOT,
                runtime_source: str | None = None) -> dict[str, Any]:
    # Deep validation re-reads every source file, validates SHA-256 and checks
    # coordinates, shape, four native variables, and no synthetic science.
    snapshot = validate_manifest(block_root, deep_payloads=True)
    manifest = load_manifest(block_root)
    assert_runtime_manifest_parity(
        manifest, RUNTIME.read_text(encoding="utf-8") if runtime_source is None else runtime_source
    )
    rows: list[dict[str, Any]] = []
    for block in manifest["blocks"]:
        pilot = block["materialization"] == "pilot"
        fraction = block["ocean_fraction"]
        geographically_eligible = (
            block["ocean_relevance"] in ("ocean", "coastal")
            and isinstance(fraction, (float, int))
            and fraction >= 0.2
        )
        if pilot and not geographically_eligible:
            raise MaterializationContractError(f"Non-ocean pilot forbidden: {block['id']}")
        rows.append({
            "id": block["id"],
            "region": block["region"],
            "bounds": {key: block[key] for key in ("west", "east", "south", "north")},
            "oceanRelevance": block["ocean_relevance"],
            "oceanFraction": fraction,
            "geographicallyEligibleForMaterialization": geographically_eligible,
            "evidenceClass": "source-backed-render-ready-pilot" if pilot else "geography-only-planned",
            "materialized": pilot,
            "sourceSha256VerifiedByAudit": pilot,
            "cesiumContractReady": pilot,
            "waterColumnContractReady": pilot,
            "individualProduction3DRenderProven": False,
            "independentModelObservationValidated": False,
            "availableVariables": ["thetao", "so", "currents"] if pilot else [],
            "availableDates": list(block["available_dates"]),
            "depthEvidence": "source-payload-native-depth" if pilot else "none",
            "sourcePayloads": [
                {"date": p["date"], "path": p["path"], "sha256": p["sha256"]}
                for p in block["payloads"]
            ],
        })
    if [row["id"] for row in rows] != [f"IO-{i:03d}" for i in range(1, 141)]:
        raise MaterializationContractError("Logical grid ID sequence is incomplete or reordered")
    eligible_planned = sum(
        not b["materialized"] and b["geographicallyEligibleForMaterialization"] for b in rows
    )
    return {
        "schema": SCHEMA,
        "note": "Static verified-source inventory, not individual GPU rendering proof or public deployment attestation.",
        "source": {
            "productId": manifest["source"]["product_id"],
            "datasetId": manifest["source"]["dataset_id"],
            "timeSemantics": manifest["source"]["time_semantics"],
        },
        "summary": {
            "logicalBlocks": snapshot.logical_blocks,
            "sourceBackedPilots": snapshot.materialized_pilots,
            "plannedBlocks": snapshot.planned_blocks,
            "multiDatePilots": snapshot.multi_date_pilots,
            "sourcePayloadFrames": snapshot.payloads,
            "landBlocksMaterialized": snapshot.land_blocks_materialized,
            "geographicallyEligiblePlannedBlocks": eligible_planned,
            "geographicallyIneligiblePlannedBlocks": snapshot.planned_blocks - eligible_planned,
            "independentlyObservationValidatedPilots": 0,
        },
        "verifiedBaselineSeparateFrom140": {
            "id": "BASE-GLORYS-001",
            "date": "2024-01-02",
            "depthLevels": 31,
            "independentModelObservationValidation": "reference-baseline-only",
            "notPartOfPilotInventory": True,
        },
        "blocks": rows,
    }


def assert_snapshot_matches(expected: dict[str, Any], actual: dict[str, Any]) -> None:
    if actual != expected:
        raise MaterializationContractError(
            "Committed capability audit is stale or scientifically overclaims; regenerate from validated sources"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="Rewrite deterministic public audit from verified evidence")
    mode.add_argument("--check", action="store_true", help="Fail if public audit differs from source evidence")
    args = parser.parse_args()
    actual = build_audit()
    if args.write:
        REPORT.write_text(json.dumps(actual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    else:
        assert_snapshot_matches(actual, json.loads(REPORT.read_text(encoding="utf-8")))
    print("3DB-14 source-backed audit OK:", json.dumps(actual["summary"], sort_keys=True))


if __name__ == "__main__":
    main()
