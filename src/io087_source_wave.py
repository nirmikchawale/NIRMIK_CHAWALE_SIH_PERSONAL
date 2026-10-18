"""M040–M047 genuine IO-087 provider acquisition/verification development path.

No real model values are included here. SHA, native time/depth/masks, original
source receipt and Argo conditions are checked; UI and public source manifests
remain PLANNED until source-backed derived artifacts are separately certified.
"""
from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
import json
import math
from pathlib import Path
import re
from typing import Any, Mapping

IO087 = "IO-087"
BOUNDS = {"west": 66.0, "east": 69.0, "south": 11.0, "north": 13.0}
MODEL_DATASET_ID = "cmems_mod_glo_phy_my_0.083deg_P1D-m"
PRODUCT_ID = "GLOBAL_MULTIYEAR_PHY_001_030"
MODEL_DATE = "2024-01-02"
MODEL_VARIABLES = ("thetao", "so", "uo", "vo")
MAX_RAW_BYTES = 512 * 1024 * 1024
ORIGINAL_ARGO_PROFILE_IDS = {
    "20240102_indian_ocean_prof:23": (5907092, 13, 50),
    "20240102_indian_ocean_prof:26": (5907092, 12, 49),
}


def canonical_request(*, date: str = MODEL_DATE, output_directory: str = "artifacts/io087",
                      dataset_version: str | None = None) -> dict[str, Any]:
    """M041: native 2024 Copernicus Toolbox subset, not local 2004 pilot data."""
    if date != MODEL_DATE:
        raise ValueError("IO-087 requires source-date matching verified 2024 Argo")
    if dataset_version is not None and not re.fullmatch(r"[A-Za-z0-9_-]{4,40}", dataset_version):
        raise ValueError("Invalid pinned Copernicus dataset version")
    filename = "IO-087_GLORYS12V1_20240102.nc"
    params: dict[str, Any] = {
        "dataset_id": MODEL_DATASET_ID,
        "variables": list(MODEL_VARIABLES),
        "minimum_longitude": BOUNDS["west"],
        "maximum_longitude": BOUNDS["east"],
        "minimum_latitude": BOUNDS["south"],
        "maximum_latitude": BOUNDS["north"],
        "start_datetime": MODEL_DATE,
        "end_datetime": MODEL_DATE,
        "minimum_depth": 0,
        "maximum_depth": 500,
        "output_directory": output_directory,
        "output_filename": filename,
    }
    if dataset_version:
        params["dataset_version"] = dataset_version
    return params


def verify_original_inventory(manifest: Mapping[str, Any]) -> None:
    """M040: IO-087 must remain unmaterialized until new original source is proven."""
    blocks = {row["id"]: row for row in manifest["blocks"]}
    io87 = blocks.get(IO087)
    if not io87 or any(float(io87[k]) != v for k, v in BOUNDS.items()):
        raise ValueError("IO-087 canonical polygon changed")
    if io87.get("materialization") != "planned" or io87.get("available_dates") or io87.get("payloads"):
        raise ValueError("Unexpected IO-087 publication; audit before acquiring new source")
    if len(blocks) != 140 or len(manifest.get("payloads", [])) != 41:
        raise ValueError("Protected 140-cell/41-frame baseline has changed")
    if MODEL_DATE in manifest.get("source", {}).get("dates", []):
        raise ValueError("Old pilot manifest falsely claims new 2024 source evidence")


