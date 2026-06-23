"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CityPicker } from "./CityPicker";
import { inferProfile } from "@/lib/inferProfile";
import type { ChatAnswers, ResolvedCity, ExtraPlace } from "@/lib/inferProfile";
import { classifyProjectUrl } from "@/lib/projectUrl";
import {
  CONNECTION_EMOJIS,
  CONNECTION_LABELS,
  PIN_COLORS,
} from "@/types/profile";
import type { ConnectionType, ProfileProject } from "@/types/profile";

type StepKind =
  | "text"
  | "year"
  | "city"
  | "workDetails"
  | "extras"
  | "projects"
  | "confirm";

interface StepDef {
  id: string;
  kind: StepKind;
  bot: (a: Partial<ChatAnswers>) => string;
  placeholder?: string;
  optional?: boolean;
  skipLabel?: string;
  onSkip?: (a: Partial<ChatAnswers>) => Partial<ChatAnswers>;
  shouldSkip?: (a: Partial<ChatAnswers>) => boolean;
}

const firstName = (n?: string) => (n ? n.trim().split(/\s+/)[0] : "");

const EXTRA_TYPES: ConnectionType[] = [
  "other",
  "travel",
  "family",
  "lived",
  "worked",
  "married",
];

const STEPS: StepDef[] = [
  {
    id: "name",
    kind: "text",
    placeholder: "Your name",
    bot: (a) =>
      `Hi${firstName(a.name) ? ` ${firstName(a.name)}` : ""} — let's build your globe. What name should we put on it?`,
  },
  {
    id: "birthDate",
    kind: "year",
    placeholder: "e.g. 1995",
    bot: () => "What year were you born?",
    optional: true,
    skipLabel: "Prefer not to say",
  },
  {
    id: "born",
    kind: "city",
    placeholder: "City you were born in",
    bot: () => "Where were you born?",
  },
  {
    id: "raised",
    kind: "city",
    placeholder: "City you grew up in",
    bot: () => "Where did you grow up?",
    optional: true,
    skipLabel: "Same place I was born",
    onSkip: (a) => ({ raised: a.born }),
  },
  {
    id: "live",
    kind: "city",
    placeholder: "City you live in now",
    bot: () => "Where do you live now?",
  },
  {
    id: "school",
    kind: "city",
    placeholder: "City of your school",
    bot: () => "Where did you go to school?",
    optional: true,
    skipLabel: "Skip",
  },
  {
    id: "work",
    kind: "city",
    placeholder: "City you work in",
    bot: () => "Where do you work?",
    optional: true,
    skipLabel: "Skip",
  },
  {
    id: "workDetails",
    kind: "workDetails",
    bot: () => "What do you do there?",
    optional: true,
    skipLabel: "Skip these",
    shouldSkip: (a) => !a.work?.city,
  },
  {
    id: "extras",
    kind: "extras",
    bot: () => "Any other meaningful places?",
    optional: true,
    skipLabel: "I'm good — let's keep going",
  },
  {
    id: "projects",
    kind: "projects",
    bot: () => "Want to add a few projects you're proud of?",
    optional: true,
    skipLabel: "Skip projects for now",
  },
  {
    id: "confirm",
    kind: "confirm",
    bot: (a) =>
      `Looks great${firstName(a.name) ? `, ${firstName(a.name)}` : ""}. Ready to launch your globe?`,
  },
];

const cityLabel = (c?: ResolvedCity) =>
  c ? [c.city, c.region, c.country].filter(Boolean).join(", ") : "";

const cityShort = (c: ResolvedCity) =>
  [c.city, c.country].filter(Boolean).join(", ");

