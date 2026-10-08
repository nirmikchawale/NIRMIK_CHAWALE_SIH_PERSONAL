type DataLabDirectoryId = "overview" | "sources" | "datasets" | "variables" | "filters" | "inspection" | "downloads" | "provenance";

const DIRECTORIES: Array<{ id: DataLabDirectoryId; label: string; target: string }> = [
  { id: "overview", label: "Overview", target: "#data-lab-overview" },
  { id: "sources", label: "Sources", target: "#data-lab-sources" },
  { id: "datasets", label: "Datasets", target: "#data-lab-validator" },
  { id: "variables", label: "Variables", target: "#data-lab-variables" },
  { id: "filters", label: "Filters", target: "#data-lab-filters" },
  { id: "inspection", label: "Inspection", target: "#data-lab-inspection" },
  { id: "downloads", label: "Downloads", target: "#data-lab-downloads" },
  { id: "provenance", label: "Provenance", target: "#data-lab-provenance" }
];

function revealDirectory(target: string) {
  document.querySelector<HTMLElement>(target)?.scrollIntoView({ block: "start", behavior: "smooth" });
}

export function DataLabDirectoryNav() {
  return (
    <section className="data-lab-directory-shell" data-testid="rui-nav-06-data-lab-directory">
      <div className="data-lab-directory-title">
        <span>DATA LAB</span>
        <strong>Feature directory</strong>
        <small>Source → dataset → variable → filter → inspect → export → trace</small>
      </div>
      <nav className="data-lab-directory-nav" aria-label="Data Lab feature directory">
        {DIRECTORIES.map((directory) => (
          <button
            key={directory.id}
            type="button"
            data-data-lab-directory={directory.id}
            onClick={() => revealDirectory(directory.target)}
          >
            {directory.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
