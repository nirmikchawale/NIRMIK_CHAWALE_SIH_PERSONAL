interface Props {
  evidenceOpen: boolean;
  provenanceOpen: boolean;
  observationOpen: boolean;
  profileAvailable: boolean;
  scientificError: string;
  onEvidence: () => void;
  onProvenance: () => void;
  onObservation: () => void;
  onClose: () => void;
}

/**
 * MPR-15: accessible entry points to the ORIGINAL inspector components.
 * The linked scientific data, source status and model/observation math
 * stay in their existing owners, rather than a decorative cloned drawer.
 */
export function ExplorerInspectorAccess({
  evidenceOpen, provenanceOpen, observationOpen, profileAvailable, scientificError,
  onEvidence, onProvenance, onObservation, onClose
}: Props) {
  const anyOpen = evidenceOpen || provenanceOpen || observationOpen;
  return (
    <nav className="mpr-inspector-access"
      aria-label="Ocean Canvas inspector and quality-control access"
      data-testid="mpr-15-inspector-access">
      <div className="mpr-inspector-access-heading">
        <span>SCIENTIFIC INSPECTION</span>
        <strong>Inspect the current source</strong>
        <small>{scientificError
          ? "Scientific evidence is degraded; check source provenance and reported limitations."
          : "Actual model, observation and quality-control inspectors."}</small>
      </div>
      <div className="mpr-inspector-access-actions" role="group"
        aria-label="Scientific inspector actions">
        <button type="button" aria-expanded={evidenceOpen}
          aria-label="Open current evidence inspector"
          onClick={onEvidence}>Field evidence ↗</button>
        <button type="button" aria-expanded={provenanceOpen}
          aria-label="Open scientific provenance drawer"
          onClick={onProvenance}>Sources &amp; QC ↗</button>
        <button type="button" aria-expanded={observationOpen}
          aria-label="Open selected observation inspector"
          disabled={!profileAvailable}
          title={profileAvailable?"Inspect actual selected profile":"Select an eligible source-backed observation first"}
          onClick={onObservation}>Selected profile ↗</button>
        <button type="button" aria-label="Close scientific inspectors"
          disabled={!anyOpen} onClick={onClose}>Close inspectors</button>
      </div>
      <small className="mpr-inspector-keyboard-help">
        Keyboard: Tab to choose an inspector, Enter to open, Escape to close.
        Unavailable source evidence remains explicitly unavailable.
      </small>
    </nav>
  );
}
