"""Stage A CI proves source integrity; NOT public browser success."""
from scripts.certify_build_first import certify

def test_original_pilot_sha_and_18_theme_source_invariants():
    got=certify()
    assert got["source_integrity"]=={"blocks":140,"pilots":35,"frames":41,"checked_sha":41}
    assert got["themes"]==18
    assert got["native_browser_screenshots_target"]==108
    assert got["native_browser_screenshots_verified"]==0
    assert got["new_io087_model_frames_verified"]==0
    assert got["ready_to_merge"] is False
    assert got["stage"]=="BUILD_ONLY_UNMERGED"
