# CERT-04 real 18 x 3 x 2 screenshot evidence

At SHA 492f52b4 dedicated Chromium run 39140620787 logged 15 passing and two failing tests, including the real July native time-index bug (repaired in b9c8d679) and a whole-viewport screenshot stall in WebGL SwiftShader during animation disabling.

The screenshot call now permits native Cesium/Water Column animations and retains reduced-motion emulation. It raises timeout to 90 seconds, but still fails if a real screenshot cannot be captured. Geographic and water-column frames remain true Playwright Chromium viewport PNGs after scrolling to the real scientific renderer. No mock screenshots and no invented data. 108 genuine image captures remain TARGETED, NOT VERIFIED, until exact-head CI passes and attachment artifacts are counted.

The real March/July pilot time-index regression is included in both development-only Chromium workflows. Production release-scope check remains unchanged and no merge or deployment is permitted.
