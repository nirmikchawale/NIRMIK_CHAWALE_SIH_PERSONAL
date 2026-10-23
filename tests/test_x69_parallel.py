"""Source-independent plan/selection guard for X001–X069."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import materialize_x69_parallel as x


def test_x69_plan_exact_once_and_reserved_argo_cell():
    manifest = x.base_manifest()
    ids = x.targets(manifest)
    assert len(ids) == 69 and len(set(ids)) == 69
    assert ids == sorted(ids)
    assert x.RESERVED == "IO-087" and x.RESERVED not in ids
    assert not set(ids).intersection(manifest["pilot_ids"])
    assert len({item for i in range(x.SHARDS) for item in x.shard_ids(ids, i)}) == 69
    for block_id in ids:
        assessment = x.contract.assess_materialization_target(manifest, block_id)
        assert assessment.eligible_for_acquisition
        assert not assessment.source_available and not assessment.data_available


def test_x69_immutable_baseline_counts_and_no_unsafe_shard():
    assert x.BEFORE.materialized_pilots == 35
    assert x.AFTER.materialized_pilots == 104
    assert x.AFTER.planned_blocks == 36
    assert x.AFTER.payloads == 110
    assert x.AFTER.multi_date_pilots == 6
    assert x.AFTER.land_blocks_materialized == 0
    for bad in (-1, x.SHARDS, x.SHARDS + 1):
        try:
            x.shard_ids(["IO-003"], bad)
        except ValueError:
            pass
        else:
            raise AssertionError("Out-of-range acquisition shard accepted")
