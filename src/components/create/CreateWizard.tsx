"use client";

import { useState } from "react";
import { WizardNav } from "./WizardNav";
import { IdentityStep } from "./steps/IdentityStep";
import { LocationsStep } from "./steps/LocationsStep";
import { ProjectsStep } from "./steps/ProjectsStep";
import { PreviewStep } from "./steps/PreviewStep";
import { DeployStep } from "./steps/DeployStep";
import type { ProfileLocation, ProfileProject } from "@/types/profile";

export interface WizardState {
  name: string;
  handle: string;
  email: string;
  title: string;
  locations: ProfileLocation[];
  projects: ProfileProject[];
}

const EMPTY: WizardState = {
  name: "",
  handle: "",
  email: "",
  title: "",
  locations: [],
  projects: [],
};

const STEPS = [
  { id: "identity", label: "You" },
  { id: "locations", label: "Places" },
  { id: "projects", label: "Projects" },
  { id: "preview", label: "Preview" },
  { id: "deploy", label: "Launch" },
];

export function CreateWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(EMPTY);
  const [deployedId, setDeployedId] = useState<string | null>(null);

  const patch = (partial: Partial<WizardState>) =>
    setState((s) => ({ ...s, ...partial }));

  const canAdvance = () => {
    if (step === 0) return state.name.trim() !== "" && state.email.trim() !== "";
    return true;
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onDeployed = (id: string) => {
    setDeployedId(id);
    setStep(4);
  };

  return (
    <div className="wizard-root">
      <div className="wizard-shell">
        <WizardNav steps={STEPS} current={step} />

        <div className="wizard-body">
          {step === 0 && <IdentityStep state={state} patch={patch} />}
          {step === 1 && <LocationsStep state={state} patch={patch} />}
          {step === 2 && <ProjectsStep state={state} patch={patch} />}
          {step === 3 && <PreviewStep state={state} />}
          {step === 4 && <DeployStep state={state} deployedId={deployedId} onDeploy={onDeployed} />}
        </div>

        {step < 4 && (
          <div className="wizard-footer">
            {step > 0 ? (
              <button className="wizard-btn-ghost" onClick={back}>
                ← Back
              </button>
            ) : (
              <a href="/" className="wizard-btn-ghost">
                ← Home
              </a>
            )}

            {step < 3 ? (
              <button
                className="wizard-btn-primary"
                onClick={next}
                disabled={!canAdvance()}
              >
                Continue →
              </button>
            ) : step === 3 ? (
              <button
                className="wizard-btn-primary"
                onClick={() => setStep(4)}
              >
                Looks good →
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
