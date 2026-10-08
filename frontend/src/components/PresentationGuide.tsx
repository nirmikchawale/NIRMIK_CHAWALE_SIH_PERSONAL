import { useEffect, useState } from "react";

const STEPS = [
  { title: "Start with the numerical ocean field", body: "Open the verified GLORYS temperature field in geographic 3D. Establish the Indian Ocean study window, model source and real coordinates before discussing analytics." },
  { title: "Go beneath the surface", body: "Change depth, enter Water Column 3D and show genuine depth coordinates. Briefly demonstrate one required rendering control such as opacity, color range or isosurface." },
  { title: "Show genuine ocean time", body: "Switch to the INCOIS multi-time physical source. Move through real timestamps or start playback and state explicitly that the GLORYS comparison baseline itself remains single-time." },
  { title: "Inspect a real in-situ sensor", body: "Return to the geographic Explorer and open a Glider, CTD or BGC profile. Point out position, UTC time, depth, variable, QC/source provenance and the observed profile shape." },
  { title: "Compare model and observation", body: "Open the Argo diagnostic comparison. Explain collocation, vertical matching, Model − Observation bias, MAE/RMSE and why this is diagnostic rather than independent validation." },
  { title: "Finish with trust and scale", body: "Open sources, QC and provenance. Explain that bounded verified windows prove the architecture; scheduled acquisition, cache services and additional adapters are the path to continuous operations." }
]

export function PresentationGuide({ onStep, onClose }: { onStep: (step: number) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const advance = (next: number) => {
    const bounded = Math.max(0, Math.min(STEPS.length - 1, next));
    setStep(bounded);
    onStep(bounded);
  };

  return (
    <section className="presentation-guide" aria-label="Presentation guide" data-testid="presentation-guide">
      <header className="presentation-guide-header">
        <div>
          <span className="eyebrow">JUDGE PRESENTATION · {String(step + 1).padStart(2, "0")} / {STEPS.length}</span>
          <h2>{STEPS[step].title}</h2>
        </div>
        <button type="button" className="presentation-guide-close" aria-label="Close presentation guide" onClick={onClose}>×</button>
      </header>
      <progress className="presentation-guide-progress" aria-label="Presentation step progress" max={STEPS.length} value={step + 1} />
      <div className="presentation-guide-content"><p>{STEPS[step].body}</p></div>
      <nav className="guide-actions" aria-label="Presentation step controls">
        <button type="button" onClick={() => onStep(step)}>Show this step</button>
        <button type="button" disabled={step === 0} onClick={() => advance(step - 1)}>Back</button>
        <button type="button" disabled={step === STEPS.length - 1} onClick={() => advance(step + 1)}>Next →</button>
        <button type="button" onClick={onClose}>Close</button>
      </nav>
    </section>
  );
}
