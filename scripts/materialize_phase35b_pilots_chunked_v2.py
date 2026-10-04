"""Phase 3.5B chunked acquisition v2.

NCSS defaults to `present` when a time is omitted, which is invalid for the
historical one-day GLORYS files. Reuse the tested chunked materializer while
binding every request to that file's genuine source day. The exact returned
source timestamp is still read from NetCDF metadata and persisted unchanged.
"""
from __future__ import annotations

from urllib.parse import urlencode

import materialize_phase35b_pilots_chunked as impl


def ncss_url(
    source: dict[str, str],
    bounds: dict[str, float],
    variables: str,
    *,
    surface_only: bool = False,
) -> str:
    params: list[tuple[str, str | float | int]] = [
        ("var", variables),
        ("north", bounds["north"]),
        ("south", bounds["south"]),
        ("west", bounds["west"]),
        ("east", bounds["east"]),
        ("horizStride", impl.HORIZONTAL_STRIDE),
        ("time", f"{source['date']}T00:00:00Z"),
        ("accept", "netcdf4"),
    ]
    if surface_only:
        # NCSS returns the closest genuine dataset level to this requested
        # coordinate; the payload records the returned source coordinate.
        params.append(("vertCoord", 0))
    return f"{impl.THREDDS_BASE}/{source['file']}?{urlencode(params)}"


impl.ncss_url = ncss_url

if __name__ == "__main__":
    impl.main()
