"""Build-only 105-cell source-feasibility atlas; never publish via Pages implicitly."""
from __future__ import annotations

import argparse
from pathlib import Path

from src.feasibility_atlas import build_from_original_files, serialized_atlas

REPO = Path(__file__).resolve().parents[1]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", type=Path, default=Path("artifacts/105-cell-feasibility.json"))
    args = ap.parse_args()
    out = args.output.expanduser().resolve()
    public = (REPO / "frontend/public").resolve()
    if out == public or public in out.parents:
        raise ValueError("Feasibility atlas is internal development evidence, not public frames")
    payload = build_from_original_files()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(serialized_atlas(payload))
    print("Built metadata-only feasibility atlas:", len(payload["blocks"]),
          "planned blocks, 7 batches; 0 new source acquisitions, 0 new matchups.")


if __name__ == "__main__":
    main()
