import { SourceWorkbench } from "./components/SourceWorkbench";
import { WaterColumnControlDock } from "./components/WaterColumnControlDock";
import { ExplorerInspectorAccess } from "./components/ExplorerInspectorAccess";
import { linkedSelectionKey, matchesGeographicPayload, matchesWaterColumnPayload } from "./linked-view-integrity";
import { ExplorerDirectoryNav } from "./components/ExplorerDirectoryNav";
import { ExplorerWorkspaceModeIsland } from "./components/ExplorerWorkspaceModeIsland";
import { RefreshControl } from "./components/RefreshControl";
import { ImmersiveFullscreenButton } from "./components/ImmersiveFullscreenButton";
import { getGlassTheme, initialGlassTheme } from "./theme";
import { useOceanMotion } from "./useOceanMotion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { api, fetchIncoisChlorophyll, fetchIncoisOperational, fetchVerifiedObservationPack } from "./api";
import { useStartupScreen } from "./useStartupScreen";
import { AppNavigation } from "./components/AppNavigation";
import { AnalysisSplitPanel } from "./components/AnalysisSplitPanel";
import { EvidenceRail } from "./components/EvidenceRail";
import { PresentationGuide } from "./components/PresentationGuide";
import { ScientificColorbarHud } from "./components/ScientificColorbarHud";
import { ControlPanel } from "./components/ControlPanel";
import { ComparisonPage } from "./pages/ComparisonPage";
import { AnomalyPage } from "./pages/AnomalyPage";
import { TelemetryPage } from "./pages/TelemetryPage";
import { DataLabPage } from "./pages/DataLabPage";
import { InfoPage } from "./pages/InfoPage";
import { OceanGlobe } from "./components/OceanGlobe";
import { WaterColumn3D } from "./components/WaterColumn3D";
import { VisualizationDock } from "./components/VisualizationDock";
import { ProfilePanel } from "./components/ProfilePanel";
import { ImportedObservationPanel } from "./components/ImportedObservationPanel";
import { ProvenanceDrawer } from "./components/ProvenanceDrawer";
import argoLogo0 from "./assets/exact-logo-00.b64?raw";
import argoLogo1 from "./assets/exact-logo-01.b64?raw";
import argoLogo2 from "./assets/exact-logo-02.b64?raw";
import argoLogo3a from "./assets/exact-logo-03a.b64?raw";
import argoLogo3b from "./assets/exact-logo-03b.b64?raw";
import argoLogo4a from "./assets/exact-logo-04a.b64?raw";
import argoLogo4b from "./assets/exact-logo-04b.b64?raw";
import { PAGE_ITEMS, routeFromHash, type PageId } from "./navigation";
import { readScientificWorkspaceContext } from "./scientific-context-runtime";
import {
  readActiveMainBlockId,
  resolveMainBlock,
  subscribeActiveMainBlock
} from "./main-block-runtime";
import { deriveMainBlockObservationIntegration } from "./main-block-observations";
import { deriveMainBlockProvenanceEvidence } from "./main-block-provenance";
import {
  fetchPilotMainBlockManifest,
  type PilotBlockManifest
} from "./pilot-main-block-loader";
import {
  buildIncoisChlorophyllCatalog,
  buildIncoisChlorophyllField,
  buildIncoisExploreCatalog,
  buildIncoisField,
  buildIncoisVolume,
  type ExploreSourceMode
} from "./operationalExplore";
import {
  IMPORTED_OBSERVATIONS_EVENT,
  groupImportedObservationProfiles,
  readImportedObservationRecords,
  sanitizeImportedObservationRecords
} from "./observationSession";
import type {
  Catalog,
  ColorPalette,
  ColorScaleMode,
  CurrentsResponse,
  CurrentsVolumeResponse,
  FieldResponse,
  ImportedObservationProfile,
  IncoisChlorophyllSnapshot,
  IncoisOperationalSnapshot,
  ProfileDetail,
  ProfileSummary,
  ProvenanceResponse,
  ViewMode,
  VisualizationMode,
  VolumeResponse
} from "./types";

type ThemeMode = "dark" | "light";
type MobileSheet = "none" | "controls" | "observation";
type WorkspaceMode = "explorer" | "analysis" | "presentation";

const THEME_STORAGE_KEY = "oceantwin-theme";
const ARGO_COMPASS_LOGO_SRC = `data:image/png;base64,${argoLogo0}${argoLogo1}${argoLogo2}${argoLogo3a}${argoLogo3b}${argoLogo4a}${argoLogo4b}`;

function initialTheme(): ThemeMode {
  // The Appearance Lab's explicit 16-preset selection is authoritative.
  // For new visitors the initial scheme matches Arctic Mist, not the
  // historical binary dark/light setting, avoiding a dark first paint.
  return getGlassTheme(initialGlassTheme()).scheme;
}

