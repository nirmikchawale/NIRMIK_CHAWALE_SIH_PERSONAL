"""Portable, dependency-light integrity gate for the bundled model export.

Only verifies local bundled bytes against the repository's immutable manifest.
It cannot authenticate original provider transport, observation QC, rights,
model skill, independent validation or public deployment.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
from typing import Any

from src.science_evidence_pipeline import (
    EvidenceStage,
    ScientificFacets,
    portable_provenance,
)


def build_model_source_evidence(*, repository_root: Path,
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
