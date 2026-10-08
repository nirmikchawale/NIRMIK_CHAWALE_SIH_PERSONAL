import { useEffect, useRef } from "react";

import { readScientificWorkspaceContext } from "../scientific-context-runtime";
import { MprIcon } from "./MprIcon";

type Source = "glorys" | "incois" | "chlorophyll";

export function SourceWorkbench({ source, operationalAvailable, chlorophyllAvailable, onSource, onOverview, onCompare, onData }: {
  source: Source; operationalAvailable: boolean; chlorophyllAvailable: boolean;
  onSource: (source: Source) => void; onOverview: () => void; onCompare: () => void; onData: () => void;
}) {
  const attemptedHydration = useRef(false);

  useEffect(() => {
    if (attemptedHydration.current) return;
    const requestedSource = readScientificWorkspaceContext().sourceMode;
    if (requestedSource === source) {
      attemptedHydration.current = true;
      return;
    }
    if (requestedSource === "incois" && !operationalAvailable) return;
    if (requestedSource === "chlorophyll" && !chlorophyllAvailable) return;

    attemptedHydration.current = true;
    onSource(requestedSource);
  }, [chlorophyllAvailable, onSource, operationalAvailable, source]);

  return <section className="source-workbench mpr-ocean-intelligence" aria-label="Scientific source workspace" data-testid="mpr-06-ocean-intelligence">
    <div className="source-workbench-title"><span>OCEAN INTELLIGENCE</span><h2>Choose your ocean.</h2><p className="mpr-source-subtitle">Select available scientific evidence. Each card retains its genuine source and native time/depth limits.</p></div>
    <div className="source-workbench-choices" aria-label="Explore scientific source">
      <button aria-label="GLORYS baseline" aria-pressed={source === "glorys"} onClick={() => { if (source !== "glorys") onSource("glorys"); }}><span className="source-number">01</span><span><strong><MprIcon name="globe" size={17}/> GLORYS baseline</strong><small>Depth &amp; Argo comparison</small><span className="mpr-source-status">One verified model timestep</span></span></button>
      <button aria-label="INCOIS multi-time" aria-pressed={source === "incois"} disabled={!operationalAvailable} onClick={() => { if (source !== "incois") onSource("incois"); }}><span className="source-number">02</span><span><strong><MprIcon name="time" size={17}/> INCOIS multi-time</strong><small>{operationalAvailable ? "Explore genuine time steps" : "Source unavailable"}</small><span className="mpr-source-status">{operationalAvailable ? "Native multi-time field" : "Unavailable · selection disabled"}</span></span></button>
      <button aria-label="INCOIS chlorophyll" aria-pressed={source === "chlorophyll"} disabled={!chlorophyllAvailable} onClick={() => { if (source !== "chlorophyll") onSource("chlorophyll"); }}><span className="source-number">03</span><span><strong><MprIcon name="source" size={17}/> INCOIS chlorophyll</strong><small>{chlorophyllAvailable ? "Satellite surface colour" : "Source unavailable"}</small><span className="mpr-source-status">{chlorophyllAvailable ? "Surface only · no synthetic depths" : "Unavailable · selection disabled"}</span></span></button>
    </div>
    <nav className="source-workbench-actions" aria-label="Scientific workflow actions">
      <button onClick={onOverview}>Field overview ↗</button><button onClick={onCompare}>Compare observations ↗</button><button onClick={onData}>Open Data Lab ↗</button>
    </nav>
  </section>;
}
