type ComparisonDirectoryId =
  | "overview"
  | "observation-sources"
  | "matchups"
  | "profile-comparison"
  | "bias-by-depth"
  | "metrics"
  | "qc"
  | "evidence";

const DIRECTORIES: Array<{ id: ComparisonDirectoryId; label: string; target: string }> = [
  { id: "overview", label: "Overview", target: "#comparison-overview" },
  { id: "observation-sources", label: "Observation Sources", target: "#comparison-observation-sources" },
  { id: "matchups", label: "Matchups", target: "#comparison-matchups" },
  { id: "profile-comparison", label: "Profile Comparison", target: "#comparison-profile-comparison" },
  { id: "bias-by-depth", label: "Bias by Depth", target: "#comparison-bias-by-depth" },
  { id: "metrics", label: "Metrics", target: "#comparison-metrics" },
  { id: "qc", label: "QC", target: "#comparison-qc" },
  { id: "evidence", label: "Evidence", target: "#comparison-evidence" }
];

function revealDirectory(target: string) {
  const element = document.querySelector<HTMLElement>(target);
  if (!element) return;
  element.scrollIntoView({ block: "start", behavior: "smooth" });
}

export function ComparisonDirectoryNav() {
  return (
    <section className="comparison-directory-shell" data-testid="rui-nav-04-comparison-directory">
      <div className="comparison-directory-title">
        <span>MODEL VS OBSERVATION</span>
        <strong>Feature directory</strong>
        <small>Source → matchup → profile → bias → QC → evidence</small>
      </div>
      <nav className="comparison-directory-nav" aria-label="Model vs Observation feature directory">
        {DIRECTORIES.map((directory) => (
          <button
            key={directory.id}
            type="button"
            data-comparison-directory={directory.id}
            onClick={() => revealDirectory(directory.target)}
          >
            {directory.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
