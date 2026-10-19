"""M032–M039 preserve source registry and fail-closed QC/rights semantics."""
import pytest

from src.provider_adapter_contracts import (
    KNOWN_PROVIDER_IDS, assess_native_observation, provider_catalog,
    provider_rights_allows_export, safe_provider_metadata_url,
    validate_incois_source_grid, validate_satellite_surface,
)


def row(**changes):
    out = {
        "variable": "temperature", "qc_flag": "1", "units": "degree_C",
        "platform_id": "TEST-ONLY", "data_mode": "D", "cycle": 13,
        "latitude": 12.8, "longitude": 67.6, "depth_m": 44.1,
        "timestamp": "2024-01-02T14:46:00Z", "value": 25.0
    }
    return {**out, **changes}


def test_m032_registered_adapters_exact_names_and_versioned_types():
    catalog = provider_catalog()
    assert set(catalog) == KNOWN_PROVIDER_IDS
    assert all(x.payload()["schema"] == "oceancanvas-provider-adapter-contract-v1"
               for x in catalog.values())
    assert catalog["bgc-argo-gdac"].provider_claim == "bgc-s-prof"
    assert catalog["incois-chlorophyll"].provider_claim == "surface"


def test_m033_glorys_product_and_rights_not_mistaken_for_authentication():
    m = provider_catalog()["bundled-glorys12"]
    assert m.doi == "10.48670/moi-00021"
    assert m.operational_status == "METADATA_ONLY"
    assert m.rights_status == "UNREVIEWED"


def test_m034_incois_analysis_and_surface_sensor_contract():
    good = {"dataset_id": "incois_argo_10d_VAM",
            "coordinates": ["time", "ZAX", "latitude", "longitude"],
            "variables": ["TEMP", "SAL", "TERR", "SERR"],
            "temporal_semantics": "10-day-analysis"}
    assert validate_incois_source_grid(good)[0]
    assert not validate_incois_source_grid({**good, "coordinates": ["time"]})[0]
    assert not validate_incois_source_grid({**good, "temporal_semantics": "instantaneous"})[0]
    assert validate_satellite_surface({"dataset_id": "IRS_chlorophyll_datasets",
        "variable": "CHLOROPHYLL", "depths_m": []})[0]
    assert not validate_satellite_surface({"dataset_id": "IRS_chlorophyll_datasets",
        "variable": "CHLOROPHYLL", "depths_m": [10]})[0]


def test_m035_argo_requires_adjusted_mode_and_qc1():
    assert assess_native_observation(row(), "argo")[0] == "OBSERVATION_CONTEXT_ONLY"
    for bad in [row(qc_flag="2"), row(data_mode="R"), row(cycle=-1),
                row(timestamp="2004-03-15"), row(latitude=200),
                row(depth_m=-1), row(value=float("nan"))]:
        assert assess_native_observation(bad, "argo")[0] == "INELIGIBLE"


def test_m036_glider_native_qc_is_separate_from_argo():
    assert assess_native_observation(row(qc_flag="2"), "glider")[0] == "OBSERVATION_CONTEXT_ONLY"
    assert assess_native_observation(row(qc_flag="9"), "glider")[0] == "INELIGIBLE"


def test_m037_go_ship_ctd_woce_qc2_only():
    assert assess_native_observation(row(qc_flag="2"), "ctd")[0] == "OBSERVATION_CONTEXT_ONLY"
    assert assess_native_observation(row(qc_flag="1"), "ctd")[0] == "INELIGIBLE"


def test_m038_bgc_sprof_native_data_mode_and_variable():
    bgc = row(variable="dissolved_oxygen", qc_flag="1",
              units="micromoles/kg", argo_parameter_mode="D")
    assert assess_native_observation(bgc, "bgc")[0] == "OBSERVATION_CONTEXT_ONLY"
    assert assess_native_observation({**bgc, "argo_parameter_mode": "U"}, "bgc")[0] == "INELIGIBLE"
    assert assess_native_observation({**bgc, "variable": "thetao"}, "bgc")[0] == "INELIGIBLE"


@pytest.mark.parametrize("url", [
    "http://erddap.incois.gov.in/erddap",
    "https://erddap.incois.gov.in.evil.com/erddap",
    "https://evil:password@data.marine.copernicus.eu/path",
    "https://data.pmel.noaa.gov:8080/erddap",
    "https://data-argo.ifremer.fr/a#api-token"
])
def test_m039_external_provider_url_must_use_exact_https_host(url):
    assert not safe_provider_metadata_url(url)


def test_license_must_be_source_specific_and_not_guessed():
    assert not provider_rights_allows_export("bundled-glorys12",
                                              source_license="none", attribution="yes")
    assert not provider_rights_allows_export("incois-argo-10d-vam",
                                              source_license=None, attribution="INCOIS")
    assert provider_rights_allows_export("incois-argo-10d-vam",
               source_license="ERDDAP notice reviewed at export time", attribution="INCOIS")
