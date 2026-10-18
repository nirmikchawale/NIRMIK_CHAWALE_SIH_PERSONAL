"""M012 deterministic transport retry / no-fabrication tests."""
from __future__ import annotations

from io import BytesIO
from urllib.error import HTTPError

import pytest
from scripts import fetch_verified_observation_breadth as provider

URL = provider.AOML_BASE + "?profile_id=1414"


class Response(BytesIO):
    status = 200


def http_error(code, message="upstream issue"):
    return HTTPError(URL, code, message, {}, BytesIO(message.encode()))


def test_transient_503_then_exact_bytes_success(monkeypatch):
    calls, sleeps = [], []
    def flaky(_request, timeout):
        calls.append(timeout)
        if len(calls) == 1:
            raise http_error(503)
        return Response(b"a,b\n1,2\n")
    monkeypatch.setattr(provider, "urlopen", flaky)
    monkeypatch.setattr(provider.time, "sleep", sleeps.append)
    assert provider._request_text(URL, attempts=3, timeout=10) == "a,b\n1,2\n"
    assert calls == [10, 10] and sleeps == [2]


@pytest.mark.parametrize("code", [400, 401, 403, 404, 422])
def test_nonretryable_provider_error_fails_once(monkeypatch, code):
    calls = []
    def bad(_request, timeout):
        calls.append(timeout)
        raise http_error(code, "Your query produced no matching results. (nRows = 0)")
    monkeypatch.setattr(provider, "urlopen", bad)
    with pytest.raises(RuntimeError, match=f"HTTP {code}"):
        provider._request_text(URL, attempts=4)
    assert len(calls) == 1


def test_rate_limit_429_retries_without_inventing_records(monkeypatch):
    calls, sleeps = [], []
    def throttled(_request, timeout):
        calls.append(timeout)
        raise http_error(429)
    monkeypatch.setattr(provider, "urlopen", throttled)
    monkeypatch.setattr(provider.time, "sleep", sleeps.append)
    with pytest.raises(RuntimeError, match="after 3 attempts"):
        provider._request_text(URL, attempts=3)
    assert len(calls) == 3 and sleeps == [2, 4]


@pytest.mark.parametrize("url", [
    "http://erddap.aoml.noaa.gov/erddap/tabledap/test.csv",
    "https://other.example/erddap/data",
    "https://erddap.aoml.noaa.gov.evil.example/no",
    "https://user:pass@data.pmel.noaa.gov/data",
])
def test_provider_allowlist_prevents_ssrf(monkeypatch, url):
    monkeypatch.setattr(provider, "urlopen", lambda *_args, **_kwargs: pytest.fail("network attempted"))
    with pytest.raises(ValueError, match="Unapproved"):
        provider._request_text(url)


def test_oversized_response_fails_closed_without_retry(monkeypatch):
    calls = []
    def oversized(_request, timeout):
        calls.append(True)
        return Response(b"x" * 16_000_001)
    monkeypatch.setattr(provider, "urlopen", oversized)
    with pytest.raises(ValueError, match="exceeds"):
        provider._request_text(URL, attempts=5)
    assert calls == [True]
