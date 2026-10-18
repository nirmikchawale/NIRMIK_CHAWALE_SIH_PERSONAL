"""M011/M022 scientific evidence classifier for genuine BGC measurements.

A QC-accepted row is OBSERVATION_CONTEXT_ONLY until its source bytes, licensing,
and model time/space compatibility are separately established. Never infer
BGC values from adjacent CTD records or satellite surface chlorophyll.
"""
from __future__ import annotations

from datetime import datetime
import math
import re
from typing import Mapping, Any

BGC_VARIABLE_UNITS = {
    "dissolved_oxygen": frozenset({"micromoles/kg", "umol/kg"}),
    "chlorophyll": frozenset({"mg/m^3"}),
    "nitrate": frozenset({"micromoles/kg", "umol/kg"}),
    "ph": frozenset({"1", "total_scale"}),
}
ACCEPTED_REALTIME_QC = frozenset({"1", "2"})
SHA256 = re.compile(r"^[0-9a-f]{64}$")


def classify_bgc_record(record: Mapping[str, Any]) -> tuple[str, str]:
    """Return (evidence_state, reason), never an invented BGC reading."""
    if record.get("sensor_type") != "bgc":
        return "INELIGIBLE", "record is not a BGC instrument observation"
    variable = record.get("variable")
    if variable not in BGC_VARIABLE_UNITS:
        return "INELIGIBLE", "unsupported or absent measured BGC variable"
    if record.get("units") not in BGC_VARIABLE_UNITS[variable]:
        return "INELIGIBLE", "source-native units not established for parameter"
    if str(record.get("qc_flag") or "").strip() not in ACCEPTED_REALTIME_QC:
        return "INELIGIBLE", "provider QC not accepted"
    if not all(str(record.get(k) or "").strip() for k in ("source", "dataset_id", "platform_id")):
        return "INELIGIBLE", "missing instrument/provenance identity"
    try:
        longitude, latitude = float(record["longitude"]), float(record["latitude"])
        depth, value = float(record["depth_m"]), float(record["value"])
        stamp = datetime.fromisoformat(str(record["timestamp"]).replace("Z", "+00:00"))
    except (ValueError, TypeError, KeyError, OverflowError):
        return "INELIGIBLE", "missing or malformed source-native coordinates/time/value"
    if not (all(math.isfinite(n) for n in (longitude, latitude, depth, value)) and
            -180 <= longitude <= 180 and -90 <= latitude <= 90 and depth >= 0 and
            stamp.tzinfo is not None):
        return "INELIGIBLE", "source-native coordinate/time/value outside valid domain"
    if variable in {"dissolved_oxygen", "chlorophyll", "nitrate"} and value < 0:
        return "INELIGIBLE", "negative concentration is not accepted"
    if record.get("instrument_type") == "satellite":
        return "INELIGIBLE", "surface satellite retrieval is not a BGC profile"
    digest = str(record.get("original_source_sha256") or "")
    if not SHA256.fullmatch(digest):
        return "OBSERVATION_CONTEXT_ONLY", "QC accepted; original raw bytes not yet SHA-verified"
    if record.get("redistribution_status") != "verified":
        return "OBSERVATION_CONTEXT_ONLY", "QC accepted; redistribution rights not verified"
    # Even fully traceable raw observations are not independent model validation.
    return "SOURCE_VERIFIED", "QC, source bytes and redistribution confirmed; matchup not established"
