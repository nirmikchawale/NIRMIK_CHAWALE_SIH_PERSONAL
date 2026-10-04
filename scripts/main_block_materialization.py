"""3DB-01 reusable, fail-closed materialization gates for Ocean Canvas blocks.

This phase is read-only: it validates canonical evidence and future candidates but
never fetches or promotes scientific data.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path, PurePosixPath
from typing import Any, Mapping
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
MANIFEST_SCHEMA = "oceancanvas-main-block-manifest-v1"
PAYLOAD_SCHEMA = "oceancanvas-main-block-pilot-v1"
REQUIRED_VARIABLES = ("thetao", "so", "uo", "vo")
SYNTHETIC_FLAGS = ("synthetic_measurements", "synthetic_timestamps", "synthetic_coordinates", "synthetic_depths")
MIN_OCEAN_FRACTION = 0.20
TOLERANCE = 1e-6


class MaterializationContractError(RuntimeError):
    """A source-evidence or block-truth gate failed."""


@dataclass(frozen=True)
class InventorySnapshot:
    logical_blocks: int
    materialized_pilots: int
    planned_blocks: int
    multi_date_pilots: int
    payloads: int
    land_blocks_materialized: int


@dataclass(frozen=True)
class TargetAssessment:
    block_id: str
    state: str
    eligible_for_acquisition: bool
    source_available: bool
    data_available: bool
    reason: str


def _fail_unless(condition: bool, message: str) -> None:
    if not condition:
        raise MaterializationContractError(message)


def _finite(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise MaterializationContractError(f"Invalid JSON evidence {path}: {exc}") from exc
    _fail_unless(isinstance(value, dict), f"Expected JSON object: {path}")
    return value


def load_manifest(block_root: Path = DEFAULT_BLOCK_ROOT) -> dict[str, Any]:
    return _json(block_root / "manifest.json")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _blocks(manifest: Mapping[str, Any]) -> dict[str, Mapping[str, Any]]:
    raw = manifest.get("blocks")
    _fail_unless(isinstance(raw, list), "Manifest blocks must be a list")
    result: dict[str, Mapping[str, Any]] = {}
    for block in raw:
        _fail_unless(isinstance(block, dict) and isinstance(block.get("id"), str), "Every block needs a string id")
        block_id = block["id"]
        _fail_unless(block_id not in result, f"Duplicate block id: {block_id}")
        result[block_id] = block
    return result


def _bounds(block: Mapping[str, Any]) -> dict[str, float]:
    result: dict[str, float] = {}
    for key in ("west", "east", "south", "north"):
        value = block.get(key)
        _fail_unless(_finite(value), f"Invalid {key} bound for {block.get('id', 'block')}")
        result[key] = float(value)
    _fail_unless(result["west"] < result["east"] and result["south"] < result["north"], "Invalid block bounds")
    return result


def _payload_path(root: Path, relative: str) -> Path:
    pure = PurePosixPath(relative)
    _fail_unless(not pure.is_absolute() and ".." not in pure.parts, f"Unsafe payload path: {relative}")
    _fail_unless(len(pure.parts) >= 3 and pure.parts[0] == "data", f"Payload must live under data/: {relative}")
    candidate = (root / Path(*pure.parts)).resolve()
    _fail_unless(candidate.is_relative_to(root.resolve()), f"Payload escapes block root: {relative}")
    return candidate


def assess_materialization_target(manifest: Mapping[str, Any], block_id: str) -> TargetAssessment:
    block = _blocks(manifest).get(block_id)
    if block is None:
        raise MaterializationContractError(f"Unknown logical block id: {block_id}")
    _bounds(block)
    if block.get("materialization") == "pilot":
        return TargetAssessment(block_id, "already-materialized", False, True, True, "Existing source-backed pilot; 3DB-01 does not replace evidence.")
    _fail_unless(block.get("materialization") == "planned", f"Unsupported materialization state for {block_id}")
    _fail_unless(block.get("available_dates") == [] and block.get("payloads") == [], f"Planned block {block_id} already advertises scientific evidence")
    relevance, fraction = block.get("ocean_relevance"), block.get("ocean_fraction")
    if relevance == "land" or not _finite(fraction) or float(fraction) < MIN_OCEAN_FRACTION:
        return TargetAssessment(block_id, "blocked-land", False, False, False, "Land-dominant target; materialization is forbidden.")
    _fail_unless(relevance in {"ocean", "coastal"}, f"Unknown ocean relevance for {block_id}")
    return TargetAssessment(block_id, "eligible-geography-only", True, False, False, "Geographically eligible only; source/data remain unclaimed until genuine evidence passes validation.")


def _source_identity(payload: Mapping[str, Any], source: Mapping[str, Any]) -> None:
    actual = payload.get("source")
    _fail_unless(isinstance(actual, dict), "Payload source metadata is missing")
    for key in ("origin_product", "product_id", "dataset_id", "archive_provider"):
        _fail_unless(isinstance(source.get(key), str) and source[key], f"Manifest source missing {key}")
        _fail_unless(actual.get(key) == source[key], f"Payload source {key} mismatch")
    service_url = actual.get("service_url")
    parsed = urlparse(service_url) if isinstance(service_url, str) else None
    _fail_unless(parsed is not None and parsed.scheme in {"http", "https"} and bool(parsed.netloc), "Payload source service_url must be HTTP(S)")


def validate_payload_document(
    payload: Mapping[str, Any], *, expected_block: Mapping[str, Any], expected_date: str,
    expected_source: Mapping[str, Any], maximum_depth_m: float, deep_values: bool = True,
) -> None:
    block_id = expected_block.get("id")
    _fail_unless(payload.get("schema") == PAYLOAD_SCHEMA, "Unsupported payload schema")
    _fail_unless(payload.get("block_id") == block_id, f"Payload block identity mismatch for {block_id}")
    timestamp = payload.get("time")
    _fail_unless(isinstance(timestamp, str) and timestamp[:10] == expected_date, f"Payload source date mismatch for {block_id}")
    _fail_unless(payload.get("time_semantics") == expected_source.get("time_semantics"), f"Payload time semantics mismatch for {block_id}")

    actual_bounds = payload.get("bounds")
    _fail_unless(isinstance(actual_bounds, dict), f"Payload bounds missing for {block_id}")
    for key, expected in _bounds(expected_block).items():
        actual = actual_bounds.get(key)
        _fail_unless(_finite(actual) and abs(float(actual) - expected) <= TOLERANCE, f"Payload {key} bound mismatch for {block_id}")

    relevance, fraction = expected_block.get("ocean_relevance"), expected_block.get("ocean_fraction")
    _fail_unless(relevance in {"ocean", "coastal"} and _finite(fraction) and float(fraction) >= MIN_OCEAN_FRACTION, f"Block {block_id} is not ocean eligible")
    _fail_unless(payload.get("ocean_relevance") == relevance, f"Payload ocean relevance mismatch for {block_id}")
    actual_fraction = payload.get("ocean_fraction")
    _fail_unless(_finite(actual_fraction) and abs(float(actual_fraction) - float(fraction)) <= TOLERANCE, f"Payload ocean fraction mismatch for {block_id}")

    coordinates, shape = payload.get("coordinates"), payload.get("shape")
    _fail_unless(isinstance(coordinates, dict) and isinstance(shape, dict), "Payload coordinates/shape are missing")
    lon, lat, depth = coordinates.get("longitude"), coordinates.get("latitude"), coordinates.get("depth_m")
    for name, values in (("longitude", lon), ("latitude", lat), ("depth", depth)):
        _fail_unless(isinstance(values, list) and values and all(_finite(v) for v in values), f"Payload {name} coordinates are invalid")
    _fail_unless(coordinates.get("depth_positive") == "down", "Depth semantics must remain positive-down")
    _fail_unless(min(depth) >= 0 and max(depth) <= maximum_depth_m + TOLERANCE, "Payload depth range exceeds contract")
    expected_shape = {"depth": len(depth), "latitude": len(lat), "longitude": len(lon)}
    _fail_unless(all(shape.get(k) == v for k, v in expected_shape.items()), "Payload shape does not match coordinates")
    value_count = expected_shape["depth"] * expected_shape["latitude"] * expected_shape["longitude"]

    variables = payload.get("variables")
    _fail_unless(isinstance(variables, dict), "Payload variables are missing")
    for variable in REQUIRED_VARIABLES:
        evidence = variables.get(variable)
        _fail_unless(isinstance(evidence, dict), f"Payload missing {variable}")
        count = evidence.get("finite_count")
        _fail_unless(isinstance(count, int) and count > 0, f"Payload {variable} has no finite source evidence")
        _fail_unless(_finite(evidence.get("minimum")) and _finite(evidence.get("maximum")) and float(evidence["minimum"]) <= float(evidence["maximum"]), f"Payload {variable} range is invalid")
        if deep_values:
            values = evidence.get("values")
            _fail_unless(isinstance(values, list) and len(values) == value_count, f"Payload {variable} value count does not match shape")
            _fail_unless(sum(1 for value in values if _finite(value)) == count, f"Payload {variable} finite_count does not match values")

    integrity = payload.get("integrity")
    _fail_unless(isinstance(integrity, dict), "Payload integrity metadata is missing")
    _fail_unless(integrity.get("source_values_modified") is False, "Source values must remain unmodified")
    for flag in SYNTHETIC_FLAGS:
        _fail_unless(integrity.get(flag) is False, f"Synthetic scientific evidence is forbidden: {flag}")
    _fail_unless(integrity.get("vertical_component_available") is False, "Vertical current cannot be claimed without source evidence")
    _fail_unless(integrity.get("land_fill_preserved_as_missing") is True, "Land fill must remain missing")
    _source_identity(payload, expected_source)


def validate_candidate_payload(candidate_path: Path, *, manifest: Mapping[str, Any], block_id: str, source_date: str, expected_sha256: str | None = None, deep_values: bool = True) -> str:
    assessment = assess_materialization_target(manifest, block_id)
    _fail_unless(assessment.eligible_for_acquisition, assessment.reason)
    source = manifest.get("source")
    _fail_unless(isinstance(source, dict) and _finite(source.get("maximum_depth_m")), "Manifest source/depth contract is invalid")
    digest = sha256_file(candidate_path)
    if expected_sha256 is not None:
        _fail_unless(digest == expected_sha256, f"Candidate checksum mismatch for {block_id} {source_date}")
    validate_payload_document(_json(candidate_path), expected_block=_blocks(manifest)[block_id], expected_date=source_date, expected_source=source, maximum_depth_m=float(source["maximum_depth_m"]), deep_values=deep_values)
    return digest


def validate_manifest(block_root: Path = DEFAULT_BLOCK_ROOT, *, deep_payloads: bool = True) -> InventorySnapshot:
    manifest = load_manifest(block_root)
    _fail_unless(manifest.get("schema") == MANIFEST_SCHEMA, "Unsupported manifest schema")
    domain, source, integrity = manifest.get("target_domain"), manifest.get("source"), manifest.get("integrity")
    _fail_unless(isinstance(domain, dict) and isinstance(domain.get("logical_block_count"), int), "Invalid target domain")
    _fail_unless(isinstance(source, dict) and _finite(source.get("maximum_depth_m")), "Invalid source contract")
    _fail_unless(isinstance(integrity, dict), "Manifest integrity metadata is missing")
    for key in ("origin_product", "product_id", "dataset_id", "archive_provider", "transport", "time_semantics"):
        _fail_unless(isinstance(source.get(key), str) and source[key], f"Manifest source missing {key}")
    for flag in SYNTHETIC_FLAGS:
        _fail_unless(integrity.get(flag) is False, f"Manifest synthetic flag must remain false: {flag}")
    _fail_unless(integrity.get("vertical_component_available") is False, "Manifest must not claim vertical velocity")

    by_id, logical = _blocks(manifest), int(domain["logical_block_count"])
    _fail_unless(len(by_id) == logical, "Logical count does not match registry")
    pilots_raw, multi_raw, globals_raw = manifest.get("pilot_ids"), manifest.get("multi_date_pilot_ids"), manifest.get("payloads")
    _fail_unless(isinstance(pilots_raw, list) and len(pilots_raw) == len(set(pilots_raw)), "Invalid/duplicate pilot_ids")
    _fail_unless(isinstance(multi_raw, list) and len(multi_raw) == len(set(multi_raw)), "Invalid/duplicate multi_date_pilot_ids")
    _fail_unless(isinstance(globals_raw, list), "Manifest payloads must be a list")

    pilots: set[str] = set()
    multi: set[str] = set()
    nested: set[tuple[str, str, str, str]] = set()
    land_materialized = 0
    for block_id, block in by_id.items():
        _bounds(block)
        dates, records = block.get("available_dates"), block.get("payloads")
        _fail_unless(isinstance(dates, list) and len(dates) == len(set(dates)) and isinstance(records, list), f"Invalid dates/payloads for {block_id}")
        if block.get("materialization") == "planned":
            _fail_unless(dates == [] and records == [], f"Planned block {block_id} must not advertise scientific evidence")
            continue
        _fail_unless(block.get("materialization") == "pilot", f"Unsupported materialization state for {block_id}")
        pilots.add(block_id)
        fraction = block.get("ocean_fraction")
        if block.get("ocean_relevance") == "land" or not _finite(fraction) or float(fraction) < MIN_OCEAN_FRACTION:
            land_materialized += 1
        _fail_unless(block.get("ocean_relevance") in {"ocean", "coastal"} and _finite(fraction) and float(fraction) >= MIN_OCEAN_FRACTION, f"Materialized block {block_id} is not ocean eligible")
        _fail_unless(dates and len(dates) == len(records), f"Pilot {block_id} lacks one-to-one evidence")
        if len(dates) > 1:
            multi.add(block_id)
        for record in records:
            _fail_unless(isinstance(record, dict), f"Invalid payload record for {block_id}")
            date, relative, digest = record.get("date"), record.get("path"), record.get("sha256")
            _fail_unless(isinstance(date, str) and date in dates and isinstance(relative, str) and isinstance(digest, str) and len(digest) == 64, f"Incomplete payload record for {block_id}")
            _fail_unless(relative.startswith(f"data/{block_id}/"), f"Payload path identity mismatch: {relative}")
            nested.add((block_id, date, relative, digest))

    _fail_unless(set(pilots_raw) == pilots, "pilot_ids does not match materialized blocks")
    _fail_unless(set(multi_raw) == multi and multi.issubset(pilots), "multi_date_pilot_ids does not match evidence")
    global_records: set[tuple[str, str, str, str]] = set()
    for record in globals_raw:
        _fail_unless(isinstance(record, dict), "Invalid global payload record")
        values = (record.get("block_id"), record.get("date"), record.get("path"), record.get("sha256"))
        _fail_unless(all(isinstance(v, str) and v for v in values), "Incomplete global payload record")
        key = (str(values[0]), str(values[1]), str(values[2]), str(values[3]))
        _fail_unless(key not in global_records, f"Duplicate global payload record: {key[0]} {key[1]}")
        global_records.add(key)
    _fail_unless(global_records == nested, "Global and block-local payload records disagree")

    maximum_depth = float(source["maximum_depth_m"])
    for block_id, date, relative, digest in sorted(global_records):
        path = _payload_path(block_root, relative)
        _fail_unless(path.is_file(), f"Missing payload: {relative}")
        _fail_unless(sha256_file(path) == digest, f"Checksum mismatch: {relative}")
        validate_payload_document(_json(path), expected_block=by_id[block_id], expected_date=date, expected_source=source, maximum_depth_m=maximum_depth, deep_values=deep_payloads)

    _fail_unless(integrity.get("logical_block_count") == logical, "Integrity logical count mismatch")
    _fail_unless(integrity.get("pilot_block_count") == len(pilots), "Integrity pilot count mismatch")
    _fail_unless(integrity.get("multi_date_pilot_count") == len(multi), "Integrity multi-date count mismatch")
    _fail_unless(integrity.get("land_blocks_materialized") == land_materialized == 0, "Land blocks must never be materialized")
    return InventorySnapshot(logical, len(pilots), logical - len(pilots), len(multi), len(global_records), land_materialized)


def _cli() -> None:
    parser = argparse.ArgumentParser(description="3DB-01 main-block materialization contract")
    parser.add_argument("--root", type=Path, default=DEFAULT_BLOCK_ROOT)
    parser.add_argument("--shallow", action="store_true")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("verify")
    assess = sub.add_parser("assess")
    assess.add_argument("block_id")
    args = parser.parse_args()
    if args.command == "verify":
        print(json.dumps({"status": "valid", **asdict(validate_manifest(args.root, deep_payloads=not args.shallow))}, sort_keys=True))
    else:
        print(json.dumps(asdict(assess_materialization_target(load_manifest(args.root), args.block_id)), sort_keys=True))


if __name__ == "__main__":
    _cli()
