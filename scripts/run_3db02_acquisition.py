"""Run 3DB-02 while treating the verified 24-pilot registry as order-independent.

The 3DB-01 contract defines pilot identity by set equality, while the legacy
manifest stores pilot_ids in acquisition order and the frontend runtime stores
the same IDs in display order. This adapter normalizes that already-verified
identity in memory only. It performs no canonical write itself; the 3DB-02
executor still writes production evidence only after genuine candidate
validation succeeds.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import materialize_3db02_pilot as impl

_original_load_manifest = impl.contract.load_manifest


def _load_manifest_order_independent(block_root: Path = impl.BLOCK_ROOT) -> dict[str, Any]:
    manifest = _original_load_manifest(block_root)
    pilot_ids = manifest.get("pilot_ids")
    if isinstance(pilot_ids, list):
        legacy = set(impl.LEGACY_PILOTS)
        if len(pilot_ids) == len(impl.LEGACY_PILOTS) and set(pilot_ids) == legacy:
            manifest["pilot_ids"] = list(impl.LEGACY_PILOTS)
    return manifest


impl.contract.load_manifest = _load_manifest_order_independent
impl.main()
