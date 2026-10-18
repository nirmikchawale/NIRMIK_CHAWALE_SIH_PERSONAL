# M000 — Canonical USB-140 and Competitor Improvement Traceability Register

**Phase:** M000 · **Date:** 2026-10-18 · **Stage:** REGISTERED, NOT IMPLEMENTED OR DEPLOYED
**Scientific source of truth:** [USB-140 Master Handoff](USB140_MASTER_HANDOFF.md)
**Uploaded source SHA-256 (UTF-8, unmodified):** `8e1b01522ae3a0de70c3d3e4c80229845b25a6cbcf32126578f532c925a7c798`
**Source length:** 929 lines, 80,906 UTF-8 bytes
**Repository baseline inspected:** `79b51d83aa8db5c86192b68a31cf0d16b5d5afbc`

## Authority and traceability rule

1. The complete uploaded USB-140 text is preserved verbatim in `USB140_MASTER_HANDOFF.md`. That document remains the authority for original requirements, limitations, scientific terms, source references and implementation constraints.
2. The **13-part/61-section** table below maps to exact one-indexed source line numbers. Every source line falls under one part; do not summarize away unindexed paragraph, table, code or footnote requirements.
3. All **300** original competitor-improvement identifiers A01–Y12 are reserved individually below. The category titles are a retrieval/navigation index. **Original item-by-item descriptions were in a prior conversation and are not provided in the USB-140 attachment**; therefore this register does not invent their exact wording or assert their scientific verification. Reconcile every ID against the original candidate text before adopting or rejecting its technical recommendation.
4. The user's subsequent requirements add **two additional appearance choices, Light and Dark**, retaining the original 16 existing glass themes, and require a dependency-aware file-by-file repository audit before any destructive cleanup. These are **post-USB-140 extensions**, not edits to the scientific source.
5. Requirements and candidate enhancements are **registered** here, not marked shipped. A status can advance only with code/test/PR/production evidence. No raw scientific data, existing CSS, runtime, CI or deployment was modified by this documentation phase.

## Source part coverage

| Part | Source title | Lines (1-based, inclusive) | Current state |
|---|---|---|---|
| A | MISSION, PRINCIPLES, AND NON-NEGOTIABLE OUTCOMES | 15–63 | REGISTERED |
| B | VERIFIED EXISTING BASELINE AND OPEN LIMITATIONS | 64–168 | REGISTERED |
| C | FULL SCIENTIFIC PRODUCT REQUIREMENTS | 169–270 | REGISTERED |
| D | END-TO-END SYSTEM ARCHITECTURE | 271–338 | REGISTERED |
| E | CRITICAL UI, UX, CSS AND GLASSMORPHISM NON-REGRESSION CONTRACT | 339–431 | REGISTERED |
| F | 16-PHASE MASTER IMPLEMENTATION PROGRAM (00–15) | 432–603 | REGISTERED |
| G | FIRST THREE EXECUTABLE RELEASE WAVES | 604–643 | REGISTERED |
| H | SCIENTIFIC, VISUAL AND RELEASE ACCEPTANCE GATES | 644–715 | REGISTERED |
| I | ENGINEERING WORKFLOW, FAILURE RECOVERY AND CHANGE MANAGEMENT | 716–787 | REGISTERED |
| J | OBJECTIVE PRIORITIES, EFFORT AND DELIVERY ORDER | 788–819 | REGISTERED |
| K | SINGLE MASTER EXECUTION PROMPT FOR THE NEXT CHAT | 820–843 | REGISTERED |
| L | FINAL DELIVERABLES AND EXIT CERTIFICATION | 844–883 | REGISTERED |
| M | AUTHORITATIVE STARTING RESOURCES | 884–929 | REGISTERED |

## Navigable section-level register

Each section's source line refers to the verbatim scientific handoff. Each entry is REGISTERED and requires later item-level tests and implementation evidence; it is **not a feature-completion claim**.

