export type PageId = "explore" | "telemetry" | "compare" | "anomaly" | "data-lab" | "about";

export type NavigationGroupId = "explore" | "analyse" | "data" | "science";

export interface PageItem {
  id: PageId;
  short: string;
  label: string;
  description: string;
}

export interface NavigationGroup {
  id: NavigationGroupId;
  label: "EXPLORE" | "ANALYSE" | "DATA" | "SCIENCE";
  directoryLabel: string;
  description: string;
  pages: PageId[];
}

export interface BreadcrumbItem {
  label: string;
  kind: "root" | "directory" | "workspace";
  pageId?: PageId;
}

export const PAGE_ITEMS: PageItem[] = [
  { id: "explore", short: "3D", label: "3D Explorer", description: "Selectable Cesium globe and scientific water-column 3D" },
  { id: "telemetry", short: "TEL", label: "Telemetry", description: "Depth, time and ocean telemetry visual analytics" },
  { id: "compare", short: "OBS", label: "Model vs Observation", description: "Argo comparison, bias and anomaly evidence" },
  { id: "anomaly", short: "FLAG", label: "Anomaly Screening", description: "Explainable spatial extremes and Argo residual outliers" },
  { id: "data-lab", short: "DATA", label: "Data Lab", description: "Local CSV/JSON schema, quality and provenance validation" },
  { id: "about", short: "INFO", label: "Science System", description: "Sources, methods, limits and architecture" }
];

/**
 * RUI-NAV-00 frozen root information architecture.
 *
 * Route ids remain deliberately unchanged in NAV-01. The directory model owns
 * discoverability and parentage only; scientific context remains workspace-owned.
 */
export const NAVIGATION_TREE: NavigationGroup[] = [
  {
    id: "explore",
    label: "EXPLORE",
    directoryLabel: "Explore",
    description: "Interactive ocean model and water-column exploration",
    pages: ["explore"]
  },
  {
    id: "analyse",
    label: "ANALYSE",
    directoryLabel: "Analyse",
    description: "Telemetry, model-observation comparison and anomaly screening",
    pages: ["telemetry", "compare", "anomaly"]
  },
  {
    id: "data",
    label: "DATA",
    directoryLabel: "Data",
    description: "Dataset inspection, validation and evidence preparation",
    pages: ["data-lab"]
  },
  {
    id: "science",
    label: "SCIENCE",
    directoryLabel: "Science",
    description: "Methods, provenance, system limits and scientific evidence",
    pages: ["about"]
  }
];

export function pageItem(page: PageId): PageItem {
  return PAGE_ITEMS.find((item) => item.id === page) ?? PAGE_ITEMS[0];
}

export function navigationGroupForPage(page: PageId): NavigationGroup {
  return NAVIGATION_TREE.find((group) => group.pages.includes(page)) ?? NAVIGATION_TREE[0];
}

export function breadcrumbForPage(page: PageId): BreadcrumbItem[] {
  const group = navigationGroupForPage(page);
  const item = pageItem(page);
  return [
    { label: "Ocean Canvas", kind: "root" },
    { label: group.directoryLabel, kind: "directory" },
    { label: item.label, kind: "workspace", pageId: item.id }
  ];
}

export function routeFromHash(hash: string): PageId {
  const route = hash.replace(/^#\/?/, "").split(/[?&]/)[0];
  return PAGE_ITEMS.some((item) => item.id === route) ? (route as PageId) : "explore";
}
