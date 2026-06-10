"use client";

import { useEffect } from "react";
import type { WizardState } from "../CreateWizard";

export function IdentityStep({
  state,
  patch,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
}) {
  useEffect(() => {
    if (state.name && !state.handle) {
      const slug = state.name.toLowerCase().replace(/\s+/g, "");
      patch({ handle: `@${slug}` });
    }
  }, [state.name]);

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <div className="wizard-step-eyebrow">Step 1 of 5</div>
        <h2 className="wizard-step-title">
          Tell us about yourself<span className="wizard-period">.</span>
        </h2>
        <p className="wizard-step-sub">
          This becomes the top-level identity on your globe.
        </p>
      </div>

      <div className="wizard-fields">
        <div className="wizard-field">
          <label className="wizard-label" htmlFor="name">
            Full name <span className="wizard-required">*</span>
          </label>
          <input
            id="name"
            className="wizard-input"
            type="text"
            placeholder="Alex Chen"
            value={state.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().replace(/\s+/g, "");
              patch({ name, handle: `@${slug}` });
            }}
            autoFocus
          />
        </div>

        <div className="wizard-field">
          <label className="wizard-label" htmlFor="handle">
            Handle
          </label>
          <input
            id="handle"
            className="wizard-input"
            type="text"
            placeholder="@alexchen"
            value={state.handle}
            onChange={(e) => patch({ handle: e.target.value })}
          />
          <span className="wizard-hint">
            Shown in the top-left of your globe page
          </span>
        </div>

        <div className="wizard-field">
          <label className="wizard-label" htmlFor="email">
            Email <span className="wizard-required">*</span>
          </label>
          <input
            id="email"
            className="wizard-input"
            type="email"
            placeholder="hello@example.com"
            value={state.email}
            onChange={(e) => patch({ email: e.target.value })}
          />
          <span className="wizard-hint">
            Shown on your Contact page — make it one you want to receive mail at
          </span>
        </div>

        <div className="wizard-field">
          <label className="wizard-label" htmlFor="title">
            Job title
          </label>
          <input
            id="title"
            className="wizard-input"
            type="text"
            placeholder="Software Engineer"
            value={state.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
