"""Fetch genuine Glider, CTD and BGC profile evidence for the static SIH26067 build.

The fetch is deliberately build-time only. Browser runtime remains deterministic and does not
silently depend on external services. All values are provider records; the only derived coordinate
is CTD depth from pressure using the UNESCO 1983 pressure-to-depth approximation.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import io
import json
import math
from pathlib import Path
import time
from urllib.parse import quote
from urllib.error import HTTPError
from urllib.request import Request, urlopen

USER_AGENT = "OceanTwin-SIH26067/1.0 (+https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL)"

AOML_DATASET = "AOML_GLIDERS_2025"
AOML_BASE = f"https://erddap.aoml.noaa.gov/hdb/erddap/tabledap/{AOML_DATASET}.csv"
AOML_INFO = f"https://erddap.aoml.noaa.gov/hdb/erddap/info/{AOML_DATASET}/index.html"
AOML_TRAJECTORY = "SG683-20250910T0000"

CCHDO_DATASET = "cchdo_ctd"
CCHDO_BASE = f"https://data.pmel.noaa.gov/generic/erddap/tabledap/{CCHDO_DATASET}.csv"
CCHDO_INFO = f"https://data.pmel.noaa.gov/generic/erddap/info/{CCHDO_DATASET}/index.html"


def _request_text(url: str, attempts: int = 5, timeout: int = 60) -> str:
    """M012 bounded genuine provider read; retry only transport/429/5xx.

    Never cache responses or reinterpret ERDDAP 404/no-results as measurements.
    The underlying source row/QC filters remain authoritative.
    """
    from urllib.parse import urlsplit
    if not isinstance(attempts, int) or isinstance(attempts, bool) or not 1 <= attempts <= 8:
        raise ValueError("attempts must be between 1 and 8")
    if not 0 < timeout <= 120:
        raise ValueError("timeout out of supported range")
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in {
        "erddap.aoml.noaa.gov", "data.pmel.noaa.gov"
    } or parsed.username or parsed.password or parsed.port:
        raise ValueError("Unapproved scientific provider URL")
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/csv,*/*;q=0.8"})
        try:
            with urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status} for {url}")
                # Bounded read prevents accidental giant server responses or HTML
                # error dumps from being treated as normal ERDDAP CSV payload.
                payload = response.read(16_000_001)
                if len(payload) > 16_000_000:
                    raise ValueError("Scientific response exceeds 16 MB safety limit")
                return payload.decode("utf-8")
        except HTTPError as exc:
            # A genuine 404 'nRows = 0' is handled by the CTD caller as no data.
            # 400/401/403/404/etc must not be retried or replaced with invented rows.
            if 400 <= exc.code < 500 and exc.code != 429:
                body = exc.read(801).decode("utf-8", errors="replace")
                raise RuntimeError(f"HTTP {exc.code} for {url}: {body[:800]}") from exc
            last_error = exc
        except (ValueError, UnicodeError):
            raise
        except Exception as exc:
            last_error = exc
        if attempt < attempts:
            time.sleep(min(2 * attempt, 8))
    raise RuntimeError(f"Failed to fetch verified observation source after {attempts} attempts: {url}: {last_error}")


def _csv_rows(url: str) -> list[dict[str, str]]:
    text = _request_text(url)
    return list(csv.DictReader(io.StringIO(text)))


def _erddap_url(base: str, query: str) -> str:
    return base + "?" + quote(query, safe=",&=<>.-_:()")


def _finite(value: str | None) -> float | None:
    try:
        result = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def _iso(value: str | None) -> str | None:
    text = str(value or "").strip()
    if not text.endswith("Z"):
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return None
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _pressure_to_depth_m(pressure_dbar: float, latitude_deg: float) -> float:
    """UNESCO 1983 pressure-to-depth approximation (Saunders & Fofonoff formulation)."""
    x = math.sin(math.radians(latitude_deg)) ** 2
    gravity = 9.780318 * (1.0 + 5.2788e-3 * x + 2.36e-5 * x * x) + 1.092e-6 * pressure_dbar
    numerator = (((-1.82e-15 * pressure_dbar + 2.279e-10) * pressure_dbar - 2.2512e-5)
                 * pressure_dbar + 9.72659) * pressure_dbar
    return max(0.0, numerator / gravity)


def _record(
    *,
    longitude: float,
    latitude: float,
    depth_m: float,
    timestamp: str,
    variable: str,
    value: float,
    units: str,
    source: str,
    platform_id: str,
    sensor_type: str,
    dataset_id: str,
    qc_flag: str | None = None,
) -> dict:
    return {
        "longitude": longitude,
        "latitude": latitude,
        "depth_m": depth_m,
        "timestamp": timestamp,
        "variable": variable,
        "value": value,
        "units": units,
        "source": source,
        "platform_id": platform_id,
        "sensor_type": sensor_type,
        "qc_flag": qc_flag,
        "dataset_id": dataset_id,
    }


def _fetch_aoml_profile(profile_id: int) -> tuple[list[dict], list[dict], str]:
    fields = (
        "trajectory,profile_time,profile_lon,profile_lat,depth,"
        "temperature,temperature_qc,salinity,salinity_qc,"
        "aanderaa4831_dissolved_oxygen,aanderaa4831_dissolved_oxygen_qc,profile_id"
    )
    # The official dataset metadata currently reports profile_id actual_range 1..1414
    # for the single SG683-20250910T0000 deployment. A direct numeric constraint keeps
    # CI bounded and avoids expensive server-side discovery.
    query = f"{fields}&profile_id={profile_id}"
    url = _erddap_url(AOML_BASE, query)
    rows = _csv_rows(url)

    glider_records: list[dict] = []
    bgc_records: list[dict] = []
    for row in rows:
        row_profile = _finite(row.get("profile_id"))
        if row_profile is None or int(row_profile) != profile_id:
            continue
        timestamp = _iso(row.get("profile_time"))
        longitude = _finite(row.get("profile_lon"))
        latitude = _finite(row.get("profile_lat"))
        depth = _finite(row.get("depth"))
        if timestamp is None or longitude is None or latitude is None or depth is None or depth < 0:
            continue

        trajectory = str(row.get("trajectory") or AOML_TRAJECTORY).strip() or AOML_TRAJECTORY
        temperature = _finite(row.get("temperature"))
        salinity = _finite(row.get("salinity"))
        oxygen = _finite(row.get("aanderaa4831_dissolved_oxygen"))
        temp_qc = str(row.get("temperature_qc") or "").strip()
        sal_qc = str(row.get("salinity_qc") or "").strip()
        oxygen_qc = str(row.get("aanderaa4831_dissolved_oxygen_qc") or "").strip()

        if temperature is not None and temp_qc in {"1", "2"}:
            glider_records.append(_record(
                longitude=longitude, latitude=latitude, depth_m=depth, timestamp=timestamp,
                variable="temperature", value=temperature, units="degree_C",
                source="NOAA AOML / IOOS glider ERDDAP", platform_id=trajectory,
                sensor_type="glider", dataset_id=AOML_DATASET, qc_flag=temp_qc,
            ))
        if salinity is not None and sal_qc in {"1", "2"}:
            glider_records.append(_record(
                longitude=longitude, latitude=latitude, depth_m=depth, timestamp=timestamp,
                variable="salinity", value=salinity, units="1e-3",
                source="NOAA AOML / IOOS glider ERDDAP", platform_id=trajectory,
                sensor_type="glider", dataset_id=AOML_DATASET, qc_flag=sal_qc,
            ))
        if oxygen is not None and oxygen_qc in {"1", "2"}:
            bgc_records.append(_record(
                longitude=longitude, latitude=latitude, depth_m=depth, timestamp=timestamp,
                variable="dissolved_oxygen", value=oxygen, units="micromoles/kg",
                source="NOAA AOML glider Aanderaa 4831 optode",
                platform_id=f"{trajectory} · O2 optode",
                sensor_type="bgc", dataset_id=AOML_DATASET, qc_flag=oxygen_qc,
            ))
    return glider_records, bgc_records, url


def fetch_aoml_glider_and_bgc() -> tuple[list[dict], dict]:
    failures: list[str] = []
    # Pin to a small set of real IDs near the provider-advertised upper range.
    for profile_id in range(1414, 1398, -1):
        try:
            glider_records, bgc_records, url = _fetch_aoml_profile(profile_id)
        except Exception as exc:
            failures.append(f"{profile_id}: {exc}")
            continue

        if len(glider_records) >= 20 and len(bgc_records) >= 8:
            trajectory = (
                glider_records[0]["platform_id"]
                if glider_records
                else AOML_TRAJECTORY
            )
            return glider_records + bgc_records, {
                "id": "noaa-aoml-glider-bgc",
                "provider": "NOAA AOML / IOOS",
                "dataset_id": AOML_DATASET,
                "title": "NOAA AOML underwater glider profile with onboard CTD and dissolved-oxygen optode",
                "service": "ERDDAP tabledap / OPeNDAP",
                "query_url": url,
                "official_metadata": AOML_INFO,
                "roles": ["glider", "bgc"],
                "platform": trajectory,
                "profile_id": profile_id,
                "transformations": [
                    "provider values unchanged",
                    "accepted provider QC flags 1/2",
                    "profile_time/profile_lon/profile_lat used as profile coordinates",
                ],
            }
        failures.append(
            f"{profile_id}: glider={len(glider_records)} bgc={len(bgc_records)} accepted records"
        )

    raise RuntimeError(
        "No pinned AOML profile satisfied both physical and BGC evidence thresholds. "
        + " | ".join(failures)
    )


def _candidate_ctd_profiles() -> list[dict[str, str]]:
    # Prefer genuine Indian Ocean profiles; broaden only within the Indian Ocean sector.
    fields = "profile_id,time,latitude,longitude"
    query = (
        f"{fields}&time>=2018-01-01T00:00:00Z&time<=2026-12-31T23:59:59Z"
        "&longitude>=40&longitude<=120&latitude>=-40&latitude<=30&distinct()"
    )
    url = _erddap_url(CCHDO_BASE, query)
    rows = []
    for row in _csv_rows(url):
        if _iso(row.get("time")) and _finite(row.get("latitude")) is not None and _finite(row.get("longitude")) is not None:
            rows.append(row)
    rows.sort(key=lambda row: str(row.get("time") or ""), reverse=True)
    if not rows:
        raise RuntimeError("CCHDO profile discovery returned no Indian Ocean profiles.")
    return rows[:12]


def _fetch_ctd_profile(candidate: dict[str, str]) -> tuple[list[dict], str]:
    profile_id = str(candidate.get("profile_id") or "").strip()
    timestamp = _iso(candidate.get("time"))
    latitude = _finite(candidate.get("latitude"))
    longitude = _finite(candidate.get("longitude"))
    if not profile_id or timestamp is None or latitude is None or longitude is None:
        raise RuntimeError("CCHDO candidate lacks profile_id/time/latitude/longitude.")

    fields = (
        "profile_id,expocode,time,latitude,longitude,pressure,"
        "ctd_temperature,ctd_temperature_qc,ctd_salinity,ctd_salinity_qc"
    )
    # PMEL ERDDAP rejects quoted profile_id string constraints for these generated IDs.
    # Constrain by the provider-returned profile coordinates/time, then verify profile_id locally.
    query = (
        f"{fields}&time={timestamp}&latitude={latitude:.8f}&longitude={longitude:.8f}"
    )
    url = _erddap_url(CCHDO_BASE, query)
    records: list[dict] = []
    for row in _csv_rows(url):
        if str(row.get("profile_id") or "").strip() != profile_id:
            continue
        timestamp = _iso(row.get("time"))
        longitude = _finite(row.get("longitude"))
        latitude = _finite(row.get("latitude"))
        pressure = _finite(row.get("pressure"))
        if timestamp is None or longitude is None or latitude is None or pressure is None or pressure < 0:
            continue
        depth = _pressure_to_depth_m(pressure, latitude)
        temp = _finite(row.get("ctd_temperature"))
        sal = _finite(row.get("ctd_salinity"))
        temp_qc = str(row.get("ctd_temperature_qc") or "").strip()
        sal_qc = str(row.get("ctd_salinity_qc") or "").strip()
        expocode = str(row.get("expocode") or profile_id).strip() or profile_id
        platform = f"GO-SHIP {expocode} · {profile_id}"

        # WOCE CTD quality code 2 = acceptable measurement.
        if temp is not None and temp_qc == "2" and -5 <= temp <= 45:
            records.append(_record(
                longitude=longitude, latitude=latitude, depth_m=depth, timestamp=timestamp,
                variable="temperature", value=temp, units="degree_C",
                source="CCHDO GO-SHIP CTD via NOAA PMEL ERDDAP", platform_id=platform,
                sensor_type="ctd", dataset_id=CCHDO_DATASET, qc_flag=temp_qc,
            ))
        if sal is not None and sal_qc == "2" and 0 < sal < 50:
            records.append(_record(
                longitude=longitude, latitude=latitude, depth_m=depth, timestamp=timestamp,
                variable="salinity", value=sal, units="1",
                source="CCHDO GO-SHIP CTD via NOAA PMEL ERDDAP", platform_id=platform,
                sensor_type="ctd", dataset_id=CCHDO_DATASET, qc_flag=sal_qc,
            ))
    return records, url


def fetch_cchdo_ctd() -> tuple[list[dict], dict]:
    failures: list[str] = []
    for candidate in _candidate_ctd_profiles():
        profile_id = str(candidate.get("profile_id") or "").strip()
        if not profile_id:
            continue
        try:
            records, url = _fetch_ctd_profile(candidate)
        except Exception as exc:
            failures.append(f"{profile_id}: {exc}")
            continue
        variable_counts = {
            variable: sum(1 for record in records if record["variable"] == variable)
            for variable in ("temperature", "salinity")
        }
        if variable_counts["temperature"] >= 8 and variable_counts["salinity"] >= 8:
            return records, {
                "id": "cchdo-go-ship-ctd",
                "provider": "CCHDO / NOAA PMEL",
                "dataset_id": CCHDO_DATASET,
                "title": "CCHDO GO-SHIP CTD profile",
                "service": "ERDDAP tabledap / OPeNDAP",
                "query_url": url,
                "official_metadata": CCHDO_INFO,
                "roles": ["ctd"],
                "profile_id": profile_id,
                "transformations": [
                    "temperature/salinity provider values unchanged",
                    "WOCE CTD quality code 2 only",
                    "pressure converted to depth metres using UNESCO 1983 approximation",
                ],
            }
        failures.append(f"{profile_id}: accepted counts {variable_counts}")
    raise RuntimeError("No candidate CCHDO CTD profile satisfied the evidence contract: " + " | ".join(failures))


def fetch() -> dict:
    aoml_records, aoml_source = fetch_aoml_glider_and_bgc()
    ctd_records, ctd_source = fetch_cchdo_ctd()
    records = aoml_records + ctd_records
    sensor_counts = {
        sensor: sum(1 for record in records if record["sensor_type"] == sensor)
        for sensor in ("glider", "ctd", "bgc")
    }
    if any(count <= 0 for count in sensor_counts.values()):
        raise RuntimeError(f"Observation breadth pack missing required sensor evidence: {sensor_counts}")

    return {
        "schema": "oceantwin-verified-observation-pack-v1",
        "generated_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "sources": [aoml_source, ctd_source],
        "records": records,
        "record_count": len(records),
        "integrity": {
            "sensor_types": ["glider", "ctd", "bgc"],
            "sensor_record_counts": sensor_counts,
            "synthetic_measurements": False,
            "synthetic_timestamps": False,
            "provider_values_modified": False,
            "derived_coordinate_fields": ["CCHDO CTD depth_m from provider pressure + latitude"],
            "runtime_network_required": False,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = fetch()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(
        "Verified observation breadth pack:",
        payload["record_count"],
        "records;",
        payload["integrity"]["sensor_record_counts"],
    )


if __name__ == "__main__":
    main()
