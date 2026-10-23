"""M016/M018 integration: source integrity in the actual static export path.

Fixtures are deliberately test-only bytes; they are never ocean data or
provider-authenticated records, and cannot be deployed as scientific frames.
"""
from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path

import pytest

from src.source_integrity_export import build_model_source_evidence as _build_model_source_evidence


def _setup(tmp_path: Path) -> tuple[Path, Path]:
    model = tmp_path / "data" / "fixture.nc"
    model.parent.mkdir(parents=True)
    model.write_bytes(b"TEST_ONLY_NOT_OCEAN_DATA")
    digest = sha256(model.read_bytes()).hexdigest()
    (tmp_path / "data_manifest.json").write_text(
        json.dumps({"data/fixture.nc": digest}), encoding="utf-8"
    )
    return tmp_path, model


def test_export_integrity_gates_local_bytes_without_provider_overclaim(tmp_path):
    root, model = _setup(tmp_path)
    result = _build_model_source_evidence(
        repository_root=root, model_file=model, dataset_id="TEST_ONLY"
    )
    assert result["byte_integrity"] == "BUNDLED_MANIFEST_SHA256_MATCH"
    assert result["scientific_facets"]["source"] == "MATERIALIZED"
    assert result["scientific_facets"]["observation"] == "UNAVAILABLE"
    assert result["scientific_facets"]["matchup"] == "UNAVAILABLE"
    assert result["scientific_facets"]["deployment"] == "PLANNED"
    assert result["not_independent_provider_authentication"] is True
    assert result["source"]["sha256"] == sha256(model.read_bytes()).hexdigest()
    assert "tmp" not in json.dumps(result).lower()


def test_export_integrity_refuses_mismatch_missing_manifest_or_external_path(tmp_path):
    root, model = _setup(tmp_path)
    model.write_bytes(b"ALTERED_TEST_FIXTURE")
    with pytest.raises(RuntimeError, match="differs"):
        _build_model_source_evidence(
            repository_root=root, model_file=model, dataset_id="TEST_ONLY"
        )
    root, model = _setup(tmp_path)
    (root / "data_manifest.json").write_text("{}", encoding="utf-8")
    with pytest.raises(RuntimeError, match="valid canonical"):
        _build_model_source_evidence(
            repository_root=root, model_file=model, dataset_id="TEST_ONLY"
        )
    outside = tmp_path.parent / "external-test-only.nc"
    outside.write_bytes(b"TEST_ONLY")
    with pytest.raises(RuntimeError, match="unregistered"):
        _build_model_source_evidence(
            repository_root=root, model_file=outside, dataset_id="TEST_ONLY"
        )
