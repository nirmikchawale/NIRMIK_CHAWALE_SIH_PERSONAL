import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArcGisMapServerImageryProvider,
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  ColorGeometryInstanceAttribute,
  EllipsoidTerrainProvider,
  GeometryInstance,
  GridImageryProvider,
  TileMapServiceImageryProvider,
  buildModuleUrl,
  HorizontalOrigin,
  LabelStyle,
  Material,
  Math as CesiumMath,
  PointPrimitiveCollection,
  PolylineCollection,
  PolylineDashMaterialProperty,
  Primitive,
  PerInstanceColorAppearance,
  Rectangle,
  RectangleGeometry,
  SceneTransforms,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  Viewer
} from "cesium";

import type {
  ColorPalette,
  ColorScaleMode,
  CurrentsResponse,
  FieldResponse,
  ImportedObservationProfile,
  ProfileSummary,
  VolumeResponse
} from "../types";
import { displayUnits } from "../units";
import { paletteCssGradient, paletteHsl } from "../palettes";
import {
  TARGET_DOMAIN,
  blockBoundsLabel
} from "../main-block-engine";
import {
  LAND_ONLY_BLOCK_COUNT,
  OCEAN_INTERSECTING_BLOCK_COUNT,
  OCEAN_INTERSECTING_MAIN_BLOCKS,
  oceanCoverageYellow
} from "../main-block-ocean-mask";
import { fetchPilotMainBlockManifest } from "../pilot-main-block-loader";
import { globePilotLodBudget, nativeDepthBalancedLodIndices } from "../main-block-lod";
import { deriveMainBlockObservationIntegration } from "../main-block-observations";
import {
  buildCesiumCurrentsRenderPlan,
  buildCesiumFieldRenderPlan,
  buildCesiumVolumeRenderPlan,
  canCesiumRenderMainBlock
} from "../main-block-cesium-renderer";
import {
  activeMainBlockRegion,
  PHASE35B_PILOT_IDS,
  findTargetBlockAt,
  publishActiveMainBlockId,
  readActiveMainBlockId,
  resolveMainBlock,
  subscribeActiveMainBlock
} from "../main-block-runtime";
import { CameraOrientationHud, type CameraPreset } from "./CameraOrientationHud";

interface Inspection {
  kind: "scalar" | "current";
  variable: string;
  longitude: number;
  latitude: number;
  depth_m: number;
  time: string;
  units: string;
  value?: number;
  u?: number;
  v?: number;
  speed?: number;
}

interface Props {
  field: FieldResponse | null;
  volume: VolumeResponse | null;
  currents: CurrentsResponse | null;
  profiles: ProfileSummary[];
  selectedProfileId: string;
  importedProfiles: ImportedObservationProfile[];
  verifiedObservationProfiles: ImportedObservationProfile[];
  selectedImportedProfileId: string;
  verticalExaggeration: number;
  colorPalette: ColorPalette;
  colorScale: ColorScaleMode;
  colorMinimum: number;
  colorMaximum: number;
  presentationActive: boolean;
  profileCalloutOpen: boolean;
  onSelectProfile: (profileId: string) => void;
  onInspectProfile: (profileId: string) => void;
  onCloseProfileCallout: () => void;
  onSelectImportedProfile: (profileId: string) => void;
  onEnterWaterColumn: () => void;
  canEnterWaterColumn: boolean;
}

function scalarColor(
  value: number,
  minimum: number,
  maximum: number,
  palette: ColorPalette,
  scale: ColorScaleMode
): Color {
  const safeMin = Number.isFinite(minimum) ? minimum : value;
  const safeMax = Number.isFinite(maximum) && maximum > safeMin ? maximum : safeMin + 1e-12;
  const useLog = scale === "log" && safeMin > 0 && safeMax > 0 && value > 0;
  const raw = useLog
    ? (Math.log(value) - Math.log(safeMin)) / Math.max(Math.log(safeMax) - Math.log(safeMin), 1e-12)
    : (value - safeMin) / Math.max(safeMax - safeMin, 1e-12);
  const t = Math.max(0, Math.min(1, raw));

  const [hue, saturation, lightness] = paletteHsl(t, palette);
  return Color.fromHsl(hue / 360, saturation / 100, lightness / 100, 1);
}

