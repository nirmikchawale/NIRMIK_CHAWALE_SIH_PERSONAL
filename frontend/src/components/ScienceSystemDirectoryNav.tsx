/** RUI-NAV-07 canonical Science System directory. Routes retain #/about compatibility. */
export const SCIENCE_HOMES = [
  { id: "overview", label: "Overview" },
  { id: "scientific-context", label: "Scientific Context" },
  { id: "data-provenance", label: "Data Provenance" },
  { id: "quality-control", label: "Quality Control" },
  { id: "source-integrity", label: "Source Integrity" },
  { id: "architecture", label: "Architecture" },
  { id: "system-health", label: "System Health" },
  { id: "capabilities", label: "Capabilities" },
  { id: "limitations", label: "Limitations" },
  { id: "demo-guide", label: "Demo / Verification Guide" }
] as const;

export type ScienceHomeId = (typeof SCIENCE_HOMES)[number]["id"];

export function scienceHomeFromHash(hash: string): ScienceHomeId | null {
  const query = hash.split("?")[1];
  if (!query) return null;
  const id = new URLSearchParams(query).get("section");
  return SCIENCE_HOMES.find((home) => home.id === id)?.id ?? null;
}

function revealScienceHome(id: ScienceHomeId): void {
  const target = document.getElementById(`science-${id}`);
  if (!target) return;
  const url = new URL(window.location.href);
  url.hash = `/about?section=${id}`;
  window.history.replaceState(window.history.state, "", url.toString());
  target.scrollIntoView({
    block: "start",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
  });
}

export function ScienceSystemDirectoryNav() {
  return (
    <section className="science-directory-shell" data-testid="rui-nav-07-science-directory">
      <div className="science-directory-heading">
        <span>SCIENCE SYSTEM</span>
        <strong>Evidence & trust directory</strong>
        <small>Scientific context, traceability, quality, integrity and limits</small>
      </div>
      <nav className="science-directory-nav" aria-label="Science System feature directory">
        {SCIENCE_HOMES.map((home) => (
          <button
            key={home.id}
            type="button"
            data-science-directory={home.id}
            onClick={() => revealScienceHome(home.id)}
          >
            {home.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
