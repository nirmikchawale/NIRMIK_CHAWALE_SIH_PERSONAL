"""M024–M031 conservative competitor evidence audit with no network or code reuse."""
from __future__ import annotations
from collections import Counter
from pathlib import Path
import json
import re

SHA = re.compile(r"^[0-9a-f]{40}$")
LEVELS = frozenset({"METADATA_ONLY", "TREE_INSPECTED", "CODE_INSPECTED"})
DECISIONS = frozenset({"NEEDS_CODE_REVIEW", "STRUCTURAL_QC_SEPARATION",
                       "REQUIRES_SIGN_CONVERSION", "LABEL_2_5D_CORRECTLY"})
COMPETITOR_CENSUS = Path(__file__).resolve().parents[1] / "docs/requirements/M024_M031_COMPETITOR_CENSUS.json"


def validate_census(document: dict) -> dict:
    if document.get("schema") != "ocean-canvas-competitor-census-v1":
        raise ValueError("Unknown census schema")
    entries = document.get("entries")
    if not isinstance(entries, list):
        raise ValueError("Entries must be an array")
    unique = set()
    for entry in entries:
        name = str(entry.get("repository") or "").lower()
        if name in unique or name.count("/") != 1 or not all(name.split("/")):
            raise ValueError(f"Duplicate or invalid repository identity: {name}")
        unique.add(name)
        if not SHA.fullmatch(str(entry.get("head_sha") or "")):
            raise ValueError(f"Missing exact GitHub commit: {name}")
        if entry.get("inspection_level") not in LEVELS:
            raise ValueError(f"Unsupported source inspection level: {name}")
        if entry.get("inspection_level") == "CODE_INSPECTED" and not entry.get("inspected_file"):
            raise ValueError("Code-inspected status requires an actual path")
        if entry.get("decision") not in DECISIONS:
            raise ValueError("Unsupported reproducible evidence classification")
        if entry.get("adoption_status") != "RESEARCH_ONLY":
            raise ValueError("Competitor research cannot authorize copying/production")
        if entry.get("license") == "UNKNOWN" and entry.get("adoption_status") != "RESEARCH_ONLY":
            raise ValueError("Source code licence not cleared")
    return {
        "exact_snapshots": len(unique),
        "levels": dict(Counter(item["inspection_level"] for item in entries)),
        "historical_98_complete": document.get("original_98_registry_status") == "VERIFIED"
            and len(unique) >= 98,
        "historic_300_descriptions_recovered":
            document.get("historical_300_descriptions_status") == "VERIFIED",
    }


def load_census(path: Path = COMPETITOR_CENSUS) -> dict:
    return validate_census(json.loads(path.read_text(encoding="utf-8")))


def classify_candidate_claim(*, source_kind: str, raw_sha: str | None,
                             provider_rights: bool, model_match: bool) -> str:
    """Marketing claims never constitute proof of authentic scientific pairing."""
    if source_kind in {"synthetic", "demo"}:
        return "DEMONSTRATION_ONLY"
    if source_kind not in {"model", "observation", "climatology"}:
        return "UNKNOWN"
    if not raw_sha or not re.fullmatch(r"[a-f0-9]{64}", raw_sha):
        return "UNVERIFIED_SOURCE"
    if not provider_rights:
        return "RIGHTS_NOT_VERIFIED"
    if source_kind == "observation" and not model_match:
        return "OBSERVATION_CONTEXT_ONLY"
    return "SOURCE_METADATA_CHECKED_NOT_SCIENTIFICALLY_VALIDATED"
