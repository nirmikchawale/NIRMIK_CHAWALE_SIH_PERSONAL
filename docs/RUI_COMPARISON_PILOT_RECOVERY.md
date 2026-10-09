# Comparison pilot empty-state recovery

Status: IN PROGRESS
Starting main: 5965c48bd29da21bb2601fc910d372cc8dc3fcc2 (NAV-07, preserving 3DB-11).
Branch: fix/comparison-pilot-empty-state.

Pilot blocks intentionally expose no matched Argo comparison bundle. The previous page
showed an empty selector and asked users to select a nonexistent profile. It now names
the active pilot, explains why baseline comparisons cannot validate that block, and offers
an explicit switch to BASE-GLORYS-001 using the existing shared block-selection runtime.
The action changes the whole workspace context; this is stated beside the button.
Pilot mode hides comparison metrics and exports even while old baseline props settle.
The baseline empty state also avoids asking users to use a disabled selector.

Scope: ComparisonPage presentation, scoped recovery-button CSS, two browser regressions.
No API, data, QC, interpolation, science-state contracts or navigation hierarchy changes.
Tests cover pilot deep links, absent metrics/exports, 44px target, keyboard recovery,
real baseline profiles, persistence after refresh and returning to a second pilot, at
1440px and 390px. Existing VIS/NAV suites remain unchanged.

No new open NAV/3DB PR at bootstrap. Recheck fresh main before merge. Require exact-head
tests/final-mvp, then exact-main CI, Pages and public Chromium. Record completion here
and retain the VIS-04 phase branch ledger as the completed two-phase session checkpoint.
