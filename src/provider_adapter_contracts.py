"""M032-M039 native scientific-provider contract and observation assessment.

Build-only validation facade over the EXISTING registered connectors: it does
not fetch network data, declare licences where unknown, or change original
GLORYS/Argo science. Genuine provider URLs were cross-checked on 2026-10-18;
dataset availability and redistribution may change thereafter.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Mapping
from urllib.parse import urlsplit
import math

from src.source_registry import registry_payload

SCHEMA = "oceancanvas-provider-adapter-contract-v1"
KNOWN_PROVIDER_IDS = frozenset({
    "bundled-glorys12", "bundled-argo", "incois-argo-10d-vam",
    "incois-indian-argo", "incois-chlorophyll", "ocean-gliders-gdac",
    "incois-ctd-holdings", "bgc-argo-gdac",
})
# Metadata confirmation is NOT a successful authentic 2024 provider download.
EVIDENCE = {
    "bundled-glorys12": (
        "https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/services",
        "10.48670/moi-00021", "UNREVIEWED", "model",
    ),
    "bundled-argo": (
        "https://argo.ucsd.edu/data/data-faq/", None, "UNREVIEWED", "profile",
    ),
    "incois-argo-10d-vam": (
        "https://erddap.incois.gov.in/erddap/info/incois_argo_10d_VAM/index.html",
        None, "PUBLIC_ERDDAP_NOTICE", "analysis",
    ),
    "incois-indian-argo": (
        "https://erddap.incois.gov.in/erddap/tabledap/Indian_ARGO_Floats.html",
        None, "PUBLIC_ERDDAP_NOTICE", "profile",
    ),
    "incois-chlorophyll": (
        "https://erddap.incois.gov.in/erddap/info/IRS_chlorophyll_datasets/index.html",
        None, "UNREVIEWED", "surface",
    ),
    "ocean-gliders-gdac": (
        "https://nrt.cmems-du.eu/erddap/index.html", None, "UNREVIEWED", "profile",
    ),
    "incois-ctd-holdings": (
        "https://incois.gov.in/site/dataholdings.jsp", None, "UNREVIEWED", "profile",
    ),
    "bgc-argo-gdac": (
        "https://argo.ucsd.edu/data/data-faq/", None, "UNREVIEWED", "bgc-s-prof",
    ),
}
ACCEPTED_QC = {
    "argo": frozenset({"1"}),
    "glider": frozenset({"1", "2"}),
    "ctd": frozenset({"2"}),
    "bgc": frozenset({"1", "2"}),
}
OBS_VARS = {
    "argo": frozenset({"temperature", "salinity"}),
    "glider": frozenset({"temperature", "salinity"}),
    "ctd": frozenset({"temperature", "salinity"}),
    "bgc": frozenset({"dissolved_oxygen", "chlorophyll", "nitrate", "ph"}),
}
BGC_PARAMETER_MODES = frozenset({"R", "A", "D"})
ALLOWED_EXTERNAL_HOSTS = frozenset({
    "data.marine.copernicus.eu", "argo.ucsd.edu",
    "erddap.incois.gov.in", "nrt.cmems-du.eu", "incois.gov.in",
    "cchdo.ucsd.edu", "erddap.aoml.noaa.gov", "data.pmel.noaa.gov",
    "data-argo.ifremer.fr",
})


def safe_provider_metadata_url(url: str) -> bool:
    try:
        p = urlsplit(url)
        return bool(p.scheme == "https" and p.hostname in ALLOWED_EXTERNAL_HOSTS
                    and not (p.username or p.password or p.port or p.fragment)
                    and not p.path.startswith("//"))
    except ValueError:
        return False


@dataclass(frozen=True)
class ProviderContract:
    connector_id: str
    adapter: str
    kind: str
    native_variables: tuple[str, ...]
    metadata_url: str
    doi: str | None
    rights_status: str
    provider_claim: str
    operational_status: str = "METADATA_ONLY"

    def payload(self) -> dict[str, Any]:
        return {"schema": SCHEMA, **asdict(self)}


def provider_catalog() -> dict[str, ProviderContract]:
    """Versioned descriptor for declared external providers, no inferred data."""
    registry = registry_payload()
    known = {row["id"]: row for row in registry["connectors"]}
    missing = KNOWN_PROVIDER_IDS - known.keys()
    if missing:
        raise ValueError(f"Registered source adapters missing: {sorted(missing)}")
    contracts = {}
    for connector_id in sorted(KNOWN_PROVIDER_IDS):
        row = known[connector_id]
        link, doi, rights, claim = EVIDENCE[connector_id]
        if not safe_provider_metadata_url(link):
            raise ValueError(f"Untrusted provider metadata URL: {connector_id}")
        contracts[connector_id] = ProviderContract(
            connector_id=connector_id,
            adapter=row["adapter"],
            kind=row["kind"],
            native_variables=tuple(row["variables"]),
            metadata_url=link, doi=doi,
            rights_status=rights, provider_claim=claim,
        )
    return contracts


def provider_rights_allows_export(connector_id: str, *, source_license: str | None,
                                  attribution: str | None) -> bool:
    """Review gate; explicit provider notice alone is NOT an export approval."""
    contract = provider_catalog()[connector_id]
    return bool(contract.rights_status == "PUBLIC_ERDDAP_NOTICE"
                and source_license and attribution
                and source_license.strip() and attribution.strip())


def assess_native_observation(row: Mapping[str, Any], sensor: str) -> tuple[str, str]:
    """Conservative source-level QC. Never asserts model-observation matching."""
    if sensor not in OBS_VARS:
        return "INELIGIBLE", "Unknown sensor adapter"
    if row.get("variable") not in OBS_VARS[sensor]:
        return "INELIGIBLE", "Variable not present in native sensor contract"
    if str(row.get("qc_flag") or "").strip() not in ACCEPTED_QC[sensor]:
        return "INELIGIBLE", "Native provider quality code rejected"
    if not str(row.get("units") or "").strip() or not str(row.get("platform_id") or "").strip():
        return "INELIGIBLE", "Missing units or native sensor identity"
    if sensor == "argo":
        if row.get("data_mode") not in {"A", "D"}:
            return "INELIGIBLE", "Adjusted Argo values require adjusted data mode"
        cycle = row.get("cycle")
        if not isinstance(cycle, int) or isinstance(cycle, bool) or cycle < 0:
            return "INELIGIBLE", "Argo cycle and source QC must be explicit"
    if sensor == "bgc" and row.get("argo_parameter_mode") is not None:
        if row["argo_parameter_mode"] not in BGC_PARAMETER_MODES:
            return "INELIGIBLE", "Invalid BGC-Argo native parameter data mode"
    try:
        lat, lon = float(row["latitude"]), float(row["longitude"])
        depth, value = float(row["depth_m"]), float(row["value"])
        dt = datetime.fromisoformat(str(row["timestamp"]).replace("Z", "+00:00"))
    except (ValueError, KeyError, TypeError, OverflowError):
        return "INELIGIBLE", "Invalid native coordinates, depth, time or measurement"
    if (not all(math.isfinite(v) for v in (lat, lon, depth, value))
            or not (-90 <= lat <= 90 and -180 <= lon <= 360 and depth >= 0)
            or dt.tzinfo is None):
        return "INELIGIBLE", "Observation coordinate/time/value out of domain"
    return "OBSERVATION_CONTEXT_ONLY", "Accepted source QC; model matching not established"


def validate_incois_source_grid(metadata: Mapping[str, Any]) -> tuple[bool, str]:
    """M034: genuine native analysis grid is 4D; satellite chlorophyll is NOT."""
    if metadata.get("dataset_id") != "incois_argo_10d_VAM":
        return False, "Unexpected INCOIS grid dataset"
    if not {"time", "ZAX", "latitude", "longitude"} <= set(metadata.get("coordinates", [])):
        return False, "Missing native time/ZAX/latitude/longitude axes"
    if not {"TEMP", "SAL"} <= set(metadata.get("variables", [])):
        return False, "Expected native physical fields absent"
    if metadata.get("temporal_semantics") != "10-day-analysis":
        return False, "INCOIS analysis must not be labeled instantaneous observation"
    return True, "Metadata structure eligible; source bytes not yet retrieved"


def validate_satellite_surface(metadata: Mapping[str, Any]) -> tuple[bool, str]:
    if metadata.get("dataset_id") != "IRS_chlorophyll_datasets":
        return False, "Unexpected satellite source"
    if metadata.get("depths_m") or metadata.get("is_water_column") is True:
        return False, "Satellite chlorophyll cannot supply invented subsurface depths"
    if metadata.get("variable") != "CHLOROPHYLL":
        return False, "Invalid native ocean-colour variable"
    return True, "Surface observation only, not BGC depth profile"
