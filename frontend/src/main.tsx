import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "cesium/Build/Cesium/Widgets/widgets.css";

import App from "./App";
import { Phase35MainBlockEngine } from "./components/Phase35MainBlockEngine";
import { Phase3ArabianAtlas } from "./components/Phase3ArabianAtlas";
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
import "./phase5-context-bridge.css";
import "./phase5-integration-gate.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <>
      <App />
      <Phase35MainBlockEngine />
      <Phase3ArabianAtlas />
    </>
  </StrictMode>
);
