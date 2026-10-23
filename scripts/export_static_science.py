"""Export the verified OceanTwin FastAPI contract as immutable static JSON.

This is the hosted fail-safe for environments where a Python serverless runtime
is unavailable. It calls the same canonical backend functions used by FastAPI,
so no scientific logic is duplicated or reimplemented.

The normal local demo continues to use FastAPI directly.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app import main as api
from src.science_evidence_pipeline import (
    EvidenceStage,
    ScientificFacets,
    portable_provenance,
)


def _safe_profile_id(profile_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", profile_id).strip("_") or "profile"


def _write_json(root: Path, relative: str, payload: Any) -> dict[str, Any]:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    path.write_text(text + "\n", encoding="utf-8")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return {
        "path": relative.replace("\\", "/"),
        "bytes": path.stat().st_size,
        "sha256": digest,
    }



def _build_model_source_evidence(*, repository_root: Path,
                                 model_file: Path, dataset_id: str) -> dict[str, Any]:
    """Report exact bundled-byte integrity; do not authenticate provider origin.

    An in-repository manifest is not independent evidence of provider provenance,
    observation QC, redistribution rights, scientific matchup or live deployment.
    """
    root = repository_root.resolve()
    try:
        source_file = model_file.resolve(strict=True)
        relative_path = source_file.relative_to(root).as_posix()
    except (OSError, ValueError) as exc:
        raise RuntimeError("Cannot export unregistered or missing model source file") from exc
    if not relative_path.startswith("data/"):
        raise RuntimeError("Model source is outside the versioned science data directory")

    try:
        expected_hashes = json.loads((root / "data_manifest.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RuntimeError("Canonical immutable source manifest cannot be read") from exc
    expected = expected_hashes.get(relative_path) if isinstance(expected_hashes, dict) else None
    if not isinstance(expected, str) or re.fullmatch(r"[0-9a-f]{64}", expected) is None:
        raise RuntimeError("No valid canonical SHA-256 for selected model source")

    hasher = hashlib.sha256()
    with source_file.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            hasher.update(chunk)
    digest = hasher.hexdigest()
    if digest != expected:
        raise RuntimeError("Bundled model SHA-256 differs from frozen data_manifest.json")

    # MATERIALIZED is deliberately below SOURCE_VERIFIED: matching the local
    # manifest alone cannot authenticate the remote provider's original bytes.
    facets = ScientificFacets(source=EvidenceStage.MATERIALIZED)
    return {
        "schema": "ocean-canvas-model-source-integrity-v1",
        "byte_integrity": "BUNDLED_MANIFEST_SHA256_MATCH",
        "not_independent_provider_authentication": True,
        "not_independent_observation_validation": True,
        "scientific_facets": {key: value.value for key, value in vars(facets).items()},
        "source": portable_provenance({
            "provider": "Copernicus Marine",
            "dataset_id": dataset_id,
            "sha256": digest,
            "source_path": source_file.name,
            "source_uri": "https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description",
        }),
    }


def export_static_science(output: Path) -> dict[str, Any]:
    output.mkdir(parents=True, exist_ok=True)

    catalog = api.catalog()
    health = api.health()
    profiles = api.profiles()
    provenance = api.provenance()
    connectors = api.connectors()

    records: list[dict[str, Any]] = []
    records.append(_write_json(output, "health.json", health))
    records.append(_write_json(output, "catalog.json", catalog))
    records.append(_write_json(output, "profiles/index.json", profiles))
    records.append(_write_json(output, "provenance.json", provenance))
    records.append(_write_json(output, "connectors.json", connectors))

    profile_items = profiles.get("profiles", [])
    for profile in profile_items:
        profile_id = str(profile["profile_id"])
        records.append(
            _write_json(
                output,
                f"profiles/{_safe_profile_id(profile_id)}.json",
                api.profile_detail(profile_id),
            )
        )

    time_count = len(catalog["coordinates"]["time"])
    depth_count = len(catalog["coordinates"]["depth"])

    for time_index in range(time_count):
        for variable in ("thetao", "so"):
            records.append(
                _write_json(
                    output,
                    f"volumes/{variable}/t{time_index}.json",
                    api.scalar_volume(
                        variable=variable,
                        time_index=time_index,
                        horizontal_stride=2,
                        depth_stride=1,
                    ),
                )
            )
            for depth_index in range(depth_count):
                records.append(
                    _write_json(
                        output,
                        f"fields/{variable}/t{time_index}_d{depth_index}.json",
                        api.scalar_field(
                            variable=variable,
                            time_index=time_index,
                            depth_index=depth_index,
                            stride=1,
                        ),
                    )
                )

        records.append(
            _write_json(
                output,
                f"currents-volume/t{time_index}.json",
                api.currents_volume(
                    time_index=time_index,
                    horizontal_stride=4,
                    depth_stride=1,
                ),
            )
        )

        for depth_index in range(depth_count):
            records.append(
                _write_json(
                    output,
                    f"currents/t{time_index}_d{depth_index}.json",
                    api.currents(
                        time_index=time_index,
                        depth_index=depth_index,
                        stride=2,
                    ),
                )
            )
            for variable in ("thetao", "so"):
                records.append(
                    _write_json(
                        output,
                        f"telemetry/{variable}/t{time_index}_d{depth_index}.json",
                        api.scalar_telemetry(
                            variable=variable,
                            time_index=time_index,
                            depth_index=depth_index,
                        ),
                    )
                )
                records.append(
                    _write_json(
                        output,
                        f"anomalies/{variable}/t{time_index}_d{depth_index}.json",
                        api.anomaly_screen(
                            variable=variable,
                            time_index=time_index,
                            depth_index=depth_index,
                        ),
                    )
                )

    expected = 5 + len(profile_items) + time_count * (3 + 7 * depth_count)
    if len(records) != expected:
        raise RuntimeError(
            f"Static science export count mismatch: expected {expected}, wrote {len(records)}."
        )

    if health.get("status") != "ok":
        raise RuntimeError("Static science export refused because API health is not ok.")

    manifest = {
        "schema": "oceantwin-static-science-v1",
        "source": "backend.app.main canonical scientific API",
        "runtime_mode": "static_checksum_verified_export",
        "scientific_data_network_required_at_runtime": False,
        "time_steps": time_count,
        "depth_levels": depth_count,
        "profiles": len(profile_items),
        "files": records,
        # Independent facet statuses do not authorize new ocean/sensor claims.
        "model_source_integrity": _build_model_source_evidence(
            repository_root=ROOT, model_file=api.MODEL_FILE,
            dataset_id=api.DATASET_ID,
        ),
    }
    _write_json(output, "manifest.json", manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("frontend/public/science-static"),
        help="Directory to receive immutable JSON responses.",
    )
    args = parser.parse_args()
    manifest = export_static_science(args.output)
    print(
        "Exported OceanTwin static science:",
        f"{len(manifest['files'])} payloads,",
        f"{manifest['depth_levels']} depths,",
        f"{manifest['profiles']} profiles.",
    )


if __name__ == "__main__":
    main()