export function ChatCreate({
  initialName,
  email,
  initialImage,
}: {
  initialName: string;
  email: string;
  initialImage?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ChatAnswers>>({
    name: initialName,
    email,
    image: initialImage,
    extras: [],
    projects: [],
  });
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const current = STEPS[step];
  const lastIndex = STEPS.length - 1;

  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [step, error]);

  const advance = (display: string, patch: Partial<ChatAnswers>) => {
    setResponses((r) => ({ ...r, [current.id]: display }));
    const nextAnswers = { ...answers, ...patch };
    setAnswers(nextAnswers);
    let target = Math.min(step + 1, lastIndex);
    while (target < lastIndex && STEPS[target].shouldSkip?.(nextAnswers)) {
      target++;
    }
    setStep(target);
    setError(null);
  };

  const back = () => {
    if (step === 0) return;
    let target = step - 1;
    while (target > 0 && STEPS[target].shouldSkip?.(answers)) {
      target--;
    }
    const prevId = STEPS[target].id;
    setResponses((r) => {
      const next = { ...r };
      delete next[prevId];
      return next;
    });
    setStep(target);
    setError(null);
  };

  const skip = () => {
    if (!current.optional) return;
    const display = current.skipLabel ?? "Skip";
    const patch = current.onSkip ? current.onSkip(answers) : {};
    advance(display, patch);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const profile = inferProfile(answers as ChatAnswers);
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Something went wrong. Try again?");
        return;
      }
      const { url } = await res.json();
      router.push(url);
    } catch {
      setError("Couldn't reach the server. Try again?");
    } finally {
      setSubmitting(false);
    }
  };

  const transcript = useMemo(() => {
    const msgs: { role: "bot" | "user"; text: string; key: string }[] = [];
    for (let i = 0; i <= step; i++) {
      const s = STEPS[i];
      if (s.shouldSkip?.(answers)) continue;
      msgs.push({ role: "bot", text: s.bot(answers), key: `${s.id}-bot` });
      const resp = responses[s.id];
      if (resp) msgs.push({ role: "user", text: resp, key: `${s.id}-user` });
    }
    return msgs;
  }, [step, answers, responses]);

  return (
    <main className="chat-root">
      <header className="chat-header">
        <p className="landing-eyebrow">Orbit</p>
        <a href="/" className="chat-exit" aria-label="Exit">
          Exit
        </a>
      </header>

      <div ref={transcriptRef} className="chat-transcript">
        {transcript.map((m) => (
          <div key={m.key} className={`chat-msg chat-msg--${m.role}`}>
            <span className="chat-bubble">{m.text}</span>
          </div>
        ))}
        <div className="chat-progress">
          {(() => {
            const visible = STEPS.filter((s) => !s.shouldSkip?.(answers));
            const currentVisibleIndex = visible.findIndex(
              (s) => s.id === current.id,
            );
            return visible.map((s, i) => (
              <span
                key={s.id}
                className={`chat-dot ${i <= currentVisibleIndex ? "is-active" : ""}`}
              />
            ));
          })()}
        </div>
      </div>

      <div className="chat-input-area">
        {step > 0 && (
          <button className="chat-back" onClick={back}>
            ← Back
          </button>
        )}
        <ActiveInput
          key={`${current.id}-${step}`}
          step={current}
          answers={answers}
          submitting={submitting}
          onAdvance={advance}
          onSkip={skip}
          onSubmit={submit}
          onPatch={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
        />
        {error && <p className="chat-error">{error}</p>}
      </div>
    </main>
  );
}

