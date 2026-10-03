# Ocean Canvas — Glassmorphism UI/UX Migration
## Phase 1: Scroll and Viewport Foundation

**Project:** Smart India Hackathon SIH26067  
**Product:** Ocean Canvas  
**Repository:** `nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL`  
**Phase:** 1 of 8  
**Parent phase:** `ui/glass-00-baseline`  
**Parent phase commit:** `eca677f670afdb46d07e23c6dbba2da89b35c12e`  
**Pre-glass production rollback anchor:** `d469c99a4caa98368c03e22f843e889391ef394f`  
**Phase branch:** `ui/glass-01-scroll-foundation`

---

## 1. Master Execution Prompt

Act as the senior frontend architecture, responsive-layout, accessibility, regression, and release engineer for Ocean Canvas SIH26067.

The sole objective of Phase 1 is to make scrolling and viewport ownership deterministic across the entire React/Cesium application before visual glassmorphism styling begins.

### Non-negotiable constraints

1. Do not change scientific values, datasets, QC logic, collocation, provenance, model/observation calculations, timestamps, or renderer semantics.
2. Do not redesign the Cesium Earth renderer or Water Column 3D renderer.
3. Do not begin Phase 2 glass tokens or visual restyling.
4. Do not merge directly to `main` during implementation.
5. Preserve a clear rollback path to the Phase 0 parent commit and the pre-glass production anchor.
6. Prefer the smallest coherent change over broad component rewrites.
7. Resolve scroll ownership through an authoritative final stylesheet rather than adding unrelated one-off fixes throughout legacy CSS.
8. Maintain keyboard, mouse-wheel, trackpad, and touch reachability.
9. Prevent accidental document scrolling, double vertical scrollbars, horizontal page overflow, and background scrolling beneath blocking mobile sheets/dialogs.
10. Use `100dvh` with sensible `100vh`/`100svh` fallbacks and respect mobile safe-area insets.
11. Ensure shrinking flex/grid descendants use `min-height: 0` / `min-width: 0` where needed.
12. Keep Cesium canvas wheel input available for scientific camera zoom; do not globally hijack wheel events.
13. Preserve reduced-motion behavior.
14. Validate TypeScript and production frontend build before calling the phase complete.
15. Stop after Phase 1. Do not start Phase 2 automatically.

### Execution sequence

UNDERSTAND
- Confirm Phase 0 parent commit and CI state.
- Inspect root shell, workspace, route pages, Explorer, drawers, modal/dialog surfaces, mobile sheets, and navigation.
- Identify legacy overflow conflicts and manual scroll workarounds.

EXECUTE
- Introduce one authoritative scroll-foundation stylesheet loaded after legacy style layers.
- Lock the browser document viewport for the application.
- Make the application shell own exactly one dynamic viewport.
- Keep navigation horizontal scrolling isolated.
- Make non-Explorer route roots their own vertical scroll containers.
- Make the Explorer workstation an internal scroll context while panels/sheets retain intentional local scrolling.
- Restore deterministic mobile control/profile sheet behavior.
- Give overlays/drawers bounded viewport scrolling.
- Add safe-area and overscroll rules.

VERIFY
- Inspect the diff for UI-only scope.
- Run existing regression CI.
- Trigger the full React/FastAPI/static workflow through a pull request when appropriate.
- Confirm typecheck and production build pass.
- Confirm the branch contains no scientific or renderer changes.
- Record remaining limitations honestly.

REPORT
Return: START SHA, BRANCH, FILES CHANGED, WHAT CHANGED, TESTS RUN, TEST RESULTS, SCROLL OWNERSHIP, ACCESSIBILITY NOTES, KNOWN ISSUES, ROLLBACK INSTRUCTION, DEPLOYMENT STATUS, and NEXT PHASE — NOT STARTED.

---

## 2. Baseline problem

The current UI accumulated several competing viewport strategies during development:

