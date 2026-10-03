import type { PageId } from "../navigation";
import { PAGE_ITEMS } from "../navigation";
import { ScientificContextBar } from "./ScientificContextBar";

interface Props {
  page: PageId;
  focusMode: boolean;
  onNavigate: (page: PageId) => void;
}

const NAV_GROUPS: Array<{ label: string; pages: PageId[] }> = [
  { label: "EXPLORE", pages: ["explore"] },
  { label: "ANALYSIS", pages: ["telemetry", "compare", "anomaly"] },
  { label: "EVIDENCE", pages: ["data-lab", "about"] }
];

export function AppNavigation({ page, focusMode, onNavigate }: Props) {
  return (
    <nav className="feature-rail feature-rail-left" aria-label="Ocean Canvas pages" aria-hidden={focusMode}>
      <div className="rail-title">WORKSPACE</div>
      {NAV_GROUPS.map((group) => (
        <div className="rail-group" key={group.label}>
          <div className="rail-group-label">{group.label}</div>
          {group.pages.map((pageId) => {
            const item = PAGE_ITEMS.find((candidate) => candidate.id === pageId);
            if (!item) return null;
            return (
              <button
                key={item.id}
                className={page === item.id ? "active" : ""}
                onClick={() => onNavigate(item.id)}
                title={item.description}
                aria-label={item.label}
                aria-current={page === item.id ? "page" : undefined}
              >
                <strong>{item.short}</strong>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
      <ScientificContextBar page={page} onNavigate={onNavigate} />
    </nav>
  );
}
