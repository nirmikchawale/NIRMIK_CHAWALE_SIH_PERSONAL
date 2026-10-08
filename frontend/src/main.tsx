import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";

import App from "./App";
import { ExplorerConsolidationHost } from "./components/ExplorerConsolidationHost";
import { PilotMainBlockRendererBridge } from "./components/PilotMainBlockRendererBridge";
import { WorkspaceContextHost } from "./components/WorkspaceContextHost";
import "./styles.css";
import "./feature-upgrades.css";
import "./workbench.css";
import "./station.css";
import "./ocean-motion.css";
import "./interface-polish.css";
import "./scroll-foundation.css";
import "./glass-system.css";
import "./glass-system-bridge.css";
import "./phase3-atlas.css";
import "./phase35-main-block-engine.css";
import "./phase35c-time-engine.css";
import "./viewport-lock.css";
import "./theme-gallery-alignment.css";
import "./main-block-globe-integration.css";
import "./phase35a-live-acceptance.css";
import "./phase5-context-bridge.css";
import "./phase5-integration-gate.css";
import "./phase35d-pilot-sync.css";
import "./phase35d-pilot-compat.css";
import "./rui-shell.css";
import "./rui-shell-compat.css";
import "./rui-context-header.css";
import "./rui-context-header-mobile-fix.css";
import "./rui-nav-file-manager.css";
import "./rui-nav-explorer.css";
import "./rui-nav-telemetry.css";
import "./rui-nav-comparison.css";
import "./rui-nav-anomaly.css";
import "./science-system-consolidation.css";
import "./explorer-islands.css";
// MPR-01: opt-in theme-neutral visual tokens, loaded after legacy CSS.
import "./mpr-design-foundation.css";
// MPR-02: Explorer-only shell scrolling, without changing other routes.
import "./mpr-explorer-scroll.css";
// MPR-03: theme-neutral category rail + overlay workspace directory.
import "./mpr-workspaces-navigation.css";
// MPR-04: independent 16-theme Workspace Mode island.
import "./mpr-workspace-mode.css";
// MPR-05: one theme-aware, horizontally scrollable feature directory.
import "./mpr-feature-directory.css";
// MPR-06: responsive source selector, no scientific contract changes.
import "./mpr-ocean-intelligence.css";
// MPR-07: source-backed Active Main Block disclosure.
import "./mpr-active-main-block.css";
// MPR-08: move evidence/QC entry points into Ocean Intelligence.
import "./mpr-intelligence-evidence-hub.css";
// MPR-09: scientific-view navigation on existing source-backed stage.
import "./mpr-dual-view-navigator.css";
// MPR-10: full-width Geographic 3D view and responsive right-side dock.
import "./mpr-geographic-section.css";
// MPR-11: reorganize existing source-backed controls in the Geographic dock.
import "./mpr-geographic-controls.css";
// MPR-12: second genuine stacked Water Column 3D section, independent dock.
import "./mpr-stacked-water-column.css";
// MPR-13: genuine depth/time, colour, geometry and camera-linked controls.
import "./mpr-water-column-controls.css";
// MPR-14: never paint stale or mixed-source field/volume evidence.
import "./mpr-linked-view-evidence.css";
// MPR-15: real scientific inspectors, responsive keyboard/touch and footer.
import "./mpr-responsive-inspectors.css";
// MPR production hardening: remove duplicated scientific-context header strip.
import "./mpr-context-consolidation.css";
// MPR post-release: genuine main-block controller now in the Geographic dock.
import "./mpr-block-region-relocation.css";
// Desktop click regression and standards-compliant immersive viewport action.
import "./mpr-desktop-interaction-immersive.css";
// P0: Align real Geographic toolbar controls and forward wheel input to Explorer.
import "./mpr-geographic-toolbar-scroll-layout.css";
// Canonical Block Details island and full-size accessible judge presentation.
import "./mpr-block-details-workspace.css";
import "./mpr-presentation-reconstruction.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <>
      <App />
      <WorkspaceContextHost />
      <ExplorerConsolidationHost />
      <PilotMainBlockRendererBridge />
    </>
  </StrictMode>
);