function ActiveInput({
  step,
  answers,
  submitting,
  onAdvance,
  onSkip,
  onSubmit,
  onPatch,
}: {
  step: StepDef;
  answers: Partial<ChatAnswers>;
  submitting: boolean;
  onAdvance: (display: string, patch: Partial<ChatAnswers>) => void;
  onSkip: () => void;
  onSubmit: () => void;
  onPatch: (patch: Partial<ChatAnswers>) => void;
}) {
  const [text, setText] = useState(
    step.id === "name" ? (answers.name ?? "") : "",
  );

  if (step.kind === "confirm") {
    const summary = summarize(answers);
    return (
      <div className="chat-confirm">
        <ul className="chat-summary">
          {summary.map((line, i) => (
            <li key={i}>
              <span className="chat-summary-emoji">{line.emoji}</span>
              <span>{line.text}</span>
            </li>
          ))}
        </ul>
        <button
          className="chat-launch"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Launching…" : "Launch my globe →"}
        </button>
      </div>
    );
  }

  if (step.kind === "city") {
    return (
      <div className="chat-input-row">
        <CityPicker
          autoFocus
          placeholder={step.placeholder}
          onPick={(city) => {
            const patch: Partial<ChatAnswers> = {};
            if (step.id === "school") patch.school = { city };
            else if (step.id === "work")
              patch.work = { ...(answers.work ?? {}), city };
            else (patch as Record<string, ResolvedCity>)[step.id] = city;
            onAdvance(cityLabel(city), patch);
          }}
        />
        {step.optional && (
          <button className="chat-skip" onClick={onSkip} type="button">
            {step.skipLabel ?? "Skip"}
          </button>
        )}
      </div>
    );
  }

  if (step.kind === "workDetails") {
    return (
      <WorkDetailsInput
        work={answers.work}
        title={answers.title}
        onCommit={(company, role) => {
          const patch: Partial<ChatAnswers> = {
            work: { ...(answers.work ?? { city: undefined as unknown as ResolvedCity }), company, role },
          };
          const summary = [company, role].filter(Boolean).join(" · ") || "(no details)";
          onAdvance(summary, patch);
        }}
        onSkip={onSkip}
      />
    );
  }

  if (step.kind === "extras") {
    return (
      <ExtrasInput
        extras={answers.extras ?? []}
        onAdd={(extra) => onPatch({ extras: [...(answers.extras ?? []), extra] })}
        onRemove={(i) =>
          onPatch({
            extras: (answers.extras ?? []).filter((_, idx) => idx !== i),
          })
        }
        onDone={() => {
          const count = (answers.extras ?? []).length;
          const display =
            count === 0
              ? step.skipLabel ?? "No extras"
              : `${count} place${count === 1 ? "" : "s"} added`;
          onAdvance(display, {});
        }}
      />
    );
  }

  if (step.kind === "projects") {
    return (
      <ProjectsInput
        projects={answers.projects ?? []}
        onAdd={(p) => onPatch({ projects: [...(answers.projects ?? []), p] })}
        onRemove={(i) =>
          onPatch({
            projects: (answers.projects ?? []).filter((_, idx) => idx !== i),
          })
        }
        onDone={() => {
          const count = (answers.projects ?? []).length;
          const display =
            count === 0
              ? step.skipLabel ?? "No projects"
              : `${count} project${count === 1 ? "" : "s"} added`;
          onAdvance(display, {});
        }}
      />
    );
  }

  const commit = () => {
    const value = text.trim();
    if (!value) return;
    if (step.id === "name") {
      onAdvance(value, { name: value });
    } else if (step.id === "birthDate") {
      onAdvance(value, { birthDate: value });
    }
    setText("");
  };

  const canSubmit = text.trim().length > 0;
  const inputType = step.kind === "year" ? "number" : "text";

  return (
    <div className="chat-input-row">
      <input
        autoFocus
        type={inputType}
        inputMode={step.kind === "year" ? "numeric" : undefined}
        className="chat-input"
        placeholder={step.placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        min={step.kind === "year" ? 1900 : undefined}
        max={step.kind === "year" ? new Date().getFullYear() : undefined}
      />
      <button
        type="button"
        className="chat-send"
        onClick={commit}
        disabled={!canSubmit}
        aria-label="Continue"
      >
        →
      </button>
      {step.optional && (
        <button className="chat-skip" onClick={onSkip} type="button">
          {step.skipLabel ?? "Skip"}
        </button>
      )}
    </div>
  );
}

function WorkDetailsInput({
  work,
  title,
  onCommit,
  onSkip,
}: {
  work: ChatAnswers["work"];
  title?: string;
  onCommit: (company?: string, role?: string) => void;
  onSkip: () => void;
}) {
  const [company, setCompany] = useState(work?.company ?? "");
  const [role, setRole] = useState(work?.role ?? title ?? "");

  return (
    <div className="chat-work-details">
      <div className="chat-work-row">
        <input
          autoFocus
          className="chat-input"
          placeholder="Company / organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <input
          className="chat-input"
          placeholder="Your role / title"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommit(company.trim() || undefined, role.trim() || undefined);
            }
          }}
        />
      </div>
      <div className="chat-work-actions">
        <button
          type="button"
          className="chat-send chat-send--wide"
          onClick={() =>
            onCommit(company.trim() || undefined, role.trim() || undefined)
          }
        >
          Continue →
        </button>
        <button type="button" className="chat-skip" onClick={onSkip}>
          Skip these
        </button>
      </div>
    </div>
  );
}

