"use client";

interface Step {
  id: string;
  label: string;
}

export function WizardNav({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <div className="wizard-nav">
      <div className="wizard-brand">
        <span className="wizard-brand-icon">🌍</span>
        <span className="wizard-brand-name">Orbit</span>
      </div>

      <div className="wizard-steps">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`wizard-step ${
              i < current
                ? "wizard-step--done"
                : i === current
                  ? "wizard-step--active"
                  : "wizard-step--future"
            }`}
          >
            <span className="wizard-step-dot">
              {i < current ? "✓" : String(i + 1)}
            </span>
            <span className="wizard-step-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
