"""Development-only official Copernicus IO-087 2024 source plan/fetch/inspect.

Never writes frontend/public or main-block manifest; no demo sample fallback.
CLI:
    python -m scripts.build_io087_candidate plan
    python -m scripts.build_io087_candidate fetch --output-dir /private/raw/io087
    python -m scripts.build_io087_candidate inspect --source /private/raw/io087/IO-087_GLORYS12V1_20240102.nc --receipt /private/raw/io087/receipt.json
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

from src.io087_source_wave import (
    MODEL_DATASET_ID, MODEL_DATE, IO087, canonical_request, raw_sha256,
    inspect_native_netcdf, confirm_source_receipt, request_status, io087_user_view_state,
)


def _safe_private_output(output: Path) -> Path:
    """Forbid direct writes into deployed static source assets."""
    out = output.expanduser().resolve()
    project_root = Path(__file__).resolve().parents[1]
    public = project_root / "frontend" / "public"
    try:
        out.relative_to(public)
    except ValueError:
        return out
    raise ValueError("IO-087 acquisition may not write directly into frontend/public")


def _acquire(output: Path, *, dataset_version: str | None = None) -> dict:
    """M042: official authenticated source retrieval, resumable at file boundary.

    Copernicus SDK uses credentials external to code, not in Git or CLI args.
    Existing output is NEVER overwritten or passed as an authenticated download.
    """
    out = _safe_private_output(output)
    request = canonical_request(output_directory=str(out),
                                dataset_version=dataset_version)
    source = out / request["output_filename"]
    receipt_path = out / "receipt.json"
    if source.exists():
        return {"status": "EXISTING_SOURCE_NEEDS_VERIFICATION",
                "source": str(source), "receipt": str(receipt_path),
                "raw_source": request_status(source)}
    try:
        import copernicusmarine
    except ImportError as exc:
        raise RuntimeError("Install 'copernicusmarine' in a private acquisition environment") from exc
    out.mkdir(parents=True, exist_ok=True)
    # No credentials passed or recorded; authenticated Toolbox session only.
    copernicusmarine.subset(**request, overwrite=False)
    if not source.is_file():
        raise RuntimeError("Copernicus Toolbox returned without the requested original-source file")
    # Check real NetCDF BEFORE writing a provenance receipt.
    inspection = inspect_native_netcdf(source)
    digest = raw_sha256(source)
    receipt = {
        "schema": "oceancanvas-io087-toolbox-receipt-v1",
        "block_id": IO087,
        "dataset_id": MODEL_DATASET_ID,
        "request_date": MODEL_DATE,
        "method": "copernicusmarine.subset",
        "source_filename": source.name,
        "sha256": digest,
        "retrieved_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_version_requested": dataset_version,
        "dataset_version_resolved": "TO_BE_CHECKED_AGAINST_COPERNICUS_METADATA",
        "distribution_license_review": "REQUIRED_BEFORE_REDISTRIBUTION",
        "source_variables": sorted(inspection["variable_evidence"]),
    }
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    return {"status": "SOURCE_DOWNLOADED_STRUCTURALLY_VALIDATED",
            "source": str(source), "receipt": str(receipt_path),
            "raw_sha256": digest, "ready_for_scientific_matchup": False}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["plan", "fetch", "inspect"])
    parser.add_argument("--output-dir", type=Path, default=Path("artifacts/io087"))
    parser.add_argument("--source", type=Path)
    parser.add_argument("--receipt", type=Path)
    parser.add_argument("--dataset-version")
    options = parser.parse_args()
    if options.action == "plan":
        result = {"status": "UNFETCHED_REQUEST_READY",
                  "request": canonical_request(
                      output_directory=str(_safe_private_output(options.output_dir)),
                      dataset_version=options.dataset_version),
                  "source_data_included": False}
    elif options.action == "fetch":
        result = _acquire(options.output_dir, dataset_version=options.dataset_version)
    else:
        if options.source is None:
            parser.error("inspect requires --source with real NetCDF downloaded from provider")
        source = _safe_private_output(options.source)
        inspection = inspect_native_netcdf(source)
        verified_receipt = False
        if options.receipt:
            r = json.loads(_safe_private_output(options.receipt).read_text(encoding="utf-8"))
            verified_receipt = confirm_source_receipt(inspection, r)
        result = {"inspection": inspection,
                  "receipt_matches_sha_and_request": verified_receipt,
                  "view": io087_user_view_state(source_report=inspection,
                       receipt_verified=verified_receipt)}
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
