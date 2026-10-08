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
