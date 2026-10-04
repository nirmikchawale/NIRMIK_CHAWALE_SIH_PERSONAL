import { useCallback, useEffect, useRef, useState } from "react";

import type { PageId } from "../navigation";
import { PAGE_ITEMS } from "../navigation";
import { ScientificContextBar } from "./ScientificContextBar";

interface Props {
  page: PageId;
  focusMode: boolean;
  onNavigate: (page: PageId) => void;
}

const SIDEBAR_STORAGE_KEY = "ocean-canvas-rui-sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 900px)";

const NAV_GROUPS: Array<{ label: string; pages: PageId[] }> = [
  { label: "EXPLORE", pages: ["explore"] },
  { label: "ANALYSE", pages: ["telemetry", "compare", "anomaly"] },
  { label: "DATA", pages: ["data-lab"] },
  { label: "EVIDENCE", pages: ["about"] }
];

function initialCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function initialMobileLayout(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

export function AppNavigation({ page, focusMode, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(initialMobileLayout);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  const currentPage = PAGE_ITEMS.find((item) => item.id === page) ?? PAGE_ITEMS[0];
  const currentGroup = NAV_GROUPS.find((group) => group.pages.includes(page))?.label ?? "EXPLORE";
  const mobileClosed = mobileLayout && !mobileOpen;
  const sidebarInert = focusMode || mobileClosed;

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "true" : "false");
    } catch {
      // Sidebar persistence is optional; the workstation remains fully usable without storage.
    }
  }, [collapsed]);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const syncLayout = () => {
      setMobileLayout(media.matches);
      if (!media.matches) setMobileOpen(false);
    };
    syncLayout();
    media.addEventListener?.("change", syncLayout);
    return () => media.removeEventListener?.("change", syncLayout);
  }, []);

  const closeMobileNavigation = useCallback((restoreFocus = true) => {
    setMobileOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileTriggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMobileNavigation(true);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeMobileNavigation, mobileOpen]);

  useEffect(() => {
    if (focusMode) setMobileOpen(false);
  }, [focusMode]);

  const navigateFromSidebar = (nextPage: PageId) => {
    onNavigate(nextPage);
    if (mobileLayout) closeMobileNavigation(true);
  };

  return (
    <div
      className="app-navigation-root"
      data-testid="app-navigation-root"
      data-collapsed={collapsed ? "true" : "false"}
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      <div
        className="mobile-workspace-nav"
        data-testid="mobile-workspace-nav"
        aria-hidden={focusMode ? true : undefined}
      >
        <button
          ref={mobileTriggerRef}
          className="mobile-sidebar-trigger"
          type="button"
          aria-label="Open workspace navigation"
          aria-controls="ocean-canvas-workspace-navigation"
          aria-expanded={mobileOpen}
          tabIndex={focusMode ? -1 : undefined}
          onClick={() => setMobileOpen(true)}
        >
          <span aria-hidden="true">☰</span>
          <span>Workspaces</span>
        </button>
        <div className="mobile-workspace-current" aria-live="polite">
          <span>{currentGroup}</span>
          <strong>{currentPage.label}</strong>
        </div>
      </div>

      {mobileLayout && mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close workspace navigation"
          onClick={() => closeMobileNavigation(true)}
        />
      )}

      <nav
        id="ocean-canvas-workspace-navigation"
        className="feature-rail feature-rail-left rui-sidebar"
        aria-label="Ocean Canvas workspaces"
        aria-hidden={sidebarInert ? true : undefined}
        inert={sidebarInert ? true : undefined}
      >
        <div className="rui-sidebar-brand">
          <div className="rui-sidebar-identity" aria-label="Ocean Canvas scientific workstation">
            <span className="rui-sidebar-mark" aria-hidden="true">OC</span>
            <span className="rui-sidebar-brand-copy">
              <strong>Ocean Canvas</strong>
              <small>SIH26067 · Scientific workstation</small>
            </span>
          </div>
          <button
            type="button"
            className="sidebar-collapse"
            aria-label={collapsed ? "Expand workspace sidebar" : "Collapse workspace sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand workspace sidebar" : "Collapse workspace sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
          </button>
          <button
            type="button"
            className="sidebar-mobile-close"
            aria-label="Close workspace navigation"
            onClick={() => closeMobileNavigation(true)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="rui-sidebar-groups">
          {NAV_GROUPS.map((group) => (
            <div className="rui-nav-group" data-nav-group={group.label} key={group.label}>
              <div className="rui-nav-group-label">{group.label}</div>
              <div className="rui-nav-group-items">
                {group.pages.map((pageId) => {
                  const item = PAGE_ITEMS.find((candidate) => candidate.id === pageId);
                  if (!item) return null;
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`rui-nav-item ${active ? "active" : ""}`}
                      onClick={() => navigateFromSidebar(item.id)}
                      title={`${item.label} — ${item.description}`}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="rui-nav-short" aria-hidden="true">{item.short}</span>
                      <span className="rui-nav-copy">
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="rui-sidebar-context" data-testid="rui-sidebar-context-slot">
          <ScientificContextBar page={page} onNavigate={navigateFromSidebar} />
        </div>
      </nav>
    </div>
  );
}
