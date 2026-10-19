# CERT-03 exact-native time-index repair

At candidate 492f52b4, real GitHub Chromium (run 39140620760) verified 14 of 15 tests and found the 2004-07-28 geographic element stuck at `data-linked-evidence=mismatch` despite source time changing.

**Root cause confirmed in source:** every conversion in `pilot-main-block-loader.ts` returned `time_index: 0`, even when selecting genuine second July source frame, while `linked-view-integrity.ts` intentionally (and correctly) required `payload.time_index === selected timeIndex`. This did not corrupt source values, but withheld the authentic July frame.

**Fix:** optional `timeIndex=0` argument to all four existing original-source converters (thetao/so slices and 3D volumes, u/v currents slices and 3D volumes), with actual native index passed from all matching `api.ts` call sites. Existing default remains index 0 for backwards compatibility. No invented ocean samples or timestamp changes. Added pure regression using original unchanged March and July source files; invalid March frame remains rejected when July selected.

Run exact-commit M008+CERT03 browser suite, original 3DB13 source corruption tests, 41 SHA original frames, TypeScript/frontend build, and standard Python tests. DO NOT declare CERT03 green until the real GitHub job passes.

Separate CERT04 108 visual screenshots old failure due `page.screenshot({animations:"disabled",timeout:45000})` timed out on active Cesium; handle screenshots in an isolated follow-up, never claim 108 attachments until truly collected.
