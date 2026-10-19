"""M092-M095 read-only provenance/release evidence check. NEVER deploy/merge."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
FRAMES=ROOT/"frontend/public/main-blocks"
SHA=re.compile(r"^[0-9a-f]{64}$")
ORIGINAL_THEMES=(
 "abyss-noir","aurora-borealis","midnight-indigo","deep-sea-emerald",
 "bioluminescent-cyan","coral-dusk","solar-amber","graphite-clear",
 "polar-frost","arctic-mist","pearl-lagoon","glacier-mint",
 "rose-quartz","lavender-haze","sandglass","cloud-prism",
)


def certify() -> dict:
    """M093/094 check all current original checksum-source and 18-theme code."""
    manifest=json.loads((FRAMES/"manifest.json").read_text(encoding="utf-8"))
    counts={"blocks":len(manifest["blocks"]),"pilots":len(manifest["pilot_ids"]),
            "frames":len(manifest["payloads"]),"checked_sha":0}
    if (counts["blocks"],counts["pilots"],counts["frames"])!=(140,35,41):
        raise ValueError("Original 140/35/41 source inventory broken")
    for entry in manifest["payloads"]:
        candidate=(FRAMES/entry["path"]).resolve()
        if FRAMES.resolve() not in candidate.parents or not candidate.is_file():
            raise ValueError("Source frame path escapes immutable pilot archive")
        expected=entry["sha256"]
        if not SHA.fullmatch(expected) or hashlib.sha256(candidate.read_bytes()).hexdigest()!=expected:
            raise ValueError("Original scientific source SHA256 mismatch: "+entry["path"])
        counts["checked_sha"]+=1
    theme=(ROOT/"frontend/src/theme.ts").read_text(encoding="utf-8")
    ids=re.findall(r'^\s+"([a-z][a-z0-9-]+)"[,]?$',theme,re.M)
    if tuple(ids[:16])!=ORIGINAL_THEMES or ids[16:]!=["system-light","system-dark"]:
        raise ValueError("Original 16 themes or added Light/Dark identities changed")
    if 'DEFAULT_GLASS_THEME: GlassThemeId = "arctic-mist"' not in theme:
        raise ValueError("New visitor Arctic Mist identity was lost")
    styles=(ROOT/"frontend/src/glass-system.css").read_text(encoding="utf-8")
    missing=[theme_id for theme_id in (*ORIGINAL_THEMES,"system-light","system-dark")
             if '[data-glass-theme="'+theme_id+'"]' not in styles]
    if missing: raise ValueError("Missing semantic theme CSS: "+repr(missing))
    # Static source package and fallback scripts must be recoverable in build;
    # availability of a file does NOT assert an executable healthy server.
    expected_files=("frontend/vite.config.ts","scripts/export_static_science.py",
                    "backend/app/main.py","app.py",".github/workflows/deploy-pages.yml",
                    "frontend/e2e/mpr-16-all-themes-visual.spec.ts")
    absent=[f for f in expected_files if not (ROOT/f).is_file()]
    if absent:raise ValueError("Fallback or real-browser source missing: "+repr(absent))
    visual=(ROOT/"frontend/e2e/mpr-16-all-themes-visual.spec.ts").read_text(encoding="utf-8")
    if "for(const theme of GLASS_THEMES)" not in visual and "for (const theme of GLASS_THEMES)" not in visual:
        raise ValueError("108-screenshot actual-renderer iteration not present")
    return {
        "schema":"oceancanvas-build-only-certification-v1",
        "source_integrity":counts,
        "themes":18,
        "new_theme_ids":["system-light","system-dark"],
        "native_browser_screenshots_target":108,
        "native_browser_screenshots_verified":0,
        "git_pages_deployment_verified":False,
        "new_io087_model_frames_verified":0,
        "stage":"BUILD_ONLY_UNMERGED",
        "source_checksum_status":"PASSED",
        "fallback_presence":"PRESENT_NOT_EXECUTION_CERTIFIED",
        "ready_to_merge":False,
    }


if __name__=="__main__":
    try:print(json.dumps(certify(),indent=2))
    except Exception as exc:
        print("Build-only integrity check failed:",str(exc),file=sys.stderr)
        raise