export function OceanGlobe({
  field,
  volume,
  currents,
  profiles,
  selectedProfileId,
  importedProfiles,
  verifiedObservationProfiles,
  selectedImportedProfileId,
  verticalExaggeration,
  colorPalette,
  colorScale,
  colorMinimum,
  colorMaximum,
  presentationActive,
  profileCalloutOpen,
  onSelectProfile,
  onInspectProfile,
  onCloseProfileCallout,
  onSelectImportedProfile,
  onEnterWaterColumn,
  canEnterWaterColumn
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calloutRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const enterWaterColumnRef = useRef(onEnterWaterColumn);
  const stopJourneyRef = useRef<() => void>(() => {});
  const journeyRef = useRef<(skip?: boolean) => void>(() => {});
  const entryAvailableRef = useRef(canEnterWaterColumn);
  useEffect(() => { entryAvailableRef.current = canEnterWaterColumn; }, [canEnterWaterColumn]);
  const dynamicPrimitivesRef = useRef<Array<PointPrimitiveCollection | PolylineCollection | Primitive>>([]);
  const profileIdsRef = useRef<string[]>([]);
  const clickHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const depthAnimationRef = useRef<number | null>(null);
  const zoomAnimationRef = useRef<number | null>(null);
  const imageryRequestRef = useRef(0);
  const sliceHeightRef = useRef(0);
  const [sensorsExpanded, setSensorsExpanded] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [rendererError, setRendererError] = useState("");
  const [renderScale, setRenderScale] = useState(1);
  const [antialiasing, setAntialiasing] = useState("initializing");
  const [cameraHeight, setCameraHeight] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("perspective");
  const [imageryPreference, setImageryPreference] = useState<"auto" | "offline">("auto");
  const [imageryStatus, setImageryStatus] = useState<"connecting" | "online" | "offline" | "grid">("connecting");
  const [introPhase, setIntroPhase] = useState<"idle" | "earth" | "india" | "flying" | "region">("idle");
  const [activeMainBlockId, setActiveMainBlockId] = useState(readActiveMainBlockId);
  const activeMainBlock = resolveMainBlock(activeMainBlockId);
  // Three discrete globe LOD tiers; camera motion within a tier does not
  // rebuild GPU geometry, and the verified baseline retains its historic cap.
  const pilotGlobeLodBudget = globePilotLodBudget(cameraHeight);
  const observationIntegration = useMemo(
    () => deriveMainBlockObservationIntegration(activeMainBlock, {
      comparisonProfiles: profiles,
      verifiedProfiles: verifiedObservationProfiles
    }),
    [activeMainBlockId, profiles, verifiedObservationProfiles]
  );

  useEffect(() => subscribeActiveMainBlock(setActiveMainBlockId), []);

  // Keep the original camera, selection, validation and Water Column callbacks
  // owned by OceanGlobe. Only the React DOM destination changes: real controls
  // live in the MPR Geographic dock, not in the Cesium image canvas.
  const [blockDockSlot, setBlockDockSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const workspace = document.querySelector<HTMLElement>(".station-workspace");
    if (!workspace) return;
    const syncSlot = () => {
      const slot = workspace.querySelector<HTMLElement>('[data-mpr-block-region-slot="true"]');
      setBlockDockSlot((current) => current === slot ? current : slot);
    };
    syncSlot();
    const observer = new MutationObserver(syncSlot);
    observer.observe(workspace, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const selectMainBlock = (id: string) => {
    const selectedId = publishActiveMainBlockId(id);
    setActiveMainBlockId(selectedId);
    setInspection(null);
  };

  useEffect(() => {
    enterWaterColumnRef.current = onEnterWaterColumn;
  }, [onEnterWaterColumn]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let introTimer: number | null = null;
    let viewer: Viewer;
    try {
      viewer = new Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayer: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        infoBox: false,
        fullscreenButton: false,
        skyBox: false,
        skyAtmosphere: false,
        terrainProvider: new EllipsoidTerrainProvider(),
        msaaSamples: 4,
        requestRenderMode: true,
        maximumRenderTimeChange: Number.POSITIVE_INFINITY
      });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setRendererError(message || "Cesium viewer initialization failed.");
      return;
    }

    const removeRenderErrorListener = viewer.scene.renderError.addEventListener((_scene, reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      setRendererError(message || "Cesium rendering stopped.");
    });

    const syncRenderQuality = () => {
      if (viewer.isDestroyed()) return;
      const deviceRatio = window.devicePixelRatio || 1;
      const nextScale = Math.min(2, Math.max(1.5, deviceRatio));
      viewer.resolutionScale = nextScale;
      setRenderScale(nextScale);

      if (viewer.scene.msaaSupported) {
        viewer.scene.msaaSamples = 4;
        setAntialiasing("4× MSAA");
      } else {
        viewer.scene.postProcessStages.fxaa.enabled = true;
        setAntialiasing("FXAA");
      }
      viewer.scene.requestRender();
    };

    syncRenderQuality();
    window.addEventListener("resize", syncRenderQuality);

    viewer.scene.backgroundColor = Color.fromCssColorString("#010913");
    viewer.scene.globe.baseColor = Color.fromCssColorString("#062438");
    viewer.scene.globe.depthTestAgainstTerrain = false;
    viewer.scene.globe.maximumScreenSpaceError = 0.8;
    viewer.scene.fog.enabled = false;
    viewer.scene.globe.translucency.enabled = true;
    // Open the translucent scientific window over the active canonical 3DB block footprint.
    // This changes only presentation; source longitude/latitude/depth remain untouched.
    const initialRenderBlock = resolveMainBlock(readActiveMainBlockId());
    viewer.scene.globe.translucency.frontFaceAlpha = 0.3;
    viewer.scene.globe.translucency.backFaceAlpha = 0.28;
    viewer.scene.globe.translucency.rectangle = Rectangle.fromDegrees(
      initialRenderBlock.west,
      initialRenderBlock.south,
      initialRenderBlock.east,
      initialRenderBlock.north
    );
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100_000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 18_000_000;
    viewer.scene.screenSpaceCameraController.inertiaZoom = 0.65;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    void reducedMotion;
    let journeyGeneration = 0;
    let pendingInitialJourneyTimer: number | null = null;
    const stopJourney = () => {
      journeyGeneration += 1;
      // The first flight is deliberately delayed until the verified launch
      // screen releases the page, so desktop viewers actually SEE Earth/India.
      if (pendingInitialJourneyTimer != null) {
        window.clearTimeout(pendingInitialJourneyTimer);
        pendingInitialJourneyTimer = null;
      }
      if (introTimer != null) window.clearTimeout(introTimer);
      introTimer = null;
      viewer.camera.cancelFlight();
      setCameraHeight(viewer.camera.positionCartographic.height);
      setIntroPhase("region");
    };
    stopJourneyRef.current = stopJourney;
    journeyRef.current = (skip = false) => {
      stopJourney();
      const generation = journeyGeneration;
      const current = () => !viewer.isDestroyed() && generation === journeyGeneration;
      const finish = () => {
        if (!current()) return;
        setIntroPhase("region");
        setCameraHeight(viewer.camera.positionCartographic.height);
      };
      // Respect the viewer's actual selected block when one is materialized or
      // planned; the immutable baseline remains an honest regional reference.
      const selected = resolveMainBlock(readActiveMainBlockId());
      const destination = selected.materialization === "verified-baseline"
        ? Rectangle.fromDegrees(TARGET_DOMAIN.west - 1.5, TARGET_DOMAIN.south - 2, TARGET_DOMAIN.east + 1.5, TARGET_DOMAIN.north + 2)
        : Rectangle.fromDegrees(selected.west - 1.5, selected.south - 1.5, selected.east + 1.5, selected.north + 1.5);
      if (skip) {
        viewer.camera.setView({ destination });
        finish();
        return;
      }

      setIntroPhase("earth");
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(76, 20, 16_000_000),
        orientation: { heading: 0, pitch: CesiumMath.toRadians(-90), roll: 0 }
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        introTimer = window.setTimeout(() => {
          if (!current()) return;
          setIntroPhase("india");
          viewer.camera.setView({ destination: Rectangle.fromDegrees(64, 6, 92, 35) });
          introTimer = window.setTimeout(() => {
            if (!current()) return;
            setIntroPhase("flying");
            viewer.camera.setView({ destination });
            introTimer = window.setTimeout(finish, 420);
          }, 520);
        }, 520);
        return;
      }

      introTimer = window.setTimeout(() => {
        if (!current()) return;
        setIntroPhase("india");
        viewer.camera.flyTo({
          destination: Rectangle.fromDegrees(64, 6, 92, 35), duration: 1.8,
          complete: () => {
            if (!current()) return;
            introTimer = window.setTimeout(() => {
              if (!current()) return;
              setIntroPhase("flying");
              viewer.camera.flyTo({ destination, duration: 2, complete: finish });
            }, 700);
          }
        });
      }, 900);
    };
    // Always orient the viewer from Earth → India → the integrated Indian Ocean block field on mount.
    // The 140 logical targets remain geographic truth; only the immutable baseline and genuine pilots
    // may cross the 3DB-04 fail-closed scientific Cesium render gate.
    // React may mount the globe before useStartupScreen releases #root.inert.
    // Do not spend the orientation flight hidden behind the loading screen.
    const beginVisibleJourney = (attempt = 0) => {
      if (viewer.isDestroyed()) return;
      const root = document.getElementById("root");
      if (root?.inert && attempt < 120) {
        pendingInitialJourneyTimer = window.setTimeout(() => beginVisibleJourney(attempt + 1), 75);
      } else {
        pendingInitialJourneyTimer = window.setTimeout(() => journeyRef.current(false), 180);
      }
    };
    beginVisibleJourney();
    // Keep judge-facing camera telemetry valid immediately, even while the
    // opening journey is still animating. This prevents transient 0-height
    // state from making zoom controls appear unresponsive in live checks.
    setCameraHeight(viewer.camera.positionCartographic.height);
    const removeCameraHeightListener = viewer.camera.moveEnd.addEventListener(() => {
      setCameraHeight(viewer.camera.positionCartographic.height);
    });

    viewer.entities.add({
      id: "main-block-domain-boundary",
      polyline: {
        positions: Cartesian3.fromDegreesArray([
          TARGET_DOMAIN.west, TARGET_DOMAIN.south,
          TARGET_DOMAIN.east, TARGET_DOMAIN.south,
          TARGET_DOMAIN.east, TARGET_DOMAIN.north,
          TARGET_DOMAIN.west, TARGET_DOMAIN.north,
          TARGET_DOMAIN.west, TARGET_DOMAIN.south
        ]),
        width: 2.2,
        material: Color.fromCssColorString("#d5a800").withAlpha(0.82)
      }
    });

    void fetchPilotMainBlockManifest()
      .then((manifest) => {
        if (viewer.isDestroyed()) return;
        const byId = new Map(manifest.blocks.map((entry) => [entry.id, entry]));
        for (const block of OCEAN_INTERSECTING_MAIN_BLOCKS) {
          const oceanFraction = byId.get(block.id)?.ocean_fraction ?? 0;
          const yellow = Color.fromCssColorString(oceanCoverageYellow(oceanFraction));
          viewer.entities.add({
            id: `main-block:${block.id}`,
            rectangle: {
              coordinates: Rectangle.fromDegrees(block.west, block.south, block.east, block.north),
              height: 1_250,
              material: yellow.withAlpha(0.12),
              outline: true,
              outlineColor: yellow.withAlpha(0.72)
            }
          });
        }
        viewer.scene.requestRender();
      })
      .catch(() => {
        // Scientific payload rendering remains available if block coverage
        // metadata cannot be loaded; do not reintroduce land-only geometry.
      });

    viewerRef.current = viewer;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    const interruptOpeningTransition = stopJourney;
    handler.setInputAction(interruptOpeningTransition, ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(interruptOpeningTransition, ScreenSpaceEventType.WHEEL);
    handler.setInputAction((movement: { position: Cartesian2 }) => {
      const picked = viewer.scene.pick(movement.position) as { id?: unknown } | undefined;
      const pickedId = picked?.id as { id?: string; kind?: string; inspection?: Inspection } | undefined;
      const entityId = pickedId?.id;
      if (typeof entityId === "string" && entityId.startsWith("argo:")) {
        setInspection(null);
        onSelectProfile(entityId.slice(5));
        return;
      }
      if (typeof entityId === "string" && entityId.startsWith("instrument:")) {
        setInspection(null);
        onSelectImportedProfile(entityId.slice("instrument:".length));
        return;
      }

      const surfacePoint = viewer.camera.pickEllipsoid(
        movement.position,
        viewer.scene.globe.ellipsoid
      );
      if (surfacePoint) {
        const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(surfacePoint);
        const longitude = CesiumMath.toDegrees(cartographic.longitude);
        const latitude = CesiumMath.toDegrees(cartographic.latitude);
        const targetBlock = findTargetBlockAt(longitude, latitude);
        if (targetBlock) {
          // Block clicks select geographic/scientific context only. 3DB-07
          // deliberately does not auto-open Water Column 3D.
          publishActiveMainBlockId(targetBlock.id);
          setActiveMainBlockId(targetBlock.id);
          setInspection(null);
          return;
        }
      }

      if (pickedId?.kind === "ocean-inspection" && pickedId.inspection) {
        setInspection(pickedId.inspection);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    clickHandlerRef.current = handler;

    return () => {
      stopJourney();
      journeyRef.current = () => {};
      stopJourneyRef.current = () => {};
      removeRenderErrorListener();
      removeCameraHeightListener();
      window.removeEventListener("resize", syncRenderQuality);
      if (zoomAnimationRef.current != null) {
        window.cancelAnimationFrame(zoomAnimationRef.current);
        zoomAnimationRef.current = null;
      }
      if (introTimer != null) {
        window.clearTimeout(introTimer);
        introTimer = null;
      }
      clickHandlerRef.current?.destroy();
      clickHandlerRef.current = null;
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onSelectProfile, onSelectImportedProfile]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.entities.removeById("active-main-block-highlight");
    const block = resolveMainBlock(activeMainBlockId);
    if (block.materialization === "verified-baseline") {
      // Keep the immutable baseline as scientific reference evidence only.
      // It must not occupy the block grid or obscure IO-073/074/087/088.
      viewer.scene.requestRender();
      return;
    }
    const sourceBackedPilot = block.materialization === "pilot";
    const centreLon = (block.west + block.east) / 2;
    const centreLat = (block.south + block.north) / 2;
    const outline = sourceBackedPilot
      ? Color.fromCssColorString("#8a6400")
      : Color.fromCssColorString("#b88700");
    const fill = sourceBackedPilot
      ? Color.fromCssColorString("#f2c94c").withAlpha(0.18)
      : Color.fromCssColorString("#ffe27a").withAlpha(0.12);
    const lifecycleLabel = sourceBackedPilot ? "SOURCE-BACKED PILOT" : "PLANNED";

    viewer.scene.globe.translucency.rectangle = Rectangle.fromDegrees(
      block.west,
      block.south,
      block.east,
      block.north
    );
    viewer.entities.add({
      id: "active-main-block-highlight",
      position: Cartesian3.fromDegrees(centreLon, centreLat, 28_000),
      rectangle: {
        coordinates: Rectangle.fromDegrees(block.west, block.south, block.east, block.north),
        height: 2_600,
        material: fill,
        outline: true,
        outlineColor: outline
      },
      label: {
        text: `${block.id} · ${lifecycleLabel}`,
        font: "700 12px system-ui",
        fillColor: Color.WHITE,
        outlineColor: Color.fromCssColorString("#04111d"),
        outlineWidth: 4,
        style: LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Color.fromCssColorString("#04111d").withAlpha(0.82),
        backgroundPadding: new Cartesian2(7, 4),
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    viewer.scene.requestRender();
  }, [activeMainBlockId]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!presentationActive || !viewer || viewer.isDestroyed()) return;

    setInspection(null);
    journeyRef.current();
  }, [presentationActive]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const requestId = ++imageryRequestRef.current;
    let removeOnlineErrorListener: (() => void) | null = null;

    const isCurrent = () =>
      !viewer.isDestroyed() && requestId === imageryRequestRef.current;

    const addGridFallback = () => {
      if (!isCurrent()) return;
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(
        new GridImageryProvider({
          color: Color.fromCssColorString("#2a6d89").withAlpha(0.52),
          glowColor: Color.fromCssColorString("#071a28").withAlpha(0.42),
          backgroundColor: Color.fromCssColorString("#082335")
        })
      );
      setImageryStatus("grid");
      viewer.scene.requestRender();
    };

    const addOfflineNaturalEarth = async () => {
      if (!isCurrent()) return;
      setImageryStatus("connecting");
      try {
        const provider = await TileMapServiceImageryProvider.fromUrl(
          buildModuleUrl("Assets/Textures/NaturalEarthII"),
          { maximumLevel: 2 }
        );
        if (!isCurrent()) return;
        viewer.imageryLayers.removeAll();
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.brightness = 1.10;
        layer.contrast = 1.22;
        layer.saturation = 1.02;
        setImageryStatus("offline");
        viewer.scene.requestRender();
      } catch {
        addGridFallback();
      }
    };

    const addOnlineWorldImagery = async () => {
      setImageryStatus("connecting");
      try {
        const provider = await ArcGisMapServerImageryProvider.fromUrl(
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
        );
        if (!isCurrent()) return;

        let tileErrorCount = 0;
        let failedOver = false;
        removeOnlineErrorListener = provider.errorEvent.addEventListener(() => {
          tileErrorCount += 1;
          if (tileErrorCount < 3 || failedOver || !isCurrent()) return;
          failedOver = true;
          void addOfflineNaturalEarth();
        });

        viewer.imageryLayers.removeAll();
        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.brightness = 1.03;
        layer.contrast = 1.12;
        layer.saturation = 1.04;
        layer.gamma = 0.96;
        setImageryStatus("online");
        viewer.scene.requestRender();
      } catch {
        await addOfflineNaturalEarth();
      }
    };

    if (imageryPreference === "offline") {
      void addOfflineNaturalEarth();
    } else {
      void addOnlineWorldImagery();
    }

    return () => {
      imageryRequestRef.current += 1;
      removeOnlineErrorListener?.();
    };
  }, [imageryPreference]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    for (const id of profileIdsRef.current) {
      viewer.entities.removeById(id);
    }
    viewer.entities.removeById("selected-model-cell");
    viewer.entities.removeById("selected-collocation-line");
    profileIdsRef.current = [];

    for (const profile of profiles) {
      const id = `argo:${profile.profile_id}`;
      profileIdsRef.current.push(id);
      const selected = profile.profile_id === selectedProfileId;
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(
          profile.observation_longitude,
          profile.observation_latitude,
          7_500
        ),
        point: {
          pixelSize: selected ? 17 : 12,
          color: selected
            ? Color.fromCssColorString("#ffd56a")
            : Color.fromCssColorString("#f0a93d"),
          outlineColor: Color.fromCssColorString("#ffffff"),
          outlineWidth: selected ? 3 : 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: selected ? `Argo ${profile.platform_id} · C${profile.cycle}` : "",
          font: "13px system-ui",
          fillColor: Color.WHITE,
          outlineColor: Color.fromCssColorString("#04111d"),
          outlineWidth: 4,
          style: LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Color.fromCssColorString("#04111d"),
          backgroundPadding: new Cartesian2(7, 4),
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, -22),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    }

    const sensorColour = (sensor: ImportedObservationProfile["sensor_type"]) => {
      if (sensor === "glider") return Color.fromCssColorString("#8cefff");
      if (sensor === "ctd") return Color.fromCssColorString("#b58cff");
      if (sensor === "bgc") return Color.fromCssColorString("#75e68e");
      if (sensor === "argo") return Color.fromCssColorString("#f0a93d");
      return Color.fromCssColorString("#d7e3ea");
    };

    for (const profile of importedProfiles) {
      const id = `instrument:${profile.id}`;
      profileIdsRef.current.push(id);
      const selected = profile.id === selectedImportedProfileId;
      viewer.entities.add({
        id,
        position: Cartesian3.fromDegrees(profile.longitude, profile.latitude, 11_000),
        point: {
          pixelSize: selected ? 18 : 13,
          color: sensorColour(profile.sensor_type),
          outlineColor: selected
            ? Color.fromCssColorString("#ffffff")
            : Color.fromCssColorString("#04111d"),
          outlineWidth: selected ? 3 : 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: selected
            ? `${profile.sensor_type.toUpperCase()} · ${profile.platform_id}`
            : "",
          font: "13px system-ui",
          fillColor: Color.WHITE,
          outlineColor: Color.fromCssColorString("#04111d"),
          outlineWidth: 4,
          style: LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Color.fromCssColorString("#04111d"),
          backgroundPadding: new Cartesian2(7, 4),
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, -19),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    }

    const selectedProfile = profiles.find((profile) => profile.profile_id === selectedProfileId);
    if (selectedProfile) {
      viewer.entities.add({
        id: "selected-model-cell",
        position: Cartesian3.fromDegrees(
          selectedProfile.model_cell_longitude,
          selectedProfile.model_cell_latitude,
          7_500
        ),
        point: {
          pixelSize: 14,
          color: Color.fromCssColorString("#4ad7f5"),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `Nearest model cell · ${selectedProfile.spatial_distance_km.toFixed(2)} km`,
          font: "12px system-ui",
          fillColor: Color.fromCssColorString("#b8f4ff"),
          outlineColor: Color.fromCssColorString("#04111d"),
          outlineWidth: 4,
          style: LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Color.fromCssColorString("#04111d"),
          backgroundPadding: new Cartesian2(7, 4),
          verticalOrigin: VerticalOrigin.TOP,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: new Cartesian2(0, 22),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });

      viewer.entities.add({
        id: "selected-collocation-line",
        polyline: {
          positions: [
            Cartesian3.fromDegrees(
              selectedProfile.observation_longitude,
              selectedProfile.observation_latitude,
              7_500
            ),
            Cartesian3.fromDegrees(
              selectedProfile.model_cell_longitude,
              selectedProfile.model_cell_latitude,
              7_500
            )
          ],
          width: 3,
          material: new PolylineDashMaterialProperty({
            color: Color.fromCssColorString("#8cefff")
          })
        }
      });
    }

    viewer.scene.requestRender();
  }, [profiles, selectedProfileId, importedProfiles, selectedImportedProfileId]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const block = resolveMainBlock(activeMainBlockId);
    const depth = field?.depth_m ?? currents?.depth_m;
    if (depth == null || volume || !canCesiumRenderMainBlock(block)) {
      viewer.entities.removeById("selected-depth-plane");
      if (depthAnimationRef.current != null) {
        window.cancelAnimationFrame(depthAnimationRef.current);
        depthAnimationRef.current = null;
      }
      viewer.scene.requestRender();
      return;
    }

    const blockRectangle = Rectangle.fromDegrees(block.west, block.south, block.east, block.north);
    let plane = viewer.entities.getById("selected-depth-plane");
    if (!plane) {
      plane = viewer.entities.add({
        id: "selected-depth-plane",
        rectangle: {
          coordinates: blockRectangle,
          height: -depth * verticalExaggeration,
          material: Color.fromCssColorString("#40d8f2").withAlpha(0.12),
          outline: true,
          outlineColor: Color.fromCssColorString("#55e3fa").withAlpha(0.72)
        }
      });
      sliceHeightRef.current = -depth * verticalExaggeration;
      viewer.scene.requestRender();
      return;
    }

    if (!plane.rectangle) return;
    plane.rectangle.coordinates = new ConstantProperty(blockRectangle);
    if (depthAnimationRef.current != null) {
      window.cancelAnimationFrame(depthAnimationRef.current);
    }

    const startHeight = sliceHeightRef.current;
    const targetHeight = -depth * verticalExaggeration;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      plane.rectangle.height = new ConstantProperty(targetHeight);
      sliceHeightRef.current = targetHeight;
      viewer.scene.requestRender();
      return;
    }
    const startedAt = performance.now();
    const durationMs = 320;

    const animate = (now: number) => {
      if (viewer.isDestroyed() || !plane?.rectangle) return;
      const raw = Math.min(1, (now - startedAt) / durationMs);
      const eased = raw * raw * (3 - 2 * raw);
      const height = startHeight + (targetHeight - startHeight) * eased;
      plane.rectangle.height = new ConstantProperty(height);
      sliceHeightRef.current = height;
      viewer.scene.requestRender();

      if (raw < 1) {
        depthAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        depthAnimationRef.current = null;
      }
    };

    depthAnimationRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (depthAnimationRef.current != null) {
        window.cancelAnimationFrame(depthAnimationRef.current);
        depthAnimationRef.current = null;
      }
    };
  }, [field?.depth_m, currents?.depth_m, volume, verticalExaggeration, activeMainBlockId]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    for (const primitive of dynamicPrimitivesRef.current) {
      viewer.scene.primitives.remove(primitive);
    }
    dynamicPrimitivesRef.current = [];

    const block = resolveMainBlock(activeMainBlockId);
    let fieldAllowed = false;
    let volumeAllowed = false;
    let currentsAllowed = false;
    try {
      fieldAllowed = field ? buildCesiumFieldRenderPlan(block, field).allowed : false;
      volumeAllowed = volume ? buildCesiumVolumeRenderPlan(block, volume).allowed : false;
      currentsAllowed = currents ? buildCesiumCurrentsRenderPlan(block, currents).allowed : false;
      setRendererError((current) => current.startsWith("3DB-04 Cesium contract:") ? "" : current);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setRendererError(message || "3DB-04 Cesium contract rejected the scientific render payload.");
      viewer.scene.requestRender();
      return;
    }

    if (field && fieldAllowed) {
      const collection = new PointPrimitiveCollection();
      for (let yi = 0; yi < field.latitude.length; yi += 1) {
        for (let xi = 0; xi < field.longitude.length; xi += 1) {
          const value = field.values[yi]?.[xi];
          if (value == null) continue;
          collection.add({
            id: {
              kind: "ocean-inspection",
              inspection: {
                kind: "scalar",
                variable: field.label,
                longitude: field.longitude[xi],
                latitude: field.latitude[yi],
                depth_m: field.depth_m,
                time: field.time,
                units: field.units,
                value
              } satisfies Inspection
            },
            position: Cartesian3.fromDegrees(
              field.longitude[xi],
              field.latitude[yi],
              -field.depth_m * verticalExaggeration
            ),
            pixelSize: 7,
            color: scalarColor(value, colorMinimum, colorMaximum, colorPalette, colorScale),
            outlineColor: Color.fromCssColorString("#00111c"),
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          });
        }
      }
      viewer.scene.primitives.add(collection);
      // Keep field samples beneath Argo/sensor markers and their labels.
      viewer.scene.primitives.lowerToBottom(collection);
      dynamicPrimitivesRef.current.push(collection);
    }

    if (volume && volumeAllowed) {
      const longitudes = Array.from(new Set(volume.points.map(([lon]) => lon))).sort((a, b) => a - b);
      const latitudes = Array.from(new Set(volume.points.map(([, lat]) => lat))).sort((a, b) => a - b);
      const lonStep = longitudes.length > 1 ? Math.abs(longitudes[1] - longitudes[0]) : 0.15;
      const latStep = latitudes.length > 1 ? Math.abs(latitudes[1] - latitudes[0]) : 0.15;
      const pilotLod = block.materialization === "pilot"
        ? nativeDepthBalancedLodIndices(volume.points, pilotGlobeLodBudget)
        : null;
      const legacyStride = Math.max(1, Math.ceil(volume.points.length / 5000));
      const renderIndices = pilotLod ??
        Array.from({ length: Math.ceil(volume.points.length / legacyStride) }, (_value, index) => index * legacyStride);
      const instances: GeometryInstance[] = [];

      for (const index of renderIndices) {
        const [lon, lat, depth, value] = volume.points[index];
        const color = scalarColor(value, colorMinimum, colorMaximum, colorPalette, colorScale).withAlpha(0.36);
        instances.push(
          new GeometryInstance({
            id: {
              kind: "ocean-inspection",
              inspection: {
                kind: "scalar",
                variable: volume.label,
                longitude: lon,
                latitude: lat,
                depth_m: depth,
                time: volume.time,
                units: volume.units,
                value
              } satisfies Inspection
            },
            geometry: new RectangleGeometry({
              rectangle: Rectangle.fromDegrees(
                lon - lonStep * 0.48,
                lat - latStep * 0.48,
                lon + lonStep * 0.48,
                lat + latStep * 0.48
              ),
              height: -depth * verticalExaggeration,
              vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT
            }),
            attributes: {
              color: ColorGeometryInstanceAttribute.fromColor(color)
            }
          })
        );
      }

      if (instances.length > 0) {
        const layeredVolume = new Primitive({
          geometryInstances: instances,
          appearance: new PerInstanceColorAppearance({
            translucent: true,
            closed: false
          }),
          asynchronous: false
        });
        viewer.scene.primitives.add(layeredVolume);
        viewer.scene.primitives.lowerToBottom(layeredVolume);
        dynamicPrimitivesRef.current.push(layeredVolume);
      }
    }

    if (currents && currentsAllowed) {
      const lines = new PolylineCollection();
      const heads = new PointPrimitiveCollection();
      const displayScaleDegrees = 1.25;
      for (const [lon, lat, u, v, speed] of currents.vectors) {
        const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.25);
        const endLon = lon + (u * displayScaleDegrees) / cosLat;
        const endLat = lat + v * displayScaleDegrees;
        const color = Color.fromHsl(
          0.56 - 0.12 * (speed / Math.max(currents.maximum, 1e-12)),
          0.9,
          0.58,
          0.9
        );
        const start = Cartesian3.fromDegrees(lon, lat, 12_000);
        const end = Cartesian3.fromDegrees(endLon, endLat, 12_000);
        lines.add({
          positions: [start, end],
          width: 2.6,
          material: Material.fromType("Color", { color })
        });

        const dx = endLon - lon;
        const dy = endLat - lat;
        const length = Math.max(Math.hypot(dx, dy), 1e-9);
        const ux = dx / length;
        const uy = dy / length;
        const px = -uy;
        const py = ux;
        const headLength = Math.min(0.16, Math.max(0.07, length * 0.34));
        const headWidth = headLength * 0.55;
        const left = Cartesian3.fromDegrees(
          endLon - ux * headLength + px * headWidth,
          endLat - uy * headLength + py * headWidth,
          12_000
        );
        const right = Cartesian3.fromDegrees(
          endLon - ux * headLength - px * headWidth,
          endLat - uy * headLength - py * headWidth,
          12_000
        );
        lines.add({
          positions: [left, end, right],
          width: 2.6,
          material: Material.fromType("Color", { color })
        });
        heads.add({
          id: {
            kind: "ocean-inspection",
            inspection: {
              kind: "current",
              variable: "Horizontal current",
              longitude: lon,
              latitude: lat,
              depth_m: currents.depth_m,
              time: currents.time,
              units: currents.units,
              u,
              v,
              speed
            } satisfies Inspection
          },
          position: end,
          pixelSize: 3.8,
          color,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        });
      }
      viewer.scene.primitives.add(lines);
      viewer.scene.primitives.add(heads);
      viewer.scene.primitives.lowerToBottom(heads);
      viewer.scene.primitives.lowerToBottom(lines);
      dynamicPrimitivesRef.current.push(lines, heads);
    }

    viewer.scene.requestRender();
  }, [field, volume, currents, verticalExaggeration, colorPalette, colorScale, colorMinimum, colorMaximum, activeMainBlockId, pilotGlobeLodBudget]);

  const selectedProfile = profiles.find((profile) => profile.profile_id === selectedProfileId) ?? null;

  useEffect(() => {
    const viewer = viewerRef.current;
    const element = calloutRef.current;
    if (!viewer || viewer.isDestroyed() || !element || !selectedProfile || !profileCalloutOpen) return;

    const anchor = Cartesian3.fromDegrees(
      selectedProfile.observation_longitude,
      selectedProfile.observation_latitude,
      7_500
    );
    const scratch = new Cartesian2();

    const syncCallout = () => {
      if (viewer.isDestroyed()) return;
      const screen = SceneTransforms.worldToWindowCoordinates(viewer.scene, anchor, scratch);
      if (!screen || !Number.isFinite(screen.x) || !Number.isFinite(screen.y)) {
        element.dataset.anchorVisible = "false";
        return;
      }

      const canvasWidth = viewer.scene.canvas.clientWidth;
      const canvasHeight = viewer.scene.canvas.clientHeight;
      const halfWidth = Math.max(150, element.offsetWidth / 2);
      const height = Math.max(120, element.offsetHeight);
      const x = Math.min(Math.max(screen.x, halfWidth + 10), Math.max(halfWidth + 10, canvasWidth - halfWidth - 10));
      const y = Math.min(Math.max(screen.y, height + 30), Math.max(height + 30, canvasHeight - 18));

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.dataset.anchorVisible =
        screen.x >= -30 && screen.x <= canvasWidth + 30 && screen.y >= -30 && screen.y <= canvasHeight + 30
          ? "true"
          : "false";
    };

    viewer.scene.postRender.addEventListener(syncCallout);
    syncCallout();
    viewer.scene.requestRender();
    return () => {
      if (!viewer.isDestroyed()) viewer.scene.postRender.removeEventListener(syncCallout);
    };
  }, [
    selectedProfile?.profile_id,
    selectedProfile?.observation_longitude,
    selectedProfile?.observation_latitude,
    profileCalloutOpen
  ]);

  const scalar = field ?? volume;
  const legendMin = scalar ? colorMinimum : currents?.minimum;
  const legendMax = scalar ? colorMaximum : currents?.maximum;
  const legendUnits = scalar?.units ?? currents?.units;
  const legendLabel = scalar?.label ?? (currents ? "Current speed" : "Ocean field");

  const smoothGlobeZoom = (direction: "in" | "out") => {
    stopJourneyRef.current();
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
      zoomAnimationRef.current = null;
    }

    const initialHeight = viewer.camera.positionCartographic.height;
    const minimumHeight = 115_000;
    const totalDistance =
      direction === "in"
        ? Math.max(0, Math.min(initialHeight * 0.32, initialHeight - minimumHeight))
        : Math.max(90_000, initialHeight * 0.34);

    if (totalDistance <= 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (direction === "in") viewer.camera.zoomIn(totalDistance);
      else viewer.camera.zoomOut(totalDistance);
      setCameraHeight(viewer.camera.positionCartographic.height);
      viewer.scene.requestRender();
      return;
    }

    const startedAt = performance.now();
    const durationMs = 420;
    let previousEased = 0;

    const animate = (now: number) => {
      if (viewer.isDestroyed()) return;
      const raw = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - raw, 3);
      const delta = totalDistance * (eased - previousEased);
      previousEased = eased;

      if (direction === "in") viewer.camera.zoomIn(delta);
      else viewer.camera.zoomOut(delta);
      setCameraHeight(viewer.camera.positionCartographic.height);
      viewer.scene.requestRender();

      if (raw < 1) {
        zoomAnimationRef.current = window.requestAnimationFrame(animate);
      } else {
        zoomAnimationRef.current = null;
      }
    };

    zoomAnimationRef.current = window.requestAnimationFrame(animate);
  };

  const cancelCameraAnimation = () => {
    stopJourneyRef.current();
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return null;
    if (zoomAnimationRef.current != null) {
      window.cancelAnimationFrame(zoomAnimationRef.current);
      zoomAnimationRef.current = null;
    }
    viewer.camera.cancelFlight();
    return viewer;
  };

  const cameraDuration = (seconds: number) =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : seconds;

  const applyCameraPreset = (preset: CameraPreset) => {
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    setCameraPreset(preset);
    const complete = () => setCameraHeight(viewer.camera.positionCartographic.height);

    if (preset === "north") {
      viewer.camera.flyTo({
        destination: Cartesian3.clone(viewer.camera.position),
        orientation: {
          heading: 0,
          pitch: viewer.camera.pitch,
          roll: 0
        },
        duration: cameraDuration(0.36),
        complete
      });
      return;
    }

    if (preset === "nadir") {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(68.5, 13.0, 1_500_000),
        orientation: {
          heading: 0,
          pitch: CesiumMath.toRadians(-90),
          roll: 0
        },
        duration: cameraDuration(0.55),
        complete
      });
      return;
    }

    if (preset === "perspective") {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(68.5, 13.0, 1_350_000),
        orientation: {
          heading: CesiumMath.toRadians(315),
          pitch: CesiumMath.toRadians(-45),
          roll: 0
        },
        duration: cameraDuration(0.58),
        complete
      });
      return;
    }

    if (preset === "cross-section") {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(68.5, 13.0, 1_050_000),
        orientation: {
          heading: CesiumMath.toRadians(90),
          pitch: CesiumMath.toRadians(-12),
          roll: 0
        },
        duration: cameraDuration(0.58),
        complete
      });
      return;
    }

    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(66.35, 11.35, 70.65, 14.65),
      duration: cameraDuration(0.58),
      complete
    });
  };

  const fitStudyRegion = () => applyCameraPreset("basin");

  const fitMainBlock = (id = activeMainBlockId) => {
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    const block = resolveMainBlock(id);
    const lonPad = Math.max(0.35, (block.east - block.west) * 0.22);
    const latPad = Math.max(0.3, (block.north - block.south) * 0.22);
    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(
        block.west - lonPad,
        block.south - latPad,
        block.east + lonPad,
        block.north + latPad
      ),
      duration: cameraDuration(0.62),
      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)
    });
  };

  const fitIndianOceanBlocks = () => {
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(
        TARGET_DOMAIN.west - 1.5,
        TARGET_DOMAIN.south - 2,
        TARGET_DOMAIN.east + 1.5,
        TARGET_DOMAIN.north + 2
      ),
      duration: cameraDuration(0.72),
      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)
    });
  };

  const showEarthView = () => {
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    setCameraPreset("nadir");
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(69.0, 13.0, 14_000_000),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-90),
        roll: 0
      },
      duration: cameraDuration(0.7),
      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)
    });
  };

  const focusSelectedObservation = () => {
    if (!selectedProfile) return;
    const viewer = cancelCameraAnimation();
    if (!viewer) return;
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        selectedProfile.observation_longitude,
        selectedProfile.observation_latitude,
        520_000
      ),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-76),
        roll: 0
      },
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.5,
      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)
    });
  };

  const activeMaterialization = activeMainBlock.materialization;
  const activeStatusLabel = activeMaterialization === "verified-baseline"
    ? "Verified volume"
    : activeMaterialization === "pilot"
      ? "Source-backed pilot"
      : "Planned target";

  return (
    <main
      className="globe-shell"
      data-journey-phase={introPhase}
      data-render-scale={renderScale.toFixed(2)}
      data-antialiasing={antialiasing}
      data-render-quality="high"
      data-camera-height={cameraHeight.toFixed(0)}
      data-pilot-lod-budget={activeMainBlock.materialization === "pilot" ? pilotGlobeLodBudget : "baseline"}
      data-camera-preset={cameraPreset}
      data-presentation-active={presentationActive ? "true" : "false"}
      data-imagery-preference={imageryPreference}
      data-imagery-status={imageryStatus}
      data-imagery-failsafe="online-hd+offline-natural-earth"
      data-color-palette={colorPalette}
      data-color-scale={colorScale}
      data-color-min={colorMinimum}
      data-color-max={colorMaximum}
      data-imported-profile-count={importedProfiles.length}
      data-selected-imported-profile={selectedImportedProfileId}
      data-main-block-count={OCEAN_INTERSECTING_BLOCK_COUNT}
      data-active-main-block={activeMainBlock.id}
      data-active-main-block-materialization={activeMaterialization}
      data-active-block-observation-count={observationIntegration.observationCount}
      data-active-block-observation-evidence={observationIntegration.evidenceClass}
      data-active-block-observation-validation={observationIntegration.modelObservationValidated ? "true" : "false"}
      data-cesium-scientific-render-ready={canCesiumRenderMainBlock(activeMainBlock) ? "true" : "false"}
    >
      <div ref={containerRef} className="cesium-host" />
      {blockDockSlot && createPortal(
      <section
        className="main-block-globe-hud"
        data-testid="integrated-main-block-hud"
        data-intro-ready={introPhase === "region" ? "true" : "false"}
        aria-label="Integrated Indian Ocean main block controls"
      >
        <div className="main-block-globe-heading">
          <div>
            <span>INDIAN OCEAN BLOCK FIELD</span>
            <strong>{activeMaterialization === "verified-baseline" ? "Verified GLORYS reference · no block selected" : `${activeMainBlock.id} · ${activeMainBlockRegion(activeMainBlock)}`}</strong>
            <small>{activeMaterialization === "verified-baseline" ? "Reference evidence retained outside the block grid" : blockBoundsLabel(activeMainBlock)}</small>
          </div>
          <span className={`main-block-status-pill ${activeMaterialization !== "planned" ? "verified" : ""}`}>
            {activeStatusLabel}
          </span>
        </div>
        <label>
          <span>Active main block</span>
          <select
            aria-label="Active main block"
            value={activeMaterialization === "verified-baseline" ? "" : activeMainBlock.id}
            onChange={(event) => {
              selectMainBlock(event.target.value);
              window.setTimeout(() => fitMainBlock(event.target.value), 0);
            }}
          >
            <option value="" disabled>Select an ocean-intersecting block</option>
            {OCEAN_INTERSECTING_MAIN_BLOCKS.map((block) => (
              <option key={block.id} value={block.id}>
                {block.id} · {block.region} · {block.west}–{block.east}°E / {block.south}–{block.north}°N
              </option>
            ))}
          </select>
        </label>
        <div className="main-block-globe-stats" aria-label="Main block materialization status">
          <div><span>Ocean blocks</span><strong>{OCEAN_INTERSECTING_BLOCK_COUNT} retained</strong></div>
          <div><span>Land-only removed</span><strong>{LAND_ONLY_BLOCK_COUNT}</strong></div>
          <div><span>Source-backed pilots</span><strong>{PHASE35B_PILOT_IDS.length} materialized</strong></div>
        </div>
        <div className="main-block-grid-key" aria-label="Block map legend">
          <span><i /> Light yellow · mixed/coastal</span>
          <span className="verified"><i /> Dark yellow · ocean-dominant</span>
          <span className="active"><i /> Active selection</span>
        </div>
        <div className="main-block-globe-actions">
          <button type="button" disabled={activeMaterialization === "verified-baseline"} onClick={() => fitMainBlock()}>Fit selected block</button>
          <button type="button" onClick={fitIndianOceanBlocks}>Fit ocean-block field</button>
          <button
            type="button"
            className="primary"
            disabled={!canEnterWaterColumn}
            onClick={() => enterWaterColumnRef.current()}
          >
            Open in Water Column 3D
          </button>
        </div>
        <p
          className="main-block-globe-boundary-note"
          data-testid="active-block-observation-context"
          data-observation-evidence={observationIntegration.evidenceClass}
        >
          {activeMaterialization === "verified-baseline"
            ? <>The independently validated GLORYS baseline remains <strong>reference science only</strong> and is not drawn as a block footprint.</>
            : activeMaterialization === "pilot"
              ? <>This footprint carries a <strong>genuine source-backed GLORYS pilot</strong>; no pilot-specific independent observation validation is implied.</>
              : <>This footprint is integrated into the Earth model but carries <strong>no copied or synthetic ocean values</strong> until materialized from source data.</>}
          <br />
          <strong>Observation context:</strong>{" "}
          {observationIntegration.modelObservationValidated
            ? `${observationIntegration.independentComparisonCount} verified Argo comparison profile${observationIntegration.independentComparisonCount === 1 ? "" : "s"} are independently compared to this active verified baseline.`
            : observationIntegration.observationCount > 0
              ? `${observationIntegration.observationCount} source-backed observation profile${observationIntegration.observationCount === 1 ? "" : "s"} fall inside this block footprint as spatial context only; no block validation is implied.`
              : "No source-backed observation profile currently falls inside this footprint; no observation validation is claimed."}
        </p>
      </section>,
      blockDockSlot
      )}
      <div className="renderer-tools" aria-label="Ocean view tools">
      {selectedProfile && profileCalloutOpen && (
        <div
          ref={calloutRef}
          className="argo-billboard-callout"
          data-anchor-visible="false"
          data-profile-id={selectedProfile.profile_id}
          aria-label={`Anchored Argo profile callout for ${selectedProfile.platform_id}`}
        >
          <div className="argo-callout-heading">
            <div>
              <span>ARGO FLOAT #{selectedProfile.platform_id}</span>
              <strong>
                Cycle {selectedProfile.cycle} · {selectedProfile.direction === "A" ? "Ascending" : selectedProfile.direction === "D" ? "Descending" : selectedProfile.direction}
              </strong>
            </div>
            <button type="button" aria-label="Close anchored Argo callout" onClick={onCloseProfileCallout}>×</button>
          </div>
          <div className="argo-callout-location">
            <span>{Math.abs(selectedProfile.observation_latitude).toFixed(3)}°{selectedProfile.observation_latitude >= 0 ? "N" : "S"}</span>
            <span>{Math.abs(selectedProfile.observation_longitude).toFixed(3)}°{selectedProfile.observation_longitude >= 0 ? "E" : "W"}</span>
            <span>{selectedProfile.observation_time_utc.replace("T", " ").replace("Z", " UTC")}</span>
          </div>
          <div className="argo-callout-metrics">
            <div>
              <span>MAE</span>
              <strong>{selectedProfile.mae_celsius.toFixed(3)} °C</strong>
            </div>
            <div>
              <span>RMSE</span>
              <strong>{selectedProfile.rmse_celsius.toFixed(3)} °C</strong>
            </div>
            {typeof selectedProfile.mean_bias_celsius === "number" && (
              <div>
                <span>Mean signed bias</span>
                <strong>
                  {selectedProfile.mean_bias_celsius >= 0 ? "+" : ""}
                  {selectedProfile.mean_bias_celsius.toFixed(3)} °C
                </strong>
              </div>
            )}
            <div>
              <span>Matched levels</span>
              <strong>{selectedProfile.matched_level_count}</strong>
            </div>
          </div>
          <div className="argo-callout-footer">
            <span>Diagnostic model–observation evidence · nearest model cell {selectedProfile.spatial_distance_km.toFixed(2)} km</span>
            <button type="button" onClick={() => onInspectProfile(selectedProfile.profile_id)}>
              Inspect Profile ↗
            </button>
          </div>
          <i className="argo-callout-anchor" aria-hidden="true" />
        </div>
      )}
      {rendererError && (
        <div className="renderer-fallback-card" role="alert">
          <strong>3D renderer degraded</strong>
          <span>{rendererError}</span>
          <small>
            Scientific controls, provenance and evidence remain available. Reload the app; for a demo emergency use the preserved Streamlit fallback.
          </small>
        </div>
      )}
      <div className="globe-overlay imagery-control" data-status={imageryStatus}>
        <span>HIGH-QUALITY BASEMAP</span>
        <strong>
          {imageryStatus === "online"
            ? "ArcGIS World Imagery · HD online"
            : imageryStatus === "offline"
              ? "Natural Earth II · offline fail-safe"
              : imageryStatus === "grid"
                ? "Scientific grid fallback"
                : "Resolving best available layer…"}
        </strong>
        <div className="imagery-control-buttons">
          <button
            type="button"
            className={imageryPreference === "auto" ? "active" : ""}
            aria-pressed={imageryPreference === "auto"}
            onClick={() => setImageryPreference("auto")}
          >
            High-res auto
          </button>
          <button
            type="button"
            className={imageryPreference === "offline" ? "active" : ""}
            aria-pressed={imageryPreference === "offline"}
            onClick={() => setImageryPreference("offline")}
          >
            Offline
          </button>
        </div>
        <small>Preferred online HD → automatic offline fallback · basemap only; scientific coordinates and values never change.</small>
      </div>
      <div className="ocean-journey" aria-label="Ocean orientation journey">
        <div className="journey-stops" aria-live="polite">
          <span className={introPhase === "earth" ? "active" : ""}>01 Earth</span><i aria-hidden="true">→</i>
          <span className={introPhase === "india" ? "active" : ""}>02 India</span><i aria-hidden="true">→</i>
          <span className={introPhase === "flying" || introPhase === "region" ? "active" : ""}>03 {activeMaterialization === "verified-baseline" ? "112-block ocean field" : `${activeMainBlock.id} ocean block`}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (introPhase === "region") {
              journeyRef.current(false);
              return;
            }
            // Use the canonical skip path so generation cancellation,
            // synchronous basin framing and the final "region" state happen
            // atomically even while a Cesium flight is active.
            journeyRef.current(true);
          }}
        >
          {introPhase === "region" ? "Replay journey" : "Skip journey"}
        </button>
      </div>
      {introPhase !== "region" && introPhase !== "idle" && <div className="globe-intro-status" role="status" data-intro-phase={introPhase}>
        <span>
          {introPhase === "earth"
            ? "01 · EARTH / ONE CONNECTED SYSTEM"
            : introPhase === "india"
              ? "02 · INDIA / OPERATIONAL CONTEXT"
              : "03 · INDIAN OCEAN / 140-BLOCK FIELD"}
        </span>
        <strong>
          {introPhase === "earth"
            ? "One ocean. One connected system."
            : introPhase === "india"
              ? "From national context to the Indian Ocean."
              : "112 ocean-intersecting targets with source-backed materialization where evidence exists."}
        </strong>
        <small>
          {introPhase === "earth"
            ? "Ocean Canvas starts at planetary scale so model fields, currents and in-situ observations stay anchored to real geography before we zoom into evidence."
            : introPhase === "india"
              ? "We narrow to the northern Indian Ocean, where INCOIS multi-time analysis adds genuine temporal breadth to the verified model baseline."
              : "60–100°E · 5–25°N · 112 ocean-intersecting target footprints; 28 zero-ocean land cells are suppressed. The verified GLORYS baseline remains reference evidence and is no longer drawn as a competing block footprint."}
        </small>
      </div>}

      <div className="globe-overlay top-left judge-summary">
        <div>
          <span className="live-dot" />
          <strong>INDIAN OCEAN · INTEGRATED MAIN-BLOCK FIELD</strong>
        </div>
        <span>{OCEAN_INTERSECTING_BLOCK_COUNT} ocean-intersecting footprints · {LAND_ONLY_BLOCK_COUNT} land-only suppressed · active {activeMaterialization === "verified-baseline" ? "reference science" : activeMainBlock.id} · 25 source-backed pilots · {profiles.length} Argo comparison profiles</span>
        <small>
          {scalar?.label ?? (currents ? "Currents" : "Ocean field")}
          {field ? ` · ${field.depth_m.toFixed(2)} m` : ""}
          {currents ? ` · ${currents.depth_m.toFixed(2)} m` : ""}
          {volume ? " · full water column" : ""}
        </small>
        <small className="render-quality-line">
          HD canvas ×{renderScale.toFixed(2)} · {antialiasing}
        </small>
      </div>
      {importedProfiles.length > 0 && !selectedImportedProfileId && (
        <div className="globe-overlay imported-observation-chips" aria-label="Multi-sensor observation profiles" data-expanded={sensorsExpanded}>
          <span>MULTI-SENSOR PROFILES</span>
          <button className="sensor-disclosure" type="button" aria-expanded={sensorsExpanded} aria-controls="sensor-profile-choices" onClick={() => setSensorsExpanded(!sensorsExpanded)}>{sensorsExpanded ? "Close sensor profiles" : `Sensor profiles (${importedProfiles.length})`}</button>
          <div id="sensor-profile-choices">
            {importedProfiles.map((profile) => (
              <button
                type="button"
                key={profile.id}
                className={profile.id === selectedImportedProfileId ? "active" : ""}
                aria-pressed={profile.id === selectedImportedProfileId}
                onClick={() => onSelectImportedProfile(profile.id)}
              >
                <strong>{profile.sensor_type.toUpperCase()}</strong>
                <span>{profile.platform_id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {inspection && (
        <div className="globe-overlay inspection-card">
          <div className="inspection-title">
            <strong>Scientific inspection</strong>
            <button onClick={() => setInspection(null)} aria-label="Close inspection">×</button>
          </div>
          <span>{inspection.variable}</span>
          <div className="inspection-grid">
            <span>Lon</span><strong>{inspection.longitude.toFixed(4)}°</strong>
            <span>Lat</span><strong>{inspection.latitude.toFixed(4)}°</strong>
            <span>Depth</span><strong>{inspection.depth_m.toFixed(2)} m</strong>
            {inspection.kind === "scalar" ? (
              <>
                <span>Value</span><strong>{inspection.value?.toFixed(4)} {displayUnits(inspection.units)}</strong>
              </>
            ) : (
              <>
                <span>u / v</span><strong>{inspection.u?.toFixed(4)} / {inspection.v?.toFixed(4)} {displayUnits(inspection.units)}</strong>
                <span>Speed</span><strong>{inspection.speed?.toFixed(4)} {displayUnits(inspection.units)}</strong>
              </>
            )}
          </div>
          <small>{inspection.time.replace("T", " ").replace("Z", " UTC")}</small>
          <small>Copernicus GLORYS12V1 · source-backed reanalysis</small>
        </div>
      )}
      {(field || currents) && !volume && canCesiumRenderMainBlock(activeMainBlock) && (
        <div className="globe-overlay depth-indicator">
          DEPTH PLANE · {(field?.depth_m ?? currents?.depth_m ?? 0).toFixed(2)} m
        </div>
      )}
      <CameraOrientationHud
        context="globe"
        activePreset={cameraPreset}
        onPreset={applyCameraPreset}
      />

      <div className="globe-overlay smooth-zoom-controls cesium-smooth-zoom camera-control-stack" aria-label="Ocean Globe camera controls">
        <span>CAMERA</span>
        <div className="camera-zoom-row">
          <button type="button" aria-label="Zoom out Ocean Globe" title="Zoom out" onClick={() => smoothGlobeZoom("out")}>−</button>
          <button type="button" aria-label="Zoom in Ocean Globe" title="Zoom in" onClick={() => smoothGlobeZoom("in")}>+</button>
        </div>
        <div className="camera-preset-row">
          <button type="button" className="camera-preset-button" onClick={fitStudyRegion}>
            <span>FIT</span><strong>Study region</strong>
          </button>
          <button type="button" className="camera-preset-button" onClick={showEarthView}>
            <span>EARTH</span><strong>Global view</strong>
          </button>
        </div>
        <button
          type="button"
          className="camera-observation-button"
          disabled={!selectedProfile}
          onClick={focusSelectedObservation}
        >
          <span>ARGO</span>
          <strong>{selectedProfile ? `Focus ${selectedProfile.platform_id}` : "No observation selected"}</strong>
        </button>
        <small>Wheel to zoom · drag to orbit · one-click geographic presets</small>
      </div>

      <div className="globe-overlay interaction-hint">
        Drag to orbit · wheel to zoom · click a yellow block to select · click evidence to inspect
      </div>
      <div className="globe-overlay legend-card">
        <span>{legendLabel}</span>
        <div className="gradient-bar" data-palette={colorPalette} style={{ background: paletteCssGradient(colorPalette) }} />
        <div className="legend-values">
          <span>{legendMin?.toFixed(3) ?? "—"}</span>
          <span>{displayUnits(legendUnits)}</span>
          <span>{legendMax?.toFixed(3) ?? "—"}</span>
        </div>
      </div>
      {volume && canCesiumRenderMainBlock(activeMainBlock) && (
        <div className="globe-overlay volume-note">
          3D WATER COLUMN · {activeMaterialization === "verified-baseline" ? "verified baseline layers" : "source-backed pilot layers"} · visual depth ×{verticalExaggeration}
        </div>
      )}
      {currents && canCesiumRenderMainBlock(activeMainBlock) && (
        <div className="globe-overlay current-note">
          HORIZONTAL u/v FLOW · arrow direction + speed colour · {currents.depth_m.toFixed(2)} m · projected above globe for readability
        </div>
      )}
      </div>
    </main>
  );
}
