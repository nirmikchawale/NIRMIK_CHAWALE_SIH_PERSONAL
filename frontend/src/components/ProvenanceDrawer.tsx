import type { MainBlockProvenanceEvidence } from "../main-block-provenance";
import type { ProvenanceResponse } from "../types";

export function ProvenanceDrawer({
  open,
  provenance,
  blockEvidence,
  onClose
}: {
  open: boolean;
  provenance: ProvenanceResponse | null;
  blockEvidence?: MainBlockProvenanceEvidence | null;
  onClose: () => void;
}) {
  if (!open) return null;

  const activeRuntimeProvenanceAllowed =
    !blockEvidence || blockEvidence.evidenceAvailability !== "withheld";

  return (
    <aside className="provenance-drawer" aria-label="Scientific provenance and quality control">
      <div className="drawer-heading">
        <div>
          <div className="section-kicker">Evidence trace</div>
          <h2>Sources · QC · Provenance</h2>
        </div>
        <button onClick={onClose} aria-label="Close provenance drawer">×</button>
      </div>

      {blockEvidence && (
        <section
          data-testid="active-block-provenance-evidence"
          data-block-id={blockEvidence.blockId}
          data-materialization={blockEvidence.materialization}
          data-evidence-class={blockEvidence.evidenceClass}
          data-evidence-availability={blockEvidence.evidenceAvailability}
          data-checksum-count={blockEvidence.payloadChecksums.length}
          data-observation-evidence={blockEvidence.observationEvidence.evidenceClass}
          data-observation-count={blockEvidence.observationEvidence.profileCount}
          data-model-observation-validated={blockEvidence.observationEvidence.modelObservationValidated ? "true" : "false"}
        >
          <h3>Active block evidence</h3>
          <strong>{blockEvidence.blockId} · {blockEvidence.evidenceClass}</strong>
          <p>{blockEvidence.summary}</p>
          <dl>
            <dt>Materialization</dt><dd>{blockEvidence.materialization}</dd>
            <dt>Evidence status</dt><dd>{blockEvidence.evidenceAvailability}</dd>
            <dt>Model evidence</dt><dd>{blockEvidence.modelEvidenceAvailable ? "Attached" : "Withheld"}</dd>
            <dt>Source integrity</dt><dd>{blockEvidence.sourceIntegrityValidated ? "Validated" : "Not claimed"}</dd>
            <dt>Renderer acceptance</dt><dd>{blockEvidence.rendererAcceptanceValidated ? "Validated" : "Not claimed"}</dd>
            <dt>Observation role</dt><dd>{blockEvidence.observationEvidence.evidenceClass}</dd>
            <dt>Observation profiles</dt><dd>{blockEvidence.observationEvidence.profileCount}</dd>
            <dt>Model ↔ observation validation</dt><dd>{blockEvidence.observationEvidence.modelObservationValidated ? "Attached" : "Not attached"}</dd>
          </dl>

          {blockEvidence.payloadChecksums.length > 0 && (
            <>
              <h3>Payload SHA-256 evidence</h3>
              <dl data-testid="active-block-checksum-evidence">
                {blockEvidence.payloadChecksums.slice(0, 4).map((payload) => (
                  <div key={`${payload.date}:${payload.path}`}>
                    <dt>{payload.date}</dt>
                    <dd><code>{payload.sha256.slice(0, 16)}…</code></dd>
                  </div>
                ))}
              </dl>
              {blockEvidence.payloadChecksums.length > 4 && (
                <small>+ {blockEvidence.payloadChecksums.length - 4} additional canonical manifest checksum records.</small>
              )}
            </>
          )}

          {blockEvidence.withheldClaims.length > 0 && (
            <p className="diagnostic-note">
              <strong>Withheld claims:</strong> {blockEvidence.withheldClaims.join(" ")}
            </p>
          )}
        </section>
      )}

      {!provenance ? (
        <p className="drawer-muted">Provenance metadata is unavailable. Active scientific claims remain limited to evidence shown above.</p>
      ) : !activeRuntimeProvenanceAllowed ? (
        <section data-testid="active-block-runtime-provenance-withheld">
          <h3>Active model provenance</h3>
          <p className="drawer-muted">
            No materialized scientific payload is attached to this active block, so verified baseline fallback metadata is intentionally not presented as active-block provenance.
          </p>
        </section>
      ) : (
        <>
          <section>
            <h3>Model source</h3>
            <strong>{provenance.model.label}</strong>
            <p>{provenance.model.product}</p>
            <dl>
              <dt>Dataset</dt><dd>{provenance.model.dataset_id}</dd>
              <dt>DOI</dt><dd>{provenance.model.doi}</dd>
              <dt>Runtime</dt><dd>{provenance.model.runtime_mode}</dd>
              <dt>Freshness</dt><dd>{provenance.model.freshness_class}</dd>
            </dl>
          </section>

          <section>
            <h3>Observation source</h3>
            <strong>{provenance.observations.provider}</strong>
            <dl>
              <dt>DOI</dt><dd>{provenance.observations.doi}</dd>
              <dt>Matched profiles</dt><dd>{provenance.quality_control.matched_profiles}</dd>
              <dt>Accepted provider QC</dt><dd>{provenance.quality_control.accepted_provider_qc.join(", ") || "—"}</dd>
              <dt>Cell-distance cap</dt><dd>{provenance.quality_control.max_cell_distance_km ?? "—"} km</dd>
              <dt>Vertical extrapolation</dt><dd>{provenance.quality_control.no_extrapolation ? "Disabled" : "Not specified"}</dd>
            </dl>
          </section>

          <section>
            <h3>Comparison method</h3>
            <p>{provenance.methodology.horizontal}</p>
            <p>{provenance.methodology.depth}</p>
            <p>{provenance.quality_control.metrics_weighting}</p>
          </section>

          <section>
            <h3>Integrity</h3>
            <div className="drawer-badges">
              <span className={provenance.integrity.source_checksums_unchanged ? "badge success" : "badge"}>
                CHECKSUMS {provenance.integrity.source_checksums_unchanged ? "UNCHANGED" : "UNKNOWN"}
              </span>
              <span className={provenance.integrity.no_synthetic_measurements_in_outputs ? "badge success" : "badge"}>
                NO SYNTHETIC MEASUREMENTS
              </span>
            </div>
            <small>Config SHA · {provenance.integrity.configuration_sha256?.slice(0, 16) ?? "—"}…</small>
            <small>Engine SHA · {provenance.integrity.engine_sha256?.slice(0, 16) ?? "—"}…</small>
          </section>

          <p className="diagnostic-note">{provenance.scientific_disclaimer}</p>
        </>
      )}
    </aside>
  );
}
