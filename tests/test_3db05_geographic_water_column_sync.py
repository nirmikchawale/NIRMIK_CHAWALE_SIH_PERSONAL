from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "frontend" / "public" / "main-blocks" / "manifest.json"
RUNTIME = ROOT / "frontend" / "src" / "main-block-runtime.ts"
BRIDGE = ROOT / "frontend" / "src" / "components" / "PilotMainBlockRendererBridge.tsx"
WATER_COLUMN = ROOT / "frontend" / "src" / "components" / "WaterColumn3D.tsx"


def _manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def test_3db05_preserves_materialization_and_scientific_integrity_truth() -> None:
    manifest = _manifest()
    blocks = manifest["blocks"]

    assert manifest["phase"] == "3DB-02"
    assert manifest["integrity"]["logical_block_count"] == 140
    assert manifest["integrity"]["pilot_block_count"] == 25
    assert manifest["integrity"]["multi_date_pilot_count"] == 6
    assert manifest["integrity"]["land_blocks_materialized"] == 0
    assert len(manifest["payloads"]) == 31
    assert sum(block["materialization"] == "pilot" for block in blocks) == 25
    assert sum(block["materialization"] == "planned" for block in blocks) == 115

    integrity = manifest["integrity"]
    assert integrity["synthetic_measurements"] is False
    assert integrity["synthetic_timestamps"] is False
    assert integrity["synthetic_coordinates"] is False
    assert integrity["synthetic_depths"] is False
    assert integrity["vertical_component_available"] is False


def test_3db05_runtime_exposes_explicit_water_column_capability_context() -> None:
    runtime = RUNTIME.read_text(encoding="utf-8")

    assert 'MAIN_BLOCK_WATER_COLUMN_SYNC_VERSION = "3db-05-v1"' in runtime
    assert "deriveMainBlockWaterColumnSyncContext" in runtime
    assert "deriveMainBlockCapabilities(block)" in runtime
    assert "capability.waterColumnReady && capability.materialized" in runtime
    assert '"scientific-volume" : "geographic-shell"' in runtime
    assert "evidenceClass: capability.provenance.evidenceClass" in runtime
    assert "validationLevel: capability.validation.level" in runtime
    assert "availableDates: capability.availableTimes" in runtime


def test_3db05_pilot_bridge_corrects_legacy_water_column_identity_without_touching_science() -> None:
    bridge = BRIDGE.read_text(encoding="utf-8")

    assert "deriveMainBlockWaterColumnSyncContext" in bridge
    assert 'shell.dataset.mainBlockId = activeId' in bridge
    assert 'shell.dataset.materialization = "pilot"' in bridge
    assert 'shell.dataset.waterColumnSync = "synchronized"' in bridge
    assert "shell.dataset.waterColumnSyncVersion = waterColumnSync.version" in bridge
    assert "shell.dataset.waterColumnEvidenceClass = waterColumnSync.evidenceClass" in bridge
    assert "SOURCE-BACKED PILOT VOLUME" in bridge
    assert "no independent Argo validation claim" in bridge

    # 3DB-05 may synchronize lifecycle/identity presentation but must never alter
    # the actual scientific WaterColumn arrays, timestamps, depths or currents.
    forbidden = (
        "volume.points =",
        "currentsVolume.vectors =",
        "synthetic_measurements: true",
        "synthetic_timestamps: true",
        "synthetic_coordinates: true",
        "synthetic_depths: true",
        "vertical_component_available: true",
    )
    assert all(token not in bridge for token in forbidden)


def test_3db05_planned_shell_remains_fail_closed() -> None:
    source = WATER_COLUMN.read_text(encoding="utf-8")

    assert 'data-materialization="planned"' in source
    assert 'data-scientific-values="0"' in source
    assert "PLANNED TARGET · NO MATERIALIZED VOLUME" in source
    assert "0 bundled for this target; none copied from the baseline" in source
    assert "No temperature, salinity, current or depth values are fabricated" in source
