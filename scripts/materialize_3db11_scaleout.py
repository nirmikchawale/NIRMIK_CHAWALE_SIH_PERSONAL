"""3DB-11: fail-closed, source-backed Indian Ocean scale-out.

Acquires 10 additional region-diverse GLORYS12V1 ocean blocks using verified
NCAR GDEX OPeNDAP source. Validates ALL candidates before promoting ANY.
Original baseline and existing 31 checksum-referenced payloads are immutable.
"""
from __future__ import annotations
import argparse
from collections import defaultdict
import json
from pathlib import Path
import re
import shutil
import tempfile

import main_block_materialization as contract
import materialize_3db02_pilot as phase02
import materialize_phase35b_pilots_opendap as opendap

ROOT = Path(__file__).resolve().parents[1]
BLOCK_ROOT = ROOT / "frontend" / "public" / "main-blocks"
RUNTIME = ROOT / "frontend" / "src" / "main-block-runtime.ts"
DOC = ROOT / "docs" / "3DB_11_INDIAN_OCEAN_SCALE_OUT.md"
START = contract.InventorySnapshot(140, 25, 115, 6, 31, 0)
END = contract.InventorySnapshot(140, 35, 105, 6, 41, 0)
BATCH = 10


def choose(manifest):
    regions = defaultdict(list)
    for block in manifest["blocks"]:
        if (block["materialization"] == "planned"
                and block["ocean_relevance"] == "ocean"
                and isinstance(block.get("ocean_fraction"), (float, int))
                and block["ocean_fraction"] >= 0.8):
            eligible = contract.assess_materialization_target(manifest, block["id"])
            if eligible.eligible_for_acquisition and not eligible.source_available:
                regions[block["region"]].append(block)
    for entries in regions.values():
        entries.sort(key=lambda x: (-x["ocean_fraction"], x["id"]))
    result = []
    for index in range(max(map(len, regions.values()), default=0)):
        for name in sorted(regions):
            if index < len(regions[name]):
                result.append(regions[name][index]["id"])
                if len(result) == BATCH:
                    return result
    raise RuntimeError("Fewer than 10 independent ocean-mask-qualified planned blocks")


def once(text, a, b):
    count = text.count(a)
    if count != 1:
        raise RuntimeError(f"Expected one historical count substitution, got {count}: {a}")
    return text.replace(a, b, 1)


CHANGES = {
    "frontend/e2e/3db00-capability-contract.spec.ts": [
        ("expect(planned).toHaveLength(115);", "expect(planned).toHaveLength(105);"),
        ("expect(PHASE35B_PILOT_IDS).toHaveLength(25);", "expect(PHASE35B_PILOT_IDS).toHaveLength(35);"),
    ],
    "frontend/e2e/main-block-engine.spec.ts": [
        ("exactly 25 source-backed pilots", "exactly 35 source-backed pilots"),
        ('toContainText("25 source-backed pilots")', 'toContainText("35 source-backed pilots")'),
        ('toContainText("25")', 'toContainText("35")'),
    ],
    "tests/test_3db01_materialization_foundation.py": [
        ("assert snapshot.materialized_pilots == 25", "assert snapshot.materialized_pilots == 35"),
        ("assert snapshot.planned_blocks == 115", "assert snapshot.planned_blocks == 105"),
        ("assert snapshot.payloads == 31", "assert snapshot.payloads == 41"),
    ],
    "tests/test_3db10_provenance_scientific_evidence.py": [
        ('assert manifest["integrity"]["pilot_block_count"] == 25',
         'assert manifest["integrity"]["pilot_block_count"] == 35'),
        ("assert len(payloads) == 31", "assert len(payloads) == 41"),
        ("for item in payloads}) == 31", "for item in payloads}) == 41"),
    ],
    "tests/test_3db02_genuine_pilot_acquisition.py": [
        ("assert snapshot.materialized_pilots == 25", "assert snapshot.materialized_pilots >= 25"),
        ("assert snapshot.planned_blocks == 115", "assert snapshot.planned_blocks <= 115"),
        ("assert snapshot.payloads == 31", "assert snapshot.payloads >= 31"),
        ('assert manifest["phase"] == "3DB-02"',
         'assert manifest["phase"] in {"3DB-02", "3DB-11"}'),
    ],
    "tests/test_phase35b_manifest.py": [
        ('assert manifest["phase"] == "3DB-02"',
         'assert manifest["phase"] in {"3DB-02", "3DB-11"}'),
        ('assert 20 <= integrity["pilot_block_count"] <= 25',
         'assert integrity["pilot_block_count"] >= 25'),
    ],
}


def update_canonical_clients(manifest):
    original = RUNTIME.read_text(encoding="utf-8")
    match = re.search(r'(export const PHASE35B_PILOT_IDS = \[)(.*?)(\] as const;)', original, re.S)
    if not match:
        raise RuntimeError("Typed runtime pilot array missing")
    old_ids = re.findall(r'"(IO-\d{3})"', match.group(2))
    new_ids = manifest["pilot_ids"]
    if len(old_ids) != START.materialized_pilots or old_ids != new_ids[:len(old_ids)]:
        raise RuntimeError("Original pilot registry differs from immutable source inventory")
    lines = []
    for n in range(0, len(new_ids), 6):
        items = new_ids[n:n + 6]
        lines.append("  " + ", ".join(json.dumps(item) for item in items) +
                     ("," if n + 6 < len(new_ids) else ""))
    replacement = match.group(1) + "\n" + "\n".join(lines) + "\n" + match.group(3)
    RUNTIME.write_text(original[:match.start()] + replacement + original[match.end():], encoding="utf-8")
    for relative, substitutions in CHANGES.items():
        path = ROOT / relative
        text = path.read_text(encoding="utf-8")
        for old, new in substitutions:
            text = once(text, old, new)
        path.write_text(text, encoding="utf-8")


