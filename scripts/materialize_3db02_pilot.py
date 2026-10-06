"""3DB-02: acquire and promote exactly one new genuine GLORYS12V1 pilot.

The script is intentionally fail-closed. It validates the existing 3DB-01
inventory, selects one planned ocean block deterministically, downloads genuine
source evidence from the same NCAR GDEX GLORYS12V1 OPeNDAP archive used by the
existing pilots, validates the candidate *before* changing canonical truth, and
only then promotes the block in the manifest/runtime.

No synthetic values, timestamps, coordinates, depths, observations, or vertical
current component are introduced.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
from typing import Any

import main_block_materialization as contract
import materialize_phase35b_pilots_opendap as opendap

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
MANIFEST_PATH = BLOCK_ROOT / "manifest.json"
RUNTIME_PATH = ROOT / "frontend" / "src" / "main-block-runtime.ts"
CAPABILITY_TEST_PATH = ROOT / "frontend" / "e2e" / "3db00-capability-contract.spec.ts"
ENGINE_TEST_PATH = ROOT / "frontend" / "e2e" / "main-block-engine.spec.ts"
FOUNDATION_TEST_PATH = ROOT / "tests" / "test_3db01_materialization_foundation.py"
LEGACY_MANIFEST_TEST_PATH = ROOT / "tests" / "test_phase35b_manifest.py"
PHASE_TEST_PATH = ROOT / "tests" / "test_3db02_genuine_pilot_acquisition.py"
PHASE_DOC_PATH = ROOT / "docs" / "3DB_02_GENUINE_PILOT_BLOCK_ACQUISITION.md"

EXPECTED_START = contract.InventorySnapshot(
    logical_blocks=140,
    materialized_pilots=24,
    planned_blocks=116,
    multi_date_pilots=6,
    payloads=30,
    land_blocks_materialized=0,
)
EXPECTED_END = contract.InventorySnapshot(
    logical_blocks=140,
    materialized_pilots=25,
    planned_blocks=115,
    multi_date_pilots=6,
    payloads=31,
    land_blocks_materialized=0,
)

LEGACY_PILOTS = (
    "IO-001", "IO-002", "IO-015", "IO-016", "IO-031", "IO-038",
    "IO-045", "IO-046", "IO-052", "IO-053", "IO-065", "IO-075",
    "IO-089", "IO-091", "IO-096", "IO-103", "IO-105", "IO-110",
    "IO-115", "IO-116", "IO-119", "IO-121", "IO-129", "IO-133",
)


def compact_write(path: Path, payload: Any) -> str:
    text = json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_replace(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one {label} replacement, found {count}: {old!r}")
    return text.replace(old, new, 1)


def choose_target(manifest: dict[str, Any]) -> dict[str, Any]:
    candidates = [
        block for block in manifest["blocks"]
        if block.get("materialization") == "planned"
        and block.get("ocean_relevance") == "ocean"
        and isinstance(block.get("ocean_fraction"), (int, float))
        and float(block["ocean_fraction"]) >= 0.80
    ]
    if not candidates:
        raise RuntimeError("No planned ocean block is eligible for 3DB-02 acquisition")
    # Prefer the strongest existing ocean mask evidence, then stable logical id.
    candidates.sort(key=lambda block: (-float(block["ocean_fraction"]), str(block["id"])))
    target = candidates[0]
    assessment = contract.assess_materialization_target(manifest, str(target["id"]))
    if not assessment.eligible_for_acquisition or assessment.state != "eligible-geography-only":
        raise RuntimeError(f"3DB-01 target gate rejected {target['id']}: {assessment.reason}")
    return target


def update_runtime(block_id: str) -> None:
    text = RUNTIME_PATH.read_text(encoding="utf-8")
    marker = "export const PHASE35B_PILOT_IDS = ["
    start = text.index(marker)
    end_marker = "] as const;"
    end = text.index(end_marker, start) + len(end_marker)
    segment = text[start:end]
    ids = re.findall(r'"(IO-\d{3})"', segment)
    if tuple(ids) != LEGACY_PILOTS:
        raise RuntimeError(f"Unexpected pre-3DB-02 runtime pilot registry: {ids}")
    if block_id in ids:
        raise RuntimeError(f"Target {block_id} is already in runtime pilot registry")
    ids.append(block_id)
    rows: list[str] = []
    for offset in range(0, len(ids), 6):
        values = ids[offset: offset + 6]
        suffix = "," if offset + 6 < len(ids) else ""
        rows.append("  " + ", ".join(f'\"{value}\"' for value in values) + suffix)
    replacement = marker + "\n" + "\n".join(rows) + "\n] as const;"
    RUNTIME_PATH.write_text(text[:start] + replacement + text[end:], encoding="utf-8")


def update_regression_expectations() -> None:
    text = CAPABILITY_TEST_PATH.read_text(encoding="utf-8")
    text = require_replace(text, "expect(planned).toHaveLength(116);", "expect(planned).toHaveLength(115);", "planned capability count")
    text = require_replace(text, "expect(PHASE35B_PILOT_IDS).toHaveLength(24);", "expect(PHASE35B_PILOT_IDS).toHaveLength(25);", "pilot capability count")
    CAPABILITY_TEST_PATH.write_text(text, encoding="utf-8")

    text = ENGINE_TEST_PATH.read_text(encoding="utf-8")
    text = require_replace(text, "Phase 3.5D exposes 140 targets and exactly 24 source-backed pilots", "Phase 3.5D exposes 140 targets and exactly 25 source-backed pilots", "engine test title")
    text = require_replace(text, 'toContainText("24 source-backed pilots")', 'toContainText("25 source-backed pilots")', "launcher pilot count")
    text = require_replace(text, 'toContainText("24")', 'toContainText("25")', "dialog pilot count")
    ENGINE_TEST_PATH.write_text(text, encoding="utf-8")

    text = FOUNDATION_TEST_PATH.read_text(encoding="utf-8")
    text = require_replace(
        text,
        "def test_3db01_reusable_foundation_validates_current_inventory_without_promotion() -> None:",
        "def test_3db01_reusable_foundation_validates_current_inventory() -> None:",
        "foundation test name",
    )
    text = require_replace(text, "assert snapshot.materialized_pilots == 24", "assert snapshot.materialized_pilots == 25", "foundation pilot count")
    text = require_replace(text, "assert snapshot.planned_blocks == 116", "assert snapshot.planned_blocks == 115", "foundation planned count")
    text = require_replace(text, "assert snapshot.payloads == 30", "assert snapshot.payloads == 31", "foundation payload count")
    FOUNDATION_TEST_PATH.write_text(text, encoding="utf-8")

    text = LEGACY_MANIFEST_TEST_PATH.read_text(encoding="utf-8")
    text = require_replace(text, 'assert manifest["phase"] == "3.5B"', 'assert manifest["phase"] == "3DB-02"', "manifest phase")
    LEGACY_MANIFEST_TEST_PATH.write_text(text, encoding="utf-8")


def write_phase_test(block_id: str, source_date: str, relative: str, digest: str) -> None:
    content = f'''from __future__ import annotations

import hashlib
import json
from pathlib import Path

from scripts.main_block_materialization import assess_materialization_target, validate_manifest

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
TARGET_ID = "{block_id}"
SOURCE_DATE = "{source_date}"
PAYLOAD_RELATIVE = "{relative}"
PAYLOAD_SHA256 = "{digest}"
LEGACY_PILOTS = {LEGACY_PILOTS!r}


def test_3db02_promotes_exactly_one_new_genuine_ocean_pilot() -> None:
    manifest = json.loads((BLOCK_ROOT / "manifest.json").read_text(encoding="utf-8"))
    snapshot = validate_manifest(BLOCK_ROOT)
    assert snapshot.logical_blocks == 140
    assert snapshot.materialized_pilots == 25
    assert snapshot.planned_blocks == 115
    assert snapshot.multi_date_pilots == 6
    assert snapshot.payloads == 31
    assert snapshot.land_blocks_materialized == 0
    assert manifest["phase"] == "3DB-02"
    assert set(LEGACY_PILOTS).issubset(set(manifest["pilot_ids"]))
    assert TARGET_ID in manifest["pilot_ids"]
    assert TARGET_ID not in LEGACY_PILOTS
    assert TARGET_ID not in manifest["multi_date_pilot_ids"]


def test_3db02_new_pilot_is_checksum_verified_source_evidence() -> None:
    manifest = json.loads((BLOCK_ROOT / "manifest.json").read_text(encoding="utf-8"))
    block = next(item for item in manifest["blocks"] if item["id"] == TARGET_ID)
    assert block["materialization"] == "pilot"
    assert block["ocean_relevance"] == "ocean"
    assert block["ocean_fraction"] >= 0.80
    assert block["available_dates"] == [SOURCE_DATE]
    assert block["payloads"] == [{{"date": SOURCE_DATE, "path": PAYLOAD_RELATIVE, "sha256": PAYLOAD_SHA256}}]

    payload_path = BLOCK_ROOT / PAYLOAD_RELATIVE
    assert hashlib.sha256(payload_path.read_bytes()).hexdigest() == PAYLOAD_SHA256
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    assert payload["block_id"] == TARGET_ID
    assert payload["time"][:10] == SOURCE_DATE
    assert payload["source"]["origin_product"] == "Copernicus Marine / Mercator Ocean GLORYS12V1"
    assert payload["source"]["product_id"] == "GLOBAL_MULTIYEAR_PHY_001_030"
    assert payload["source"]["dataset_id"] == "cmems_mod_glo_phy_my_0.083deg_P1D-m"
    assert "tds.gdex.ucar.edu/thredds/dodsC" in payload["source"]["service_url"]
    for name in ("thetao", "so", "uo", "vo"):
        assert payload["variables"][name]["finite_count"] > 0
    integrity = payload["integrity"]
    assert integrity["source_values_modified"] is False
    assert integrity["synthetic_measurements"] is False
    assert integrity["synthetic_timestamps"] is False
    assert integrity["synthetic_coordinates"] is False
    assert integrity["synthetic_depths"] is False
    assert integrity["vertical_component_available"] is False
    assert integrity["land_fill_preserved_as_missing"] is True


def test_3db02_target_now_reports_source_and_data_available() -> None:
    manifest = json.loads((BLOCK_ROOT / "manifest.json").read_text(encoding="utf-8"))
    assessment = assess_materialization_target(manifest, TARGET_ID)
    assert assessment.state == "already-materialized"
    assert assessment.eligible_for_acquisition is False
    assert assessment.source_available is True
    assert assessment.data_available is True
'''
    PHASE_TEST_PATH.write_text(content, encoding="utf-8")


def write_phase_doc(block: dict[str, Any], source: dict[str, str], relative: str, digest: str, service_url: str) -> None:
    content = f"""# Phase 3DB-02 — Genuine Pilot Block Acquisition

