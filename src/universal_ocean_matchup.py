"""M056–M063 reusable scientific model-to-in-situ DIAGNOSTIC engine.

Pure core for a documented, source-backed, QC-screened single profile and
single model field. It intentionally does NOT fetch data or declare independent
validation; never reuse old GLORYS-Argo metrics in a new geographic block.
Arrays/metadata must be actual source products before an output is scientific.
"""
from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
from io import StringIO
import csv
import json
import math
import re
from typing import Any, Mapping, Sequence

SHA = re.compile(r"^[0-9a-f]{64}$")
QC = {"argo": frozenset({"1"}), "glider": frozenset({"1", "2"}),
      "ctd": frozenset({"2"}), "bgc": frozenset({"1", "2"})}
VARIABLES = {
    "thetao": ("temperature", "degree_Celsius", "potential_temperature_at_0dbar"),
    "so": ("salinity", "1e-3", "practical_salinity"),
}
CONVENTION = "model_minus_observation"


def _number(value: Any) -> float | None:
    try:
        if value is None or isinstance(value, bool):
            return None
        x = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    return x if math.isfinite(x) else None


def _stamp(value: Any) -> datetime:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("Source timestamp must be explicit UTC Z")
    d = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if d.tzinfo is None or d.utcoffset().total_seconds() != 0:
        raise ValueError("Source timestamp must be UTC")
    return d


def _source_sha(meta: Mapping[str, Any], kind: str) -> str:
    digest = str(meta.get("original_source_sha256") or "")
    if not SHA.fullmatch(digest) or meta.get("source_verified") is not True:
        raise ValueError(f"{kind} raw source SHA and verified provenance are mandatory")
    return digest


def _validate_scientific_basis(model: Mapping[str, Any], obs: Mapping[str, Any]) -> str:
    variable = str(model.get("variable") or "")
    if variable not in VARIABLES:
        raise ValueError("Unsupported model variable; chemistry/TEOS requires source-specific rules")
    obs_variable, units, basis = VARIABLES[variable]
    if not (model.get("units") == obs.get("units") == units and
            model.get("basis") == obs.get("basis") == basis and
            obs.get("variable") == obs_variable):
        raise ValueError("Incompatible native units or physical basis; never compare in-situ T to potential T")
    if obs.get("units_converted") is True and not obs.get("documented_conversion"):
        raise ValueError("Unit/thermodynamic transform has no documented provenance")
    return variable


def convert_argo_insitu_to_potential(
    *, in_situ_temperature_c: float, practical_salinity: float,
    pressure_dbar: float, lon: float, lat: float,
) -> dict[str, Any]:
    """M060 optional physically justified TEOS conversion.

    Real gsw must be installed for this operation. No constant offset,
    pretend zero-pressure conversion or fabricated salinity is permitted.
    """
    values = (in_situ_temperature_c, practical_salinity, pressure_dbar, lon, lat)
    if any(_number(x) is None for x in values):
        raise ValueError("All physical source variables must be finite")
    if not (0 <= practical_salinity <= 50 and pressure_dbar >= 0 and
            -180 <= lon <= 180 and -90 <= lat <= 90):
        raise ValueError("Native pressure/salinity/location outside defensible bounds")
    try:
        import gsw
    except ImportError as exc:
        raise RuntimeError("TEOS-10 conversion requires installed and reviewed gsw") from exc
    sa = float(gsw.SA_from_SP(practical_salinity, pressure_dbar, lon, lat))
    pt = float(gsw.pt_from_t(sa, in_situ_temperature_c, pressure_dbar, 0))
    if _number(sa) is None or _number(pt) is None:
        raise ValueError("GSW TEOS computation produced missing or invalid values")
    return {
        "variable": "temperature",
        "value": pt, "units": "degree_Celsius", "basis": "potential_temperature_at_0dbar",
        "transform": "TEOS-10 gsw SA_from_SP + pt_from_t at reference 0 dbar",
        "original_temperature_c": in_situ_temperature_c,
        "original_practical_salinity": practical_salinity,
        "original_pressure_dbar": pressure_dbar,
        "temperature_copied_without_transform": False,
    }