- early CSS locks `html`, `body`, and `#root` to a fixed height with hidden overflow;
- older mobile CSS switches the document back to page scrolling;
- workbench CSS defines fixed/mobile sheet behavior;
- station CSS later converts the entire workstation to normal-flow document scrolling;
- route pages and panels also define their own overflow;
- a React `wheel` handler attempts to redirect wheel events to the document on non-Explorer routes.

Each layer was locally reasonable, but together they make scroll ownership dependent on viewport size, cascade order, and pointer location.

Phase 1 replaces that ambiguity with a final authoritative contract.

---

## 3. Scroll ownership contract

| Surface | Vertical scroll owner |
|---|---|
| Browser document (`html/body/#root`) | None |
| Application shell | None; fixed dynamic viewport |
| Top route navigation | Horizontal only when required |
| Non-Explorer route | Route root container |
| Explorer workstation | Workstation container when content exceeds available viewport |
| Desktop control panel | Control panel |
| Desktop evidence/profile/analysis inspector | Inspector |
| Mobile controls | Controls sheet |
| Mobile observation details | Observation sheet |
| Expanded sensor/profile list | Sensor disclosure region |
| Provenance drawer | Drawer content |
| Presentation guide | Guide content |
| Team-logo blocking modal | Modal surface; background remains locked |
| Wide tables | Dedicated table wrapper only |
| Cesium/Water Column canvas | No document scrolling; pointer/wheel remain renderer interactions |

This contract allows nested scroll only where the nested region is an intentional independent tool (drawer, table, inspector, sheet). `overscroll-behavior` is used to stop unwanted scroll chaining.

---

## 4. Viewport contract

The application uses one viewport-height shell:

1. `100vh` fallback
2. `100svh` stable small-viewport fallback where supported
3. `100dvh` authoritative dynamic mobile viewport where supported

The shell must never exceed the browser viewport because of header/footer/content sizing. The workspace receives the remaining height through flex/grid shrinking with `min-height: 0`.

Safe areas are respected with `env(safe-area-inset-*)` on mobile sheets/navigation where appropriate.

---

## 5. Implementation strategy

Create `frontend/src/scroll-foundation.css` and import it last from `frontend/src/main.tsx`.

Why a final layer instead of rewriting all legacy CSS now:

- rollback is one import plus one focused file;
- no scientific component rewrite is needed;
- cascade ownership becomes explicit;
- later Phase 8 can delete proven-redundant legacy rules after regression validation.

The file is structural only. It must not introduce glass colours, shadows, decorative blur, or a new visual design language.

---

## 6. Acceptance criteria

Phase 1 is complete only when all of the following are true:

- document/root do not become accidental vertical scroll owners;
- application fits the dynamic viewport;
- every non-Explorer route can reach its final content item;
- Explorer can reach its lower controls without relying on document scroll;
- desktop control/evidence/profile panels can reach their final item;
- mobile controls/observation sheets are bounded and independently scrollable;
- background does not scroll through the mobile sheet backdrop;
- no accidental horizontal application overflow;
- navigation horizontal overflow remains usable;
- provenance and presentation overlays are bounded by the viewport and scroll internally when needed;
- Cesium/Water Column wheel interaction is not globally intercepted;
- safe-area insets are respected;
- reduced-motion behavior remains intact;
- scientific implementation files and data are unchanged;
- TypeScript typecheck passes;
- production frontend build passes;
- existing regression workflows remain green.

---

## 7. Rollback

Before merge, discard the Phase 1 branch to return to Phase 0.

If Phase 1 is later merged and must be reverted, revert the Phase 1 merge/commit normally. Never force-reset `main`.

Known anchors:

- Phase 0 parent: `eca677f670afdb46d07e23c6dbba2da89b35c12e`
- Pre-glass production: `d469c99a4caa98368c03e22f843e889391ef394f`

---

**Phase 2 is not authorized by this document and must not start automatically.**