## Status
Generated by the fail-closed 3DB-02 acquisition executor after candidate validation. Merge/deployment status is recorded separately by GitHub CI and the final phase report.

## Starting verified inventory
- 140 logical Indian Ocean cells
- 24 source-backed pilots
- 116 planned cells
- 6 multi-date pilots
- 30 checksum-referenced payloads
- 0 land-dominant materialized cells

## Newly acquired genuine pilot
- Block: `{block['id']}`
- Region: {block['region']}
- Bounds: {block['west']}–{block['east']}°E, {block['south']}–{block['north']}°N
- Existing ocean-mask fraction: {block['ocean_fraction']}
- Source date: `{source['date']}`
- Product: Copernicus Marine / Mercator Ocean GLORYS12V1
- Product ID: `GLOBAL_MULTIYEAR_PHY_001_030`
- Dataset ID: `cmems_mod_glo_phy_my_0.083deg_P1D-m`
- Archive: NCAR GDEX public THREDDS archive
- Transport: OPeNDAP DAP2
- Source file: `{source['file']}`
- Service URL: `{service_url}`
- Payload: `{relative}`
- SHA-256: `{digest}`
- Variables: `thetao`, `so`, `uo`, `vo`
- Vertical current: not available / not claimed
- Synthetic measurements/timestamps/coordinates/depths: all false

