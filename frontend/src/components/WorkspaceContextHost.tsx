import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { routeFromHash, type PageId } from "../navigation";
import { ScientificContextHeader } from "./ScientificContextHeader";

interface IntegrityCopy {
  scientificDisclaimer: string;
  degradedWarnings: string[];
}

const EMPTY_INTEGRITY: IntegrityCopy = {
  scientificDisclaimer: "Scientific disclaimer unavailable while application evidence is still initializing.",
  degradedWarnings: []
};

function readIntegrityCopy(): IntegrityCopy {
  const footer = document.querySelector<HTMLElement>(".science-footer");
  if (!footer) return EMPTY_INTEGRITY;
  const spans = footer.querySelectorAll<HTMLElement>(":scope > span");
  const integrityLine = spans[0]?.textContent?.trim() ?? "";
  const scientificDisclaimer = spans[1]?.textContent?.trim() || EMPTY_INTEGRITY.scientificDisclaimer;
  const degradedMarker = "· Degraded:";
  const degradedIndex = integrityLine.indexOf(degradedMarker);
  const degradedWarnings = degradedIndex >= 0
    ? integrityLine
        .slice(degradedIndex + degradedMarker.length)
        .split(" · ")
        .map((warning) => warning.trim())
        .filter(Boolean)
    : [];
  return { scientificDisclaimer, degradedWarnings };
}

function sameIntegrity(left: IntegrityCopy, right: IntegrityCopy): boolean {
  return left.scientificDisclaimer === right.scientificDisclaimer &&
    left.degradedWarnings.length === right.degradedWarnings.length &&
    left.degradedWarnings.every((value, index) => value === right.degradedWarnings[index]);
}

export function WorkspaceContextHost() {
  const [target, setTarget] = useState<HTMLElement | null>(() =>
    document.querySelector<HTMLElement>(".workspace-frame")
  );
  const [page, setPage] = useState<PageId>(() => routeFromHash(window.location.hash));
  const [integrity, setIntegrity] = useState<IntegrityCopy>(readIntegrityCopy);

  useEffect(() => {
    if (target?.isConnected) return;
    const syncTarget = () => {
      const next = document.querySelector<HTMLElement>(".workspace-frame");
      if (next) setTarget(next);
    };
    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const syncRoute = () => setPage(routeFromHash(window.location.hash));
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    if (!target) return;
    const shell = target.closest<HTMLElement>(".ocean-workbench");
    if (!shell) return;
    shell.dataset.ruiContextHeader = "true";

    const footer = shell.querySelector<HTMLElement>(".science-footer");
    const syncIntegrity = () => {
      const next = readIntegrityCopy();
      setIntegrity((current) => sameIntegrity(current, next) ? current : next);
    };
    syncIntegrity();

    if (!footer) {
      return () => {
        delete shell.dataset.ruiContextHeader;
      };
    }

    const observer = new MutationObserver(syncIntegrity);
    observer.observe(footer, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      delete shell.dataset.ruiContextHeader;
    };
  }, [target]);

  const navigate = useCallback((next: PageId) => {
    const hash = `#/${next}`;
    if (window.location.hash === hash) {
      setPage(next);
    } else {
      window.location.hash = hash;
    }
  }, []);

  if (!target) return null;

  return createPortal(
    <ScientificContextHeader
      page={page}
      onNavigate={navigate}
      scientificDisclaimer={integrity.scientificDisclaimer}
      degradedWarnings={integrity.degradedWarnings}
    />,
    target
  );
}
