"use client";

import { useState } from "react";
import type { WizardState } from "../CreateWizard";
import type { ProfileProject } from "@/types/profile";
import { PIN_COLORS } from "@/types/profile";

function newProject(): ProfileProject {
  return {
    title: "",
    blurb: "",
    github: null,
    url: null,
    tags: [],
    accent: PIN_COLORS[0],
  };
}

export function ProjectsStep({
  state,
  patch,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
}) {
  const [editing, setEditing] = useState<ProfileProject | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const save = (p: ProfileProject) => {
    const updated =
      editIndex !== null
        ? state.projects.map((x, i) => (i === editIndex ? p : x))
        : [...state.projects, p];
    patch({ projects: updated });
    setEditing(null);
    setEditIndex(null);
  };

  const remove = (i: number) =>
    patch({ projects: state.projects.filter((_, idx) => idx !== i) });

  const startAdd = () => {
    setEditing(newProject());
    setEditIndex(null);
  };

  const startEdit = (p: ProfileProject, i: number) => {
    setEditing({ ...p, tags: [...p.tags] });
    setEditIndex(i);
  };

  if (editing) {
    return (
      <ProjectEditor
        project={editing}
        onChange={setEditing}
        onSave={save}
        onCancel={() => {
          setEditing(null);
          setEditIndex(null);
        }}
      />
    );
  }

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <div className="wizard-step-eyebrow">Step 3 of 5</div>
        <h2 className="wizard-step-title">
          Your projects<span className="wizard-period">.</span>
        </h2>
        <p className="wizard-step-sub">
          Showcase your best work. Add links, tags, and a short description for
          each project.
        </p>
      </div>

      {state.projects.length === 0 ? (
        <div className="wizard-empty">
          <span className="wizard-empty-icon">🚀</span>
          <p>No projects yet. Add your first one below.</p>
        </div>
      ) : (
        <ul className="wizard-project-list">
          {state.projects.map((p, i) => (
            <li key={i} className="wizard-project-item">
              <span
                className="wizard-project-accent"
                style={{ background: p.accent }}
              />
              <div className="wizard-project-info">
                <span className="wizard-project-title">
                  {p.title || "Untitled"}
                </span>
                <span className="wizard-project-blurb">{p.blurb}</span>
              </div>
              <div className="wizard-location-actions">
                <button
                  className="wizard-icon-btn"
                  onClick={() => startEdit(p, i)}
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  className="wizard-icon-btn wizard-icon-btn--danger"
                  onClick={() => remove(i)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button className="wizard-add-btn" onClick={startAdd}>
        + Add a project
      </button>
    </div>
  );
}

function ProjectEditor({
  project,
  onChange,
  onSave,
  onCancel,
}: {
  project: ProfileProject;
  onChange: (p: ProfileProject) => void;
  onSave: (p: ProfileProject) => void;
  onCancel: () => void;
}) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !project.tags.includes(t)) {
      onChange({ ...project, tags: [...project.tags, t] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    onChange({ ...project, tags: project.tags.filter((t) => t !== tag) });

  const valid = project.title.trim() !== "";

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <button className="wizard-back-link" onClick={onCancel}>
          ← Back to projects
        </button>
        <h2 className="wizard-step-title">
          Edit project<span className="wizard-period">.</span>
        </h2>
      </div>

      <div className="wizard-fields">
        <div className="wizard-field">
          <label className="wizard-label">
            Project name <span className="wizard-required">*</span>
          </label>
          <input
            className="wizard-input"
            type="text"
            placeholder="My Awesome App"
            value={project.title}
            onChange={(e) => onChange({ ...project, title: e.target.value })}
            autoFocus
          />
        </div>

        <div className="wizard-field">
          <label className="wizard-label">Description</label>
          <textarea
            className="wizard-textarea"
            rows={3}
            placeholder="What does it do? What makes it interesting?"
            value={project.blurb}
            onChange={(e) => onChange({ ...project, blurb: e.target.value })}
          />
        </div>

        <div className="wizard-field-row">
          <div className="wizard-field">
            <label className="wizard-label">GitHub URL</label>
            <input
              className="wizard-input"
              type="url"
              placeholder="https://github.com/you/repo"
              value={project.github ?? ""}
              onChange={(e) =>
                onChange({ ...project, github: e.target.value || null })
              }
            />
          </div>
          <div className="wizard-field">
            <label className="wizard-label">Live URL</label>
            <input
              className="wizard-input"
              type="url"
              placeholder="https://myapp.com"
              value={project.url ?? ""}
              onChange={(e) =>
                onChange({ ...project, url: e.target.value || null })
              }
            />
          </div>
        </div>

        <div className="wizard-field">
          <label className="wizard-label">Tags</label>
          <div className="wizard-tag-row">
            {project.tags.map((t) => (
              <span key={t} className="wizard-tag">
                {t}
                <button
                  className="wizard-tag-remove"
                  onClick={() => removeTag(t)}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              className="wizard-input wizard-input--inline"
              type="text"
              placeholder="Add tag…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
          </div>
          <span className="wizard-hint">Press Enter or comma to add a tag</span>
        </div>

        <div className="wizard-field">
          <label className="wizard-label">Accent color</label>
          <div className="wizard-color-row">
            {PIN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`wizard-color-swatch ${
                  project.accent === c ? "wizard-color-swatch--active" : ""
                }`}
                style={{ background: c }}
                onClick={() => onChange({ ...project, accent: c })}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="wizard-editor-footer">
        <button className="wizard-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="wizard-btn-primary"
          disabled={!valid}
          onClick={() => onSave(project)}
        >
          Save project
        </button>
      </div>
    </div>
  );
}