| Requirement section ID | Part | Source line | Original heading |
|---|---|---:|---|
| USB-A-001 | A | 17 | A1. Mission |
| USB-A-002 | A | 23 | A2. The distinction that governs the entire project |
| USB-A-003 | A | 33 | Target outcome |
| USB-A-004 | A | 43 | A3. Scientific honesty / hard prohibitions |
| USB-B-001 | B | 66 | B1. Canonical source-backed inventory (repository snapshot) |
| USB-B-002 | B | 93 | Sources and existing pilot product |
| USB-B-003 | B | 101 | B2. Immutable original GLORYS–Argo reference |
| USB-B-004 | B | 131 | B3. The first major scientific expansion target: IO-087 |
| USB-B-005 | B | 143 | B4. PR #200 and deployment truth |
| USB-B-006 | B | 154 | B5. Evidence hierarchy |
| USB-C-001 | C | 171 | C1. Geographic and block identity |
| USB-C-002 | C | 177 | C2. Core ocean fields |
| USB-C-003 | C | 189 | C3. Native temporal evidence |
| USB-C-004 | C | 197 | C4. Observations — source discovery and ingest |
| USB-C-005 | C | 214 | C5. Model–observation matchup science |
| USB-C-006 | C | 234 | C6. Evidence state and certification vocabulary |
| USB-C-007 | C | 254 | C7. Per-block source evidence bundle |
| USB-D-001 | D | 316 | Reuse-first engineering |
| USB-D-002 | D | 331 | Storage and compute design (subject to profiling) |
| USB-E-001 | E | 341 | E1. UI ownership and change-control boundary |
| USB-E-002 | E | 347 | E2. Preserve **all 16** actual glass themes |
| USB-E-003 | E | 375 | E3. Preserve exact key user journeys and spatial layout |
| USB-E-004 | E | 388 | E4. Style requirements for every newly added UI component |
| USB-E-005 | E | 403 | E5. Objective visual and accessibility acceptance matrix |
| USB-E-006 | E | 417 | E6. Mandatory “minimal correct change” regression policy |
| USB-F-001 | F | 436 | PHASE 00 — Production recovery and verified checkpoint |
| USB-F-002 | F | 450 | PHASE 01 — Freeze scientific and geographic contracts |
| USB-F-003 | F | 461 | PHASE 02 — Full observation and temporal feasibility atlas |
| USB-F-004 | F | 472 | PHASE 03 — Scientific source/version and data-rights strategy |
| USB-F-005 | F | 482 | PHASE 04 — Resumable source-backed model acquisition |
| USB-F-006 | F | 492 | PHASE 05 — Materialize remaining 70 eligible planned blocks |
| USB-F-007 | F | 502 | PHASE 06 — Enrich existing 35 pilots and genuine time coverage |
| USB-F-008 | F | 511 | PHASE 07 — Multi-sensor observation ingestion |
| USB-F-009 | F | 520 | PHASE 08 — Harmonization and compatibility layer |
| USB-F-010 | F | 529 | PHASE 09 — Universal model–observation matchup engine |
| USB-F-011 | F | 539 | PHASE 10 — Statistical diagnostics, uncertainty and exports |
| USB-F-012 | F | 548 | PHASE 11 — Universal block integration in current globe and water column |
| USB-F-013 | F | 559 | PHASE 12 — Glass UI/UX, accessibility and scientist-oriented workflows |
| USB-F-014 | F | 570 | PHASE 13 — Scalable storage, delivery and rendering performance |
| USB-F-015 | F | 580 | PHASE 14 — Independent scientific/security/regression audit |
| USB-F-016 | F | 591 | PHASE 15 — Release, production certification and evidence handoff |
| USB-G-001 | G | 606 | G1. Wave 0 — unblock current platform |
| USB-G-002 | G | 617 | G2. Wave 1 — IO-087 complete science reference |
| USB-G-003 | G | 631 | G3. Wave 2 — atlas and first controlled expansion batches |
| USB-H-001 | H | 646 | H1. Per-block gate model |
| USB-H-002 | H | 663 | H2. Automated tests: minimum requirements |
| USB-H-003 | H | 700 | H3. Numeric acceptance targets and constraints |
| USB-I-001 | I | 718 | I1. Standard execution loop |
| USB-I-002 | I | 733 | I2. Project boundary protection |
| USB-I-003 | I | 740 | I3. Provider/data acquisition failure policy |
| USB-I-004 | I | 749 | I4. Browser and CSS failure policy |
| USB-I-005 | I | 758 | I5. Approvals and release safety |
| USB-I-006 | I | 762 | I6. Decision and unknowns log (must be updated) |
| USB-J-001 | J | 790 | J1. Work order |
| USB-J-002 | J | 800 | J2. Preliminary effort ranges (not commitments) |
| USB-J-003 | J | 814 | J3. Quantities and economics to measure early |
| USB-L-001 | L | 846 | L1. Expected deliverables |
| USB-L-002 | L | 864 | L2. Release classification |
| USB-L-003 | L | 878 | L3. One-sentence acceptance standard |
| USB-M-001 | M | 886 | Current code/documentation |
| USB-M-002 | M | 915 | External scientific source documentation to verify when researching |