## Promotion sequence
1. 3DB-01 verified the pre-acquisition canonical inventory.
2. A planned ocean block was selected deterministically from existing registry truth.
3. The genuine GLORYS12V1 daily volume was fetched from the verified public OPeNDAP source.
4. Candidate block/date/bounds/source/coordinates/depth/variables/integrity were validated before promotion.
5. SHA-256 was computed over the candidate payload.
6. Only after candidate acceptance was the payload copied into canonical evidence and the manifest/runtime promoted.
7. The complete post-promotion manifest was revalidated fail-closed.

## Expected post-acquisition inventory
- 140 logical cells
- 25 source-backed pilots
- 115 planned cells
- 6 multi-date pilots
- 31 checksum-referenced payloads
- 0 land-dominant materialized cells

## Intentionally unchanged
- immutable `BASE-GLORYS-001` baseline;
- existing 24 pilot payloads and checksums;
- six existing multi-date pilot identities;
- source variable semantics and positive-down source depths;
- no model-observation validation is invented for the new pilot;
- no RUI-owned shell/navigation/visual-system surface is changed.
"""
    PHASE_DOC_PATH.write_text(content, encoding="utf-8")


def main() -> None:
    manifest = contract.load_manifest(BLOCK_ROOT)
    start = contract.validate_manifest(BLOCK_ROOT)

    # Idempotent recovery: if the exact phase has already completed, revalidate and exit.
    if start == EXPECTED_END and manifest.get("phase") == "3DB-02":
        latest = manifest.get("latest_acquisition", {})
        print(f"3DB-02 already materialized: {latest.get('block_id', 'unknown')}")
        return
    if start != EXPECTED_START:
        raise RuntimeError(f"3DB-02 requires exact verified 24/116/6/30 starting inventory; got {start}")
    if tuple(manifest.get("pilot_ids", ())) != LEGACY_PILOTS:
        raise RuntimeError("3DB-02 starting pilot identities differ from the verified 3DB-01 inventory")

    target = choose_target(manifest)
    block_id = str(target["id"])
    source_meta = manifest["source"]
    dates = source_meta.get("dates")
    files = source_meta.get("files")
    if not isinstance(dates, list) or not dates or not isinstance(files, list) or len(files) != len(dates):
        raise RuntimeError("Manifest source dates/files are not one-to-one")
    source = {"date": str(dates[0]), "file": str(files[0])}
    service_url = opendap.source_url(source)

    print(f"3DB-02 selected {block_id}: ocean_fraction={target['ocean_fraction']} region={target['region']}", flush=True)
    print(f"Fetching genuine source evidence {source['date']} from {service_url}", flush=True)

    with tempfile.TemporaryDirectory(prefix="oceancanvas-3db02-") as temp_dir:
        candidate_root = Path(temp_dir)
        remote = opendap.open_remote(source)
        try:
            record = opendap.materialize_one(candidate_root, remote, target, source)
        finally:
            remote.close()
        candidate_path = candidate_root / record["path"]
        digest = contract.validate_candidate_payload(
            candidate_path,
            manifest=manifest,
            block_id=block_id,
            source_date=source["date"],
            expected_sha256=record["sha256"],
            deep_values=True,
        )
        if digest != record["sha256"]:
            raise RuntimeError("Candidate digest changed between materializer and 3DB-01 validator")
        destination = BLOCK_ROOT / record["path"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(candidate_path, destination)

    canonical_record = {"date": source["date"], "path": record["path"], "sha256": digest}
    target["materialization"] = "pilot"
    target["available_dates"] = [source["date"]]
    target["payloads"] = [canonical_record]
    manifest["pilot_ids"].append(block_id)
    manifest["payloads"].append({"block_id": block_id, **canonical_record})
    manifest["integrity"]["pilot_block_count"] = len(manifest["pilot_ids"])
    manifest["phase"] = "3DB-02"
    manifest["latest_acquisition"] = {
        "phase": "3DB-02",
        "block_id": block_id,
        "source_date": source["date"],
        "source_file": source["file"],
        "service_url": service_url,
        "sha256": digest,
        "candidate_validated_before_promotion": True,
    }
    compact_write(MANIFEST_PATH, manifest)

    update_runtime(block_id)
    update_regression_expectations()
    write_phase_test(block_id, source["date"], record["path"], digest)
    write_phase_doc(target, source, record["path"], digest, service_url)

    end = contract.validate_manifest(BLOCK_ROOT)
    if end != EXPECTED_END:
        raise RuntimeError(f"3DB-02 post-promotion inventory mismatch: {end}")
    print(json.dumps({
        "status": "3DB-02-candidate-promoted",
        "block_id": block_id,
        "date": source["date"],
        "payload": record["path"],
        "sha256": digest,
        "inventory": end.__dict__,
    }, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