def raw_sha256(path: Path) -> str:
    """M043: hash actual original bytes, with bounded file-size policy."""
    path = Path(path)
    if not path.is_file() or path.is_symlink():
        raise ValueError("Original Copernicus NetCDF file is absent or unsafe")
    size = path.stat().st_size
    if not 1024 <= size <= MAX_RAW_BYTES:
        raise ValueError("Original NetCDF source file is empty or exceeds 512 MiB")
    digest = sha256()
    with path.open("rb") as handle:
        while block := handle.read(4 * 1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def inspect_native_netcdf(path: Path) -> dict[str, Any]:
    """M043–M044 inspect an ACTUAL downloaded NetCDF, never invent missing data.

    Structural QC is not a provider-authenticity certificate by itself.
    """
    from netCDF4 import Dataset, num2date
    import numpy as np

    raw_hash = raw_sha256(path)
    with Dataset(str(path), "r") as nc:
        expected_axes = ("time", "depth", "latitude", "longitude")
        absent = [name for name in expected_axes + MODEL_VARIABLES if name not in nc.variables]
        if absent:
            raise ValueError(f"Provider model lacks native axes/variables: {absent}")
        axes = {name: np.ma.asarray(nc.variables[name][:]).compressed().astype(float)
                for name in expected_axes if name != "time"}
        lon = axes["longitude"]
        lat = axes["latitude"]
        depth = axes["depth"]
        if any(len(axes[name]) < (2 if name != "depth" else 2)
               for name in ("longitude", "latitude", "depth")):
            raise ValueError("Source axes are incomplete for a geographic 3D block")
        if not all(np.isfinite(values).all() for values in axes.values()):
            raise ValueError("Source coordinate axis has missing or non-finite values")
        if not (np.diff(lon) > 0).all() or not (np.diff(lat) > 0).all() or not (np.diff(depth) > 0).all():
            raise ValueError("Source axes must be native monotone grid coordinates")
        if min(lon) < BOUNDS["west"] - 0.15 or max(lon) > BOUNDS["east"] + 0.15:
            raise ValueError("Native longitude grid leaves canonical IO-087 region")
        if min(lat) < BOUNDS["south"] - 0.15 or max(lat) > BOUNDS["north"] + 0.15:
            raise ValueError("Native latitude grid leaves canonical IO-087 region")
        if min(depth) < 0 or max(depth) > 500.5:
            raise ValueError("Native source depth beyond requested 0-500m bounds")
        tvar = nc.variables["time"]
        if len(tvar) != 1 or not hasattr(tvar, "units"):
            raise ValueError("Exactly one native source-backed daily model time is required")
        source_time = num2date(float(tvar[0]), tvar.units,
                              calendar=getattr(tvar, "calendar", "standard"))
        native_day = source_time.strftime("%Y-%m-%d")
        if native_day != MODEL_DATE:
            raise ValueError("Source native time is not the contemporaneous 2024-01-02 day")
        expected_shape = (1, len(depth), len(lat), len(lon))
        statistics = {}
        for name in MODEL_VARIABLES:
            var = nc.variables[name]
            if tuple(var.dimensions) != expected_axes or tuple(var.shape) != expected_shape:
                raise ValueError(f"{name} dims do not match native 4D source axes")
            if not str(getattr(var, "units", "")).strip():
                raise ValueError(f"{name} native variable units missing")
            values = np.ma.masked_invalid(var[:])
            finite = values.compressed()
            if len(finite) == 0:
                raise ValueError(f"{name} contains zero genuine wet finite source values")
            statistics[name] = {
                "native_units": str(var.units), "valid_wet_cells": int(len(finite)),
                "masked_or_missing_cells": int(np.prod(expected_shape) - len(finite))
            }
        # Different variables may legitimately have different native masks.
        return {
            "schema": "oceancanvas-io087-raw-source-inspection-v1",
            "block_id": IO087, "model_date": MODEL_DATE, "model_dataset_id": MODEL_DATASET_ID,
            "raw_sha256": raw_hash,
            "source_time_native": source_time.strftime("%Y-%m-%dT%H:%M:%S"),
            "time_semantics": "source-daily-mean",
            "coordinate_evidence": {
                "longitudes": lon.tolist(), "latitudes": lat.tolist(),
                "depths_m": depth.tolist(),
                "vertical_positive": str(getattr(nc.variables["depth"], "positive", "unknown")),
            },
            "variable_evidence": statistics,
            "source_authenticity": "STRUCTURALLY_VALIDATED_ORIGIN_RECEIPT_REQUIRED",
            "new_model_observation_residuals_computed": False,
            "ui_materialization": "PLANNED",
        }


def confirm_source_receipt(report: Mapping[str, Any], receipt: Mapping[str, Any]) -> bool:
    """M043: receipt and inspected raw bytes must agree before promotion."""
    return bool(receipt.get("schema") == "oceancanvas-io087-toolbox-receipt-v1"
                and receipt.get("dataset_id") == MODEL_DATASET_ID
                and receipt.get("block_id") == IO087
                and receipt.get("request_date") == MODEL_DATE
                and receipt.get("sha256") == report.get("raw_sha256")
                and receipt.get("method") == "copernicusmarine.subset"
                and report.get("model_date") == MODEL_DATE)


def assess_argo_context(model_report: Mapping[str, Any] | None,
                        argo_summary: Mapping[str, Any]) -> dict[str, Any]:
    """M045: native profile localization, not copied model residual statistics."""
    pid = str(argo_summary.get("profile_id") or "")
    candidate = ORIGINAL_ARGO_PROFILE_IDS.get(pid)
    if candidate is None or (
        str(argo_summary.get("platform_id")) != str(candidate[0])
        or argo_summary.get("cycle") != candidate[1]
        or argo_summary.get("matched_level_count") != candidate[2]
    ):
        return {"status": "INELIGIBLE", "reason": "Unknown or altered original Argo diagnostic profile"}
    try:
        lon = float(argo_summary["observation_longitude"])
        lat = float(argo_summary["observation_latitude"])
        native_time = datetime.fromisoformat(str(argo_summary["observation_time_utc"]).replace("Z", "+00:00"))
    except (ValueError, TypeError, KeyError):
        return {"status": "INELIGIBLE", "reason": "Missing original observation space/time metadata"}
    if not (BOUNDS["west"] <= lon <= BOUNDS["east"] and BOUNDS["south"] <= lat <= BOUNDS["north"]
            and native_time.tzinfo is not None and native_time.date().isoformat() == MODEL_DATE):
        return {"status": "INELIGIBLE", "reason": "Argo is outside geographic block or daily source time"}
    if model_report is None or model_report.get("raw_sha256") is None:
        return {"status": "SPATIAL_CONTEXT_ONLY", "reason": "No separate IO-087 raw 2024 model source"}
    depths = model_report.get("coordinate_evidence", {}).get("depths_m", [])
    if len(depths) < 2 or not (min(depths) <= float(argo_summary["shallowest_matched_depth_m"])
                               and float(argo_summary["deepest_matched_depth_m"]) <= max(depths)):
        return {"status": "UNAVAILABLE", "reason": "Source-native 3D depth does not bracket original observation"}
    return {
        "status": "POTENTIAL_TEMPORAL_AND_GEOGRAPHIC_OVERLAP",
        "reason": "Eligibility preliminary; wet-cell/method/QC/real resampling still required",
        "legacy_match_count_not_transferred": candidate[2],
        "fresh_io087_residual_count": 0,
    }


def io087_user_view_state(*, source_report: Mapping[str, Any] | None,
                          receipt_verified: bool, new_matchup_verified: bool = False) -> dict[str, Any]:
    """M046–M047 honest UI contract; never rebrand the baseline volume as IO-087."""
    if source_report is None:
        reason = "Awaiting a separately acquired, verified 2024 IO-087 GLORYS source"
    elif not receipt_verified:
        reason = "A source file was inspected but Copernicus origin is not attested"
    elif not new_matchup_verified:
        reason = "Model source received; fresh IO-087 scientific matchup not verified"
    else:
        reason = "Source and matchup require separately certified 3D render pipeline"
    return {
        "schema": "oceancanvas-io087-ui-readiness-v1",
        "block_id": IO087, "bounds": dict(BOUNDS),
        "status": "PLANNED",
        "reason": reason,
        "new_model_observation_residuals": None,
        "model_volume_render_ready": False,
        "visible_canvas_count_for_unmaterialized_block": 0,
        "original_baseline_remains_independent": True,
    }


def request_status(path: Path) -> dict[str, Any]:
    """M042: idempotent acquisition checkpoint, never a demo fallback."""
    if Path(path).exists():
        try:
            return {"status": "SOURCE_FILE_PRESENT_VERIFY_REQUIRED",
                    "raw_sha256": raw_sha256(path)}
        except ValueError as exc:
            return {"status": "BLOCKED", "reason": str(exc)}
    return {"status": "BLOCKED_SOURCE_NOT_ACQUIRED",
            "reason": "Copernicus Marine Toolbox source download needs account/network access"}