export default function App() {
  useOceanMotion();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sourceMode, setSourceMode] = useState<ExploreSourceMode>("glorys");
  const [operationalSnapshot, setOperationalSnapshot] = useState<IncoisOperationalSnapshot | null>(null);
  const [operationalError, setOperationalError] = useState("");
  const [chlorophyllSnapshot, setChlorophyllSnapshot] = useState<IncoisChlorophyllSnapshot | null>(null);
  const [chlorophyllError, setChlorophyllError] = useState("");
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profileDetail, setProfileDetail] = useState<ProfileDetail | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceResponse | null>(null);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("explorer");
  const [controlDockOpen, setControlDockOpen] = useState(true);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [page, setPage] = useState<PageId>(() => routeFromHash(window.location.hash));
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>("none");
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [profileCalloutOpen, setProfileCalloutOpen] = useState(false);
  const [sessionImportedProfiles, setSessionImportedProfiles] = useState<ImportedObservationProfile[]>(() =>
    groupImportedObservationProfiles(readImportedObservationRecords())
  );
  const [verifiedObservationProfiles, setVerifiedObservationProfiles] = useState<ImportedObservationProfile[]>([]);
  const [pilotManifest, setPilotManifest] = useState<PilotBlockManifest | null>(null);
  const importedProfiles = useMemo(() => {
    const profilesById = new Map<string, ImportedObservationProfile>();
    for (const profile of verifiedObservationProfiles) profilesById.set(profile.id, profile);
    for (const profile of sessionImportedProfiles) profilesById.set(profile.id, profile);
    return [...profilesById.values()];
  }, [verifiedObservationProfiles, sessionImportedProfiles]);
  const [selectedImportedProfileId, setSelectedImportedProfileId] = useState("");

  const [variable, setVariable] = useState<"thetao" | "so" | "currents" | "chlorophyll">("thetao");
  const [viewMode, setViewMode] = useState<ViewMode>("slice");
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>("globe");
  const [waterColumnOpacity, setWaterColumnOpacity] = useState(58);
  const [depthIndex, setDepthIndex] = useState(18);
  const [timeIndex, setTimeIndex] = useState(0);
  const [verticalExaggeration, setVerticalExaggeration] = useState(60);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [colorPalette, setColorPalette] = useState<ColorPalette>("thermal");
  // Chlorophyll forces a viridis ramp; remember the physical-field palette so it is restored afterwards.
  const physicalPaletteRef = useRef<ColorPalette>("thermal");
  const [colorScale, setColorScale] = useState<ColorScaleMode>("linear");
  const [colorMinimum, setColorMinimum] = useState(0);
  const [colorMaximum, setColorMaximum] = useState(1);
  const [isoSurfaceEnabled, setIsoSurfaceEnabled] = useState(false);
  const [isoValue, setIsoValue] = useState(0.5);

  const [field, setField] = useState<FieldResponse | null>(null);
  const [volume, setVolume] = useState<VolumeResponse | null>(null);
  const [currents, setCurrents] = useState<CurrentsResponse | null>(null);
  const [currentsVolume, setCurrentsVolume] = useState<CurrentsVolumeResponse | null>(null);
  const [scienceLoading, setScienceLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [startupError, setStartupError] = useState("");
  useStartupScreen(Boolean(catalog), Boolean(startupError));
  const [degradedWarnings, setDegradedWarnings] = useState<string[]>([]);
  const [mainBlockRevision, setMainBlockRevision] = useState(0);
  const [activeMainBlockId, setActiveMainBlockId] = useState(() => readActiveMainBlockId());

  useEffect(() => subscribeActiveMainBlock((id) => {
    setActiveMainBlockId(id);
    // 3DB-07 replaces the historical block-triggered full-page reload with an
    // in-session scientific source refresh. Reset only source-coupled state;
    // navigation, camera shell and the rest of the app session stay intact.
    setPlaying(false);
    setTimeIndex(0);
    setSourceMode("glorys");
    setVariable((current) => current === "chlorophyll" ? "thetao" : current);
    setSelectedProfileId("");
    setProfileDetail(null);
    setProfilePanelOpen(false);
    setProfileCalloutOpen(false);
    setMainBlockRevision((current) => current + 1);
  }), []);

  const inspectorOriginRef = useRef<HTMLElement | null>(null);
  const inspectorWasOpenRef = useRef(false);
  const rememberInspectorOrigin = () => {
    if (document.activeElement instanceof HTMLElement) {
      inspectorOriginRef.current = document.activeElement;
    }
  };
  const closeScientificInspectors = useCallback(() => {
    setEvidenceOpen(false);
    setProvenanceOpen(false);
    setProfilePanelOpen(false);
    setMobileSheet("none");
  }, []);
  // Keep legacy inspector drawers usable with keyboard, including mobile.
  useEffect(() => {
    if (page !== "explore") return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (provenanceOpen || evidenceOpen || profilePanelOpen || mobileSheet !== "none") {
        event.preventDefault();
        closeScientificInspectors();
      } else if (focusMode) {
        event.preventDefault();
        setFocusMode(false);
      } else if (workspaceMode === "presentation") {
        event.preventDefault();
        setWorkspaceMode("explorer");
        setControlDockOpen(true);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [page, provenanceOpen, evidenceOpen, profilePanelOpen, mobileSheet, focusMode, workspaceMode, closeScientificInspectors]);
  useEffect(() => {
    const anyOpen = provenanceOpen || evidenceOpen || profilePanelOpen || mobileSheet !== "none";
    if (inspectorWasOpenRef.current && !anyOpen && inspectorOriginRef.current?.isConnected) {
      window.requestAnimationFrame(() => inspectorOriginRef.current?.focus({ preventScroll:true }));
    }
    inspectorWasOpenRef.current = anyOpen;
  }, [provenanceOpen, evidenceOpen, profilePanelOpen, mobileSheet]);

  const operationalCatalog = useMemo(
    () => operationalSnapshot ? buildIncoisExploreCatalog(operationalSnapshot) : null,
    [operationalSnapshot]
  );
  const chlorophyllCatalog = useMemo(
    () => chlorophyllSnapshot ? buildIncoisChlorophyllCatalog(chlorophyllSnapshot) : null,
    [chlorophyllSnapshot]
  );
  const exploreCatalog =
    sourceMode === "incois" && operationalCatalog
      ? operationalCatalog
      : sourceMode === "chlorophyll" && chlorophyllCatalog
        ? chlorophyllCatalog
        : catalog;
  const linkedExpectation = {
    sourceId: exploreCatalog?.dataset.dataset_id ?? "",
    mainBlockId: activeMainBlockId, mainBlockRevision, variable, timeIndex,
    time: exploreCatalog?.coordinates.time[timeIndex] ?? "",
    depthIndex, depthM: exploreCatalog?.coordinates.depth[depthIndex] ?? 0
  };
  const linkedKey = linkedSelectionKey(linkedExpectation);
  const [geographicAcceptedKey, setGeographicAcceptedKey] = useState("");
  const [waterAcceptedKey, setWaterAcceptedKey] = useState("");
  const activeMainBlock = useMemo(
    () => resolveMainBlock(activeMainBlockId),
    [activeMainBlockId]
  );
  const activeBlockObservationEvidence = useMemo(
    () => deriveMainBlockObservationIntegration(activeMainBlock, {
      comparisonProfiles: profiles,
      verifiedProfiles: verifiedObservationProfiles
    }),
    [activeMainBlock, profiles, verifiedObservationProfiles]
  );
  const activeBlockProvenanceEvidence = useMemo(
    () => deriveMainBlockProvenanceEvidence(activeMainBlock, {
      manifest: pilotManifest,
      runtimeProvenance: provenance,
      observationIntegration: activeBlockObservationEvidence
    }),
    [activeMainBlock, pilotManifest, provenance, activeBlockObservationEvidence]
  );


  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains usable for the session even if persistence is blocked.
    }
  }, [theme]);

  useEffect(() => {
    if (!logoOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLogoOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [logoOpen]);

  useEffect(() => {
    const handleDockShortcut = (event: KeyboardEvent) => {
      if (page !== "explore") return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setControlDockOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleDockShortcut);
    return () => window.removeEventListener("keydown", handleDockShortcut);
  }, [page]);

  useEffect(() => {
    if (page === "explore") return;

    const handleDocumentWheel = (event: globalThis.WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.deltaY === 0) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      // Preserve native wheel behavior for nested panels/tables that can scroll
      // independently. Otherwise make the document viewport the explicit
      // scroll owner for the non-Explorer pages.
      let node: Element | null = target;
      while (node && node !== document.body && node !== document.documentElement) {
        const style = getComputedStyle(node);
        const canScrollY =
          /(auto|scroll)/.test(style.overflowY) &&
          node.scrollHeight > node.clientHeight + 1;
        if (canScrollY) return;
        node = node.parentElement;
      }

      const scroller = document.scrollingElement;
      if (!scroller || scroller.scrollHeight <= scroller.clientHeight + 1) return;
      event.preventDefault();
      scroller.scrollTop += event.deltaY;
    };

    window.addEventListener("wheel", handleDocumentWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleDocumentWheel);
  }, [page]);

  useEffect(() => {
    const syncRoute = () => {
      const next = routeFromHash(window.location.hash);
      setPage(next);
      if (next !== "explore") {
        setFocusMode(false);
        setMobileSheet("none");
        setProfilePanelOpen(false);
        setEvidenceOpen(false);
        setWorkspaceMode("explorer");
      }
    };
    window.addEventListener("hashchange", syncRoute);
    syncRoute();
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const navigate = useCallback((next: PageId) => {
    const target = `#/${next}`;
    if (window.location.hash === target) {
      setPage(next);
    } else {
      window.location.hash = target;
    }
    if (next !== "explore") {
      setFocusMode(false);
      setMobileSheet("none");
      setProfilePanelOpen(false);
      setEvidenceOpen(false);
      setWorkspaceMode("explorer");
    }
  }, []);

  useEffect(() => {
    const syncImportedProfiles = () => {
      const next = groupImportedObservationProfiles(readImportedObservationRecords());
      setSessionImportedProfiles(next);
    };
    window.addEventListener(IMPORTED_OBSERVATIONS_EVENT, syncImportedProfiles);
    window.addEventListener("storage", syncImportedProfiles);
    syncImportedProfiles();
    return () => {
      window.removeEventListener(IMPORTED_OBSERVATIONS_EVENT, syncImportedProfiles);
      window.removeEventListener("storage", syncImportedProfiles);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchIncoisOperational()
      .then((payload) => {
        if (cancelled) return;
        if (
          payload.integrity.synthetic_timestamps ||
          payload.integrity.source_values_modified ||
          payload.integrity.genuine_time_count < 2 ||
          payload.integrity.genuine_depth_count < 2
        ) {
          throw new Error("INCOIS operational snapshot failed multi-time scientific-integrity policy.");
        }
        setOperationalSnapshot(payload);
        setOperationalError("");
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setOperationalSnapshot(null);
        setOperationalError(reason.message);
        setDegradedWarnings((current) =>
          current.includes("INCOIS multi-time Explore source unavailable")
            ? current
            : [...current, "INCOIS multi-time Explore source unavailable"]
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchIncoisChlorophyll()
      .then((payload) => {
        if (cancelled) return;
        if (
          !payload.integrity.surface_only ||
          payload.integrity.synthetic_timestamps ||
          payload.integrity.synthetic_depths ||
          payload.integrity.source_values_modified ||
          payload.integrity.genuine_time_count < 2 ||
          payload.record_count < 1
        ) {
          throw new Error("INCOIS chlorophyll snapshot failed scientific-integrity policy.");
        }
        setChlorophyllSnapshot(payload);
        setChlorophyllError("");
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setChlorophyllSnapshot(null);
        setChlorophyllError(reason.message);
        setDegradedWarnings((current) =>
          current.includes("INCOIS chlorophyll Explore source unavailable")
            ? current
            : [...current, "INCOIS chlorophyll Explore source unavailable"]
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchVerifiedObservationPack()
      .then((payload) => {
        if (cancelled) return;
        if (
          payload.integrity.synthetic_measurements ||
          payload.integrity.synthetic_timestamps ||
          payload.integrity.provider_values_modified
        ) {
          throw new Error("Verified observation pack failed scientific-integrity policy.");
        }
        const records = sanitizeImportedObservationRecords(payload.records);
        const next = groupImportedObservationProfiles(records);
        const sensorTypes = new Set(next.map((profile) => profile.sensor_type));
        if (!["glider", "ctd", "bgc"].every((sensor) => sensorTypes.has(sensor as "glider" | "ctd" | "bgc"))) {
          throw new Error("Verified observation pack is missing Glider, CTD or BGC evidence.");
        }
        setVerifiedObservationProfiles(next);
      })
      .catch((reason: Error) => {
        if (cancelled) return;
        setVerifiedObservationProfiles([]);
        setDegradedWarnings((current) =>
          current.includes("Verified Glider/CTD/BGC evidence unavailable")
            ? current
            : [...current, "Verified Glider/CTD/BGC evidence unavailable"]
        );
        console.warn(reason);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedImportedProfileId((current) =>
      current && importedProfiles.some((profile) => profile.id === current) ? current : ""
    );
  }, [importedProfiles]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileSheet("none");
      setProfilePanelOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPilotMainBlockManifest()
      .then((payload) => {
        if (!cancelled) setPilotManifest(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setPilotManifest(null);
          setDegradedWarnings((current) =>
            current.includes("Main-block provenance manifest unavailable")
              ? current
              : [...current, "Main-block provenance manifest unavailable"]
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.provenance()
      .then((payload) => {
        if (!cancelled) setProvenance(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setProvenance(null);
          setDegradedWarnings((current) =>
            current.includes("Provenance metadata unavailable")
              ? current
              : [...current, "Provenance metadata unavailable"]
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mainBlockRevision]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([api.health(), api.catalog(), api.profiles()]).then(
      ([healthResult, catalogResult, profilesResult]) => {
        if (cancelled) return;

        if (catalogResult.status === "rejected") {
          const reason = catalogResult.reason as Error;
          setStartupError(reason?.message || "Scientific catalog unavailable.");
          setScienceLoading(false);
          return;
        }

        const catalogPayload = catalogResult.value;
        setCatalog(catalogPayload);
        const initialScalar = catalogPayload.variables.find((item) => item.id === "thetao")
          ?? catalogPayload.variables.find((item) => item.kind === "scalar");
        if (initialScalar) {
          setColorMinimum(initialScalar.minimum);
          setColorMaximum(initialScalar.maximum);
          setIsoValue((initialScalar.minimum + initialScalar.maximum) / 2);
        }
        const safeDepth = Math.min(18, catalogPayload.coordinates.depth.length - 1);
        setDepthIndex(Math.max(0, safeDepth));

        if (healthResult.status === "rejected") {
          setDegradedWarnings((current) => current.includes("Health check unavailable") ? current : [...current, "Health check unavailable"]);
        }

        if (profilesResult.status === "fulfilled") {
          const nextProfiles = profilesResult.value.profiles;
          setProfiles(nextProfiles);
          if (nextProfiles.length > 0) {
            const requestedProfileId = readScientificWorkspaceContext().selectedProfileId;
            const requestedProfileExists = requestedProfileId
              ? nextProfiles.some((profile) => profile.profile_id === requestedProfileId)
              : false;
            setSelectedProfileId(requestedProfileExists ? requestedProfileId! : nextProfiles[0].profile_id);
          } else {
            setSelectedProfileId("");
            setProfileDetail(null);
            setDegradedWarnings((current) => current.includes("No eligible Argo comparison profiles") ? current : [...current, "No eligible Argo comparison profiles"]);
          }
        } else {
          setProfiles([]);
          setDegradedWarnings((current) => current.includes("Argo comparison layer unavailable") ? current : [...current, "Argo comparison layer unavailable"]);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [mainBlockRevision]);

  useEffect(() => {
    if (!exploreCatalog) return;
    if (!exploreCatalog.capabilities.time_animation) {
      setPlaying(false);
      return;
    }
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTimeIndex((current) => (current + 1) % exploreCatalog.coordinates.time.length);
    }, 1300 / playbackSpeed);
    return () => window.clearInterval(timer);
  }, [exploreCatalog, playing, playbackSpeed]);

  useEffect(() => {
    if (!selectedProfileId) return;
    let cancelled = false;
    setProfileLoading(true);
    api
      .profile(selectedProfileId)
      .then((payload) => {
        if (!cancelled) setProfileDetail(payload);
      })
      .catch(() => {
        if (!cancelled) {
          setProfileDetail(null);
          setDegradedWarnings((current) =>
            current.includes("Selected Argo comparison unavailable")
              ? current
              : [...current, "Selected Argo comparison unavailable"]
          );
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProfileId]);

  useEffect(() => {
    if (!exploreCatalog) return;
    let cancelled = false;
    setScienceLoading(true);
    setError("");
    setField(null);
    setVolume(null);
    setCurrents(null);
    setCurrentsVolume(null);
    setGeographicAcceptedKey("");
    setWaterAcceptedKey("");
    const selection = linkedExpectation;
    const requestKey = linkedKey;

    if (sourceMode === "incois") {
      try {
        if (!operationalSnapshot) throw new Error("INCOIS operational snapshot is unavailable.");
        if (variable === "currents" || variable === "chlorophyll") {
          throw new Error("Selected variable is unavailable in the INCOIS physical snapshot.");
        }
        // Two independently mounted genuine views use the SAME native source/time.
        // The field remains depth-indexed; the water column retains source depth values.
        const geo = buildIncoisField(operationalSnapshot, variable, timeIndex, depthIndex);
        const deep = buildIncoisVolume(operationalSnapshot, variable, timeIndex);
        if (matchesGeographicPayload(geo, selection)) {
          setField(geo); setGeographicAcceptedKey(requestKey);
        } else setError("INCOIS geographic native source/time/depth mismatch; field withheld.");
        if (matchesWaterColumnPayload(deep, selection)) {
          setVolume(deep); setWaterAcceptedKey(requestKey);
        } else setError("INCOIS water-column native source/time mismatch; volume withheld.");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        setScienceLoading(false);
      }
      return;
    }

    if (sourceMode === "chlorophyll") {
      try {
        if (!chlorophyllSnapshot) throw new Error("INCOIS chlorophyll snapshot is unavailable.");
        if (variable !== "chlorophyll") {
          throw new Error("Only chlorophyll is available in the selected ocean-colour source.");
        }
        const geo = buildIncoisChlorophyllField(chlorophyllSnapshot, timeIndex);
        if (matchesGeographicPayload(geo, selection)) {
          setField(geo); setGeographicAcceptedKey(requestKey);
        } else setError("INCOIS chlorophyll native source/time mismatch; surface field withheld.");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        setScienceLoading(false);
      }
      return;
    }

    if (variable === "chlorophyll") {
      setError("Chlorophyll is available only from the INCOIS ocean-colour source.");
      setScienceLoading(false);
      return;
    }

    // Retain both original source-backed APIs, request them concurrently, never
    // turn a depth slice into a synthetic volume or fabricate missing data.
    const requests = variable === "currents"
      ? [
          api.currents(timeIndex, depthIndex).then(payload => {
            if (!cancelled && matchesGeographicPayload(payload, selection)) { setCurrents(payload); setGeographicAcceptedKey(requestKey); }
          }),
          api.currentsVolume(timeIndex).then(payload => {
            if (!cancelled && matchesWaterColumnPayload(payload, selection)) { setCurrentsVolume(payload); setWaterAcceptedKey(requestKey); }
          })
        ]
      : [
          api.field(variable, timeIndex, depthIndex).then(payload => {
            if (!cancelled && matchesGeographicPayload(payload, selection)) { setField(payload); setGeographicAcceptedKey(requestKey); }
          }),
          api.volume(variable, timeIndex).then(payload => {
            if (!cancelled && matchesWaterColumnPayload(payload, selection)) { setVolume(payload); setWaterAcceptedKey(requestKey); }
          })
        ];

    Promise.allSettled(requests).then(outcomes => {
      if (cancelled) return;
      const failures = outcomes.filter(outcome => outcome.status === "rejected");
      if (failures.length) {
        const reason = (failures[0] as PromiseRejectedResult).reason;
        setError(reason instanceof Error ? reason.message : String(reason));
      }
      setScienceLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [exploreCatalog, sourceMode, operationalSnapshot, chlorophyllSnapshot, variable, depthIndex, timeIndex, activeMainBlockId, mainBlockRevision]);

  const handleProfileSelection = useCallback((profileId: string) => {
    setSelectedImportedProfileId("");
    setSelectedProfileId(profileId);
    setProfileCalloutOpen(true);
    setProfilePanelOpen(true);
    setEvidenceOpen(false);
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileSheet("observation");
    }
  }, []);

  const handleProfilePinSelection = useCallback((profileId: string) => {
    setSelectedImportedProfileId("");
    setSelectedProfileId(profileId);
    setProfileCalloutOpen(true);
    setProfilePanelOpen(false);
    setEvidenceOpen(false);
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileSheet("none");
    }
  }, []);

  const handleImportedProfileSelection = useCallback((profileId: string) => {
    setSelectedImportedProfileId(profileId);
    setProfilePanelOpen(true);
    setEvidenceOpen(false);
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileSheet("observation");
    }
  }, []);

  const handleVariableChange = useCallback(
    (value: "thetao" | "so" | "currents" | "chlorophyll") => {
      setVariable(value);
      const nextVariable = exploreCatalog?.variables.find((item) => item.id === value);
      if (nextVariable && nextVariable.kind === "scalar") {
        setColorMinimum(nextVariable.minimum);
        setColorMaximum(nextVariable.maximum);
        setIsoValue((nextVariable.minimum + nextVariable.maximum) / 2);
        setColorScale("linear");
      }
      if (value === "currents") {
        setViewMode("slice");
        setIsoSurfaceEnabled(false);
        if (nextVariable) {
          setColorMinimum(nextVariable.minimum);
          setColorMaximum(nextVariable.maximum);
          setColorScale("linear");
        }
      }
      if (value === "chlorophyll") {
        setViewMode("slice");
        setVisualizationMode("globe");
        setDepthIndex(0);
        setIsoSurfaceEnabled(false);
        if (variable !== "chlorophyll") physicalPaletteRef.current = colorPalette;
        setColorPalette("viridis");
        setColorScale("linear");
      } else if (variable === "chlorophyll") {
        setColorPalette(physicalPaletteRef.current);
      }
    },
    [exploreCatalog, variable, colorPalette]
  );

  const handleSourceModeChange = useCallback((
    nextSource: ExploreSourceMode,
    preferredVariable?: "thetao" | "so" | "currents"
  ) => {
    if (nextSource === "incois" && !operationalCatalog) return;
    if (nextSource === "chlorophyll" && !chlorophyllCatalog) return;

    const nextCatalog =
      nextSource === "incois"
        ? operationalCatalog
        : nextSource === "chlorophyll"
          ? chlorophyllCatalog
          : catalog;
    let targetVariable: "thetao" | "so" | "currents" | "chlorophyll" = preferredVariable ?? variable;
    if (nextSource === "chlorophyll") targetVariable = "chlorophyll";
    else if (targetVariable === "chlorophyll" || (nextSource === "incois" && targetVariable === "currents")) {
      targetVariable = "thetao";
    }

    setSourceMode(nextSource);
    setVariable(targetVariable);
    setPlaying(false);
    setTimeIndex(0);
    setProfilePanelOpen(false);
    setProfileCalloutOpen(false);
    setSelectedProfileId((current) => current);

    if (nextSource === "chlorophyll") {
      setViewMode("slice");
      setVisualizationMode("globe");
      setDepthIndex(0);
      setIsoSurfaceEnabled(false);
      if (variable !== "chlorophyll") physicalPaletteRef.current = colorPalette;
      setColorPalette("viridis");
    } else {
      if (variable === "chlorophyll") setColorPalette(physicalPaletteRef.current);
      const nextDepth = nextSource === "incois"
        ? 0
        : Math.min(18, Math.max(0, (nextCatalog?.coordinates.depth.length ?? 1) - 1));
      setDepthIndex(nextDepth);
    }

    const nextVariable = nextCatalog?.variables.find((item) => item.id === targetVariable);
    if (nextVariable) {
      // Scalars and current speed both carry a verified range for the colour mapping.
      setColorMinimum(nextVariable.minimum);
      setColorMaximum(nextVariable.maximum);
      if (nextVariable.kind === "scalar") setIsoValue((nextVariable.minimum + nextVariable.maximum) / 2);
      setColorScale("linear");
    }
    if (targetVariable === "currents") {
      setViewMode("slice");
      setIsoSurfaceEnabled(false);
    }
  }, [operationalCatalog, chlorophyllCatalog, catalog, variable, colorPalette]);

  const handleViewNavigation = useCallback((target: VisualizationMode) => {
    if (target === "water-column" &&
      (sourceMode === "chlorophyll" || (sourceMode === "incois" && variable === "currents"))) return;
    setVisualizationMode(target);
    window.requestAnimationFrame(() => {
      const id = target === "globe" ? "mpr-3d-stage" : "mpr-water-column-section";
      const element = document.getElementById(id);
      if (!element) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    });
  }, [sourceMode, variable]);

  const handleEnterWaterColumn = useCallback(() => {
    handleViewNavigation("water-column");
  }, [handleViewNavigation]);

  const handleWorkspaceModeChange = useCallback((nextMode: WorkspaceMode) => {
    setWorkspaceMode(nextMode);
    setFocusMode(false);
    setEvidenceOpen(false);
    setProfilePanelOpen(false);
    setMobileSheet("none");

    if (nextMode === "explorer") {
      setControlDockOpen(true);
    } else {
      setControlDockOpen(false);
    }

    if (nextMode === "presentation") {
      setGuideOpen(false);
      setVisualizationMode("globe");
    }
  }, []);

  const handleAnalysisDepthSync = useCallback((observationDepthM: number) => {
    if (!exploreCatalog || exploreCatalog.capabilities.surface_only === true) return;
    const depths = exploreCatalog.coordinates.depth;
    if (depths.length === 0) return;

    let nearestIndex = 0;
    let nearestDistance = Math.abs(depths[0] - observationDepthM);
    for (let index = 1; index < depths.length; index += 1) {
      const distance = Math.abs(depths[index] - observationDepthM);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    }

    setPlaying(false);
    setVisualizationMode("globe");
    setViewMode("slice");
    setDepthIndex(nearestIndex);
  }, [exploreCatalog]);

  const selectedVariable = useMemo(
    () => exploreCatalog?.variables.find((item) => item.id === variable),
    [exploreCatalog, variable]
  );
  const colorbarValues = useMemo(() => {
    if (variable === "currents") {
      if (visualizationMode === "water-column" && currentsVolume) {
        return currentsVolume.vectors.map((vector) => vector[5]).filter(Number.isFinite);
      }
      return currents?.vectors.map((vector) => vector[4]).filter(Number.isFinite) ?? [];
    }
    if ((visualizationMode === "water-column" || viewMode === "volume") && volume) {
      return volume.points.map((point) => point[3]).filter(Number.isFinite);
    }
    if (field) {
      return field.values.flatMap((row) =>
        row.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      );
    }
    return [];
  }, [variable, visualizationMode, viewMode, field, volume, currents, currentsVolume]);
  const timelineObservations = useMemo(
    () => profiles.map((profile) => ({
      timestamp: profile.observation_time_utc,
      label: `Argo ${profile.platform_id} · cycle ${profile.cycle} ${profile.direction}`
    })),
    [profiles]
  );
  const selectedProfile = useMemo(
    () => profiles.find((item) => item.profile_id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );
  const selectedImportedProfile = useMemo(
    () => importedProfiles.find((item) => item.id === selectedImportedProfileId) ?? null,
    [importedProfiles, selectedImportedProfileId]
  );
  const currentPage = PAGE_ITEMS.find((item) => item.id === page) ?? PAGE_ITEMS[0];

  // MPR-12: update the navigator from ACTUAL scroll visibility, without
  // reissuing scientific requests or triggering scroll from a scroll observer.
  useEffect(() => {
    if (page !== "explore") return;
    const root = document.querySelector<HTMLElement>('.ocean-workbench[data-page="explore"]');
    if (!root) return;
    let pending = 0;
    const reflectVisibleSection = () => {
      pending = 0;
      const geo = document.getElementById("mpr-3d-stage");
      const water = document.getElementById("mpr-water-column-section");
      if (!geo || !water) return;
      const rootBox = root.getBoundingClientRect();
      const center = rootBox.top + rootBox.height * 0.48;
      const isVisible = (rect: DOMRect) =>
        rect.bottom > rootBox.top && rect.top < rootBox.bottom;
      const g = geo.getBoundingClientRect();
      const w = water.getBoundingClientRect();
      if (!isVisible(g) && !isVisible(w)) return;
      const distance = (rect: DOMRect) => Math.abs((rect.top + rect.bottom) / 2 - center);
      const next: VisualizationMode = isVisible(w) &&
        (!isVisible(g) || distance(w) < distance(g)) ? "water-column" : "globe";
      setVisualizationMode(current => current === next ? current : next);
    };
    const onScroll = () => {
      if (!pending) pending = window.requestAnimationFrame(reflectVisibleSection);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (pending) window.cancelAnimationFrame(pending);
    };
  }, [page]);


  if (!catalog) {
    return (
      <div className="boot-screen" data-theme={theme}>
        <img className="boot-brand-logo" src={ARGO_COMPASS_LOGO_SRC} alt="The Optimizers Argo Compass logo" />
        <h1>Ocean Canvas</h1>
        {startupError ? (
          <div className="boot-error-card">
            <strong>Scientific API unavailable</strong>
            <p>{startupError}</p>
            <p>Local fail-safe: launch START_OCEANTWIN.cmd. The Streamlit scientific reference remains the emergency fallback.</p>
            <button onClick={() => window.location.reload()}>Retry connection</button>
          </div>
        ) : (
          <p>Connecting to verified scientific evidence…</p>
        )}
      </div>
    );
  }

  const activeExploreCatalog = exploreCatalog ?? catalog;
  const activeComparisonProfiles = sourceMode === "glorys" ? profiles : [];
  const activeSelectedProfile = sourceMode === "glorys" ? selectedProfile : null;
  const plannedBlock = sourceMode === "glorys" && activeMainBlock.materialization === "planned";
  const acceptedGeographic = !plannedBlock && !scienceLoading &&
    geographicAcceptedKey === linkedKey &&
    matchesGeographicPayload(variable === "currents" ? currents : field, linkedExpectation);
  const waterEligible = sourceMode !== "chlorophyll" && (sourceMode === "glorys" || variable !== "currents");
  const acceptedWater = !plannedBlock && waterEligible && !scienceLoading &&
    waterAcceptedKey === linkedKey &&
    matchesWaterColumnPayload(variable === "currents" ? currentsVolume : volume, linkedExpectation);
  const linkedStatus = (ready: boolean, eligible = true) =>
    plannedBlock ? "planned" : !eligible ? "unavailable" :
    ready ? "verified" : scienceLoading ? "loading" :
    error ? "unavailable" : "mismatch";
  const geographicReady = acceptedGeographic && (viewMode !== "volume" || variable === "currents" || acceptedWater);
  const geographicStatus = linkedStatus(geographicReady);
  const waterStatus = linkedStatus(acceptedWater, waterEligible);


  return (
    <div
      className={`app-shell ocean-workbench ${focusMode ? "focus-mode" : ""}`}
      data-theme={theme}
      data-page={page}
      data-explore-source={sourceMode}
      data-workspace-mode={workspaceMode}
      data-control-dock={controlDockOpen ? "open" : "closed"}
      data-evidence-inspector={evidenceOpen ? "open" : "closed"}
    >
      <header className="app-header">
        <div className="brand">
          <button
            className="brand-logo-button"
            type="button"
            aria-label="Open The Optimizers Argo Compass logo"
            title="View team logo"
            onClick={() => setLogoOpen(true)}
          >
            <img src={ARGO_COMPASS_LOGO_SRC} alt="" aria-hidden="true" />
          </button>
          <div className="brand-copy">
            <h1>Ocean <span>Canvas</span></h1>
            <p>Explainable water-column explorer · SIH26067</p>
          </div>
        </div>
        <div className="header-status">
          <RefreshControl />
          <ImmersiveFullscreenButton />
          <button className="present-button" type="button" aria-expanded={guideOpen} onClick={() => setGuideOpen((open) => !open)}>Present demo</button>
          {page === "explore" && (
            <div className="workspace-mode-switcher" role="group" aria-label="Explorer workspace mode">
              <button
                type="button"
                className={workspaceMode === "explorer" ? "active" : ""}
                aria-pressed={workspaceMode === "explorer"}
                aria-label="Explorer workspace"
                onClick={() => handleWorkspaceModeChange("explorer")}
              >
                Explorer
              </button>
              <button
                type="button"
                className={workspaceMode === "analysis" ? "active" : ""}
                aria-pressed={workspaceMode === "analysis"}
                aria-label="Analysis Split workspace"
                onClick={() => handleWorkspaceModeChange("analysis")}
              >
                Analysis Split
              </button>
              <button
                type="button"
                className={workspaceMode === "presentation" ? "active" : ""}
                aria-pressed={workspaceMode === "presentation"}
                aria-label="Presentation workspace"
                onClick={() => handleWorkspaceModeChange("presentation")}
              >
                Presentation
              </button>
            </div>
          )}
          <div>
            <span>{page === "explore" ? "ACTIVE FIELD" : "PAGE"}</span>
            <strong>{page === "explore" ? (selectedVariable?.label ?? variable) : currentPage.label}</strong>
          </div>
          <div>
            <span>MODEL</span>
            <strong>{
              page === "explore" && sourceMode === "incois"
                ? "INCOIS MULTI-TIME"
                : page === "explore" && sourceMode === "chlorophyll"
                  ? "INCOIS OCM"
                  : "GLORYS12V1"
            }</strong>
          </div>
          {page === "explore" && !focusMode && (
            <div className="header-workspace-actions" role="toolbar" aria-label="Explorer workspace actions">
              <button
                type="button"
                className="header-action-button"
                aria-label={controlDockOpen ? "Hide explorer controls" : "Show explorer controls"}
                aria-expanded={controlDockOpen}
                title="Toggle Explorer controls · Ctrl+B"
                onClick={() => setControlDockOpen((open) => !open)}
              >
                {controlDockOpen ? "Hide controls" : "Controls"}
              </button>
            </div>
          )}
          {focusMode && (
            <button className="evidence-button focus-exit-header" onClick={() => setFocusMode(false)}>
              Show panels
            </button>
          )}
          <span
            className={`system-pill ${degradedWarnings.length > 0 ? "degraded" : ""}`}
            role="status"
            title={degradedWarnings.length > 0 ? `Degraded: ${degradedWarnings.join(" · ")}` : "All bundled evidence sources loaded"}
          >
            {degradedWarnings.length > 0 ? "▲ DEGRADED MODE" : "● VERIFIED SNAPSHOT"}
          </span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={theme === "light"}
            title={theme === "dark" ? "Use light appearance" : "Use dark appearance"}
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            <span aria-hidden="true" className="theme-toggle-dot" />
            {theme === "dark" ? "LIGHT" : "DARK"}
          </button>
        </div>
      </header>

      {logoOpen && (
        <div
          className="brand-logo-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setLogoOpen(false);
          }}
        >
          <section
            className="brand-logo-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="The Optimizers Argo Compass logo"
          >
            <button
              className="brand-logo-close"
              type="button"
              aria-label="Close team logo"
              onClick={() => setLogoOpen(false)}
            >
              ×
            </button>
            <img src={ARGO_COMPASS_LOGO_SRC} alt="The Optimizers Argo Compass logo" />
          </section>
        </div>
      )}

      <div className="workspace-frame">
        <AppNavigation
          page={page}
          focusMode={focusMode}
          onNavigate={navigate}
        />

        <div className="workspace">
          {guideOpen && <PresentationGuide onClose={() => setGuideOpen(false)} onStep={(step) => {
            setFocusMode(false);
            setWorkspaceMode("explorer");
            setProfilePanelOpen(false);
            setMobileSheet("none");

            if (step === 0) {
              navigate("explore");
              handleSourceModeChange("glorys", "thetao");
              setVisualizationMode("globe");
            } else if (step === 1) {
              navigate("explore");
              handleSourceModeChange("glorys", "thetao");
              setVisualizationMode("water-column");
            } else if (step === 2) {
              navigate("explore");
              if (operationalCatalog) {
                handleSourceModeChange("incois", "thetao");
              } else {
                handleSourceModeChange("glorys", "thetao");
              }
              setVisualizationMode("globe");
            } else if (step === 3) {
              navigate("explore");
              handleSourceModeChange("glorys", "thetao");
              setVisualizationMode("globe");
              const inSituProfile = importedProfiles[0];
              if (inSituProfile) {
                setSelectedImportedProfileId(inSituProfile.id);
                setProfilePanelOpen(true);
              }
            } else if (step === 4) {
              navigate("compare");
            } else {
              navigate("about");
              setProvenanceOpen(true);
            }
          }} />}
          {page === "explore" ? (
            <div className="station-workspace" data-inspector={evidenceOpen || profilePanelOpen || workspaceMode === "analysis" ? "open" : "closed"}>
              <div className="explorer-landing-islands" data-testid="explorer-landing-islands" aria-label="Explorer feature and ocean source islands">
                <ExplorerWorkspaceModeIsland
                  workspaceMode={workspaceMode}
                  focusMode={focusMode}
                  onWorkspaceModeChange={handleWorkspaceModeChange}
                  onFocus3D={() => setFocusMode(true)}
                />
                <ExplorerDirectoryNav />
                <SourceWorkbench source={sourceMode} operationalAvailable={Boolean(operationalCatalog) && !operationalError}
                  chlorophyllAvailable={Boolean(chlorophyllCatalog) && !chlorophyllError} onSource={handleSourceModeChange}
                  onOverview={() => { setProfilePanelOpen(false); setWorkspaceMode("explorer"); setEvidenceOpen(true); }}
                  onCompare={() => navigate("compare")} onData={() => navigate("data-lab")}
                   onSources={() => setProvenanceOpen(true)}
                   evidenceLoading={scienceLoading} evidenceError={Boolean(error)}
                   evidenceDegraded={degradedWarnings.length > 0} />
              </div>
              {workspaceMode === "presentation" && (
                <button
                  type="button"
                  className="presentation-mode-exit"
                  aria-label="Exit presentation workspace"
                  onClick={() => handleWorkspaceModeChange("explorer")}
                >
                  Exit presentation
                </button>
              )}

              <EvidenceRail
                catalog={activeExploreCatalog}
                variable={selectedVariable}
                depth={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0}
                time={activeExploreCatalog.coordinates.time[timeIndex] ?? "Unavailable"}
                profile={activeSelectedProfile}
                loading={scienceLoading}
                error={error}
                open={evidenceOpen}
                onClose={() => setEvidenceOpen(false)}
                onInspect={() => activeSelectedProfile && handleProfileSelection(activeSelectedProfile.profile_id)}
                onCompare={() => navigate("compare")}
                onSources={() => setProvenanceOpen(true)}
              />
              {mobileSheet !== "none" && (
                <button
                  type="button"
                  className="mobile-sheet-backdrop"
                  aria-label="Close mobile panel"
                  onClick={() => {
                    if (mobileSheet === "observation") setProfilePanelOpen(false);
                    setMobileSheet("none");
                  }}
                />
              )}

              <ControlPanel
                catalog={activeExploreCatalog}
                profiles={activeComparisonProfiles}
                sourceMode={sourceMode}
                variable={variable}
                viewMode={viewMode}
                visualizationMode={visualizationMode}
                waterColumnOpacity={waterColumnOpacity}
                depthIndex={depthIndex}
                timeIndex={timeIndex}
                verticalExaggeration={verticalExaggeration}
                selectedProfileId={selectedProfileId}
                playing={playing}
                playbackSpeed={playbackSpeed}
                timelineObservations={timelineObservations}
                isoSurfaceEnabled={isoSurfaceEnabled}
                isoValue={isoValue}
                mobileOpen={mobileSheet === "controls"}
                onMobileClose={() => setMobileSheet("none")}
                onVariableChange={handleVariableChange}
                onViewModeChange={setViewMode}
                onWaterColumnOpacityChange={setWaterColumnOpacity}
                onDepthChange={setDepthIndex}
                onTimeChange={setTimeIndex}
                onVerticalExaggerationChange={setVerticalExaggeration}
                onProfileChange={handleProfileSelection}
                onPlayingChange={setPlaying}
                onPlaybackSpeedChange={setPlaybackSpeed}
                onIsoSurfaceEnabledChange={setIsoSurfaceEnabled}
                onIsoValueChange={setIsoValue}
              />

              <header className="mpr-geographic-heading" data-testid="mpr-10-geographic-heading">
                <span>GEOGRAPHIC 3D · SCIENTIFIC OCEAN VIEW</span>
                <div className="mpr-geographic-heading-main">
                  <h2>Explore the ocean in three dimensions</h2>
                  <p>{selectedVariable?.label ?? variable} · {activeExploreCatalog.dataset.region} · native scientific field</p>
                </div>
                <small>{sourceMode === "chlorophyll"
                  ? "Satellite surface only · no artificial subsurface field"
                  : scienceLoading
                    ? "Updating the selected genuine scientific field"
                    : "Interactive Cesium globe · connected to active source and block"}</small>
              </header>

              <VisualizationDock
                mode={visualizationMode}
                waterColumnAvailable={sourceMode !== "chlorophyll" && (sourceMode === "glorys" || variable !== "currents")}
                surfaceOnly={activeExploreCatalog.capabilities.surface_only === true}
                variableLabel={selectedVariable?.label ?? variable}
                depthM={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0}
                timeLabel={activeExploreCatalog.coordinates.time[timeIndex] ?? "Unavailable"}
                regionLabel={activeExploreCatalog.dataset.region}
                modelLabel={activeExploreCatalog.dataset.product}
                observationLabel={
                  selectedImportedProfile
                    ? `${selectedImportedProfile.sensor_type.toUpperCase()} · ${selectedImportedProfile.platform_id}`
                    : activeSelectedProfile
                      ? `${activeSelectedProfile.platform_id} · cycle ${activeSelectedProfile.cycle} ${activeSelectedProfile.direction}`
                      : activeComparisonProfiles.length === 0 && importedProfiles.length === 0
                        ? "Unavailable"
                        : "Not selected"
                }
                onChange={handleViewNavigation}
              />

              <div
                id="mpr-3d-stage"
                className="visualization-stage"
                data-visualization-mode={visualizationMode}
                data-linked-evidence={geographicStatus}
                data-linked-source={sourceMode}
                data-linked-block={activeMainBlockId}
                data-linked-time={linkedExpectation.time}
                data-linked-variable={variable}
                aria-label="Connected geographic and water-column visualization stage"
              >
                <div
                  className="visualization-layer globe-visualization-layer active"
                  aria-hidden={false}
                >
                  <OceanGlobe
                    field={geographicReady ? field : null}
                    volume={geographicReady && viewMode === "volume" ? volume : null}
                    currents={geographicReady ? currents : null}
                    profiles={activeComparisonProfiles}
                    selectedProfileId={sourceMode === "glorys" ? selectedProfileId : ""}
                    importedProfiles={importedProfiles}
                    verifiedObservationProfiles={verifiedObservationProfiles}
                    selectedImportedProfileId={selectedImportedProfileId}
                    verticalExaggeration={verticalExaggeration}
                    colorPalette={colorPalette}
                    colorScale={colorScale}
                    colorMinimum={colorMinimum}
                    colorMaximum={colorMaximum}
                    presentationActive={workspaceMode === "presentation"}
                    profileCalloutOpen={profileCalloutOpen}
                    onSelectProfile={handleProfilePinSelection}
                    onInspectProfile={handleProfileSelection}
                    onCloseProfileCallout={() => setProfileCalloutOpen(false)}
                    onSelectImportedProfile={handleImportedProfileSelection}
                    onEnterWaterColumn={handleEnterWaterColumn}
                    canEnterWaterColumn={sourceMode !== "chlorophyll" && (sourceMode === "glorys" || variable !== "currents")}
                  />
                </div>
                {geographicStatus !== "verified" && (
                  <div className="mpr-linked-evidence-status" role="status" data-testid="mpr-14-geographic-status">
                    <strong>{geographicStatus === "planned" ? "Planned block · field withheld" :
                      geographicStatus === "loading" ? "Loading source-backed geographic field…" :
                      "Geographic evidence unavailable or mismatched"}</strong>
                    <small>{error || "No stale or copied scientific values are rendered for this selection."}</small>
                  </div>
                )}
                <button type="button"
                  className="mpr-stage-view-switch"
                  aria-label={visualizationMode === "globe" ? "Switch to Water Column 3D" : "Switch to Geographic 3D"}
                  title={visualizationMode === "globe" ? "Switch to eligible Water Column 3D" : "Return to Geographic 3D"}
                  disabled={visualizationMode === "globe" && (sourceMode === "chlorophyll" || (sourceMode !== "glorys" && variable === "currents"))}
                  onClick={() => handleViewNavigation(visualizationMode === "globe" ? "water-column" : "globe")}>
                  {visualizationMode === "globe" ? "Water Column 3D ↗" : "Geographic 3D ↗"}
                </button>
              </div>

              <section id="mpr-water-column-section"
                className="mpr-water-column-section"
                data-testid="mpr-12-water-column-section"
                data-scientific-source={sourceMode}
                data-native-time={activeExploreCatalog.coordinates.time[timeIndex] ?? "Unavailable"}
                data-native-depth={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0}
                data-eligible={waterEligible ? "true" : "false"}
                data-linked-evidence={waterStatus}
                data-linked-block={activeMainBlockId}
                data-linked-variable={variable}
                aria-label="Independent source-backed Water Column 3D section">
                <header className="mpr-water-column-heading">
                  <span>WATER COLUMN 3D · NATIVE MODEL GEOMETRY</span>
                  <h2>Explore the ocean below the surface</h2>
                  <p>{selectedVariable?.label ?? variable} · {activeExploreCatalog.dataset.region} · {activeExploreCatalog.coordinates.time[timeIndex] ?? "Native time unavailable"}</p>
                </header>
                <div className="mpr-water-column-visualization"
                  data-renderer-mounted="true">
                  <div className="visualization-layer water-column-visualization-layer active"
                    aria-hidden={false}>
                    {waterStatus === "verified" ? (
                      <WaterColumn3D
                        volume={variable === "currents" ? null : acceptedWater ? volume : null}
                        currentsVolume={variable === "currents" && acceptedWater ? currentsVolume : null}
                        selectedDepthM={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0}
                        verticalExaggeration={verticalExaggeration}
                        opacity={waterColumnOpacity / 100}
                        colorPalette={colorPalette}
                        colorScale={colorScale}
                        colorMinimum={colorMinimum}
                        colorMaximum={colorMaximum}
                        isoSurfaceEnabled={isoSurfaceEnabled}
                        isoValue={isoValue}
                        theme={theme}
                      />
                    ) : (
                      <div className="mpr-water-column-unavailable" role="status">
                        <strong>{waterStatus === "planned" ? "Planned block · water-column evidence withheld" :
                          waterStatus === "loading" ? "Loading native water-column evidence…" :
                          waterStatus === "mismatch" ? "Native source/time/volume mismatch · evidence withheld" :
                            "Water-column data unavailable for this scientific source"}</strong>
                        <p>{sourceMode === "chlorophyll"
                          ? "INCOIS satellite chlorophyll is surface-only; it has no measured or modelled subsurface depth axis."
                          : "The current INCOIS physical snapshot does not provide a verified full-depth currents volume."}</p>
                        <p>No copied, extrapolated or synthetic ocean values are displayed.</p>
                      </div>
                    )}
                  </div>
                </div>
                <WaterColumnControlDock
                  catalog={activeExploreCatalog}
                  variable={variable}
                  depthIndex={depthIndex}
                  timeIndex={timeIndex}
                  profiles={activeComparisonProfiles}
                  selectedProfileId={selectedProfileId}
                  opacity={waterColumnOpacity}
                  verticalExaggeration={verticalExaggeration}
                  isoSurfaceEnabled={isoSurfaceEnabled}
                  isoValue={isoValue}
                  palette={colorPalette}
                  scale={colorScale}
                  minimum={colorMinimum}
                  maximum={colorMaximum}
                  loading={scienceLoading || waterStatus === "mismatch"}
                  error={waterStatus === "mismatch" ? "Native volume metadata does not match this selection." : error}
                  onVariableChange={handleVariableChange}
                  onDepthChange={setDepthIndex}
                  onTimeChange={setTimeIndex}
                  onProfileChange={handleProfileSelection}
                  onOpacityChange={setWaterColumnOpacity}
                  onVerticalExaggerationChange={setVerticalExaggeration}
                  onIsoSurfaceEnabledChange={setIsoSurfaceEnabled}
                  onIsoValueChange={setIsoValue}
                  onPaletteChange={setColorPalette}
                  onScaleChange={setColorScale}
                  onMinimumChange={setColorMinimum}
                  onMaximumChange={setColorMaximum}
                  onSourceEvidence={() => setProvenanceOpen(true)}
                  onGeographicView={() => handleViewNavigation("globe")}
                />
              </section>

              <ExplorerInspectorAccess
                evidenceOpen={evidenceOpen}
                provenanceOpen={provenanceOpen}
                observationOpen={profilePanelOpen || mobileSheet === "observation"}
                profileAvailable={Boolean(selectedImportedProfile || activeSelectedProfile)}
                scientificError={error}
                onEvidence={() => {
                  rememberInspectorOrigin();
                  setProfilePanelOpen(false);
                  setMobileSheet("none");
                  setEvidenceOpen(true);
                  window.requestAnimationFrame(() => document.querySelector<HTMLElement>('.evidence-rail[data-open="true"]')?.scrollIntoView({ block:"start", behavior:"auto" }));
                }}
                onProvenance={() => {
                  rememberInspectorOrigin();
                  setProvenanceOpen(true);
                  window.requestAnimationFrame(() => document.querySelector<HTMLElement>(".provenance-drawer")?.scrollIntoView({ block:"start", behavior:"auto" }));
                }}
                onObservation={() => {
                  if (!selectedImportedProfile && !activeSelectedProfile) return;
                  rememberInspectorOrigin();
                  setEvidenceOpen(false);
                  setProfilePanelOpen(true);
                  if (window.matchMedia("(max-width:760px)").matches) setMobileSheet("observation");
                  window.requestAnimationFrame(() => document.querySelector<HTMLElement>('.profile-panel[data-context-open="true"]')?.scrollIntoView({ block:"nearest", behavior:"auto" }));
                }}
                onClose={closeScientificInspectors}
              />
              {selectedVariable && (
                <ScientificColorbarHud
                  label={selectedVariable.label}
                  units={selectedVariable.units}
                  palette={colorPalette}
                  scale={colorScale}
                  minimum={colorMinimum}
                  maximum={colorMaximum}
                  domainMinimum={selectedVariable.minimum}
                  domainMaximum={selectedVariable.maximum}
                  values={colorbarValues}
                  onPaletteChange={setColorPalette}
                  onScaleChange={setColorScale}
                  onMinimumChange={setColorMinimum}
                  onMaximumChange={setColorMaximum}
                />
              )}

              <AnalysisSplitPanel
                catalog={activeExploreCatalog}
                variable={selectedVariable}
                depthM={activeExploreCatalog.coordinates.depth[depthIndex] ?? 0}
                time={activeExploreCatalog.coordinates.time[timeIndex] ?? "Unavailable"}
                detail={sourceMode === "glorys" ? profileDetail : null}
                onDepthSync={handleAnalysisDepthSync}
              />

              {workspaceMode !== "analysis" && (selectedImportedProfile ? (
                <ImportedObservationPanel
                  profile={selectedImportedProfile}
                  open={profilePanelOpen || mobileSheet === "observation"}
                  mobileOpen={mobileSheet === "observation"}
                  onClose={() => {
                    setProfilePanelOpen(false);
                    setMobileSheet("none");
                  }}
                />
              ) : sourceMode === "glorys" ? (
                <ProfilePanel
                  detail={profileDetail}
                  loading={profileLoading}
                  provenance={provenance}
                  open={profilePanelOpen || mobileSheet === "observation"}
                  mobileOpen={mobileSheet === "observation"}
                  onClose={() => {
                    setProfilePanelOpen(false);
                    setMobileSheet("none");
                  }}
                />
              ) : null)}

              <div className="mobile-explore-tray" role="toolbar" aria-label="Explore quick controls">
                <button
                  type="button"
                  aria-pressed={mobileSheet === "controls"}
                  onClick={() => setMobileSheet("controls")}
                >
                  <span>Layer</span>
                  <strong>{selectedVariable?.label ?? variable}</strong>
                </button>
                <button
                  type="button"
                  aria-pressed={mobileSheet === "controls"}
                  onClick={() => setMobileSheet("controls")}
                >
                  <span>Time</span>
                  <strong>{activeExploreCatalog.coordinates.time[timeIndex]?.replace("T00:00:00Z", "") ?? "—"}</strong>
                </button>
                <button
                  type="button"
                  aria-pressed={mobileSheet === "controls"}
                  onClick={() => setMobileSheet("controls")}
                >
                  <span>Depth</span>
                  <strong>{(activeExploreCatalog.coordinates.depth[depthIndex] ?? 0).toFixed(0)} m</strong>
                </button>
                <button
                  type="button"
                  aria-pressed={mobileSheet === "observation"}
                  disabled={!activeSelectedProfile && !selectedImportedProfile}
                  onClick={() => {
                    setProfilePanelOpen(true);
                    setMobileSheet("observation");
                  }}
                >
                  <span>Observation</span>
                  <strong>{
                    selectedImportedProfile
                      ? selectedImportedProfile.platform_id
                      : activeSelectedProfile
                        ? activeSelectedProfile.platform_id
                        : "None"
                  }</strong>
                </button>
                <button type="button" onClick={() => navigate("compare")}>
                  <span>Compare</span>
                  <strong>Model ↔ Argo</strong>
                </button>
              </div>
            </div>
          ) : page === "telemetry" ? (
            <TelemetryPage catalog={catalog} provenance={provenance} argoProfiles={profiles} importedProfiles={importedProfiles} />
          ) : page === "compare" ? (
            <ComparisonPage
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              detail={profileDetail}
              loading={profileLoading}
              provenance={provenance}
              onProfileChange={setSelectedProfileId}
            />
          ) : page === "anomaly" ? (
            <AnomalyPage catalog={catalog} />
          ) : page === "data-lab" ? (
            <DataLabPage />
          ) : (
            <InfoPage catalog={catalog} provenance={provenance} blockEvidence={activeBlockProvenanceEvidence} degradedWarnings={degradedWarnings} />
          )}

          <ProvenanceDrawer
            open={provenanceOpen}
            provenance={provenance}
            blockEvidence={activeBlockProvenanceEvidence}
            onClose={() => setProvenanceOpen(false)}
          />
        </div>
      </div>

      {page === "explore" && (scienceLoading || error) && (
        <div
          className={`toast ${error ? "error" : ""}`}
          role={error ? "alert" : "status"}
          aria-live={error ? "assertive" : "polite"}
        >
          {error ? error : "Loading selected verified ocean field…"}
        </div>
      )}

      <footer className="science-footer">
        <span>
          Reanalysis · Cached verified · No runtime scientific-data download
          {degradedWarnings.length > 0 ? ` · Degraded: ${degradedWarnings.join(" · ")}` : ""}
        </span>
        <span>{catalog.scientific_disclaimer}</span>
      </footer>
    </div>
  );
}