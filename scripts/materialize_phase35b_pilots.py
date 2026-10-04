"""Materialize genuine Phase 3.5B GLORYS12V1 pilot main blocks.

The current 140 IO blocks are geographic planning cells. This script downloads
bounded, source-backed MERCATOR GLORYS12V1 daily fields from the public NCAR
GDEX THREDDS archive, derives an ocean relevance mask from finite source water
cells, selects a geographically distributed pilot inventory, and writes compact
browser-ready JSON payloads.

It never copies the existing BASE-GLORYS-001 values, never fills land with zero,
and never manufactures dates, coordinates, depths, or a vertical current.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import tempfile
import time
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import numpy as np
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "frontend" / "public" / "main-blocks"

DOMAIN = {"west": 60.0, "east": 100.0, "south": 5.0, "north": 25.0}
LONGITUDE_EDGES = [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 100]
ROWS = 10
TARGET_COUNT = 140
HORIZONTAL_STRIDE = 2
MAX_DEPTH_M = 500.0
PILOT_COUNT = 24
SECOND_DATE_COUNT = 6

SOURCES = (
    {
        "date": "2004-03-15",
        "file": "mercatorglorys12v1_gl12_mean_20040315_R20040317.nc",
    },
    {
        "date": "2004-07-28",
        "file": "mercatorglorys12v1_gl12_mean_20040728_R20040804.nc",
    },
)

THREDDS_BASE = "https://tds.gdex.ucar.edu/thredds/ncss/grid/files/d010049/2004"
ORIGIN_PRODUCT = "Copernicus Marine / Mercator Ocean GLORYS12V1"
ORIGIN_PRODUCT_ID = "GLOBAL_MULTIYEAR_PHY_001_030"
ORIGIN_DATASET_ID = "cmems_mod_glo_phy_my_0.083deg_P1D-m"
ARCHIVE_PROVIDER = "NCAR GDEX public THREDDS archive"

REGION_QUOTAS: dict[str, int] = {
    "Western Arabian Sea": 3,
    "Central Arabian Sea": 3,
    "India West Coast": 3,
    "Lakshadweep & Southern Arabian Sea": 3,
    "South of India": 3,
    "India East Coast": 2,
    "Bay of Bengal": 4,
    "Andaman & Nicobar": 2,
    "Eastern Indian Ocean": 1,
}


def classify_region(west: float, east: float, south: float, north: float) -> str:
    lon = (west + east) / 2
    lat = (south + north) / 2
    if lon < 66:
        return "Western Arabian Sea"
    if lon < 72:
        return "Lakshadweep & Southern Arabian Sea" if lat < 10 else "Central Arabian Sea"
    if lon < 77:
        return "Lakshadweep & Southern Arabian Sea" if lat < 10 else "India West Coast"
    if lon < 82:
        if lat < 10:
            return "South of India"
        return "India East Coast" if lat < 15 else "Bay of Bengal"
    if lon < 92:
        return "Eastern Indian Ocean" if lat < 9 else "Bay of Bengal"
    if lon < 96:
        return "Andaman & Nicobar" if lat < 16 else "Bay of Bengal"
    return "Eastern Indian Ocean"


def target_cells() -> list[dict[str, Any]]:
    cells: list[dict[str, Any]] = []
    index = 1
    for row in range(ROWS):
        north = DOMAIN["north"] - row * 2
        south = north - 2
        for column in range(len(LONGITUDE_EDGES) - 1):
            west = float(LONGITUDE_EDGES[column])
            east = float(LONGITUDE_EDGES[column + 1])
            cells.append(
                {
                    "id": f"IO-{index:03d}",
                    "row": row,
                    "column": column,
                    "west": west,
                    "east": east,
                    "south": float(south),
                    "north": float(north),
                    "region": classify_region(west, east, south, north),
                }
            )
            index += 1
    if len(cells) != TARGET_COUNT:
        raise RuntimeError(f"Expected {TARGET_COUNT} target cells, got {len(cells)}")
    return cells


def ncss_url(source: dict[str, str]) -> str:
    query = urlencode(
        {
            "var": "thetao,so,uo,vo",
            "north": DOMAIN["north"],
            "south": DOMAIN["south"],
            "west": DOMAIN["west"],
            "east": DOMAIN["east"],
            "horizStride": HORIZONTAL_STRIDE,
            "time": f"{source['date']}T00:00:00Z",
            "accept": "netcdf4",
        }
    )
    return f"{THREDDS_BASE}/{source['file']}?{query}"


def download(url: str, destination: Path, attempts: int = 4) -> None:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": "OceanCanvas-SIH26067/phase35b"})
            with urlopen(request, timeout=180) as response, destination.open("wb") as stream:
                shutil.copyfileobj(response, stream)
            if destination.stat().st_size < 10_000:
                raise RuntimeError(f"Downloaded subset is unexpectedly small: {destination.stat().st_size} bytes")
            return
        except Exception as exc:  # pragma: no cover - network retries are CI behaviour
            last_error = exc
            destination.unlink(missing_ok=True)
            if attempt < attempts:
                time.sleep(attempt * 4)
    raise RuntimeError(f"Failed to download {url}: {last_error}")


def _date_from_dataset(ds: xr.Dataset) -> str:
    values = np.asarray(ds["time"].values).reshape(-1)
    if values.size != 1:
        raise RuntimeError(f"Expected exactly one genuine source time, got {values.size}")
    return str(np.datetime_as_string(values[0], unit="D"))


def open_validated_subset(path: Path, expected_date: str) -> xr.Dataset:
    ds = xr.open_dataset(path, decode_cf=True, mask_and_scale=True)
    required = {"thetao", "so", "uo", "vo", "longitude", "latitude", "depth", "time"}
    missing = sorted(required.difference(ds.variables).difference(ds.coords))
    if missing:
        ds.close()
        raise RuntimeError(f"Source subset missing required variables/coordinates: {missing}")

    identity = " ".join(str(ds.attrs.get(key, "")) for key in ("source", "title", "comment", "institution"))
    if "GLORYS12V1" not in identity.upper():
        ds.close()
        raise RuntimeError(f"Source identity does not declare GLORYS12V1: {identity[:240]}")

    actual_date = _date_from_dataset(ds)
    if actual_date != expected_date:
        ds.close()
        raise RuntimeError(f"Source date mismatch: expected {expected_date}, got {actual_date}")

    ds = ds.sel(depth=ds["depth"] <= MAX_DEPTH_M)
    if ds.sizes.get("depth", 0) < 20:
        ds.close()
        raise RuntimeError("Too few genuine depth levels remained under the 500 m ceiling")

    for name in ("thetao", "so", "uo", "vo"):
        if not np.isfinite(np.asarray(ds[name].isel(time=0).values)).any():
            ds.close()
            raise RuntimeError(f"No finite source values found for {name}")
    return ds


def mask_for_cell(ds: xr.Dataset, cell: dict[str, Any]) -> tuple[np.ndarray, np.ndarray]:
    lon = np.asarray(ds["longitude"].values, dtype=float)
    lat = np.asarray(ds["latitude"].values, dtype=float)
    lon_idx = np.flatnonzero((lon >= cell["west"] - 1e-7) & (lon <= cell["east"] + 1e-7))
    lat_idx = np.flatnonzero((lat >= cell["south"] - 1e-7) & (lat <= cell["north"] + 1e-7))
    if lon_idx.size == 0 or lat_idx.size == 0:
        raise RuntimeError(f"No source coordinates intersect {cell['id']}")
    return lat_idx, lon_idx


def ocean_fraction(ds: xr.Dataset, cell: dict[str, Any]) -> float:
    lat_idx, lon_idx = mask_for_cell(ds, cell)
    surface = np.asarray(ds["thetao"].isel(time=0, depth=0).values)
    window = surface[np.ix_(lat_idx, lon_idx)]
    return float(np.isfinite(window).sum() / window.size)


def relevance(fraction: float) -> str:
    if fraction < 0.20:
        return "land"
    if fraction < 0.80:
        return "coastal"
    return "ocean"


def select_pilots(cells: list[dict[str, Any]]) -> list[str]:
    chosen: list[dict[str, Any]] = []
    used: set[str] = set()
    for region, quota in REGION_QUOTAS.items():
        candidates = sorted(
            (c for c in cells if c["region"] == region and c["ocean_fraction"] >= 0.35),
            key=lambda c: (c["ocean_fraction"], -c["row"], -c["column"]),
            reverse=True,
        )
        for cell in candidates[:quota]:
            chosen.append(cell)
            used.add(cell["id"])

    if len(chosen) < PILOT_COUNT:
        remainder = sorted(
            (c for c in cells if c["id"] not in used and c["ocean_fraction"] >= 0.55),
            key=lambda c: c["ocean_fraction"],
            reverse=True,
        )
        chosen.extend(remainder[: PILOT_COUNT - len(chosen)])

    chosen = chosen[:PILOT_COUNT]
    if len(chosen) < 20:
        raise RuntimeError(f"Only {len(chosen)} ocean-relevant pilot cells were selectable")
    if any(c["ocean_relevance"] == "land" for c in chosen):
        raise RuntimeError("Land-dominant cell selected as a pilot")
    return [c["id"] for c in chosen]


def _json_values(values: np.ndarray, decimals: int = 5) -> list[float | None]:
    flat = np.asarray(values, dtype=float).reshape(-1)
    result: list[float | None] = []
    for value in flat:
        if math.isfinite(float(value)):
            result.append(round(float(value), decimals))
        else:
            result.append(None)
    return result


def _stat(values: np.ndarray) -> dict[str, Any]:
    finite = np.asarray(values, dtype=float)
    finite = finite[np.isfinite(finite)]
    if finite.size == 0:
        return {"finite_count": 0, "minimum": None, "maximum": None}
    return {
        "finite_count": int(finite.size),
        "minimum": round(float(finite.min()), 6),
        "maximum": round(float(finite.max()), 6),
    }


def payload_for(ds: xr.Dataset, cell: dict[str, Any], source: dict[str, str]) -> dict[str, Any]:
    lat_idx, lon_idx = mask_for_cell(ds, cell)
    lats = np.asarray(ds["latitude"].values, dtype=float)[lat_idx]
    lons = np.asarray(ds["longitude"].values, dtype=float)[lon_idx]
    depths = np.asarray(ds["depth"].values, dtype=float)

    arrays: dict[str, np.ndarray] = {}
    for name in ("thetao", "so", "uo", "vo"):
        data = np.asarray(ds[name].isel(time=0).values)
        arrays[name] = data[:, lat_idx][:, :, lon_idx]

    shape = [int(depths.size), int(lats.size), int(lons.size)]
    if any(array.shape != tuple(shape) for array in arrays.values()):
        raise RuntimeError(f"Shape mismatch while materializing {cell['id']}")

    if not np.isfinite(arrays["thetao"]).any() or not np.isfinite(arrays["so"]).any():
        raise RuntimeError(f"Pilot {cell['id']} contains no finite scalar ocean values")
    if not np.isfinite(arrays["uo"]).any() or not np.isfinite(arrays["vo"]).any():
        raise RuntimeError(f"Pilot {cell['id']} contains no finite horizontal-current values")

    return {
        "schema": "oceancanvas-main-block-pilot-v1",
        "block_id": cell["id"],
        "region": cell["region"],
        "bounds": {key: cell[key] for key in ("west", "east", "south", "north")},
        "ocean_fraction": cell["ocean_fraction"],
        "ocean_relevance": cell["ocean_relevance"],
        "time": f"{source['date']}T00:00:00Z",
        "time_semantics": "daily_mean",
        "coordinates": {
            "longitude": [round(float(v), 6) for v in lons],
            "latitude": [round(float(v), 6) for v in lats],
            "depth_m": [round(float(v), 6) for v in depths],
            "depth_positive": "down",
        },
        "shape": {"depth": shape[0], "latitude": shape[1], "longitude": shape[2]},
        "variables": {
            "thetao": {"units": "degrees_C", "values": _json_values(arrays["thetao"]), **_stat(arrays["thetao"])},
            "so": {"units": "1e-3", "values": _json_values(arrays["so"]), **_stat(arrays["so"])},
            "uo": {"units": "m s-1", "values": _json_values(arrays["uo"]), **_stat(arrays["uo"])},
            "vo": {"units": "m s-1", "values": _json_values(arrays["vo"]), **_stat(arrays["vo"])},
        },
        "source": {
            "origin_product": ORIGIN_PRODUCT,
            "product_id": ORIGIN_PRODUCT_ID,
            "dataset_id": ORIGIN_DATASET_ID,
            "archive_provider": ARCHIVE_PROVIDER,
            "archive_file": source["file"],
            "service_url": ncss_url(source),
            "horizontal_stride": HORIZONTAL_STRIDE,
        },
        "integrity": {
            "source_values_modified": False,
            "synthetic_measurements": False,
            "synthetic_timestamps": False,
            "synthetic_coordinates": False,
            "synthetic_depths": False,
            "vertical_component_available": False,
            "land_fill_preserved_as_missing": True,
        },
    }


def compact_write(path: Path, payload: Any) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="oceancanvas-phase35b-") as temp_dir:
        temp = Path(temp_dir)
        datasets: dict[str, xr.Dataset] = {}
        try:
            for source in SOURCES:
                subset_path = temp / source["file"]
                url = ncss_url(source)
                print(f"Fetching genuine GLORYS12V1 daily subset: {source['date']}\n{url}")
                download(url, subset_path)
                datasets[source["date"]] = open_validated_subset(subset_path, source["date"])

            primary_source = SOURCES[0]
            primary = datasets[primary_source["date"]]
            cells = target_cells()
            for cell in cells:
                fraction = ocean_fraction(primary, cell)
                cell["ocean_fraction"] = round(fraction, 6)
                cell["ocean_relevance"] = relevance(fraction)

            pilot_ids = select_pilots(cells)
            second_date_ids = [pilot_ids[index] for index in np.linspace(0, len(pilot_ids) - 1, SECOND_DATE_COUNT, dtype=int)]
            second_date_ids = list(dict.fromkeys(second_date_ids))
            if len(second_date_ids) < 4:
                raise RuntimeError("Second-date pilot selection is too small")

            payload_records: list[dict[str, Any]] = []
            pilot_set = set(pilot_ids)
            second_set = set(second_date_ids)
            for cell in cells:
                cell["materialization"] = "pilot" if cell["id"] in pilot_set else "planned"
                cell["available_dates"] = []
                cell["payloads"] = []
                if cell["id"] not in pilot_set:
                    continue

                dates = [SOURCES[0]] + ([SOURCES[1]] if cell["id"] in second_set else [])
                for source in dates:
                    payload = payload_for(datasets[source["date"]], cell, source)
                    relative = f"data/{cell['id']}/{source['date']}.json"
                    digest = compact_write(output / relative, payload)
                    cell["available_dates"].append(source["date"])
                    cell["payloads"].append({"date": source["date"], "path": relative, "sha256": digest})
                    payload_records.append(
                        {
                            "block_id": cell["id"],
                            "date": source["date"],
                            "path": relative,
                            "sha256": digest,
                        }
                    )

            manifest = {
                "schema": "oceancanvas-main-block-manifest-v1",
                "phase": "3.5B",
                "target_domain": {**DOMAIN, "columns": 14, "rows": 10, "logical_block_count": TARGET_COUNT},
                "source": {
                    "origin_product": ORIGIN_PRODUCT,
                    "product_id": ORIGIN_PRODUCT_ID,
                    "dataset_id": ORIGIN_DATASET_ID,
                    "archive_provider": ARCHIVE_PROVIDER,
                    "dates": [source["date"] for source in SOURCES],
                    "files": [source["file"] for source in SOURCES],
                    "time_semantics": "daily_mean",
                    "horizontal_stride": HORIZONTAL_STRIDE,
                    "maximum_depth_m": MAX_DEPTH_M,
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
            compact_write(output / "manifest.json", manifest)
            verify(output)
        finally:
            for ds in datasets.values():
                ds.close()


def verify(output: Path) -> None:
    manifest_path = output / "manifest.json"
    if not manifest_path.exists():
        raise RuntimeError(f"Missing Phase 3.5B manifest: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    blocks = manifest.get("blocks", [])
    pilots = manifest.get("pilot_ids", [])
    multi = manifest.get("multi_date_pilot_ids", [])
    if len(blocks) != TARGET_COUNT:
        raise RuntimeError(f"Manifest must contain {TARGET_COUNT} logical blocks")
    if not 20 <= len(pilots) <= 25:
        raise RuntimeError(f"Expected 20–25 materialized pilots, got {len(pilots)}")
    if len(multi) < 4:
        raise RuntimeError("Expected at least four multi-date pilots")

    by_id = {block["id"]: block for block in blocks}
    for block_id in pilots:
        block = by_id[block_id]
        if block["ocean_relevance"] == "land" or block["ocean_fraction"] < 0.20:
            raise RuntimeError(f"Land-dominant block was materialized: {block_id}")
        if not block["available_dates"]:
            raise RuntimeError(f"Pilot has no genuine date: {block_id}")

    for record in manifest.get("payloads", []):
        path = output / record["path"]
        if not path.exists():
            raise RuntimeError(f"Missing pilot payload: {record['path']}")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != record["sha256"]:
            raise RuntimeError(f"Checksum mismatch for {record['path']}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload["block_id"] != record["block_id"]:
            raise RuntimeError(f"Block identity mismatch in {record['path']}")
        if payload["time"][:10] != record["date"]:
            raise RuntimeError(f"Date mismatch in {record['path']}")
        depths = payload["coordinates"]["depth_m"]
        if not depths or max(depths) > MAX_DEPTH_M + 1e-6:
            raise RuntimeError(f"Depth ceiling violated in {record['path']}")
        integrity = payload["integrity"]
        prohibited = ("synthetic_measurements", "synthetic_timestamps", "synthetic_coordinates", "synthetic_depths")
        if any(integrity[key] for key in prohibited):
            raise RuntimeError(f"Synthetic-content flag raised in {record['path']}")
        if integrity["vertical_component_available"] is not False:
            raise RuntimeError(f"Vertical current incorrectly claimed in {record['path']}")
        for variable in ("thetao", "so", "uo", "vo"):
            if payload["variables"][variable]["finite_count"] < 1:
                raise RuntimeError(f"No finite {variable} values in {record['path']}")

    print(
        "Phase 3.5B verification passed:",
        f"{len(blocks)} logical cells, {len(pilots)} genuine pilots,",
        f"{len(multi)} pilots with a second genuine date, {len(manifest.get('payloads', []))} payloads.",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    if args.verify_only:
        verify(args.output)
    else:
        build(args.output)


if __name__ == "__main__":
    main()
