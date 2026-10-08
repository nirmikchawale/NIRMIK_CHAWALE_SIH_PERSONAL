# MPR Production Hotfix — Desktop Controls, Orientation, Arctic Mist, Immersive Launch

## P0 desktop click defect
The original desktop workbench (minimum 761px) has a
`data-control-dock="open"` selector that sets `pointer-events:none`
and `visibility:hidden` for camera, basemap and imported-observation
controls within `.visualization-stage`. MPR 10–17 relocated the real
controls into `.renderer-tools` without reinstating pointer-event
ownership there. CSS paint overrides made inactive elements look active.

The new late-loaded, high-specificity CSS targets only the ACTIVE
visualization layer's actual toolbar controls. It re-enables pointer
events and visibility without making inactive renderer layers clickable,
without changing any Cesium primitive/camera implementation and without
reintroducing the Indian Ocean Block Field overlay.

## Earth → India → actual ocean selection
The genuine Cesium three-stage journey is retained, but its initial
launch waits for `useStartupScreen` to make #root interactive. This
prevents the Earth and India camera flights running behind the first-open
splash. Replaying the journey is always available from the toolbar.
When an actual ocean target is selected, the final flight uses that
block's real geographic bounds with visual margin; otherwise the
verified GLORYS baseline keeps the 60–100E, 5–25N regional view.

## Arctic Mist first visit
`DEFAULT_GLASS_THEME=arctic-mist` only for viewers without a saved
explicit 16-theme preference. All other fifteen themes remain available
and a user's selection persists locally. The legacy binary theme no
longer changes a new visitor to Polar Frost. The App's first-paint
scheme now follows the selected theme.

## Maximum display space and browser restrictions
The document fills 100dvh (safe-area aware); a clearly labelled,
keyboard-operable 'Full screen' header control requests the browser
Fullscreen API on user click, can exit again, and reports rejection.
Unprompted `requestFullscreen()` / automatic F11 on ordinary link or QR
arrival is **not technically permitted by modern browsers**. Do not
claim the page can forcibly hide address/navigation bars on every visit.
The ordinary route fills the available browser viewport automatically.

## Verification
New browser acceptance checks desktop basemap Offline/High-res interactions,
real globe overlay removal, Earth → India → selected block sequence,
Arctic Mist new-viewer default and the discoverable fullscreen control.
Run existing 3DB/MPR desktop/mobile regression, all sixteen appearance
themes, scientific data identity, FastAPI/pytest, React/Cesium build,
premerge scope, GitHub Pages deploy and four public HTTPS Chromium shards.
No numerical data/provenance/data adapter modifications.
