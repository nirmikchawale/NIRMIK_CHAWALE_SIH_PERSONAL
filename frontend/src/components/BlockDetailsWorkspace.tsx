import { useEffect, useState } from "react";
import { readScientificWorkspaceContext, subscribeScientificWorkspaceContext, sourceLabel, variableLabel } from "../scientific-context-runtime";

type Destination = "geographic" | "region" | "scientific" | "catalog" | "water";
const targets: Record<Destination, string> = {
  geographic: "#mpr-3d-stage",
  region: "#explore-block-region",
  scientific: '[data-testid="mpr-07-active-main-block"]',
  catalog: '[data-testid="phase35-block-launcher"]',
  water: "#mpr-water-column-section"
};

export function BlockDetailsWorkspace({ onOpenControls }: { onOpenControls: () => void }) {
  const [context, setContext] = useState(readScientificWorkspaceContext);
  const [notice, setNotice] = useState("");
  useEffect(() => subscribeScientificWorkspaceContext(setContext), []);

  const navigate = (destination: Destination) => {
    // The control dock can be collapsed on desktop or be a mobile sheet.
    // Open its actual React owner first so the destination is truly usable.
    if (destination === "region") onOpenControls();
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(targets[destination]);
      if (!target) {
        setNotice("That workspace is not currently available.");
        return;
      }
      if (destination === "catalog") {
        target.click();
        setNotice("Indian Ocean Block Engine opened.");
        return;
      }
      const disclosure = target.closest<HTMLDetailsElement>("details");
      if (disclosure && !disclosure.open) disclosure.open = true;
      if (target.matches("details") && !target.hasAttribute("open")) target.setAttribute("open", "");
      target.scrollIntoView({ behavior: "auto", block: "start" });
      if (destination === "region") {
        (target.querySelector("select,button") as HTMLElement | null)?.focus({ preventScroll: true });
      } else if (destination === "scientific") {
        target.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
      } else {
        target.focus({ preventScroll: true });
      }
      setNotice(destination === "water" ? "Water Column 3D section in view." : "Selected workspace in view.");
    });
  };

  return (
    <section id="mpr-block-details" className="mpr-block-details-workspace" aria-label="Dedicated Indian Ocean block details" data-testid="mpr-block-details-workspace">
      <header className="mpr-block-details-heading">
        <div><span>BLOCK DETAILS · SHARED SCIENTIFIC CONTEXT</span><h3>Current Indian Ocean selection</h3></div>
        <span className="mpr-block-details-status" data-materialization={context.blockMaterialization}>
          {context.blockMaterialization === "verified-baseline" ? "Verified reference" : context.blockMaterialization === "pilot" ? "Source-backed pilot" : "Planned target only"}
        </span>
      </header>
      <dl className="mpr-block-details-facts">
        <div><dt>Active block</dt><dd>{context.blockId}</dd></div>
        <div><dt>Region</dt><dd>{context.blockRegion}</dd></div>
        <div><dt>Native source</dt><dd>{sourceLabel(context.sourceMode, context.blockMaterialization)}</dd></div>
        <div><dt>Variable</dt><dd>{variableLabel(context.variable)}</dd></div>
        <div><dt>UTC time</dt><dd>{context.timestamp ? context.timestamp.replace("T", " ").replace("Z", " UTC") : "Not selected"}</dd></div>
        <div><dt>Depth</dt><dd>{context.depthM == null ? "Surface only / unselected" : context.depthM.toFixed(2) + " m"}</dd></div>
      </dl>
      <nav className="mpr-block-details-actions" aria-label="Block navigation and evidence actions">
        <button type="button" onClick={() => navigate("geographic")}>View on Geographic 3D</button>
        <button type="button" onClick={() => navigate("region")}>Block &amp; Region controls</button>
        <button type="button" onClick={() => navigate("catalog")}>Open complete Block Engine</button>
        <button type="button" onClick={() => navigate("scientific")}>Scientific block details</button>
        <button type="button" onClick={() => navigate("water")}>Water Column 3D section</button>
      </nav>
      <p className="mpr-block-details-truth">
        {context.blockMaterialization === "planned"
          ? "This selected footprint is geographic planning geometry only. Measurements and depth volumes are withheld until source materialization."
          : context.blockMaterialization === "pilot"
            ? "This source-backed pilot retains genuine native depth, variable and time evidence; observation validation is a separate claim."
            : "The verified GLORYS baseline is a regional scientific reference, not an invented block-volume footprint."}
      </p>
      <span className="mpr-block-details-live-notice" role="status">{notice}</span>
    </section>
  );
}
