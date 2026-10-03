from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def patch_ocean_globe() -> None:
    path = ROOT / "frontend/src/components/OceanGlobe.tsx"
    text = path.read_text(encoding="utf-8")

    text = replace_once(
        text,
        'import { paletteCssGradient, paletteHsl } from "../palettes";\nimport { CameraOrientationHud, type CameraPreset } from "./CameraOrientationHud";',
        '''import { paletteCssGradient, paletteHsl } from "../palettes";\nimport {\n  CURRENT_VERIFIED_BASELINE,\n  INDIAN_OCEAN_MAIN_BLOCKS,\n  TARGET_BLOCK_COUNT,\n  TARGET_DOMAIN,\n  blockBoundsLabel\n} from "../main-block-engine";\nimport {\n  activeMainBlockRegion,\n  findTargetBlockAt,\n  isVerifiedBaseline,\n  publishActiveMainBlockId,\n  readActiveMainBlockId,\n  resolveMainBlock,\n  subscribeActiveMainBlock\n} from "../main-block-runtime";\nimport { CameraOrientationHud, type CameraPreset } from "./CameraOrientationHud";''',
        "OceanGlobe imports",
    )

    text = replace_once(
        text,
        '  const [regionEntryArmed, setRegionEntryArmed] = useState(true);\n\n  useEffect(() => {\n    enterWaterColumnRef.current = onEnterWaterColumn;',
        '''  const [regionEntryArmed, setRegionEntryArmed] = useState(true);\n  const [activeMainBlockId, setActiveMainBlockId] = useState(readActiveMainBlockId);\n  const activeMainBlock = resolveMainBlock(activeMainBlockId);\n\n  useEffect(() => subscribeActiveMainBlock(setActiveMainBlockId), []);\n\n  const selectMainBlock = (id: string) => {\n    const selectedId = publishActiveMainBlockId(id);\n    setActiveMainBlockId(selectedId);\n    setInspection(null);\n  };\n\n  useEffect(() => {\n    enterWaterColumnRef.current = onEnterWaterColumn;''',
        "OceanGlobe active block state",
    )

    text = replace_once(
        text,
        '      const destination = Rectangle.fromDegrees(66.35, 11.35, 70.65, 14.65);',
        '      const destination = Rectangle.fromDegrees(TARGET_DOMAIN.west - 1.5, TARGET_DOMAIN.south - 2, TARGET_DOMAIN.east + 1.5, TARGET_DOMAIN.north + 2);',
        "OceanGlobe journey destination",
    )

    text = replace_once(
        text,
        '''    // Always orient the viewer from Earth → India → verified ocean field on mount.\n    // This guarantees a fresh open or refresh never drops a judge directly into\n    // an unexplained regional map. Skip remains available for repeat users.''',
        '''    // Always orient the viewer from Earth → India → the integrated Indian Ocean block field on mount.\n    // The 140 logical targets are geographic planning geometry only; the verified GLORYS\n    // baseline remains the sole source-backed ocean volume until later materialization phases.''',
        "OceanGlobe journey comment",
    )

    text = replace_once(
        text,
        '''    const boundary = viewer.entities.add({\n      id: "model-domain-boundary",\n      polyline: {\n        positions: Cartesian3.fromDegreesArray([\n          67, 12, 70, 12, 70, 14, 67, 14, 67, 12\n        ]),\n        width: 2.5,\n        material: Color.fromCssColorString("#4ad7f5").withAlpha(0.85)\n      }\n    });\n    void boundary;''',
        '''    const boundary = viewer.entities.add({\n      id: "model-domain-boundary",\n      polyline: {\n        positions: Cartesian3.fromDegreesArray([\n          67, 12, 70, 12, 70, 14, 67, 14, 67, 12\n        ]),\n        width: 3.2,\n        material: Color.fromCssColorString("#ffd56a").withAlpha(0.96)\n      }\n    });\n    void boundary;\n\n    viewer.entities.add({\n      id: "main-block-domain-boundary",\n      polyline: {\n        positions: Cartesian3.fromDegreesArray([\n          TARGET_DOMAIN.west, TARGET_DOMAIN.south,\n          TARGET_DOMAIN.east, TARGET_DOMAIN.south,\n          TARGET_DOMAIN.east, TARGET_DOMAIN.north,\n          TARGET_DOMAIN.west, TARGET_DOMAIN.north,\n          TARGET_DOMAIN.west, TARGET_DOMAIN.south\n        ]),\n        width: 2.2,\n        material: Color.fromCssColorString("#70e1f5").withAlpha(0.82)\n      }\n    });\n\n    for (const block of INDIAN_OCEAN_MAIN_BLOCKS) {\n      viewer.entities.add({\n        id: `main-block:${block.id}`,\n        rectangle: {\n          coordinates: Rectangle.fromDegrees(block.west, block.south, block.east, block.north),\n          height: 1_250,\n          material: Color.fromCssColorString("#53c9e8").withAlpha(0.035),\n          outline: true,\n          outlineColor: Color.fromCssColorString("#65d5ef").withAlpha(0.46)\n        }\n      });\n    }\n\n    viewer.entities.add({\n      id: "verified-main-block-footprint",\n      rectangle: {\n        coordinates: Rectangle.fromDegrees(\n          CURRENT_VERIFIED_BASELINE.west,\n          CURRENT_VERIFIED_BASELINE.south,\n          CURRENT_VERIFIED_BASELINE.east,\n          CURRENT_VERIFIED_BASELINE.north\n        ),\n        height: 1_650,\n        material: Color.fromCssColorString("#ffd56a").withAlpha(0.09),\n        outline: true,\n        outlineColor: Color.fromCssColorString("#ffd56a").withAlpha(0.96)\n      }\n    });''',
        "OceanGlobe block grid entities",
    )

    text = replace_once(
        text,
        '''      if (\n        regionEntryArmedRef.current &&\n        entryAvailableRef.current &&\n        (pickedId?.kind === "ocean-inspection" || entityId === "model-domain-boundary")\n      ) {\n        setInspection(null);\n        enterWaterColumnRef.current();\n        return;\n      }''',
        '''      if (\n        regionEntryArmedRef.current &&\n        entryAvailableRef.current &&\n        (pickedId?.kind === "ocean-inspection" || entityId === "model-domain-boundary")\n      ) {\n        publishActiveMainBlockId(CURRENT_VERIFIED_BASELINE.id);\n        setActiveMainBlockId(CURRENT_VERIFIED_BASELINE.id);\n        setInspection(null);\n        enterWaterColumnRef.current();\n        return;\n      }''',
        "OceanGlobe scientific pick baseline selection",
    )

    text = replace_once(
        text,
        '''        if (insideStudyFrame && regionEntryArmedRef.current && entryAvailableRef.current) {\n          setInspection(null);\n          enterWaterColumnRef.current();\n          return;\n        }\n      }\n\n      if (pickedId?.kind === "ocean-inspection" && pickedId.inspection) {''',
        '''        if (insideStudyFrame) {\n          publishActiveMainBlockId(CURRENT_VERIFIED_BASELINE.id);\n          setActiveMainBlockId(CURRENT_VERIFIED_BASELINE.id);\n          if (regionEntryArmedRef.current && entryAvailableRef.current) {\n            setInspection(null);\n            enterWaterColumnRef.current();\n          }\n          return;\n        }\n\n        const targetBlock = findTargetBlockAt(longitude, latitude);\n        if (targetBlock) {\n          publishActiveMainBlockId(targetBlock.id);\n          setActiveMainBlockId(targetBlock.id);\n          setInspection(null);\n          return;\n        }\n      }\n\n      if (pickedId?.kind === "ocean-inspection" && pickedId.inspection) {''',
        "OceanGlobe geographic block selection",
    )

    marker = '''  useEffect(() => {\n    const viewer = viewerRef.current;\n    if (!presentationActive || !viewer || viewer.isDestroyed()) return;'''
    insert = '''  useEffect(() => {\n    const viewer = viewerRef.current;\n    if (!viewer || viewer.isDestroyed()) return;\n\n    viewer.entities.removeById("active-main-block-highlight");\n    const block = resolveMainBlock(activeMainBlockId);\n    const verified = isVerifiedBaseline(block);\n    const centreLon = (block.west + block.east) / 2;\n    const centreLat = (block.south + block.north) / 2;\n    const outline = verified\n      ? Color.fromCssColorString("#ffd56a")\n      : Color.fromCssColorString("#e9fbff");\n    const fill = verified\n      ? Color.fromCssColorString("#ffd56a").withAlpha(0.12)\n      : Color.fromCssColorString("#6fe6fa").withAlpha(0.12);\n\n    viewer.entities.add({\n      id: "active-main-block-highlight",\n      position: Cartesian3.fromDegrees(centreLon, centreLat, 28_000),\n      rectangle: {\n        coordinates: Rectangle.fromDegrees(block.west, block.south, block.east, block.north),\n        height: 2_600,\n        material: fill,\n        outline: true,\n        outlineColor: outline\n      },\n      label: {\n        text: verified ? `${block.id} · VERIFIED` : `${block.id} · PLANNED`,\n        font: "700 12px system-ui",\n        fillColor: Color.WHITE,\n        outlineColor: Color.fromCssColorString("#04111d"),\n        outlineWidth: 4,\n        style: LabelStyle.FILL_AND_OUTLINE,\n        showBackground: true,\n        backgroundColor: Color.fromCssColorString("#04111d").withAlpha(0.82),\n        backgroundPadding: new Cartesian2(7, 4),\n        verticalOrigin: VerticalOrigin.BOTTOM,\n        horizontalOrigin: HorizontalOrigin.CENTER,\n        disableDepthTestDistance: Number.POSITIVE_INFINITY\n      }\n    });\n    viewer.scene.requestRender();\n  }, [activeMainBlockId]);\n\n''' + marker
    text = replace_once(text, marker, insert, "OceanGlobe active highlight effect")

    text = replace_once(
        text,
        '''  const fitStudyRegion = () => applyCameraPreset("basin");\n\n  const showEarthView = () => {''',
        '''  const fitStudyRegion = () => applyCameraPreset("basin");\n\n  const fitMainBlock = (id = activeMainBlockId) => {\n    const viewer = cancelCameraAnimation();\n    if (!viewer) return;\n    const block = resolveMainBlock(id);\n    const lonPad = Math.max(0.35, (block.east - block.west) * 0.22);\n    const latPad = Math.max(0.3, (block.north - block.south) * 0.22);\n    viewer.camera.flyTo({\n      destination: Rectangle.fromDegrees(\n        block.west - lonPad,\n        block.south - latPad,\n        block.east + lonPad,\n        block.north + latPad\n      ),\n      duration: cameraDuration(0.62),\n      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)\n    });\n  };\n\n  const fitIndianOceanBlocks = () => {\n    const viewer = cancelCameraAnimation();\n    if (!viewer) return;\n    viewer.camera.flyTo({\n      destination: Rectangle.fromDegrees(\n        TARGET_DOMAIN.west - 1.5,\n        TARGET_DOMAIN.south - 2,\n        TARGET_DOMAIN.east + 1.5,\n        TARGET_DOMAIN.north + 2\n      ),\n      duration: cameraDuration(0.72),\n      complete: () => setCameraHeight(viewer.camera.positionCartographic.height)\n    });\n  };\n\n  const showEarthView = () => {''',
        "OceanGlobe fit main block functions",
    )

    text = replace_once(
        text,
        '      data-selected-imported-profile={selectedImportedProfileId}\n    >',
        '      data-selected-imported-profile={selectedImportedProfileId}\n      data-main-block-count={TARGET_BLOCK_COUNT}\n      data-active-main-block={activeMainBlock.id}\n      data-active-main-block-materialization={isVerifiedBaseline(activeMainBlock) ? "verified-baseline" : "planned"}\n    >',
        "OceanGlobe data attributes",
    )

    text = replace_once(
        text,
        '      <div ref={containerRef} className="cesium-host" />\n      <div className="renderer-tools" aria-label="Ocean view tools">',
        '''      <div ref={containerRef} className="cesium-host" />\n      <section\n        className="main-block-globe-hud"\n        data-testid="integrated-main-block-hud"\n        data-intro-ready={introPhase === "region" ? "true" : "false"}\n        aria-label="Integrated Indian Ocean main block controls"\n      >\n        <div className="main-block-globe-heading">\n          <div>\n            <span>INDIAN OCEAN MAIN EARTH MODEL</span>\n            <strong>{activeMainBlock.id} · {activeMainBlockRegion(activeMainBlock)}</strong>\n            <small>{blockBoundsLabel(activeMainBlock)}</small>\n          </div>\n          <span className={`main-block-status-pill ${isVerifiedBaseline(activeMainBlock) ? "verified" : ""}`}>\n            {isVerifiedBaseline(activeMainBlock) ? "Verified volume" : "Planned target"}\n          </span>\n        </div>\n        <label>\n          <span>Active main block</span>\n          <select\n            aria-label="Active main block"\n            value={activeMainBlock.id}\n            onChange={(event) => {\n              selectMainBlock(event.target.value);\n              window.setTimeout(() => fitMainBlock(event.target.value), 0);\n            }}\n          >\n            <option value={CURRENT_VERIFIED_BASELINE.id}>BASE-GLORYS-001 · verified 67–70°E / 12–14°N</option>\n            {INDIAN_OCEAN_MAIN_BLOCKS.map((block) => (\n              <option key={block.id} value={block.id}>\n                {block.id} · {block.region} · {block.west}–{block.east}°E / {block.south}–{block.north}°N\n              </option>\n            ))}\n          </select>\n        </label>\n        <div className="main-block-globe-stats" aria-label="Main block materialization status">\n          <div><span>Logical grid</span><strong>{TARGET_BLOCK_COUNT} blocks</strong></div>\n          <div><span>New volumes</span><strong>0 materialized</strong></div>\n          <div><span>Verified now</span><strong>1 baseline</strong></div>\n        </div>\n        <div className="main-block-grid-key" aria-label="Block map legend">\n          <span><i /> Planned footprint</span>\n          <span className="verified"><i /> Verified baseline</span>\n          <span className="active"><i /> Active selection</span>\n        </div>\n        <div className="main-block-globe-actions">\n          <button type="button" onClick={() => fitMainBlock()}>Fit selected block</button>\n          <button type="button" onClick={fitIndianOceanBlocks}>Fit 140-block field</button>\n          <button\n            type="button"\n            className="primary"\n            disabled={!canEnterWaterColumn}\n            onClick={() => enterWaterColumnRef.current()}\n          >\n            Open in Water Column 3D\n          </button>\n          <button type="button" onClick={() => { selectMainBlock(CURRENT_VERIFIED_BASELINE.id); fitMainBlock(CURRENT_VERIFIED_BASELINE.id); }}>\n            Verified baseline\n          </button>\n        </div>\n        <p className="main-block-globe-boundary-note">\n          {isVerifiedBaseline(activeMainBlock)\n            ? <>This footprint carries the <strong>current source-backed GLORYS volume</strong>.</>\n            : <>This footprint is integrated into the Earth model but carries <strong>no copied or synthetic ocean values</strong> until materialized from source data.</>}\n        </p>\n      </section>\n      <div className="renderer-tools" aria-label="Ocean view tools">''',
        "OceanGlobe integrated HUD",
    )

    text = replace_once(
        text,
        '<span className={introPhase === "flying" || introPhase === "region" ? "active" : ""}>03 Ocean field</span>',
        '<span className={introPhase === "flying" || introPhase === "region" ? "active" : ""}>03 140-block ocean field</span>',
        "OceanGlobe journey stop label",
    )

    text = replace_once(
        text,
        ': "03 · VERIFIED OCEAN FIELD"}',
        ': "03 · INDIAN OCEAN / 140-BLOCK FIELD"}',
        "OceanGlobe intro status label",
    )
    text = replace_once(
        text,
        ': "From map pixels to a measurable water column."}',
        ': "140 geographic targets around one verified water column."}',
        "OceanGlobe intro status title",
    )
    text = replace_once(
        text,
        ': "67–70°E · 12–14°N · verified GLORYS depth fields, real observation profiles and an explainable path beneath the surface."}',
        ': "60–100°E · 5–25°N · 140 selectable target footprints are now part of the main Earth model; the 67–70°E · 12–14°N GLORYS baseline remains the only materialized volume."}',
        "OceanGlobe intro status copy",
    )

    text = replace_once(
        text,
        '<strong>INDIAN OCEAN · VERIFIED WINDOW</strong>',
        '<strong>INDIAN OCEAN · INTEGRATED MAIN-BLOCK FIELD</strong>',
        "OceanGlobe judge summary heading",
    )
    text = replace_once(
        text,
        '<span>67–70°E · 12–14°N · {profiles.length} Argo comparison profiles · {importedProfiles.length} sensor plugin profiles</span>',
        '<span>{TARGET_BLOCK_COUNT} target footprints · active {activeMainBlock.id} · verified science remains 67–70°E / 12–14°N · {profiles.length} Argo comparison profiles</span>',
        "OceanGlobe judge summary geography",
    )

    path.write_text(text, encoding="utf-8")


