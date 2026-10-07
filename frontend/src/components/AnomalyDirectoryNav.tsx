type AnomalyDirectoryId =
  | "overview"
  | "spatial-anomalies"
  | "temporal-anomalies"
  | "depth-anomalies"
  | "thresholds"
  | "detected-flags"
  | "explainability";

const DIRECTORIES: Array<{ id: AnomalyDirectoryId; label: string; target: string }> = [
  { id: "overview", label: "Overview", target: "#anomaly-overview" },
  { id: "spatial-anomalies", label: "Spatial Anomalies", target: "#anomaly-spatial" },
  { id: "temporal-anomalies", label: "Temporal Anomalies", target: "#anomaly-temporal" },
  { id: "depth-anomalies", label: "Depth Anomalies", target: "#anomaly-depth" },
  { id: "thresholds", label: "Thresholds", target: "#anomaly-thresholds" },
  { id: "detected-flags", label: "Detected Flags", target: "#anomaly-detected-flags" },
  { id: "explainability", label: "Explainability", target: "#anomaly-explainability" }
];

function revealDirectory(target: string) {
  const element = document.querySelector<HTMLElement>(target);
  if (!element) return;
  element.scrollIntoView({ block: "start", behavior: "smooth" });
}

export function AnomalyDirectoryNav() {
  return (
    <section className="anomaly-directory-shell" data-testid="rui-nav-05-anomaly-directory">
      <div className="anomaly-directory-title">
        <span>ANOMALY SCREENING</span>
        <strong>Feature directory</strong>
        <small>Detect → locate → threshold → explain</small>
      </div>
      <nav className="anomaly-directory-nav" aria-label="Anomaly Screening feature directory">
        {DIRECTORIES.map((directory) => (
          <button
            key={directory.id}
            type="button"
            data-anomaly-directory={directory.id}
            onClick={() => revealDirectory(directory.target)}
          >
            {directory.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
