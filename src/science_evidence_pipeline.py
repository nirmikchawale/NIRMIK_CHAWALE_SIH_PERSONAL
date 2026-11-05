"""M016–M023 standalone, source-agnostic, fail-closed scientific evidence layer.

These helpers are NOT permission to claim scientific validation, materialization,
or live publication. They avoid touching the immutable original reference.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from enum import Enum
from hashlib import sha256
import json
import math
import os
from pathlib import Path
import re
import tempfile
from typing import Any, Mapping
from urllib.parse import urlsplit, urlunsplit


SHA = re.compile(r"^[0-9a-f]{64}$")
ID = re.compile(r"^[A-Z0-9][A-Z0-9_-]{1,63}$")
UTC_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class EvidenceStage(str, Enum):
    PLANNED = "PLANNED"
    SOURCE_DISCOVERED = "SOURCE_DISCOVERED"
    ACQUIRING = "ACQUIRING"
    MATERIALIZED = "MATERIALIZED"
    SOURCE_VERIFIED = "SOURCE_VERIFIED"
    RENDER_READY = "RENDER_READY"
    LIVE_RENDER_VERIFIED = "LIVE_RENDER_VERIFIED"
    OBSERVATION_CONTEXT_ONLY = "OBSERVATION_CONTEXT_ONLY"
    MATCHUP_DIAGNOSTIC = "MATCHUP_DIAGNOSTIC"
    INDEPENDENTLY_VALIDATED = "INDEPENDENTLY_VALIDATED"
    UNAVAILABLE = "UNAVAILABLE"
    DEGRADED = "DEGRADED"
    INELIGIBLE = "INELIGIBLE"
    BLOCKED = "BLOCKED"


@dataclass(frozen=True)
class ScientificFacets:
    """M016: independent states; a GUI success cannot reset source failure."""
    geographic: EvidenceStage = EvidenceStage.PLANNED
    source: EvidenceStage = EvidenceStage.UNAVAILABLE
    observation: EvidenceStage = EvidenceStage.UNAVAILABLE
    matchup: EvidenceStage = EvidenceStage.UNAVAILABLE
    renderer: EvidenceStage = EvidenceStage.PLANNED
    deployment: EvidenceStage = EvidenceStage.PLANNED

    def __post_init__(self) -> None:
        for field in self.__dataclass_fields__:
            if not isinstance(getattr(self, field), EvidenceStage):
                raise TypeError(f"{field} must be an EvidenceStage")


def lint_public_claims(text: str, *, facets: ScientificFacets,
                       independent_review_sha: str | None = None,
                       real_time_source: bool = False,
                       forecast_verified: bool = False) -> tuple[str, ...]:
    """M017: fail-closed unsupported positive promotional statements.

    Statements explicitly saying 'not ...' or 'no ...' are allowed because
    those communicate limitations; this is a targeted copy gate, not a full NLP
    verifier and must not replace human scientific review.
    """
    problems: list[str] = []
    positive = re.sub(r"\b(?:not|no|never|without)\s+", "NEGATED ", text.lower())
    if re.search(r"(?<!NEGATED )\bindependently validated\b", positive):
        if facets.matchup != EvidenceStage.INDEPENDENTLY_VALIDATED or not (
            independent_review_sha and SHA.fullmatch(independent_review_sha)
        ):
            problems.append("Independent validation requires independent review and matching evidence")
    if re.search(r"\breal[- ]time\s+(?:ocean|observations?|measurements?|data)\b", positive) and not real_time_source:
        problems.append("Real-time claim lacks native provider update evidence")
    if re.search(r"\b(?:forecast|prediction)\s+(?:is\s+)?verified\b", positive) and not forecast_verified:
        problems.append("Forecast skill has not been independently verified")
    return tuple(problems)


def portable_provenance(source: Mapping[str, Any]) -> dict[str, Any]:
    """M018: remove private paths/query credentials; retain original SHA intact."""
    digest = str(source.get("sha256") or "")
    if not SHA.fullmatch(digest):
        raise ValueError("Original source SHA-256 is missing or malformed")
    provider = str(source.get("provider") or "").strip()
    dataset = str(source.get("dataset_id") or "").strip()
    if not provider or not dataset:
        raise ValueError("Provider and dataset identity required")
    out: dict[str, Any] = {"provider": provider, "dataset_id": dataset, "sha256": digest}
    uri = str(source.get("source_uri") or "")
    if uri:
        parts = urlsplit(uri)
        if parts.scheme == "https" and parts.netloc and not parts.username and not parts.password:
            out["public_source_url"] = urlunsplit(("https", parts.hostname or "", parts.path, "", ""))
    name = str(source.get("source_path") or "").replace("\\", "/").rsplit("/", 1)[-1]
    if name and name not in {".", ".."}:
        out["source_filename"] = name
    # Never copy raw headers, API tokens, arbitrary local metadata or query params.
    return out


def validate_chronological_frame(frame: Mapping[str, Any], *, baseline_date: str = "2024-01-02") -> dict[str, Any]:
    """M019: preserve historical pilot chronology distinct from baseline."""
    block = str(frame.get("block_id") or "")
    date = str(frame.get("date") or "")
    sha = str(frame.get("sha256") or "")
    native_times = frame.get("native_times_utc")
    if not ID.fullmatch(block) or not UTC_DATE.fullmatch(date) or not SHA.fullmatch(sha):
        raise ValueError("Frame requires canonical ID, date, and original SHA-256")
    if block.startswith("IO-") and date == baseline_date:
        raise ValueError("Pilot frame cannot silently inherit separate 2024 baseline")
    if not isinstance(native_times, list) or not native_times:
        raise ValueError("Native source times required; cannot invent timeline frames")
    for t in native_times:
        if not isinstance(t, str) or not t.startswith(date + "T") or not t.endswith("Z"):
            raise ValueError("Frame/source-native dates contradict each other")
        try:
            datetime.fromisoformat(t.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("Invalid native time") from exc
    return {"schema": "ocean-canvas-source-frame-v2", "block_id": block,
            "date": date, "sha256": sha, "native_times_utc": list(native_times),
            "observations_independently_validated": False}


def rights_decision(meta: Mapping[str, Any]) -> tuple[bool, str]:
    """M020: source readability does not imply redistribution permission."""
    if not meta.get("provider") or not meta.get("source_url"):
        return False, "Unknown provider or original source link"
    licence = str(meta.get("licence") or "").strip()
    attribution = str(meta.get("attribution") or "").strip()
    status = str(meta.get("redistribution_status") or "").strip()
    if status != "verified" or not licence or not attribution:
        return False, "Licence, attribution or explicit redistribution permission unverified"
    return True, "Provider rights metadata complete; retain source-specific restrictions"


def matchup_eligibility(model: Mapping[str, Any], observation: Mapping[str, Any],
                        *, max_time_delta_hours: float) -> tuple[bool, str]:
    """M021: fail closed on spatial/time/depth/variable incompatibility.

    This gate is necessary but NOT sufficient for a scientific comparison:
    wet masks, horizontal representation, thermodynamic definitions, assimilation
    and source-native QC still need the later M056–M063 engine.
    """
    if not isinstance(max_time_delta_hours, (float, int)) or not 0 <= max_time_delta_hours <= 72:
        return False, "Invalid or unjustified source-specific time tolerance"
    if model.get("source_verified") is not True or observation.get("qc_accepted") is not True:
        return False, "Source integrity or observation QC unverified"
    if model.get("variable") != observation.get("variable") or model.get("units") != observation.get("units"):
        return False, "Scientific variable or units incompatible"
    try:
        valid = datetime.fromisoformat(str(model["time"]).replace("Z", "+00:00"))
        observed = datetime.fromisoformat(str(observation["time"]).replace("Z", "+00:00"))
        if valid.tzinfo is None or observed.tzinfo is None:
            return False, "Source time has no timezone"
        lon, lat = float(observation["longitude"]), float(observation["latitude"])
        west, east, south, north = (float(model[k]) for k in ("west", "east", "south", "north"))
        depth = float(observation["depth_m"])
        depths = [float(d) for d in model["depths_m"]]
    except (ValueError, TypeError, KeyError, OverflowError):
        return False, "Invalid source-native coordinate, time or depth metadata"
    if not all(math.isfinite(n) for n in (lon, lat, west, east, south, north, depth, *depths)):
        return False, "Non-finite model or observation metadata"
    if not (west <= lon <= east and south <= lat <= north):
        return False, "Observation outside model geographical domain"
    if abs((valid - observed).total_seconds()) > max_time_delta_hours * 3600:
        return False, "Model and observation times incompatible"
    if len(depths) < 2 or not min(depths) <= depth <= max(depths):
        return False, "No bracketing model depth; extrapolation forbidden"
    return True, "Necessary metadata gates pass; still not independent validation"


def classify_s_profile(meta: Mapping[str, Any]) -> tuple[str, str]:
    """M022: authenticate an actual BGC S-profile without synthetic columns."""
    if meta.get("format") != "argo-s-profile-netcdf":
        return "INELIGIBLE", "Not an authenticated Argo S-profile source"
    if not SHA.fullmatch(str(meta.get("raw_sha256") or "")):
        return "UNAVAILABLE", "Original S-profile bytes not hash-verified"
    if not meta.get("platform_id") or not meta.get("cycle"):
        return "INELIGIBLE", "Missing native float and cycle identity"
    params = meta.get("parameters")
    if not isinstance(params, dict) or not params:
        return "UNAVAILABLE", "S-profile has no native parameter/QC fields"
    for _name, info in params.items():
        if not isinstance(info, Mapping) or info.get("mode") not in {"R", "A", "D"}:
            return "INELIGIBLE", "Missing native R/A/D parameter data mode"
        if str(info.get("qc") or "") not in {"1", "2"} or not info.get("units"):
            return "INELIGIBLE", "Native BGC parameter QC or units not accepted"
    return "OBSERVATION_CONTEXT_ONLY", "Authentic BGC S-profile; model matchup still unverified"


def atomic_promote_source(root: Path, *, block_id: str, frame_date: str,
                          raw_payload: bytes, expected_sha256: str,
                          metadata: Mapping[str, Any]) -> Path:
    """M023: stage content-addressed verified bytes, publish pointer LAST.

    A failing checksum, missing native times or bad mask never updates a pointer.
    Atomic rename applies to one target file on a single filesystem. An orphan
    object after interruption is harmless and can be garbage-collected later.
    """
    if not isinstance(raw_payload, bytes):
        raise TypeError("Source-backed payload must be original bytes")
    digest = sha256(raw_payload).hexdigest()
    if not SHA.fullmatch(expected_sha256) or digest != expected_sha256:
        raise ValueError("Source checksum mismatch; no materialization promoted")
    if metadata.get("wet_mask_verified") is not True:
        raise ValueError("Native model wet mask is not verified")
    frame = validate_chronological_frame({
        "block_id": block_id, "date": frame_date, "sha256": digest,
        "native_times_utc": metadata.get("native_times_utc")
    })
    root = Path(root)
    objects = root / "objects"
    index = root / "index"
    pointer = index / f"{block_id}_{frame_date}.json"
    # If a prior version exists, reject any silent source substitution.
    if pointer.exists():
        existing = json.loads(pointer.read_text(encoding="utf-8"))
        if existing.get("sha256") != digest:
            raise ValueError("Immutable source frame replacement requires a versioned migration")
        return pointer
    objects.mkdir(parents=True, exist_ok=True)
    index.mkdir(parents=True, exist_ok=True)
    object_path = objects / digest
    if object_path.exists():
        if sha256(object_path.read_bytes()).hexdigest() != digest:
            raise ValueError("Content-addressed existing object was corrupted")
    else:
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(dir=objects, prefix=".part-", delete=False) as tmp:
                temp_path = Path(tmp.name)
                tmp.write(raw_payload)
                tmp.flush()
                os.fsync(tmp.fileno())
            os.replace(temp_path, object_path)
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)
    frame["object"] = f"objects/{digest}"
    frame["wet_mask_verified"] = True
    temp_pointer = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=index,
                                         prefix=".part-", delete=False) as tmp:
            temp_pointer = Path(tmp.name)
            json.dump(frame, tmp, sort_keys=True)
            tmp.write("\n")
            tmp.flush()
            os.fsync(tmp.fileno())
        # The manifest pointer is the only visibility gate for this frame.
        os.replace(temp_pointer, pointer)
    finally:
        if temp_pointer is not None:
            temp_pointer.unlink(missing_ok=True)
    return pointer