def haversine_km(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    dl = math.radians(lon2 - lon1)
    dp = math.radians(lat2 - lat1)
    a = math.sin(dp / 2) ** 2 + (math.cos(math.radians(lat1)) *
        math.cos(math.radians(lat2)) * math.sin(dl / 2) ** 2)
    return 6371.0088 * 2 * math.asin(math.sqrt(max(0., min(1., a))))


def _grid(model: Mapping[str, Any], lon: float, lat: float, *, max_distance_km: float) -> tuple[int, int, float, list, list]:
    """M057 only valid wet source grid cells, even on a coastal boundary."""
    if _number(max_distance_km) is None or not 0 < max_distance_km <= 100:
        raise ValueError("Configured wet-cell distance must be 0–100 km")
    glon = model.get("longitudes")
    glat = model.get("latitudes")
    mask = model.get("wet_mask")
    depth = model.get("depths_m")
    if not (isinstance(glon, list) and isinstance(glat, list) and
            isinstance(mask, list) and isinstance(depth, list) and
            len(glon) >= 2 and len(glat) >= 2 and len(depth) >= 2):
        raise ValueError("Native ocean axes and wet mask missing")
    if (not all(_number(x) is not None for x in glon + glat + depth)
            or not all(glon[i] < glon[i + 1] for i in range(len(glon) - 1))
            or not all(glat[i] < glat[i + 1] for i in range(len(glat) - 1))
            or not all(depth[i] < depth[i + 1] for i in range(len(depth) - 1))
            or depth[0] < 0):
        raise ValueError("Source axes must be finite, ascending native ocean coordinates")
    if not (glon[0] <= lon <= glon[-1] and glat[0] <= lat <= glat[-1]):
        raise ValueError("Observation outside native source grid coverage")
    if (len(mask) != len(glat) or
            any(not isinstance(line, list) or len(line) != len(glon) or
                any(type(v) is not bool for v in line) for line in mask)):
        raise ValueError("Explicit native Boolean wet mask is required")
    wet = sorted(
        [(haversine_km(lon, lat, x, y), iy, ix)
         for iy, y in enumerate(glat) for ix, x in enumerate(glon)
         if mask[iy][ix]],
        key=lambda a: (a[0], a[1], a[2]),
    )
    if not wet or wet[0][0] > max_distance_km:
        raise ValueError("No verified wet model cell within spatial tolerance")
    return wet[0][1], wet[0][2], wet[0][0], depth, mask


def _time_policy(model: Mapping[str, Any], observation_time: str,
                 *, instantaneous_tolerance_hours: float) -> dict:
    """M058 preserve source-time semantics; daily averages are intervals."""
    observed = _stamp(observation_time)
    semantics = model.get("time_semantics")
    if semantics == "daily_mean":
        start = _stamp(model.get("valid_start_utc"))
        end = _stamp(model.get("valid_end_exclusive_utc"))
        if end <= start or not start <= observed < end:
            raise ValueError("Observation outside actual source daily-mean support")
        if (end - start).total_seconds() > 24 * 3600 + 1:
            raise ValueError("Daily mean interval exceeds legitimate day support")
        midpoint = start + (end - start) / 2
        return {"semantics": "daily_mean",
                "source_interval_start_utc": start.isoformat().replace("+00:00", "Z"),
                "source_interval_end_exclusive_utc": end.isoformat().replace("+00:00", "Z"),
                "offset_from_midpoint_hours": (observed - midpoint).total_seconds() / 3600,
                "forecast_skill_verified": False}
    if semantics == "instantaneous":
        valid = _stamp(model.get("valid_time_utc"))
        if _number(instantaneous_tolerance_hours) is None or not 0 <= instantaneous_tolerance_hours <= 24:
            raise ValueError("Instantaneous model tolerance unsupported")
        offset = (observed - valid).total_seconds() / 3600
        if abs(offset) > instantaneous_tolerance_hours:
            raise ValueError("Observation outside justified instantaneous model time tolerance")
        return {"semantics": "instantaneous",
                "model_valid_time_utc": valid.isoformat().replace("+00:00", "Z"),
                "offset_hours": offset,
                "forecast_skill_verified": False}
    raise ValueError("Unknown model time semantics; do not synthesize date/frame")


def _interpolate(depths: Sequence[float], column: Sequence[Any],
                 target: float) -> tuple[float | None, str]:
    """M059 adjacent-bracket no extrapolation/no missing-value bridging."""
    if _number(target) is None or target < depths[0] or target > depths[-1]:
        return None, "NO_MODEL_DEPTH_COVERAGE"
    for i, z in enumerate(depths):
        if z == target:
            value = _number(column[i])
            return (value, "MATCHED" if value is not None else "MODEL_MASKED")
    for hi in range(1, len(depths)):
        lo = hi - 1
        if depths[lo] < target < depths[hi]:
            left, right = _number(column[lo]), _number(column[hi])
            if left is None or right is None:
                return None, "MODEL_MASKED"
            return left + (target - depths[lo]) / (depths[hi] - depths[lo]) * (right - left), "MATCHED"
    return None, "NO_MODEL_DEPTH_COVERAGE"


def _safe_stats(residuals: list[float]) -> dict[str, Any]:
    """M061 signed model–observation residuals. Exclusions aren't zeros."""
    if not residuals:
        return {"count": 0, "mean_bias": None, "mae": None, "rmse": None, "max_abs": None}
    n = len(residuals)
    return {"count": n, "mean_bias": sum(residuals) / n,
            "mae": sum(abs(x) for x in residuals) / n,
            "rmse": math.sqrt(sum(x*x for x in residuals) / n),
            "max_abs": max(abs(x) for x in residuals)}


def _depth_stats(points: list[dict]) -> dict[str, dict]:
    ranges = ((0., 50., "0-50m"), (50., 200., "50-200m"),
              (200., float("inf"), "200m-plus"))
    results = {}
    for start, end, label in ranges:
        residuals = [p["residual_model_minus_observation"] for p in points
                     if p["status"] == "MATCHED" and start <= p["depth_m"] < end]
        results[label] = _safe_stats(residuals)
    return results


def compare_profile(
    model: Mapping[str, Any], obs: Mapping[str, Any], *,
    max_distance_km: float = 10.0, instantaneous_tolerance_hours: float = 1.0,
) -> dict[str, Any]:
    """M056–M063 single source-backed matchup; ALWAYS diagnostic only.

    Model cube dimensions: [depth, latitude, longitude]. Real arrays must have
    matching native wet mask; no automatic regridding or invisible gap fill.
    """
    model_sha = _source_sha(model, "Model")
    obs_sha = _source_sha(obs, "Observation")
    variable = _validate_scientific_basis(model, obs)
    sensor = str(obs.get("sensor_type") or "")
    if sensor not in QC:
        raise ValueError("Unsupported observation sensor")
    if str(obs.get("position_qc") or "") not in QC[sensor] or str(obs.get("time_qc") or "") not in QC[sensor]:
        raise ValueError("Native position and time QC rejected")
    if sensor == "argo":
        if obs.get("data_mode") not in {"A", "D"} or not isinstance(obs.get("cycle"), int):
            raise ValueError("Original Argo adjusted mode and cycle required")
    lon, lat = _number(obs.get("longitude")), _number(obs.get("latitude"))
    if lon is None or lat is None or not (-180 <= lon <= 180 and -90 <= lat <= 90):
        raise ValueError("Observation geographic coordinates invalid")
    time_info = _time_policy(model, obs.get("time_utc"),
                             instantaneous_tolerance_hours=instantaneous_tolerance_hours)
    iy, ix, separation, depths, mask = _grid(model, lon, lat,
                                             max_distance_km=max_distance_km)
    cube = model.get("cube")
    nlat, nlon = len(model["latitudes"]), len(model["longitudes"])
    if (not isinstance(cube, list) or len(cube) != len(depths) or
            any(not isinstance(layer, list) or len(layer) != nlat or
                any(not isinstance(line, list) or len(line) != nlon for line in layer)
                for layer in cube)):
        raise ValueError("Model cube dimensions incompatible with native grid")
    # M095: original source fill values may never masquerade as ocean samples.
    def native_fills(metadata: Mapping[str, Any]) -> set[float]:
        raw = metadata.get("fill_values", [])
        if not isinstance(raw, (list, tuple)):
            raise ValueError("Native source fill_values must be an array")
        values = {-9999.0, 1e20, 9.96921e36}
        for candidate in raw:
            parsed = _number(candidate)
            if parsed is None:
                raise ValueError("Native source fill metadata is malformed")
            values.add(parsed)
        return values

    model_fills = native_fills(model)
    observation_fills = native_fills(obs)
    column = [None if _number(layer[iy][ix]) in model_fills
              else layer[iy][ix] for layer in cube]
    levels = obs.get("levels")
    if not isinstance(levels, list) or not levels:
        raise ValueError("No source-backed observation profile levels")
    rows = []
    exclusions = {}
    for index, level in enumerate(levels):
        if not isinstance(level, Mapping):
            raise ValueError("Malformed provider profile level")
        dep = _number(level.get("depth_m"))
        value = _number(level.get("value"))
        if value in observation_fills:
            value = None
        qc_ok = str(level.get("qc_flag") or "") in QC[sensor]
        mode_ok = (sensor != "argo" or level.get("parameter_data_mode") in {"A", "D"})
        if dep is None or dep < 0 or value is None or not qc_ok or not mode_ok:
            status, mod, residual = "QC_REJECTED", None, None
        else:
            mod, status = _interpolate(depths, column, dep)
            residual = mod - value if mod is not None else None
        if status != "MATCHED":
            exclusions[status] = exclusions.get(status, 0) + 1
        rows.append({
            "level_index": index, "depth_m": dep, "observed": value if qc_ok and mode_ok else None,
            "model_interpolated": mod, "residual_model_minus_observation": residual,
            "status": status, "source_native_qc": str(level.get("qc_flag") or ""),
            "instrument_uncertainty": _number(level.get("uncertainty")),
        })
    vals = [r["residual_model_minus_observation"] for r in rows if r["status"] == "MATCHED"]
    # No passed levels is NOT a model success or zero-bias result.
    diagnostics = _safe_stats(vals)
    if not vals:
        status = "NO_ELIGIBLE_MATCHES"
    else:
        status = "DIAGNOSTIC_ONLY"
    return {
        "schema": "oceancanvas-universal-matchup-v1",
        "status": status, "independently_validated": False,
        "source_manifest": {
            "model_id": model.get("source_id"), "observation_id": obs.get("source_id"),
            "model_sha256": model_sha, "observation_sha256": obs_sha,
            "platform_id": obs.get("platform_id"), "cycle": obs.get("cycle"),
            "model_variable": variable, "sensor": sensor,
            "basis": model["basis"], "units": model["units"],
        },
        "spatial": {
            "observation_lon": lon, "observation_lat": lat,
            "model_cell_lon": model["longitudes"][ix],
            "model_cell_lat": model["latitudes"][iy],
            "model_cell_indices": {"lat": iy, "lon": ix},
            "distance_km": separation, "wet_mask_verified": True,
            "method": "nearest source-native wet cell, no land substitution",
        },
        "time": time_info,
        "residual_convention": CONVENTION,
        "metrics": diagnostics,
        "depth_bands": _depth_stats(rows),
        "exclusions": exclusions,
        "points": rows,
        "uncertainty": {
            "native_sensor_uncertainty": "PER_LEVEL_WHEN_REPORTED",
            "missing_uncertainty_imputed": False,
            "time_representativeness": "DAILY_AVERAGE_LIMITATION" if
                time_info["semantics"] == "daily_mean" else "INSTANTANEOUS_TIME_OFFSET",
            "assimilation_independence": "NOT_ESTABLISHED",
            "depth_samples_not_independent": True,
            "forecast_or_model_skill_verified": False,
        },
    }


def matchup_artifacts(result: Mapping[str, Any]) -> dict[str, bytes]:
    """M063 reproducible source-linked chart-ready series + CSV/JSON bytes.

    Only a verified source-backed engine result is accepted; no arbitrary
    data-to-chart spoofing or invented PNG rendering.
    """
    if result.get("schema") != "oceancanvas-universal-matchup-v1":
        raise ValueError("Not a verified engine diagnostic contract")
    sources = result.get("source_manifest", {})
    if not all(SHA.fullmatch(str(sources.get(k) or "")) for k in
               ("model_sha256", "observation_sha256")):
        raise ValueError("Original source hashes required for deterministic export")
    points = result.get("points")
    if not isinstance(points, list):
        raise ValueError("Missing matched depth provenance")
    plot = {
        "schema": "oceancanvas-depth-chart-series-v1",
        "residual_convention": CONVENTION,
        "units": sources.get("units"),
        "model_source_sha256": sources["model_sha256"],
        "observation_source_sha256": sources["observation_sha256"],
        "series": [
            {"depth_m": p["depth_m"],
             "observed": p["observed"],
             "model": p["model_interpolated"],
             "bias_model_minus_observation": p["residual_model_minus_observation"],
             "status": p["status"]}
            for p in points
        ],
        "not_independent_validation": True,
    }
    # Generated time deliberately omitted: same source+algorithm => same bytes.
    metadata = {key: value for key, value in result.items() if key != "points"}
    csv_fields = ("level_index", "depth_m", "observed", "model_interpolated",
                  "residual_model_minus_observation", "status", "source_native_qc",
                  "instrument_uncertainty")
    stream = StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=csv_fields, lineterminator="\n")
    writer.writeheader()
    for p in points:
        writer.writerow({key: p.get(key) for key in csv_fields})
    def encoded(obj: dict) -> bytes:
        return (json.dumps(obj, indent=2, sort_keys=True, allow_nan=False) + "\n").encode("utf-8")
    return {
        "profile.csv": stream.getvalue().encode("utf-8"),
        "chart-series.json": encoded(plot),
        "matchup-provenance.json": encoded(metadata),
    }