def patch_water_column() -> None:
    path = ROOT / "frontend/src/components/WaterColumn3D.tsx"
    text = path.read_text(encoding="utf-8")

    text = replace_once(
        text,
        'import { paletteCssGradient, paletteHsl } from "../palettes";\nimport { CameraOrientationHud, type CameraPreset } from "./CameraOrientationHud";',
        '''import { paletteCssGradient, paletteHsl } from "../palettes";\nimport { CURRENT_VERIFIED_BASELINE, blockBoundsLabel, type OceanMainBlock } from "../main-block-engine";\nimport {\n  activeMainBlockRegion,\n  isVerifiedBaseline,\n  publishActiveMainBlockId,\n  readActiveMainBlockId,\n  resolveMainBlock,\n  subscribeActiveMainBlock\n} from "../main-block-runtime";\nimport { CameraOrientationHud, type CameraPreset } from "./CameraOrientationHud";''',
        "WaterColumn imports",
    )

    export_marker = 'export function WaterColumn3D({'
    planned_component = r'''function PlannedMainBlockShell({ block, theme }: { block: OceanMainBlock; theme: "dark" | "light" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const dark = theme === "dark";
      const background = context.createRadialGradient(width * 0.5, height * 0.4, 10, width * 0.5, height * 0.45, Math.max(width, height) * 0.72);
      background.addColorStop(0, dark ? "#0a2a3b" : "#f6fbfd");
      background.addColorStop(1, dark ? "#01070c" : "#dceaf0");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const yaw = -0.72;
      const pitch = -0.46;
      const scale = Math.min(width * 0.76, Math.max(180, height - 150) * 0.86);
      const project = (x: number, y: number, z: number) => {
        const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
        const x1 = x * cosYaw - z * sinYaw;
        const z1 = x * sinYaw + z * cosYaw;
        const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
        const y1 = y * cosPitch - z1 * sinPitch;
        const z2 = y * sinPitch + z1 * cosPitch;
        const perspective = 1 / Math.max(2.25, 3.1 + z2 * 0.48);
        return { x: width * 0.52 + x1 * scale * perspective, y: height * 0.48 + y1 * scale * perspective };
      };

      const corners = [
        [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1],
        [-1, 1.7, -1], [1, 1.7, -1], [1, 1.7, 1], [-1, 1.7, 1]
      ] as const;
      const points = corners.map(([x, y, z]) => project(x, y, z));
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ] as const;
      context.strokeStyle = dark ? "rgba(111,230,250,.78)" : "rgba(18,121,153,.72)";
      context.lineWidth = 1.5;
      for (const [a, b] of edges) {
        context.beginPath();
        context.moveTo(points[a].x, points[a].y);
        context.lineTo(points[b].x, points[b].y);
        context.stroke();
      }

      for (let layer = 1; layer < 5; layer += 1) {
        const y = (layer / 5) * 1.7;
        const layerPoints = [project(-1, y, -1), project(1, y, -1), project(1, y, 1), project(-1, y, 1)];
        context.beginPath();
        layerPoints.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
        context.closePath();
        context.strokeStyle = dark ? "rgba(100,190,218,.19)" : "rgba(45,104,126,.18)";
        context.lineWidth = 1;
        context.stroke();
      }

      context.fillStyle = dark ? "rgba(210,240,247,.72)" : "rgba(31,75,91,.74)";
      context.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      context.fillText(`${block.west.toFixed(0)}°E`, points[0].x - 18, points[0].y - 8);
      context.fillText(`${block.east.toFixed(0)}°E`, points[1].x - 2, points[1].y - 8);
      context.fillText(`${block.south.toFixed(0)}°N`, points[0].x - 18, points[0].y + 16);
      context.fillText(`${block.north.toFixed(0)}°N`, points[3].x - 18, points[3].y + 16);
      context.fillText("SOURCE DEPTH AXIS PENDING", points[7].x + 8, points[7].y);
    };

    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [block, theme]);

  return (
    <main
      className="globe-shell water-column-shell planned-main-block-shell"
      data-main-block-id={block.id}
      data-materialization="planned"
      data-scientific-values="0"
      aria-label={`Planned Water Column 3D shell for ${block.id}`}
    >
      <canvas ref={canvasRef} className="planned-main-block-canvas" aria-hidden="true" />
      <section className="main-block-water-shell-summary" data-testid="planned-main-block-shell">
        <div className="main-block-water-shell-heading">
          <div>
            <span>INTEGRATED WATER COLUMN TARGET</span>
            <strong>PLANNED TARGET · NO MATERIALIZED VOLUME</strong>
            <small>{block.id} · {activeMainBlockRegion(block)} · {blockBoundsLabel(block)}</small>
          </div>
          <span className="main-block-status-pill">0 values</span>
        </div>
        <dl className="main-block-water-shell-meta">
          <div><dt>Geographic footprint</dt><dd>{blockBoundsLabel(block)}</dd></div>
          <div><dt>Source plan</dt><dd>GLORYS12V1 historical + verified operational companion</dd></div>
          <div><dt>Variables reserved</dt><dd>Temperature · Salinity · horizontal currents</dd></div>
          <div><dt>Time hierarchy</dt><dd>Block → date → native time → variable → depth</dd></div>
          <div><dt>Depth geometry</dt><dd>Source depth axis pending genuine materialization</dd></div>
          <div><dt>Scientific values</dt><dd>0 bundled for this target; none copied from the baseline</dd></div>
        </dl>
        <div className="main-block-water-shell-actions">
          <button type="button" onClick={() => publishActiveMainBlockId(CURRENT_VERIFIED_BASELINE.id)}>
            Return to verified baseline volume
          </button>
        </div>
      </section>
      <div className="main-block-water-shell-disclosure" role="status">
        <strong>SCIENTIFIC BOUNDARY</strong>
        <span>This is the real geographic shell for {block.id}, integrated into the same Water Column 3D workflow.</span>
        <small>No temperature, salinity, current or depth values are fabricated. Phase 3.5B can replace this empty shell only after a genuine source-backed volume is acquired and verified.</small>
      </div>
    </main>
  );
}

'''
    text = replace_once(text, export_marker, planned_component + export_marker, "WaterColumn planned shell component")

    text = replace_once(
        text,
        '  const [hover, setHover] = useState<HoverPoint | null>(null);\n\n  const depthLevels = useMemo(() => {',
        '''  const [hover, setHover] = useState<HoverPoint | null>(null);\n  const [activeMainBlockId, setActiveMainBlockId] = useState(readActiveMainBlockId);\n  const activeMainBlock = resolveMainBlock(activeMainBlockId);\n\n  useEffect(() => subscribeActiveMainBlock(setActiveMainBlockId), []);\n\n  const depthLevels = useMemo(() => {''',
        "WaterColumn active block state",
    )

    text = replace_once(
        text,
        '''  if (!volume && !currentsVolume) {\n    return (''',
        '''  if (!isVerifiedBaseline(activeMainBlock)) {\n    return <PlannedMainBlockShell block={activeMainBlock} theme={theme} />;\n  }\n\n  if (!volume && !currentsVolume) {\n    return (''',
        "WaterColumn planned selection return",
    )

    text = replace_once(
        text,
        '      data-current-depth-count={currentsVolume?.depths_m.length ?? 0}\n    >',
        '      data-current-depth-count={currentsVolume?.depths_m.length ?? 0}\n      data-main-block-id={CURRENT_VERIFIED_BASELINE.id}\n      data-materialization="verified-baseline"\n    >',
        "WaterColumn baseline data attributes",
    )

    text = replace_once(
        text,
        '      <canvas\n        ref={canvasRef}',
        '''      <div className="water-column-main-block-context" aria-label="Active verified main block">\n        <span>ACTIVE MAIN BLOCK</span>\n        <strong>{CURRENT_VERIFIED_BASELINE.id} · VERIFIED VOLUME</strong>\n        <small>{blockBoundsLabel(CURRENT_VERIFIED_BASELINE)} · 31 verified depth levels · current source-backed GLORYS baseline</small>\n      </div>\n      <canvas\n        ref={canvasRef}''',
        "WaterColumn baseline context",
    )

    path.write_text(text, encoding="utf-8")


def patch_main() -> None:
    path = ROOT / "frontend/src/main.tsx"
    text = path.read_text(encoding="utf-8")
    if 'import "./main-block-globe-integration.css";' not in text:
        text = replace_once(
            text,
            'import "./theme-gallery-alignment.css";',
            'import "./theme-gallery-alignment.css";\nimport "./main-block-globe-integration.css";',
            "main CSS import",
        )
    path.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    patch_ocean_globe()
    patch_water_column()
    patch_main()
    print("Phase 3.5A globe + water-column integration patch applied.")