## Exact identifier reservation for the 300 enhancement candidates

Status for all entries: **UNRECONCILED PROPOSAL**. A row guarantees identifier preservation and backlog ownership only; it does not fabricate or approve a feature description.

| Candidate ID | Domain | Candidate description | Evaluation state |
|---|---|---|---|
| A01 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A02 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A03 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A04 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A05 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A06 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A07 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A08 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A09 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A10 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A11 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| A12 | Production and deployment | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B01 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B02 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B03 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B04 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B05 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B06 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B07 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B08 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B09 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B10 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B11 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| B12 | Scientific evidence and provenance | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C01 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C02 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C03 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C04 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C05 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C06 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C07 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C08 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C09 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C10 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C11 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| C12 | Authentic data sources | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D01 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D02 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D03 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D04 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D05 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D06 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D07 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D08 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D09 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D10 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D11 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| D12 | Quality control and missing data | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E01 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E02 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E03 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E04 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E05 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E06 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E07 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E08 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E09 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E10 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E11 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| E12 | Interoperability and standards | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F01 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F02 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F03 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F04 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F05 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F06 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F07 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F08 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F09 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F10 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F11 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| F12 | Vertical and geospatial integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G01 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G02 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G03 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G04 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G05 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G06 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G07 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G08 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G09 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G10 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G11 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| G12 | Time and temporal integrity | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H01 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H02 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H03 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H04 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H05 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H06 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H07 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H08 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H09 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H10 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H11 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| H12 | Volumetric 3D rendering | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I01 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I02 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I03 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I04 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I05 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I06 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I07 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I08 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I09 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I10 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I11 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| I12 | Currents and flow | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J01 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J02 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J03 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J04 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J05 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J06 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J07 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J08 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J09 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J10 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J11 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| J12 | Bathymetry, coastline and masks | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K01 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K02 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K03 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K04 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K05 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K06 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K07 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K08 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K09 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K10 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K11 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| K12 | Observation instruments | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L01 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L02 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L03 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L04 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L05 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L06 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L07 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L08 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L09 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L10 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L11 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| L12 | Biogeochemistry | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M01 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M02 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M03 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M04 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M05 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M06 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M07 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M08 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M09 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M10 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M11 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| M12 | Model–observation collocation | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N01 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N02 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N03 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N04 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N05 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N06 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N07 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N08 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N09 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N10 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N11 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| N12 | Statistics and uncertainty | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O01 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O02 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O03 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O04 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O05 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O06 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O07 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O08 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O09 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O10 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O11 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| O12 | Ocean physics and TEOS-10 | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P01 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P02 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P03 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P04 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P05 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P06 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P07 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P08 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P09 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P10 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P11 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| P12 | Hazards and scientific research | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q01 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q02 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q03 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q04 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q05 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q06 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q07 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q08 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q09 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q10 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q11 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Q12 | ML, anomaly and model intelligence | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R01 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R02 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R03 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R04 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R05 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R06 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R07 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R08 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R09 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R10 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R11 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| R12 | Scientific UI and visualization controls | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S01 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S02 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S03 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S04 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S05 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S06 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S07 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S08 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S09 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S10 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S11 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| S12 | Glass themes and accessibility | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T01 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T02 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T03 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T04 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T05 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T06 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T07 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T08 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T09 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T10 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T11 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| T12 | Performance and storage | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U01 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U02 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U03 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U04 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U05 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U06 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U07 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U08 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U09 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U10 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U11 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| U12 | Software architecture | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V01 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V02 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V03 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V04 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V05 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V06 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V07 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V08 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V09 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V10 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V11 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| V12 | Tests and certification | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W01 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W02 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W03 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W04 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W05 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W06 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W07 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W08 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W09 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W10 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W11 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| W12 | Security and source rights | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X01 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X02 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X03 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X04 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X05 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X06 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X07 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X08 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X09 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X10 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X11 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| X12 | Documentation and explainability | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y01 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y02 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y03 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y04 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y05 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y06 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y07 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y08 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y09 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y10 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y11 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |
| Y12 | Advanced research opportunities | Original item text requires cross-check against prior 300-item backlog | UNRECONCILED |

