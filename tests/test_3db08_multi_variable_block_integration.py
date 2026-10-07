from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "frontend" / "public" / "main-blocks" / "manifest.json"
VARIABLE_CONTRACT = ROOT / "frontend" / "src" / "main-block-variables.ts"
PILOT_LOADER = ROOT / "frontend" / "src" / "pilot-main-block-loader.ts"

EXPECTED_COMPONENTS = {"thetao", "so", "uo", "vo"}


def _manifest() -> dict:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def _payload(relative_path: str) -> dict:
    return json.loads((ROOT / "frontend" / "public" / "main-blocks" / relative_path).read_text(encoding="utf-8"))


def _finite(values: list[float | None]) -> list[float]:
    return [value for value in values if isinstance(value, (int, float)) and math.isfinite(value)]


def test_3db08_all_existing_pilot_payloads_are_genuinely_multi_variable() -> None:
    manifest = _manifest()
    pilots = [entry for entry in manifest["blocks"] if entry["materialization"] == "pilot"]
    planned = [entry for entry in manifest["blocks"] if entry["materialization"] == "planned"]

    assert len(pilots) == 25
    assert len(planned) == 115
    assert sum(len(entry["payloads"]) for entry in pilots) == 31
    assert all(entry["payloads"] == [] for entry in planned)

    for entry in pilots:
        for record in entry["payloads"]:
            payload = _payload(record["path"])
            assert payload["block_id"] == entry["id"]
            assert set(payload["variables"]) == EXPECTED_COMPONENTS
            assert "chlorophyll" not in payload["variables"]
            assert "w" not in payload["variables"]
            assert payload["integrity"]["vertical_component_available"] is False

            shape = payload["shape"]
            expected_samples = shape["depth"] * shape["latitude"] * shape["longitude"]
            assert expected_samples > 0

            for component_name in sorted(EXPECTED_COMPONENTS):
                component = payload["variables"][component_name]
                assert isinstance(component["units"], str) and component["units"].strip()
                assert len(component["values"]) == expected_samples

                finite = _finite(component["values"])
                assert component["finite_count"] == len(finite)
                if finite:
                    assert component["minimum"] is not None
                    assert component["maximum"] is not None
                    assert math.isclose(component["minimum"], min(finite), rel_tol=0.0, abs_tol=1e-5)
                    assert math.isclose(component["maximum"], max(finite), rel_tol=0.0, abs_tol=1e-5)
                else:
                    assert component["minimum"] is None
                    assert component["maximum"] is None

            assert payload["variables"]["uo"]["units"] == payload["variables"]["vo"]["units"]
            paired_currents = sum(
                1
                for u, v in zip(payload["variables"]["uo"]["values"], payload["variables"]["vo"]["values"])
                if isinstance(u, (int, float))
                and math.isfinite(u)
                and isinstance(v, (int, float))
                and math.isfinite(v)
            )
            assert paired_currents > 0


def test_3db08_runtime_enforces_variable_evidence_before_pilot_rendering() -> None:
    contract = VARIABLE_CONTRACT.read_text(encoding="utf-8")
    loader = PILOT_LOADER.read_text(encoding="utf-8")

    assert 'MAIN_BLOCK_MULTI_VARIABLE_INTEGRATION_VERSION = "3db-08-v1"' in contract
    assert "deriveMainBlockVariableIntegration" in contract
    assert "assertNativeVariableEvidence" in contract
    assert "currents require both native uo and vo components" in contract
    assert "unsupported main-block source component" in contract
    assert "planned block ${block.id} cannot receive scientific variable evidence" in contract

    assert 'from "./main-block-variables"' in loader
    assert "nativeVariableIntegration(payload);" in loader
    assert 'assertMainBlockVariableSelection(nativeVariableIntegration(payload), variable);' in loader
    assert 'assertMainBlockVariableSelection(nativeVariableIntegration(payload), "currents");' in loader


def test_3db08_scientific_boundary_keeps_currents_horizontal_only() -> None:
    contract = VARIABLE_CONTRACT.read_text(encoding="utf-8")

    assert '"thetao" | "so" | "currents"' in contract
    assert '"thetao" | "so" | "uo" | "vo"' in contract
    assert "horizontalCurrentOnly: true" in contract
