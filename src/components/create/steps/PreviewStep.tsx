"use client";

import { useState } from "react";
import { GlobeScene } from "@/components/globe/GlobeScene";
import type { WizardState } from "../CreateWizard";

export function PreviewStep({ state }: { state: WizardState }) {
  const [view] = useState<"home">("home");

  const liveLocation =
    state.locations.find((l) => l.connectionType === "live") ??
    state.locations[0];

  const liveCoords = liveLocation
    ? { lat: liveLocation.lat, lng: liveLocation.lng }
    : undefined;

  return (
    <div className="wizard-step-content wizard-step-content--preview">
      <div className="wizard-preview-header">
        <div className="wizard-step-eyebrow">Step 4 of 5</div>
        <h2 className="wizard-step-title">
          Preview<span className="wizard-period">.</span>
        </h2>
        <p className="wizard-step-sub">
          This is how your globe will look. Drag to rotate, scroll to zoom.
        </p>
      </div>

      <div className="wizard-preview-globe">
        <div className="wizard-preview-bar">
          <span className="wizard-preview-handle">
            {state.handle || "@you"}
          </span>
          <div className="wizard-preview-nav">
            <span>Projects</span>
            <span>Contact</span>
          </div>
        </div>

        {state.locations.length > 0 ? (
          <GlobeScene
            view={view}
            locations={state.locations}
            liveLocation={liveCoords}
          />
        ) : (
          <div className="wizard-preview-empty">
            <span>🌍</span>
            <p>Add locations in the previous step to see them on your globe.</p>
          </div>
        )}
      </div>
    </div>
  );
}
