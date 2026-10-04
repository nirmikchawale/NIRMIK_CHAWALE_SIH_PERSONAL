"""Chunked, coast-aware Phase 3.5B GLORYS12V1 pilot materializer.

This is the resilient acquisition path used after the first whole-domain NCSS
request proved too expensive for the public archive. It intentionally requests
small scientific chunks: ten surface-only latitude strips for the ocean/land
classification, then one compact full-depth request per selected pilot/date.

Nothing in this script copies/translates the existing BASE-GLORYS-001 field.
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
    {"date": "2004-03-15", "file": "mercatorglorys12v1_gl12_mean_20040315_R20040317.nc"},
    {"date": "2004-07-28", "file": "mercatorglorys12v1_gl12_mean_20040728_R20040804.nc"},
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
            cells.append({
                "id": f"IO-{index:03d}", "row": row, "column": column,
                "west": west, "east": east, "south": float(south), "north": float(north),
                "region": classify_region(west, east, south, north),
            })
            index += 1
    if len(cells) != TARGET_COUNT:
        raise RuntimeError(f"Expected {TARGET_COUNT} logical cells, got {len(cells)}")
    return cells


def ncss_url(
    source: dict[str, str],
    bounds: dict[str, float],
    variables: str,
    *,
    surface_only: bool = False,
) -> str:
    params: list[tuple[str, str | float | int]] = [
        ("var", variables),
        ("north", bounds["north"]), ("south", bounds["south"]),
        ("west", bounds["west"]), ("east", bounds["east"]),
        ("horizStride", HORIZONTAL_STRIDE),
        ("accept", "netcdf4"),
    ]
    # NCSS chooses the nearest genuine vertical coordinate; no vertical value is
    # manufactured. Omitting this parameter returns all genuine levels.
    if surface_only:
        params.append(("vertCoord", 0))
    return f"{THREDDS_BASE}/{source['file']}?{urlencode(params)}"


def download(url: str, destination: Path, attempts: int = 4) -> None:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": "OceanCanvas-SIH26067/phase35b-chunked"})
            with urlopen(request, timeout=120) as response, destination.open("wb") as stream:
                shutil.copyfileobj(response, stream)
            if destination.stat().st_size < 1_000:
                raise RuntimeError(f"Subset unexpectedly small: {destination.stat().st_size} bytes")
            return
        except Exception as exc:  # pragma: no cover - exercised by remote retry behaviour
            last_error = exc
            destination.unlink(missing_ok=True)
            if attempt < attempts:
                time.sleep(attempt * 3)
    raise RuntimeError(f"Failed to download chunk after {attempts} attempts: {last_error}\n{url}")


def source_timestamp(ds: xr.Dataset) -> str:
    values = np.asarray(ds["time"].values).reshape(-1)
    if values.size != 1:
        raise RuntimeError(f"Expected one source time in daily file subset, got {values.size}")
    raw = np.datetime_as_string(values[0], unit="s")
    return raw if raw.endswith("Z") else f"{raw}Z"


def validate_source(ds: xr.Dataset, expected_date: str, required_variables: tuple[str, ...]) -> None:
    required = {*required_variables, "longitude", "latitude", "time"}
    missing = sorted(required.difference(ds.variables).difference(ds.coords))
    if missing:
        raise RuntimeError(f"Source chunk missing required variables/coordinates: {missing}")
    identity = " ".join(str(ds.attrs.get(key, "")) for key in ("source", "title", "comment", "institution"))
    if "GLORYS12V1" not in identity.upper():
        raise RuntimeError(f"Source identity does not declare GLORYS12V1: {identity[:240]}")
    if source_timestamp(ds)[:10] != expected_date:
        raise RuntimeError(f"Source date mismatch: expected {expected_date}, got {source_timestamp(ds)}")


def open_surface(path: Path, expected_date: str) -> xr.Dataset:
    ds = xr.open_dataset(path, decode_cf=True, mask_and_scale=True)
    validate_source(ds, expected_date, ("thetao",))
    return ds


def open_full(path: Path, expected_date: str) -> xr.Dataset:
    ds = xr.open_dataset(path, decode_cf=True, mask_and_scale=True)
    validate_source(ds, expected_date, ("thetao", "so", "uo", "vo"))
    if "depth" not in ds.coords:
        ds.close()
        raise RuntimeError("Full-depth pilot chunk has no source depth coordinate")
    ds = ds.sel(depth=ds["depth"] <= MAX_DEPTH_M)
    if ds.sizes.get("depth", 0) < 20:
        ds.close()
        raise RuntimeError("Too few genuine source depths at or above the 500 m ceiling")
    for name in ("thetao", "so", "uo", "vo"):
        if not np.isfinite(np.asarray(ds[name].isel(time=0).values)).any():
            ds.close()
            raise RuntimeError(f"No finite source values found for {name}")
    return ds


def surface_2d(ds: xr.Dataset) -> np.ndarray:
    data = ds["thetao"].isel(time=0)
    if "depth" in data.dims:
        data = data.isel(depth=0)
    return np.asarray(data.values)


def classify_ocean_relevance(cells: list[dict[str, Any]], primary: dict[str, str], temp: Path) -> None:
    for row in range(ROWS):
        row_cells = [cell for cell in cells if cell["row"] == row]
        bounds = {
            "west": DOMAIN["west"], "east": DOMAIN["east"],
            "south": row_cells[0]["south"], "north": row_cells[0]["north"],
        }
        path = temp / f"surface-row-{row:02d}.nc"
        url = ncss_url(primary, bounds, "thetao", surface_only=True)
        print(f"Fetching surface ocean mask row {row + 1}/{ROWS}: {bounds}", flush=True)
        download(url, path)
        ds = open_surface(path, primary["date"])
        try:
            lon = np.asarray(ds["longitude"].values, dtype=float)
            surface = surface_2d(ds)
            # Latitude extent is already one planning row; split only by the
            # exact target longitude bounds.
            for cell in row_cells:
                x = np.flatnonzero((lon >= cell["west"] - 1e-7) & (lon <= cell["east"] + 1e-7))
                if x.size == 0:
                    raise RuntimeError(f"No surface coordinates intersect {cell['id']}")
                window = surface[..., x]
                fraction = float(np.isfinite(window).sum() / window.size)
                cell["ocean_fraction"] = round(fraction, 6)
                cell["ocean_relevance"] = "land" if fraction < 0.20 else "coastal" if fraction < 0.80 else "ocean"
        finally:
            ds.close()


def select_pilots(cells: list[dict[str, Any]]) -> list[str]:
    chosen: list[dict[str, Any]] = []
    used: set[str] = set()
    for region, quota in REGION_QUOTAS.items():
        candidates = sorted(
            (c for c in cells if c["region"] == region and c["ocean_fraction"] >= 0.35),
            key=lambda c: (c["ocean_fraction"], -c["row"], -c["column"]), reverse=True,
        )
        for cell in candidates[:quota]:
            chosen.append(cell)
            used.add(cell["id"])
    if len(chosen) < PILOT_COUNT:
        remainder = sorted(
            (c for c in cells if c["id"] not in used and c["ocean_fraction"] >= 0.55),
            key=lambda c: c["ocean_fraction"], reverse=True,
        )
        chosen.extend(remainder[: PILOT_COUNT - len(chosen)])
    chosen = chosen[:PILOT_COUNT]
    if len(chosen) < 20:
        raise RuntimeError(f"Only {len(chosen)} ocean-relevant pilots were selectable")
    if any(c["ocean_relevance"] == "land" for c in chosen):
        raise RuntimeError("A land-dominant target was selected as a scientific pilot")
    return [c["id"] for c in chosen]


def flat_json(values: np.ndarray, decimals: int = 5) -> list[float | None]:
    result: list[float | None] = []
    for value in np.asarray(values, dtype=float).reshape(-1):
        result.append(round(float(value), decimals) if math.isfinite(float(value)) else None)
    return result


def stats(values: np.ndarray) -> dict[str, Any]:
    finite = np.asarray(values, dtype=float)
    finite = finite[np.isfinite(finite)]
    return {
        "finite_count": int(finite.size),
        "minimum": round(float(finite.min()), 6) if finite.size else None,
        "maximum": round(float(finite.max()), 6) if finite.size else None,
    }


def payload_for(ds: xr.Dataset, cell: dict[str, Any], source: dict[str, str], service_url: str) -> dict[str, Any]:
    lons = np.asarray(ds["longitude"].values, dtype=float)
    lats = np.asarray(ds["latitude"].values, dtype=float)
    depths = np.asarray(ds["depth"].values, dtype=float)
    arrays = {name: np.asarray(ds[name].isel(time=0).values) for name in ("thetao", "so", "uo", "vo")}
    shape = [int(depths.size), int(lats.size), int(lons.size)]
    if any(array.shape != tuple(shape) for array in arrays.values()):
        raise RuntimeError(f"Unexpected source shape while materializing {cell['id']}: {shape}")
    for name, array in arrays.items():
        if not np.isfinite(array).any():
            raise RuntimeError(f"{cell['id']} has no finite {name} values")

    return {
        "schema": "oceancanvas-main-block-pilot-v1",
        "block_id": cell["id"], "region": cell["region"],
        "bounds": {key: cell[key] for key in ("west", "east", "south", "north")},
        "ocean_fraction": cell["ocean_fraction"], "ocean_relevance": cell["ocean_relevance"],
        "time": source_timestamp(ds), "time_semantics": "daily_mean",
        "coordinates": {
            "longitude": [round(float(v), 6) for v in lons],
            "latitude": [round(float(v), 6) for v in lats],
            "depth_m": [round(float(v), 6) for v in depths],
            "depth_positive": "down",
        },
        "shape": {"depth": shape[0], "latitude": shape[1], "longitude": shape[2]},
        "variables": {
            "thetao": {"units": "degrees_C", "values": flat_json(arrays["thetao"]), **stats(arrays["thetao"])},
            "so": {"units": "1e-3", "values": flat_json(arrays["so"]), **stats(arrays["so"])},
            "uo": {"units": "m s-1", "values": flat_json(arrays["uo"]), **stats(arrays["uo"])},
            "vo": {"units": "m s-1", "values": flat_json(arrays["vo"]), **stats(arrays["vo"])},
        },
        "source": {
            "origin_product": ORIGIN_PRODUCT, "product_id": ORIGIN_PRODUCT_ID,
            "dataset_id": ORIGIN_DATASET_ID, "archive_provider": ARCHIVE_PROVIDER,
            "archive_file": source["file"], "service_url": service_url,
            "horizontal_stride": HORIZONTAL_STRIDE,
        },
        "integrity": {
            "source_values_modified": False, "synthetic_measurements": False,
            "synthetic_timestamps": False, "synthetic_coordinates": False,
            "synthetic_depths": False, "vertical_component_available": False,
            "land_fill_preserved_as_missing": True,
        },
    }


def compact_write(path: Path, payload: Any) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def materialize_payload(
    output: Path, temp: Path, cell: dict[str, Any], source: dict[str, str]
) -> dict[str, str]:
    bounds = {key: float(cell[key]) for key in ("west", "east", "south", "north")}
    service_url = ncss_url(source, bounds, "thetao,so,uo,vo")
    path = temp / f"{cell['id']}-{source['date']}.nc"
    print(f"Fetching {cell['id']} genuine daily volume {source['date']}: {bounds}", flush=True)
    download(service_url, path)
    ds = open_full(path, source["date"])
    try:
        payload = payload_for(ds, cell, source, service_url)
    finally:
        ds.close()
    relative = f"data/{cell['id']}/{source['date']}.json"
    digest = compact_write(output / relative, payload)
    return {"date": source["date"], "path": relative, "sha256": digest}


def verify(output: Path) -> None:
    manifest_path = output / "manifest.json"
    if not manifest_path.exists():
        raise RuntimeError(f"Missing Phase 3.5B manifest: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    blocks = manifest.get("blocks", [])
    pilots = manifest.get("pilot_ids", [])
    multi = manifest.get("multi_date_pilot_ids", [])
    if len(blocks) != TARGET_COUNT:
        raise RuntimeError(f"Manifest must contain {TARGET_COUNT} logical cells")
    if not 20 <= len(pilots) <= 25:
        raise RuntimeError(f"Expected 20–25 pilots, got {len(pilots)}")
    if len(multi) < 4:
        raise RuntimeError("Expected at least four multi-date pilots")
    by_id = {block["id"]: block for block in blocks}
    for block_id in pilots:
        block = by_id[block_id]
        if block["ocean_relevance"] == "land" or block["ocean_fraction"] < 0.20:
            raise RuntimeError(f"Land-dominant block materialized: {block_id}")
        if not block["available_dates"]:
            raise RuntimeError(f"Pilot has no genuine date: {block_id}")
    for record in manifest.get("payloads", []):
        path = output / record["path"]
        if not path.exists():
            raise RuntimeError(f"Missing pilot payload: {record['path']}")
        if hashlib.sha256(path.read_bytes()).hexdigest() != record["sha256"]:
            raise RuntimeError(f"Checksum mismatch: {record['path']}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload["block_id"] != record["block_id"] or payload["time"][:10] != record["date"]:
            raise RuntimeError(f"Identity/date mismatch: {record['path']}")
        if not payload["coordinates"]["depth_m"] or max(payload["coordinates"]["depth_m"]) > MAX_DEPTH_M + 1e-6:
            raise RuntimeError(f"Depth ceiling violated: {record['path']}")
        integrity = payload["integrity"]
        if any(integrity[key] for key in ("synthetic_measurements", "synthetic_timestamps", "synthetic_coordinates", "synthetic_depths")):
            raise RuntimeError(f"Synthetic-content flag raised: {record['path']}")
        if integrity["vertical_component_available"] is not False:
            raise RuntimeError(f"Vertical current incorrectly claimed: {record['path']}")
        for variable in ("thetao", "so", "uo", "vo"):
            if payload["variables"][variable]["finite_count"] < 1:
                raise RuntimeError(f"No finite {variable}: {record['path']}")
    print(f"Phase 3.5B verified: {len(blocks)} logical cells, {len(pilots)} pilots, {len(multi)} multi-date pilots, {len(manifest.get('payloads', []))} source-backed payloads.")


def build(output: Path) -> None:
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)
    cells = target_cells()
    with tempfile.TemporaryDirectory(prefix="oceancanvas-phase35b-") as temp_dir:
        temp = Path(temp_dir)
        classify_ocean_relevance(cells, SOURCES[0], temp)
        pilot_ids = select_pilots(cells)
        pilot_set = set(pilot_ids)
        second_date_ids = [pilot_ids[i] for i in np.linspace(0, len(pilot_ids) - 1, SECOND_DATE_COUNT, dtype=int)]
        second_date_ids = list(dict.fromkeys(second_date_ids))
        second_set = set(second_date_ids)
        payload_records: list[dict[str, str]] = []

        for cell in cells:
            cell["materialization"] = "pilot" if cell["id"] in pilot_set else "planned"
            cell["available_dates"] = []
            cell["payloads"] = []
            if cell["id"] not in pilot_set:
                continue
            source_days = [SOURCES[0]] + ([SOURCES[1]] if cell["id"] in second_set else [])
            for source in source_days:
                record = materialize_payload(output, temp, cell, source)
                cell["available_dates"].append(record["date"])
                cell["payloads"].append(record)
                payload_records.append({"block_id": cell["id"], **record})

        manifest = {
            "schema": "oceancanvas-main-block-manifest-v1", "phase": "3.5B",
            "target_domain": {**DOMAIN, "columns": 14, "rows": 10, "logical_block_count": TARGET_COUNT},
            "source": {
                "origin_product": ORIGIN_PRODUCT, "product_id": ORIGIN_PRODUCT_ID,
                "dataset_id": ORIGIN_DATASET_ID, "archive_provider": ARCHIVE_PROVIDER,
                "dates": [source["date"] for source in SOURCES],
                "files": [source["file"] for source in SOURCES],
                "time_semantics": "daily_mean", "horizontal_stride": HORIZONTAL_STRIDE,
                "maximum_depth_m": MAX_DEPTH_M,
            },
            "integrity": {
                "logical_block_count": len(cells), "pilot_block_count": len(pilot_ids),
                "multi_date_pilot_count": len(second_date_ids),
                "land_blocks_materialized": sum(1 for c in cells if c["materialization"] == "pilot" and c["ocean_relevance"] == "land"),
                "synthetic_measurements": False, "synthetic_timestamps": False,
                "synthetic_coordinates": False, "synthetic_depths": False,
                "vertical_component_available": False,
            },
            "pilot_ids": pilot_ids, "multi_date_pilot_ids": second_date_ids,
            "payloads": payload_records, "blocks": cells,
        }
        compact_write(output / "manifest.json", manifest)
    verify(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    verify(args.output) if args.verify_only else build(args.output)


if __name__ == "__main__":
    main()
