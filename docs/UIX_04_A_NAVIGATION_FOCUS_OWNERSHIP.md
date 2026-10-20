# UIX-04A — Workspace navigation focus-ownership audit (BUILD AHEAD ONLY)

Status: DEVELOPMENT / TEST AUTHORING. **Not targeted-browser tested, premerge-certified, merged, deployed or public-certified.**

## Purpose and selection
UIX-03 consolidated PR #230 has its own frozen candidate and mandatory exact-commit release queue. UIX-04A adds an independently owned accessibility/keyboard-navigation regression surface, without touching UIX-03 UI implementation, Stage A source/science, or ITM-05–15 integration. This phase covers drawer focus placement, hidden/inert state, Escape restoration, keyboard route choice and Tab focus containment; it does **not** duplicate 16-theme screenshot capture or the existing five-workspace functional tour.

## Source and ownership
- Independent development base: main 6abb29a1557b8e7a062df53f3a1bb6d4148fc106.
- Isolated branch: build/uix04a-navigation-focus-audit-20261021.
- Owned paths only: this document and frontend/e2e/uix04a-navigation-focus-ownership.spec.ts.
- Frozen/unmodified: UIX-03 PR #230, Stage A PR #204, ITM queue PR #211, frontend/src/App.tsx, frontend/src/components/AppNavigation.tsx, all source, scientific, backend and dataset files.
- Existing implementation contract: frontend/src/components/AppNavigation.tsx exposes data-drawer-open, selected group buttons, aria-hidden + native inert, focus placement on opening, Escape to launcher, and keyboard navigation via true route controls.

## Acceptance inventory — read-only genuine Chromium
1. On 390px mobile and 1440px desktop, a closed navigation directory is inert and hidden from the accessibility tree (actual aria-hidden and inert attributes).
2. A keyboard-activated launcher opens its real drawer. Focus moves to the actually selected category: Explore on first mobile entry; Analyze on the explicitly chosen desktop rail trigger.
3. Escape closes the directory, restores inert and aria-hidden, and focuses the correct real launcher (mobile Workspaces control or desktop category rail button).
4. Tab from the last currently visible, enabled drawer button wraps to the first; Shift+Tab from the first wraps to the last, with no hidden entries or browser chrome in the loop.
5. Keyboard navigation into Telemetry changes the real hash route, preserves focus recovery to the appropriate launcher, leaves the drawer closed/inert, and retains the real Telemetry page (no fake science or downloaded fixtures).

## Focused verification — only this new spec
Use an authentic production preview built from the exact development branch with no synthetic data. The one-file test is the first gate; browser outcomes remain PENDING until a genuine run is recorded.

    cd frontend
    npm ci
    npm run typecheck
    npm run build
    # Start a separately managed production preview at 127.0.0.1:4174
    OCEANTWIN_LIVE_URL=http://127.0.0.1:4174/ npx playwright test -c playwright.live.config.ts e2e/uix04a-navigation-focus-ownership.spec.ts --list
    OCEANTWIN_LIVE_URL=http://127.0.0.1:4174/ npx playwright test -c playwright.live.config.ts e2e/uix04a-navigation-focus-ownership.spec.ts --workers=1 --retries=0

For real failures: record exact viewport/selector/first observation and source-vs-test cause, apply no more than one bounded correction per fingerprint, and stop after two identical unexplained failures. Do not launch unrelated four-shard or 96-image suites to debug UIX-04A.

## Development/release lane separation
- UIX-03 retains its distinct SHA, PR, CI/artifact watcher, independent 96-PNG requirement, guarded merge and public certification. UIX-04A writes must never alter that candidate.
- UIX-04A can remain DRAFT/BUILD-ONLY until real focused acceptance passes. **Do not open a release-enrolled PR or auto-dispatch comprehensive Chromium/96-PNG CI on this authoring checkpoint.**
- Later integration requires an explicit collision audit against the then-current certified main, honest exact-head acceptance, scope gates and separate merge/release approval. No future queued/pending check is green.
- Canonical project anti-loop and Build Ahead/Release Behind policy: GitHub issue #220.

## Handoff checklist
Phase: UIX-04A. Owner: isolated navigation audit. Build base: 6abb29a1. Scope: doc + one new Playwright spec. Dependencies: none on UIX-03 *coding*; production promotion depends on release-order rules. First incomplete gate: genuine focused Chromium runs for the exact build-branch commit. Protected applications/scientific contracts: unchanged. Next action: run the 6 focused desktop/mobile Chromium cases with zero retries in a production preview; then triage only actual failures and request development integration review.
