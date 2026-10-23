"""X001–X069: isolated genuine-source parallel acquisition and fail-closed promotion.

This is a preparation/execution lane, NOT authorization to merge or deploy.
X-to-IO mapping is deterministically derived from the 3DB-14 manifest:
the 70 geographically eligible planned cells minus reserved IO-087.
No observation matchup or individual GPU certification is inferred.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

import main_block_materialization as contract

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
RUNTIME = ROOT / "frontend" / "src" / "main-block-runtime.ts"
SOURCE_DATE = "2004-03-15"
SHARDS = 10
BEFORE = contract.InventorySnapshot(140, 35, 105, 6, 41, 0)
AFTER = contract.InventorySnapshot(140, 104, 36, 6, 110, 0)
RESERVED = "IO-087"


def targets(manifest: dict) -> list[str]:
    eligible = []
    for block in manifest["blocks"]:
        if block["materialization"] == "pilot":
            continue
        assessment = contract.assess_materialization_target(manifest, block["id"])
        if assessment.eligible_for_acquisition:
            if assessment.source_available or assessment.data_available:
                raise RuntimeError("Planned target improperly advertises source/data")
            eligible.append(block["id"])
    eligible.sort()
    if len(eligible) != 70 or eligible.count(RESERVED) != 1:
        raise RuntimeError(f"Eligibility drift; expected 70 including {RESERVED}: {eligible}")
    ids = [item for item in eligible if item != RESERVED]
    if len(ids) != 69 or len(set(ids)) != 69:
        raise RuntimeError("X series must have exactly 69 unique IDs")
    return ids


def base_manifest() -> dict:
    manifest = contract.load_manifest(BLOCK_ROOT)
    snapshot = contract.validate_manifest(BLOCK_ROOT, deep_payloads=True)
    if snapshot != BEFORE or manifest["phase"] != "3DB-11":
        raise RuntimeError(f"Unexpected pre-X source inventory: {snapshot}")
    if len(manifest["payloads"]) != 41 or len(manifest["pilot_ids"]) != 35:
        raise RuntimeError("Existing pilot inventory changed")
    targets(manifest)
    return manifest


def source_from(manifest: dict) -> dict[str, str]:
    source = manifest["source"]
    if (source["dates"] != [SOURCE_DATE, "2004-07-28"]
            or len(source["files"]) != 2
            or source["product_id"] != "GLOBAL_MULTIYEAR_PHY_001_030"):
        raise RuntimeError("Pinned genuine source identity changed")
    return {"date": SOURCE_DATE, "file": source["files"][0]}


def expected_path(block_id: str) -> str:
    return f"data/{block_id}/{SOURCE_DATE}.json"


def shard_ids(ids: list[str], shard: int) -> list[str]:
    if shard < 0 or shard >= SHARDS:
        raise ValueError("Invalid shard index")
    return ids[shard::SHARDS]


def validate_stage(manifest: dict, staged: Path, ids: list[str]) -> list[dict]:
    listed = sorted(p.relative_to(staged).as_posix()
                    for p in staged.rglob("*.json") if p.is_file())
    required = sorted(expected_path(block_id) for block_id in ids)
    if listed != required:
        raise RuntimeError(f"Staged file-set mismatch. Expected {len(required)}, found {len(listed)}")
    records = []
    for block_id in ids:
        path = staged / expected_path(block_id)
        digest = contract.sha256_file(path)
        verified = contract.validate_candidate_payload(
            path, manifest=manifest, block_id=block_id,
            source_date=SOURCE_DATE, expected_sha256=digest,
            deep_values=True
        )
        if verified != digest:
            raise RuntimeError(f"Staged scientific SHA mismatch: {block_id}")
        records.append({"block_id": block_id, "date": SOURCE_DATE,
                        "path": expected_path(block_id), "sha256": digest})
    return records


def acquire(shard: int, staged: Path) -> None:
    import materialize_phase35b_pilots_opendap as opendap

    manifest = base_manifest()
    ids = shard_ids(targets(manifest), shard)
    source = source_from(manifest)
    if any((staged / expected_path(block_id)).exists() for block_id in ids):
        raise RuntimeError("Refusing to overwrite staged evidence")
    by_id = {row["id"]: row for row in manifest["blocks"]}
    remote = opendap.open_remote(source)
    try:
        for index, block_id in enumerate(ids, 1):
            print(f"X acquisition shard {shard}: {index}/{len(ids)} {block_id}", flush=True)
            record = opendap.materialize_one(staged, remote, by_id[block_id], source)
            if record["path"] != expected_path(block_id) or record["date"] != SOURCE_DATE:
                raise RuntimeError(f"Unexpected native data identity: {block_id}")
            contract.validate_candidate_payload(
                staged / record["path"], manifest=manifest, block_id=block_id,
                source_date=SOURCE_DATE, expected_sha256=record["sha256"],
                deep_values=True
            )
    finally:
        remote.close()
    records = validate_stage(manifest, staged, ids)
    print(json.dumps({"shard": shard, "source_validated": len(records),
                      "block_ids": ids}, sort_keys=True), flush=True)


def update_runtime(old_ids: list[str], new_ids: list[str]) -> None:
    original = RUNTIME.read_text(encoding="utf-8")
    match = re.search(r'(export const PHASE35B_PILOT_IDS = \[)(.*?)(\] as const;)',
                      original, re.S)
    if not match:
        raise RuntimeError("Canonical TypeScript pilot registry absent")
    actual = re.findall(r'"(IO-\d{3})"', match.group(2))
    if actual != old_ids or len(actual) != 35:
        raise RuntimeError("Runtime and manifest existing pilot order disagree")
    rows = []
    for start in range(0, len(new_ids), 6):
        rows.append("  " + ", ".join(json.dumps(item) for item in new_ids[start:start + 6]) +
                    ("," if start + 6 < len(new_ids) else ""))
    replacement = match.group(1) + "\n" + "\n".join(rows) + "\n" + match.group(3)
    RUNTIME.write_text(original[:match.start()] + replacement + original[match.end():],
                       encoding="utf-8")


def promote(staged: Path) -> None:
    import materialize_3db02_pilot as phase02

    manifest = base_manifest()
    ids = targets(manifest)
    originals = {row["path"]: row["sha256"] for row in manifest["payloads"]}
    source = source_from(manifest)
    records = validate_stage(manifest, staged, ids)  # ALL 69 deep-validated first.
    by_id = {row["id"]: row for row in manifest["blocks"]}

    for record in records:
        dest = BLOCK_ROOT / record["path"]
        if dest.exists():
            raise RuntimeError(f"Refusing to overwrite original scientific asset: {dest}")

    for record in records:
        dest = BLOCK_ROOT / record["path"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(staged / record["path"], dest)
    old_ids = list(manifest["pilot_ids"])
    for record in records:
        block = by_id[record["block_id"]]
        if block["materialization"] != "planned" or block["available_dates"] or block["payloads"]:
            raise RuntimeError(f"Unanticipated planned-block mutation: {block['id']}")
        item = {key: record[key] for key in ("date", "path", "sha256")}
        block["materialization"] = "pilot"
        block["available_dates"] = [SOURCE_DATE]
        block["payloads"] = [item]
        manifest["pilot_ids"].append(block["id"])
        manifest["payloads"].append(record)
    manifest["integrity"]["pilot_block_count"] = len(manifest["pilot_ids"])
    manifest["phase"] = "X-69"
    manifest["x69_parallel"] = {
        "source_date": SOURCE_DATE,
        "source_file": source["file"],
        "source_product": manifest["source"]["product_id"],
        "transport": manifest["source"]["transport"],
        "block_ids": ids,
        "records": records,
        "all_candidates_deep_validated_before_promotion": True,
        "native_model_observation_matchup_claimed": False,
        "individual_gpu_render_certification_claimed": False,
        "public_deployment_certified": False,
        "reserved_block": RESERVED,
        "original_41_payload_sha256": originals,
    }
    phase02.compact_write(BLOCK_ROOT / "manifest.json", manifest)
    update_runtime(old_ids, manifest["pilot_ids"])
    verify()  # All preserved originals and 69 additions, full deep validation.
    subprocess.run([sys.executable, str(ROOT / "scripts" / "audit_3db14_capabilities.py"),
                    "--write"], check=True, cwd=ROOT)
    print("All 69 original source-backed frames promoted on isolated working tree; NOT deployed.",
          flush=True)


def verify() -> None:
    manifest = contract.load_manifest(BLOCK_ROOT)
    snapshot = contract.validate_manifest(BLOCK_ROOT, deep_payloads=True)
    if snapshot != AFTER or manifest["phase"] != "X-69":
        raise RuntimeError(f"X-69 invariant failed: {snapshot}")
    ids = manifest.get("x69_parallel", {}).get("block_ids")
    if not isinstance(ids, list) or len(ids) != 69 or len(set(ids)) != 69:
        raise RuntimeError("Missing X-69 exact candidate evidence")
    if RESERVED in ids or manifest["pilot_ids"][-69:] != ids:
        raise RuntimeError("Dedicated IO-087 block or pilot ordering corrupted")
    locked = next(b for b in manifest["blocks"] if b["id"] == RESERVED)
    if locked["materialization"] != "planned" or locked["payloads"] or locked["available_dates"]:
        raise RuntimeError("Reserved IO-087 must remain independently locked")
    original = manifest["x69_parallel"].get("original_41_payload_sha256")
    if not isinstance(original, dict) or len(original) != 41:
        raise RuntimeError("Historical frame integrity register unavailable")
    for row in manifest["payloads"]:
        if row["path"] in original and row["sha256"] != original[row["path"]]:
            raise RuntimeError(f"Original immutable SHA drift: {row['path']}")
    for key in ("synthetic_measurements", "synthetic_timestamps",
                "synthetic_coordinates", "synthetic_depths",
                "vertical_component_available"):
        if manifest["integrity"][key] is not False:
            raise RuntimeError(f"Unsupported scientific field: {key}")
    print(json.dumps({"status": "source-validated-local-only",
                      "inventory": snapshot.__dict__, "expansions": len(ids),
                      "public_certified": False}, sort_keys=True), flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--plan", action="store_true")
    mode.add_argument("--shard", type=int)
    mode.add_argument("--verify-shard", type=int)
    mode.add_argument("--promote", action="store_true")
    mode.add_argument("--verify", action="store_true")
    parser.add_argument("--staging", type=Path, default=Path("x69-staged"))
    args = parser.parse_args()
    if args.plan:
        manifest = base_manifest()
        ids = targets(manifest)
        rows = [{"microphase": f"X{i:03d}", "block": block_id,
                 "source": "NCAR GDEX GLORYS12V1",
                 "A": "geography-eligible", "B": "not-yet-acquired",
                 "C": "not-yet-source-validated", "D": "not-integrated",
                 "E": "not-independently-runtime-or-public-certified"}
                for i, block_id in enumerate(ids, 1)]
        print(json.dumps({"targets": rows, "count": len(rows),
                          "microphases": len(rows) * 5}, sort_keys=True))
    elif args.shard is not None:
        acquire(args.shard, args.staging)
    elif args.verify_shard is not None:
        manifest = base_manifest()
        ids = shard_ids(targets(manifest), args.verify_shard)
        print(json.dumps({"shard": args.verify_shard,
                          "verified": len(validate_stage(manifest, args.staging, ids))}))
    elif args.promote:
        promote(args.staging)
    else:
        verify()


if __name__ == "__main__":
    main()
