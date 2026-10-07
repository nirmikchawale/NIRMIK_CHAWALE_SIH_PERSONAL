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