function ExtrasInput({
  extras,
  onAdd,
  onRemove,
  onDone,
}: {
  extras: ExtraPlace[];
  onAdd: (extra: ExtraPlace) => void;
  onRemove: (i: number) => void;
  onDone: () => void;
}) {
  const [pendingType, setPendingType] = useState<ConnectionType>("other");

  return (
    <div className="chat-extras">
      {extras.length > 0 && (
        <ul className="chat-extra-list">
          {extras.map((e, i) => (
            <li key={`${e.city.lat},${e.city.lng}-${i}`} className="chat-extra-item">
              <span className="chat-extra-emoji">
                {CONNECTION_EMOJIS[e.type]}
              </span>
              <span className="chat-extra-text">{cityShort(e.city)}</span>
              <span className="chat-extra-type">
                {CONNECTION_LABELS[e.type]}
              </span>
              <button
                type="button"
                className="chat-extra-remove"
                onClick={() => onRemove(i)}
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="chat-extra-types">
        {EXTRA_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`chat-extra-chip ${pendingType === t ? "is-active" : ""}`}
            onClick={() => setPendingType(t)}
          >
            <span>{CONNECTION_EMOJIS[t]}</span>
            <span>{CONNECTION_LABELS[t]}</span>
          </button>
        ))}
      </div>

      <CityPicker
        placeholder="Add another place…"
        onPick={(city) => {
          onAdd({ city, type: pendingType });
        }}
      />

      <div className="chat-extra-actions">
        <button type="button" className="chat-send chat-send--wide" onClick={onDone}>
          {extras.length > 0 ? "Done adding →" : "I'm good — let's keep going"}
        </button>
      </div>
    </div>
  );
}

function ProjectsInput({
  projects,
  onAdd,
  onRemove,
  onDone,
}: {
  projects: ProfileProject[];
  onAdd: (p: ProfileProject) => void;
  onRemove: (i: number) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [url, setUrl] = useState("");

  const reset = () => {
    setTitle("");
    setBlurb("");
    setUrl("");
  };

  const [urlError, setUrlError] = useState<string | null>(null);

  const addCurrent = () => {
    const t = title.trim();
    if (!t) return;
    const raw = url.trim();
    const { github, url: link } = classifyProjectUrl(raw);
    if (raw && !github && !link) {
      setUrlError("Use a full http:// or https:// URL");
      return;
    }
    setUrlError(null);
    const project: ProfileProject = {
      title: t,
      blurb: blurb.trim(),
      github,
      url: link,
      tags: [],
      accent: PIN_COLORS[projects.length % PIN_COLORS.length],
    };
    onAdd(project);
    reset();
  };

  return (
    <div className="chat-projects">
      {projects.length > 0 && (
        <ul className="chat-project-list">
          {projects.map((p, i) => (
            <li
              key={`${p.title}-${i}`}
              className="chat-project-item"
              style={{ borderLeftColor: p.accent }}
            >
              <div className="chat-project-main">
                <span className="chat-project-title">{p.title}</span>
                {p.blurb && (
                  <span className="chat-project-blurb">{p.blurb}</span>
                )}
              </div>
              <button
                type="button"
                className="chat-extra-remove"
                onClick={() => onRemove(i)}
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="chat-project-form">
        <input
          autoFocus
          className="chat-input"
          placeholder="Project title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="chat-input"
          placeholder="One-line description"
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
        />
        <input
          className="chat-input"
          placeholder="URL or GitHub link (optional)"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCurrent();
            }
          }}
        />
        {urlError && <p className="chat-error">{urlError}</p>}
      </div>

      <div className="chat-project-actions">
        <button
          type="button"
          className="chat-send chat-send--wide"
          onClick={addCurrent}
          disabled={!title.trim()}
        >
          Add this project +
        </button>
        <button type="button" className="chat-send chat-send--ghost" onClick={onDone}>
          {projects.length > 0 ? "Done — let's launch →" : "Skip projects for now"}
        </button>
      </div>
    </div>
  );
}

function summarize(a: Partial<ChatAnswers>) {
  const lines: { emoji: string; text: string }[] = [];
  if (a.born) lines.push({ emoji: "👶", text: `Born in ${a.born.city}` });
  if (a.raised && a.raised.city !== a.born?.city)
    lines.push({ emoji: "🏡", text: `Grew up in ${a.raised.city}` });
  if (a.live) lines.push({ emoji: "📍", text: `Lives in ${a.live.city}` });
  if (a.school)
    lines.push({ emoji: "🎓", text: `Schooled in ${a.school.city.city}` });
  if (a.work) {
    const parts = [
      a.work.role,
      a.work.company,
    ].filter(Boolean).join(" · ");
    const where = `in ${a.work.city.city}`;
    lines.push({
      emoji: "💼",
      text: parts ? `${parts} ${where}` : `Works ${where}`,
    });
  }
  for (const extra of a.extras ?? []) {
    lines.push({
      emoji: CONNECTION_EMOJIS[extra.type],
      text: `${CONNECTION_LABELS[extra.type]} — ${extra.city.city}`,
    });
  }
  for (const p of a.projects ?? []) {
    lines.push({ emoji: "🚀", text: p.title });
  }
  return lines;
}
