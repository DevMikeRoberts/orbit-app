"use client";

import { useState } from "react";
import type { WizardState } from "../CreateWizard";

export function DeployStep({
  state,
  deployedId,
  onDeploy,
}: {
  state: WizardState;
  deployedId: string | null;
  onDeploy: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const launch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name,
          handle: state.handle,
          email: state.email,
          title: state.title || undefined,
          locations: state.locations,
          projects: state.projects,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Deploy failed");
      }
      const { id } = await res.json() as { id: string };
      onDeploy(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fullUrl =
    typeof window !== "undefined" && deployedId
      ? `${window.location.origin}/${deployedId}`
      : deployedId
        ? `/${deployedId}`
        : null;

  const copy = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (deployedId) {
    return (
      <div className="wizard-step-content wizard-step-content--center">
        <div className="wizard-deploy-success">
          <div className="wizard-deploy-confetti">🎉</div>
          <h2 className="wizard-step-title">
            Your Orbit is live<span className="wizard-period">.</span>
          </h2>
          <p className="wizard-step-sub">
            Share your globe with the world. It&apos;s live at:
          </p>

          <div className="wizard-url-box">
            <code className="wizard-url-text">{fullUrl}</code>
            <button className="wizard-copy-btn" onClick={copy}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          <div className="wizard-deploy-actions">
            <a
              href={`/${deployedId}`}
              className="wizard-btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit your Orbit →
            </a>
            <a href="/create" className="wizard-btn-ghost">
              Create another
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-step-content wizard-step-content--center">
      <div className="wizard-step-header">
        <div className="wizard-step-eyebrow">Step 5 of 5</div>
        <h2 className="wizard-step-title">
          Ready to launch<span className="wizard-period">?</span>
        </h2>
        <p className="wizard-step-sub">
          Here&apos;s what&apos;s going into your Orbit:
        </p>
      </div>

      <div className="wizard-summary">
        <div className="wizard-summary-row">
          <span className="wizard-summary-label">Name</span>
          <span className="wizard-summary-value">{state.name}</span>
        </div>
        <div className="wizard-summary-row">
          <span className="wizard-summary-label">Handle</span>
          <span className="wizard-summary-value">{state.handle || "—"}</span>
        </div>
        <div className="wizard-summary-row">
          <span className="wizard-summary-label">Email</span>
          <span className="wizard-summary-value">{state.email}</span>
        </div>
        {state.title && (
          <div className="wizard-summary-row">
            <span className="wizard-summary-label">Title</span>
            <span className="wizard-summary-value">{state.title}</span>
          </div>
        )}
        <div className="wizard-summary-row">
          <span className="wizard-summary-label">Locations</span>
          <span className="wizard-summary-value">
            {state.locations.length > 0
              ? state.locations.map((l) => l.city).join(", ")
              : "None"}
          </span>
        </div>
        <div className="wizard-summary-row">
          <span className="wizard-summary-label">Projects</span>
          <span className="wizard-summary-value">
            {state.projects.length > 0
              ? `${state.projects.length} project${state.projects.length !== 1 ? "s" : ""}`
              : "None"}
          </span>
        </div>
      </div>

      {error && <p className="wizard-error">{error}</p>}

      <button
        className="wizard-btn-primary wizard-btn-launch"
        onClick={launch}
        disabled={loading}
      >
        {loading ? "Launching…" : "🚀 Launch my Orbit"}
      </button>
    </div>
  );
}
