type TelemetryDirectoryId =
  | "overview"
  | "time-series"
  | "depth-series"
  | "sensors"
  | "variable-comparison"
  | "statistics"
  | "export-evidence";

const DIRECTORIES: Array<{ id: TelemetryDirectoryId; label: string; target: string }> = [
  { id: "overview", label: "Overview", target: "#telemetry-overview" },
  { id: "time-series", label: "Time Series", target: "#telemetry-time-series" },
  { id: "depth-series", label: "Depth Series", target: "#telemetry-depth-series" },
  { id: "sensors", label: "Sensors", target: "#telemetry-sensors" },
  { id: "variable-comparison", label: "Variable Comparison", target: "#telemetry-variable-comparison" },
  { id: "statistics", label: "Statistics", target: "#telemetry-statistics" },
  { id: "export-evidence", label: "Export / Evidence", target: "#telemetry-export-evidence" }
];

function revealDirectory(target: string) {
  const element = document.querySelector<HTMLElement>(target);
  if (!element) return;
  element.scrollIntoView({ block: "start", behavior: "smooth" });
}

export function TelemetryDirectoryNav() {
  return (
    <section className="telemetry-directory-shell" data-testid="rui-nav-03-telemetry-directory">
      <div className="telemetry-directory-title">
        <span>TELEMETRY</span>
        <strong>Feature directory</strong>
        <small>One canonical home per telemetry capability</small>
      </div>
      <nav className="telemetry-directory-nav" aria-label="Telemetry feature directory">
        {DIRECTORIES.map((directory) => (
          <button
            key={directory.id}
            type="button"
            data-telemetry-directory={directory.id}
            onClick={() => revealDirectory(directory.target)}
          >
            {directory.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
