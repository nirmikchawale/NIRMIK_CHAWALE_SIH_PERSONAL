from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "frontend" / "public" / "main-blocks" / "manifest.json"
CONTRACT = ROOT / "frontend" / "src" / "main-block-provenance.ts"
DRAWER = ROOT / "frontend" / "src" / "components" / "ProvenanceDrawer.tsx"
APP = ROOT / "frontend" / "src" / "App.tsx"


def test_3db10_manifest_provenance_inventory_is_source_backed() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    assert manifest["schema"] == "oceancanvas-main-block-manifest-v1"
    assert manifest["target_domain"]["logical_block_count"] == 140
    assert manifest["integrity"]["pilot_block_count"] == 35
    assert manifest["integrity"]["multi_date_pilot_count"] == 6
    assert manifest["integrity"]["land_blocks_materialized"] == 0
    assert manifest["integrity"]["synthetic_measurements"] is False
    assert manifest["integrity"]["synthetic_timestamps"] is False
    assert manifest["integrity"]["synthetic_coordinates"] is False
    assert manifest["integrity"]["synthetic_depths"] is False
    assert manifest["integrity"]["vertical_component_available"] is False

    payloads = manifest["payloads"]
    assert len(payloads) == 41
    assert all(re.fullmatch(r"[a-f0-9]{64}", item["sha256"]) for item in payloads)
    assert len({(item["block_id"], item["date"], item["sha256"]) for item in payloads}) == 41


def test_3db10_planned_io087_has_observation_context_but_no_model_payload_provenance() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    io087 = next(block for block in manifest["blocks"] if block["id"] == "IO-087")

    assert io087["materialization"] == "planned"
    assert io087["payloads"] == []
    assert io087["available_dates"] == []

    contract = CONTRACT.read_text(encoding="utf-8")
    assert 'MAIN_BLOCK_PROVENANCE_EVIDENCE_VERSION = "3db-10-v1"' in contract
    assert '"planned-no-scientific-payload"' in contract
    assert '"pilot-evidence-withheld"' in contract
    assert "The verified baseline fallback must not be presented as active-block provenance." in contract
    assert "Observation footprint context does not unlock model science or create block validation." in contract


def test_3db10_judge_surface_exposes_active_block_evidence_without_rui_redesign() -> None:
    drawer = DRAWER.read_text(encoding="utf-8")
    app = APP.read_text(encoding="utf-8")

    assert 'data-testid="active-block-provenance-evidence"' in drawer
    assert "data-evidence-class" in drawer
    assert "data-checksum-count" in drawer
    assert "data-observation-evidence" in drawer
    assert "data-model-observation-validated" in drawer
    assert 'data-testid="active-block-runtime-provenance-withheld"' in drawer
    assert "baseline fallback metadata is intentionally not presented as active-block provenance" in drawer

    assert "fetchPilotMainBlockManifest" in app
    assert "deriveMainBlockObservationIntegration" in app
    assert "deriveMainBlockProvenanceEvidence" in app
    assert "blockEvidence={activeBlockProvenanceEvidence}" in app