## New cross-cutting requirements (post-upload instructions)

| Extension ID | Requirement | Status | Next owner |
|---|---|---|---|
| EXT-THEME-LIGHT | Add a neutral, restrained premium Light glass theme while preserving the existing 16 theme IDs, theme storage compatibility and independent scientific palettes. | PLANNED | Theme/UI microphases |
| EXT-THEME-DARK | Add a neutral, restrained premium Dark glass theme with accessible contrast, existing glass tokens, no CSS regressions. | PLANNED | Theme/UI microphases |
| EXT-THEME-18-CERT | Extend the real-renderer visual/theme acceptance matrix from 16×3×2=96 to 18×3×2=108 real screenshots, with checks after relevant UI changes. | PLANNED | Visual certification |
| EXT-REPO-485 | Inspect each of the 485 tracked files from the baseline tree and classify dependencies, scientific evidence, planned future usage, tests and archival/cleanup eligibility. | PLANNED | Repository audit |
| EXT-REPO-SAFE-DELETE | Delete only separately approved proven-unnecessary files, after imports/build/CI/data-provenance/rollback tests; never delete original evidence just to reduce file count. | PLANNED | Cleanup releases |

## Scientific and production invariants

- Preserve one separate `BASE-GLORYS-001` GLORYS–Argo reference; it does not become an independent model-validation certificate merely through numerical agreement.
- Preserve the 140 logical blocks and their actual source-backed/planned/ineligible classifications. Prior snapshot: 35 materialized, 70 additional eligible planned and 35 ineligible. Refresh all counts from current manifests.
- IO-087 requires its own real, temporally compatible source evidence before source-backed promotion and new matchup claims. Do not treat 2004 model frames as 2024 comparisons.
- Retain raw source bytes, QC and original source hashes; reject synthetic fabricated measurements. Legitimate BGC-Argo synthetic-profile product files are not fabricated measurements.
- Preserve React/Cesium, the 16 original persisted theme IDs and current presentation/layout/navigation. Add Light and Dark without scientific-colorbar effects.
- Only count a step PUBLICLY VERIFIED after a passing exact-SHA Pages/public Chromium release. A documentation-only PR does not create an on-screen UI change.

## M000 objective acceptance checklist

- [x] Exact source preserved without rewriting its science or existing phase instructions.
- [x] All 13 parts and 61 headings/sections mapped to source line numbers.
- [x] 300 unique A01–Y12 competitor IDs reserved (25 domains × 12 items).
- [x] The two newly requested themes and safe repository audit are recorded as non-mutating extensions.
- [ ] Confirm documentation branch checks and reviewed pull request.
- [ ] Merge and verify GitHub main only after passing relevant checks.
- [ ] Public website release is not required for a docs-only registration (no UI changes), and no live changes may be claimed.

**Next planned microphase:** M001 — inventory main SHA, branches/workflows/tree and record authoritative checkpoint; M000 release/PR gates must be reconciled first.
