import { useCallback, useEffect, useRef, useState } from "react";

import type { NavigationGroupId, PageId } from "../navigation";
import { MprIcon, type MprIconName } from "./MprIcon";
import {
  NAVIGATION_TREE,
  breadcrumbForPage,
  navigationGroupForPage,
  pageItem
} from "../navigation";

interface Props {
  page: PageId;
  focusMode: boolean;
  onNavigate: (page: PageId) => void;
}

const MPR_NAV_STORAGE_KEY = "ocean-canvas-mpr03-rail-collapsed";
const MOBILE_QUERY = "(max-width: 900px)";
const GROUP_ICONS: Record<NavigationGroupId, MprIconName> = {
  explore: "explore", analyse: "analyze", data: "data", science: "science"
};
const GROUP_DISPLAY: Record<NavigationGroupId, string> = {
  explore: "Explore", analyse: "Analyze", data: "Data", science: "Science"
};

function initialCollapsed(): boolean {
  try {
    // Deliberately separate from the old 272px sidebar preference. Reading
    // storage is side-effect free under React StrictMode double initialization.
    return window.localStorage.getItem(MPR_NAV_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function initialMobileLayout(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

export function AppNavigation({ page, focusMode, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(initialMobileLayout);
  const [selectedGroup, setSelectedGroup] = useState<NavigationGroupId>(() => navigationGroupForPage(page).id);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const railButtonRefs = useRef<Partial<Record<NavigationGroupId, HTMLButtonElement | null>>>({});
  const directoryRef = useRef<HTMLElement>(null);

  const currentPage = pageItem(page);
  const currentGroup = navigationGroupForPage(page);
  const breadcrumbs = breadcrumbForPage(page);
  const drawerOpen = !focusMode && (mobileLayout ? mobileOpen : !collapsed);
  const sidebarInert = !drawerOpen;

  useEffect(() => {
    try {
      window.localStorage.setItem(MPR_NAV_STORAGE_KEY, collapsed ? "true" : "false");
    } catch {
      // Sidebar persistence is optional; the workstation remains fully usable without storage.
    }
  }, [collapsed]);

  useEffect(() => {
    setSelectedGroup(navigationGroupForPage(page).id);
  }, [page]);

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

  const closeNavigation = useCallback((restoreFocus = true) => {
    setMobileOpen(false);
    setCollapsed(true);
    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        if (window.matchMedia(MOBILE_QUERY).matches) mobileTriggerRef.current?.focus();
        else railButtonRefs.current[selectedGroup]?.focus();
      });
    }
  }, [selectedGroup]);

  const openGroup = useCallback((group: NavigationGroupId) => {
    setSelectedGroup(group);
    if (mobileLayout) setMobileOpen(true);
    else setCollapsed(false);
  }, [mobileLayout]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusId = window.requestAnimationFrame(() => {
      directoryRef.current?.querySelector<HTMLButtonElement>(".mpr-drawer-category.is-selected")?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeNavigation(true);
      } else if (event.key === "Tab" && directoryRef.current) {
        const focusable = Array.from(directoryRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled):not([hidden]):not([tabindex="-1"])'
        )).filter(node => node.getClientRects().length > 0);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusId);
      window.removeEventListener("keydown", onKeyDown);
      // Explicit click/route navigation restores to its correct launcher.
      void previousFocus;
    };
  }, [closeNavigation, drawerOpen]);

  useEffect(() => {
    if (focusMode) {
      setMobileOpen(false);
      setCollapsed(true);
    }
  }, [focusMode]);

  const navigateFromSidebar = (nextPage: PageId) => {
    onNavigate(nextPage);
    closeNavigation(true);
  };

  return (
    <div
      className="app-navigation-root"
      data-testid="app-navigation-root"
      data-collapsed={collapsed ? "true" : "false"}
      data-mobile-open={mobileOpen ? "true" : "false"}
      data-nav-directory={currentGroup.id}
      data-drawer-open={drawerOpen ? "true" : "false"}
      data-selected-group={selectedGroup}
    >
      {!mobileLayout && (
        <div className="mpr-workspace-rail" role="group" aria-label="Workspace categories" data-testid="mpr-workspace-rail">
          <div className="mpr-rail-brand" aria-label="Ocean Canvas"><span aria-hidden="true">OC</span></div>
          {NAVIGATION_TREE.map((group) => (
            <button
              ref={(node) => { railButtonRefs.current[group.id] = node; }}
              className={`mpr-rail-category ${currentGroup.id === group.id ? "is-current" : ""} ${drawerOpen && selectedGroup === group.id ? "is-open" : ""}`}
              data-workspace-group={group.id}
              key={group.id}
              type="button"
              title={`${GROUP_DISPLAY[group.id]} workspaces`}
              aria-label={`Open ${GROUP_DISPLAY[group.id]} workspaces`}
              aria-current={currentGroup.id === group.id ? "true" : undefined}
              aria-expanded={drawerOpen && selectedGroup === group.id}
              aria-controls="ocean-canvas-workspace-navigation"
              onClick={() => openGroup(group.id)}
            >
              <MprIcon name={GROUP_ICONS[group.id]} size={21}/>
              <span>{GROUP_DISPLAY[group.id]}</span>
            </button>
          ))}
        </div>
      )}
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
          onClick={() => openGroup(currentGroup.id)}
        >
          <span aria-hidden="true">☰</span>
          <span>Workspaces</span>
        </button>
        <div className="mobile-workspace-current" aria-live="polite">
          <span>{currentGroup.label}</span>
          <strong>{currentPage.label}</strong>
        </div>
      </div>

      {drawerOpen && (
        <button
          type="button"
          className="sidebar-backdrop mpr-workspaces-backdrop"
          aria-label="Dismiss workspace directory"
          onClick={() => closeNavigation(true)}
        />
      )}

      <nav
        ref={directoryRef}
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
            aria-label="Close workspace directory"
            title="Close workspace directory"
            onClick={() => closeNavigation(true)}
          >
            <span aria-hidden="true">×</span>
          </button>
          <button
            type="button"
            className="sidebar-mobile-close"
            aria-label="Close workspace navigation"
            onClick={() => closeNavigation(true)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="rui-nav-breadcrumb" role="navigation" aria-label="Workspace breadcrumb" data-testid="workspace-breadcrumb">
          <ol>
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.kind}-${crumb.label}`} aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>
                <span>{crumb.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mpr-drawer-categories" role="group" aria-label="Choose workspace category">
          {NAVIGATION_TREE.map(group => (
            <button
              key={group.id}
              type="button"
              className={`mpr-drawer-category ${selectedGroup === group.id ? "is-selected" : ""}`}
              aria-pressed={selectedGroup === group.id}
              onClick={() => setSelectedGroup(group.id)}
            >
              <MprIcon name={GROUP_ICONS[group.id]} size={17}/>
              <span>{GROUP_DISPLAY[group.id]}</span>
            </button>
          ))}
        </div>

        <div
          className="rui-sidebar-groups"
          role="tree"
          aria-label="Ocean Canvas feature directory"
          data-testid="workspace-directory-tree"
        >
          {NAVIGATION_TREE.map((group) => (
            <section
              className="rui-nav-group"
              data-nav-group={group.label}
              data-directory-view={group.id}
              aria-labelledby={`rui-nav-group-${group.id}`}
              aria-hidden={selectedGroup !== group.id ? true : undefined}
              hidden={selectedGroup !== group.id}
              key={group.id}
            >
              <div className="rui-nav-group-label" id={`rui-nav-group-${group.id}`}>
                <span>{group.label}</span>
                <small>{group.pages.length}</small>
              </div>
              <div className="rui-nav-group-items" role="group" aria-label={`${group.directoryLabel} directory`}>
                {group.pages.map((pageId) => {
                  const item = pageItem(pageId);
                  const active = page === item.id;
                  return (
                    <div
                      key={item.id}
                      role="treeitem"
                      aria-level={2}
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                      onClick={() => navigateFromSidebar(item.id)}
                    >
                      <button
                        type="button"
                        className={`rui-nav-item ${active ? "active" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigateFromSidebar(item.id);
                        }}
                        title={`${item.label} — ${item.description}`}
                        aria-label={item.label}
                        data-workspace-id={item.id}
                      >
                        <span className="rui-nav-short" aria-hidden="true">{item.short}</span>
                        <span className="rui-nav-copy">
                          <strong>{item.label}</strong>
                          <small>{item.description}</small>
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>
    </div>
  );
}
