"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { View } from "@/components/ProfilePage";
import type { ProfileProject } from "@/types/profile";
import { PIN_COLORS } from "@/types/profile";
import { classifyProjectUrl } from "@/lib/projectUrl";

export function ProjectsOverlay({
  view,
  onViewChange,
  projects,
  isOwner = false,
  profileId,
}: {
  view: View;
  onViewChange: (v: View) => void;
  projects: ProfileProject[];
  isOwner?: boolean;
  profileId?: string;
}) {
  const open = view === "projects";
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [accent, setAccent] = useState<string>(PIN_COLORS[projects.length % PIN_COLORS.length]);
  const [localProjects, setLocalProjects] = useState<ProfileProject[]>(projects);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const renderProjects = saving ? localProjects : projects;

  const reset = () => {
    setTitle("");
    setBlurb("");
    setUrl("");
    setTags("");
    setAccent(PIN_COLORS[renderProjects.length % PIN_COLORS.length]);
    setError(null);
  };

  const saveProject = async () => {
    if (!profileId) return;
    const t = title.trim();
    if (!t) return;
    setSaving(true);
    setError(null);
    try {
      const raw = url.trim();
      const { github, url: link } = classifyProjectUrl(raw);
      if (raw && !github && !link) {
        setError("Use a full http:// or https:// URL");
        return;
      }
      const next: ProfileProject = {
        title: t,
        blurb: blurb.trim(),
        github,
        url: link,
        tags: tags
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        accent,
      };
      const nextProjects = [...localProjects, next];
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: nextProjects }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Couldn't save project.");
        return;
      }
      setLocalProjects(nextProjects);
      setAdding(false);
      reset();
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-20 transition-all duration-500 ease-out ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <aside
        className={`projects-panel ${open ? "is-open" : ""}`}
        role="dialog"
        aria-label="Projects"
      >
        <button
          className="panel-close"
          onClick={() => onViewChange("home")}
          aria-label="Close projects"
        >
          ✕
        </button>

        <div className="projects-panel-header">
          <div className="projects-panel-eyebrow">
            <span className="projects-panel-dot" />
            <span>✨ MY BEST WORK</span>
          </div>
          <h2 className="projects-panel-title">
            Projects<span className="projects-panel-period">.</span>
          </h2>
        </div>

        <div className="projects-grid">
          {renderProjects.map((p, i) => {
            const style = {
              "--accent": p.accent,
              "--tilt": "0deg",
              animationDelay: `${0.15 + i * 0.07}s`,
            } as React.CSSProperties;

            const href = p.github ?? p.url;

            const inner = (
              <>
                <div className="project-card-index">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="project-card-body">
                  <h3 className="project-card-title">{p.title}</h3>
                  <p className="project-card-blurb">{p.blurb}</p>
                  {p.tags.length > 0 ? (
                    <div className="project-card-tags">
                      {p.tags.map((t) => (
                        <span key={t} className="project-card-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {href ? (
                    <div className="project-card-link">
                      {p.github ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.28-1.67-1.28-1.67-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.68.8.56 4.56-1.53 7.84-5.83 7.84-10.91C23.5 5.65 18.35.5 12 .5z" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      )}
                      <span>
                        {p.github ? "View on GitHub" : "View project"}
                      </span>
                      <span className="project-card-arrow">→</span>
                    </div>
                  ) : null}
                </div>
                <div className="project-card-glow" />
              </>
            );

            return href ? (
              <a
                key={p.title + i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="project-card"
                style={style}
              >
                {inner}
              </a>
            ) : (
              <div
                key={p.title + i}
                className="project-card project-card--disabled"
                style={style}
                aria-disabled="true"
              >
                {inner}
              </div>
            );
          })}

          {isOwner && !adding && (
            <button
              type="button"
              className="project-card project-card--add"
              onClick={() => setAdding(true)}
              style={{ animationDelay: `${0.15 + renderProjects.length * 0.07}s` } as React.CSSProperties}
            >
              <div className="project-add-plus">+</div>
              <div className="project-add-label">Add a project</div>
            </button>
          )}

          {isOwner && adding && (
            <div
              className="project-card project-card--form"
              style={{ "--accent": accent } as React.CSSProperties}
            >
              <div className="project-form-head">
                <span className="project-form-eyebrow">New project</span>
                <button
                  type="button"
                  className="project-form-close"
                  aria-label="Cancel"
                  onClick={() => {
                    setAdding(false);
                    reset();
                  }}
                >
                  ✕
                </button>
              </div>
              <input
                autoFocus
                className="project-form-input"
                placeholder="Project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="project-form-input project-form-textarea"
                placeholder="One-line description"
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                rows={2}
              />
              <input
                className="project-form-input"
                placeholder="URL or GitHub link (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <input
                className="project-form-input"
                placeholder="Tags, comma-separated (optional)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <div className="project-form-accents">
                {PIN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`project-form-swatch ${accent === c ? "is-active" : ""}`}
                    style={{ background: c }}
                    onClick={() => setAccent(c)}
                    aria-label={`Accent ${c}`}
                  />
                ))}
              </div>
              {error && <p className="project-form-error">{error}</p>}
              <button
                type="button"
                className="project-form-save"
                onClick={saveProject}
                disabled={saving || !title.trim()}
              >
                {saving ? "Saving…" : "Save project"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
