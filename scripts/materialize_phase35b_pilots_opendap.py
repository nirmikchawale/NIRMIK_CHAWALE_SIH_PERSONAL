"""Phase 3.5B genuine GLORYS12V1 pilot materialization via OPeNDAP.

The public NCSS endpoint rejected/timeouted this archive's subset query path on
GitHub-hosted runners. The same NCAR GDEX dataset exposes DAP2. xarray/netCDF4
therefore opens the source remotely and transfers only the requested array
slices. Scientific identity, values, coordinates and timestamps remain those of
the underlying MERCATOR GLORYS12V1 files.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import time
from typing import Any

import numpy as np
import xarray as xr

import materialize_phase35b_pilots_chunked as impl

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "frontend" / "public" / "main-blocks"
OPENDAP_BASE = "https://tds.gdex.ucar.edu/thredds/dodsC/files/d010049/2004"


def source_url(source: dict[str, str]) -> str:
    return f"{OPENDAP_BASE}/{source['file']}"


def open_remote(source: dict[str, str]) -> xr.Dataset:
    last_error: Exception | None = None
    for attempt in range(1, 5):
        try:
            ds = xr.open_dataset(source_url(source), engine="netcdf4", decode_cf=True, mask_and_scale=True)
            impl.validate_source(ds, source["date"], ("thetao", "so", "uo", "vo"))
            if "depth" not in ds.coords:
                ds.close()
                raise RuntimeError("Remote GLORYS12V1 dataset has no depth coordinate")
            return ds
        except Exception as exc:  # pragma: no cover - remote retry behaviour
            last_error = exc
            if attempt < 4:
                time.sleep(attempt * 4)
    raise RuntimeError(f"Unable to open genuine GLORYS12V1 OPeNDAP source: {last_error}\n{source_url(source)}")


def retry_load(data: xr.Dataset | xr.DataArray, label: str):
    last_error: Exception | None = None
    for attempt in range(1, 5):
        try:
            return data.load()
        except Exception as exc:  # pragma: no cover - remote retry behaviour
            last_error = exc
            if attempt < 4:
                time.sleep(attempt * 3)
    raise RuntimeError(f"Failed to load OPeNDAP slice {label}: {last_error}")


def add_ocean_relevance(cells: list[dict[str, Any]], ds: xr.Dataset) -> None:
    surface = ds["thetao"].isel(time=0, depth=0).sel(
        longitude=slice(impl.DOMAIN["west"], impl.DOMAIN["east"]),
        latitude=slice(impl.DOMAIN["south"], impl.DOMAIN["north"]),
    ).isel(longitude=slice(None, None, impl.HORIZONTAL_STRIDE), latitude=slice(None, None, impl.HORIZONTAL_STRIDE))
    surface = retry_load(surface, "60–100E, 5–25N surface mask")
    lon = np.asarray(surface["longitude"].values, dtype=float)
    lat = np.asarray(surface["latitude"].values, dtype=float)
    values = np.asarray(surface.values)

    for cell in cells:
        x = np.flatnonzero((lon >= cell["west"] - 1e-7) & (lon <= cell["east"] + 1e-7))
        y = np.flatnonzero((lat >= cell["south"] - 1e-7) & (lat <= cell["north"] + 1e-7))
        if x.size == 0 or y.size == 0:
            raise RuntimeError(f"Surface OPeNDAP coordinates do not intersect {cell['id']}")
        window = values[np.ix_(y, x)]
        fraction = float(np.isfinite(window).sum() / window.size)
        cell["ocean_fraction"] = round(fraction, 6)
        cell["ocean_relevance"] = "land" if fraction < 0.20 else "coastal" if fraction < 0.80 else "ocean"


def full_block_subset(ds: xr.Dataset, cell: dict[str, Any]) -> xr.Dataset:
    # Preserve a length-one time dimension because payload_for records the exact
    # source timestamp and expects time as a dimension.
    subset = ds[["thetao", "so", "uo", "vo"]].isel(time=slice(0, 1)).sel(
        depth=slice(0, impl.MAX_DEPTH_M),
        longitude=slice(cell["west"], cell["east"]),
        latitude=slice(cell["south"], cell["north"]),
    ).isel(longitude=slice(None, None, impl.HORIZONTAL_STRIDE), latitude=slice(None, None, impl.HORIZONTAL_STRIDE))
    subset = retry_load(subset, f"{cell['id']} full water column")
    if subset.sizes.get("depth", 0) < 20:
        raise RuntimeError(f"{cell['id']} has too few genuine depths under 500 m")
    return subset


def materialize_one(output: Path, ds: xr.Dataset, cell: dict[str, Any], source: dict[str, str]) -> dict[str, str]:
    subset = full_block_subset(ds, cell)
    try:
        payload = impl.payload_for(subset, cell, source, source_url(source))
    finally:
        subset.close()
    relative = f"data/{cell['id']}/{source['date']}.json"
    digest = impl.compact_write(output / relative, payload)
    return {"date": source["date"], "path": relative, "sha256": digest}


def build(output: Path) -> None:
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)

    cells = impl.target_cells()
    primary_source, secondary_source = impl.SOURCES
    primary = open_remote(primary_source)
    try:
        print("Loading source-backed surface mask through NCAR GDEX OPeNDAP…", flush=True)
        add_ocean_relevance(cells, primary)
        pilot_ids = impl.select_pilots(cells)
        pilot_set = set(pilot_ids)
        second_date_ids = [pilot_ids[i] for i in np.linspace(0, len(pilot_ids) - 1, impl.SECOND_DATE_COUNT, dtype=int)]
        second_date_ids = list(dict.fromkeys(second_date_ids))
        second_set = set(second_date_ids)
        payload_records: list[dict[str, str]] = []

        for cell in cells:
            cell["materialization"] = "pilot" if cell["id"] in pilot_set else "planned"
            cell["available_dates"] = []
            cell["payloads"] = []
            if cell["id"] not in pilot_set:
                continue
            print(f"Materializing {cell['id']} {primary_source['date']} ({cell['region']}, ocean={cell['ocean_fraction']:.3f})", flush=True)
            record = materialize_one(output, primary, cell, primary_source)
            cell["available_dates"].append(record["date"])
            cell["payloads"].append(record)
            payload_records.append({"block_id": cell["id"], **record})
    finally:
        primary.close()

    secondary = open_remote(secondary_source)
    try:
        by_id = {cell["id"]: cell for cell in cells}
        for block_id in second_date_ids:
            cell = by_id[block_id]
            print(f"Materializing second genuine date {block_id} {secondary_source['date']}", flush=True)
            record = materialize_one(output, secondary, cell, secondary_source)
            cell["available_dates"].append(record["date"])
            cell["payloads"].append(record)
            payload_records.append({"block_id": cell["id"], **record})
    finally:
        secondary.close()

    manifest = {
        "schema": "oceancanvas-main-block-manifest-v1",
        "phase": "3.5B",
        "target_domain": {**impl.DOMAIN, "columns": 14, "rows": 10, "logical_block_count": impl.TARGET_COUNT},
        "source": {
            "origin_product": impl.ORIGIN_PRODUCT,
            "product_id": impl.ORIGIN_PRODUCT_ID,
            "dataset_id": impl.ORIGIN_DATASET_ID,
            "archive_provider": impl.ARCHIVE_PROVIDER,
            "transport": "OPeNDAP DAP2",
            "dates": [source["date"] for source in impl.SOURCES],
            "files": [source["file"] for source in impl.SOURCES],
            "time_semantics": "daily_mean",
            "horizontal_stride": impl.HORIZONTAL_STRIDE,
            "maximum_depth_m": impl.MAX_DEPTH_M,
        },
        "integrity": {
            "logical_block_count": len(cells),
            "pilot_block_count": len(pilot_ids),
            "multi_date_pilot_count": len(second_date_ids),
            "land_blocks_materialized": sum(1 for c in cells if c["materialization"] == "pilot" and c["ocean_relevance"] == "land"),
            "synthetic_measurements": False,
            "synthetic_timestamps": False,
            "synthetic_coordinates": False,
            "synthetic_depths": False,
            "vertical_component_available": False,
        },
        "pilot_ids": pilot_ids,
        "multi_date_pilot_ids": second_date_ids,
        "payloads": payload_records,
        "blocks": cells,
    }
    impl.compact_write(output / "manifest.json", manifest)
    impl.verify(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    impl.verify(args.output) if args.verify_only else build(args.output)


if __name__ == "__main__":
    main()
