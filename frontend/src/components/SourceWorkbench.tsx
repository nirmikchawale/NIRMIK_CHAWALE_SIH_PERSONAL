import { useEffect } from "react";

import { readScientificWorkspaceContext } from "../scientific-context-runtime";

type Source = "glorys" | "incois" | "chlorophyll";

export function SourceWorkbench({ source, operationalAvailable, chlorophyllAvailable, onSource, onOverview, onCompare, onData }: {
  source: Source; operationalAvailable: boolean; chlorophyllAvailable: boolean;
  onSource: (source: Source) => void; onOverview: () => void; onCompare: () => void; onData: () => void;
}) {
  useEffect(() => {
    const requestedSource = readScientificWorkspaceContext().sourceMode;
    if (requestedSource === source) return;
    if (requestedSource === "incois" && !operationalAvailable) return;
    if (requestedSource === "chlorophyll" && !chlorophyllAvailable) return;
    onSource(requestedSource);
  }, [chlorophyllAvailable, onSource, operationalAvailable, source]);

  return <section className="source-workbench" aria-label="Scientific source workspace">
    <div className="source-workbench-title"><span>OCEAN INTELLIGENCE</span><h2>Choose your ocean.</h2></div>
    <div className="source-workbench-choices" aria-label="Explore scientific source">
      <button aria-label="GLORYS baseline" aria-pressed={source === "glorys"} onClick={() => onSource("glorys")}><span className="source-number">01</span><span><strong>GLORYS baseline</strong><small>Depth & Argo comparison</small></span></button>
      <button aria-label="INCOIS multi-time" aria-pressed={source === "incois"} disabled={!operationalAvailable} onClick={() => onSource("incois")}><span className="source-number">02</span><span><strong>INCOIS multi-time</strong><small>{operationalAvailable ? "Explore genuine time steps" : "Source unavailable"}</small></span></button>
      <button aria-label="INCOIS chlorophyll" aria-pressed={source === "chlorophyll"} disabled={!chlorophyllAvailable} onClick={() => onSource("chlorophyll")}><span className="source-number">03</span><span><strong>INCOIS chlorophyll</strong><small>{chlorophyllAvailable ? "Satellite surface colour" : "Source unavailable"}</small></span></button>
    </div>
    <nav className="source-workbench-actions" aria-label="Scientific workflow actions">
      <button onClick={onOverview}>Field overview ↗</button><button onClick={onCompare}>Compare observations ↗</button><button onClick={onData}>Open Data Lab ↗</button>
    </nav>
  </section>;
}