def verify():
    snapshot = contract.validate_manifest(BLOCK_ROOT)
    manifest = contract.load_manifest(BLOCK_ROOT)
    if snapshot != END or manifest["phase"] != "3DB-11":
        raise RuntimeError(f"3DB-11 end-state not satisfied: {snapshot}")
    record = manifest.get("scale_out_3db11")
    if not isinstance(record, dict) or record.get("validated_before_promotion") is not True:
        raise RuntimeError("Scale-out promotion evidence missing")
    ids = record.get("block_ids")
    if not isinstance(ids, list) or len(ids) != BATCH or len(set(ids)) != BATCH:
        raise RuntimeError("Scale-out source-backed target inventory incorrect")
    if manifest["pilot_ids"][-BATCH:] != ids:
        raise RuntimeError("Scale-out runtime ordering inconsistent")
    by_id = {b["id"]: b for b in manifest["blocks"]}
    for block_id in ids:
        block = by_id[block_id]
        if block["materialization"] != "pilot" or len(block["payloads"]) != 1:
            raise RuntimeError(f"New source-backed pilot not validated: {block_id}")
    print(json.dumps({"phase": "3DB-11", "inventory": snapshot.__dict__,
                      "new_ids": ids, "validated": True}, sort_keys=True), flush=True)


def build():
    manifest = contract.load_manifest(BLOCK_ROOT)
    snapshot = contract.validate_manifest(BLOCK_ROOT)
    if snapshot == END and manifest.get("phase") == "3DB-11":
        verify()
        return
    if snapshot != START or manifest.get("phase") != "3DB-02":
        raise RuntimeError(f"Refusing acquisition from unexpected scientific inventory: {snapshot}")
    source_meta = manifest["source"]
    if source_meta["dates"] != ["2004-03-15", "2004-07-28"]:
        raise RuntimeError("Verified two-date source inventory changed")
    if len(source_meta["files"]) != 2:
        raise RuntimeError("Source files/dates mapping invalid")
    source = {"date": source_meta["dates"][0], "file": source_meta["files"][0]}
    ids = choose(manifest)
    by_id = {b["id"]: b for b in manifest["blocks"]}
    staged = []
    print(f"3DB-11 acquiring from genuine source: {ids}", flush=True)

    # Fail closed: remote retrieval + deep integrity gates precede all canonical writes.
    with tempfile.TemporaryDirectory(prefix="oceancanvas-3db11-") as temp:
        temporary = Path(temp)
        remote = opendap.open_remote(source)
        try:
            for i, block_id in enumerate(ids, 1):
                print(f"Genuine remote candidate {i}/{BATCH}: {block_id}", flush=True)
                record = opendap.materialize_one(temporary, remote, by_id[block_id], source)
                digest = contract.validate_candidate_payload(
                    temporary / record["path"], manifest=manifest, block_id=block_id,
                    source_date=source["date"], expected_sha256=record["sha256"],
                    deep_values=True)
                if digest != record["sha256"]:
                    raise RuntimeError(f"SHA-256 changed during candidate check: {block_id}")
                staged.append((block_id, record))
        finally:
            remote.close()

        for block_id, record in staged:
            destination = BLOCK_ROOT / record["path"]
            if destination.exists():
                raise RuntimeError(f"Refusing to overwrite original source evidence: {destination}")
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(temporary / record["path"], destination)

    for block_id, record in staged:
        block = by_id[block_id]
        block["materialization"] = "pilot"
        block["available_dates"] = [source["date"]]
        block["payloads"] = [record]
        manifest["pilot_ids"].append(block_id)
        manifest["payloads"].append({"block_id": block_id, **record})
    manifest["integrity"]["pilot_block_count"] = len(manifest["pilot_ids"])
    manifest["phase"] = "3DB-11"
    manifest["scale_out_3db11"] = {
        "phase": "3DB-11", "source_date": source["date"],
        "source_file": source["file"], "service_url": opendap.source_url(source),
        "selection": "ocean mask >=0.8; round robin across geographic regions",
        "block_ids": ids,
        "records": [{"block_id": block_id, **record} for block_id, record in staged],
        "validated_before_promotion": True,
    }
    phase02.compact_write(BLOCK_ROOT / "manifest.json", manifest)
    update_canonical_clients(manifest)
    verify()

    with DOC.open("a", encoding="utf-8") as stream:
        stream.write("\n## Source-acquisition results (generated and deep-validated)\n\n")
        stream.write("| Region | New block | Actual source date | Payload SHA-256 |\n")
        stream.write("|---|---|---|---|\n")
        for block_id, record in staged:
            stream.write(f"| {by_id[block_id]['region']} | {block_id} | "
                         f"{record['date']} | {record['sha256']} |\n")
        stream.write("\nValidated branch inventory: 140 logical; 35 pilots; 105 planned; "
                     "6 multi-date; 41 genuine checksum-referenced payloads; zero land. "
                     "This does not certify merge/deployment; live gates remain separate.\n")
    print("All 10 candidates acquired and validated before promotion", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    if args.plan_only:
        manifest = contract.load_manifest(BLOCK_ROOT)
        if contract.validate_manifest(BLOCK_ROOT) != START:
            raise RuntimeError("Plan-only requires exact verified pre-scale-out inventory")
        print(json.dumps({"planned_ids": choose(manifest)}, sort_keys=True))
    elif args.verify_only:
        verify()
    else:
        build()


if __name__ == "__main__":
    main()
