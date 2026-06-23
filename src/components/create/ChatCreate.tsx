"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CityPicker } from "./CityPicker";
import { inferProfile } from "@/lib/inferProfile";
import type { ChatAnswers, ResolvedCity } from "@/lib/inferProfile";

type StepKind = "text" | "year" | "city" | "confirm";

interface StepDef {
  id: keyof Responses;
  kind: StepKind;
  bot: (a: Partial<ChatAnswers>) => string;
  placeholder?: string;
  optional?: boolean;
  skipLabel?: string;
  onSkip?: (a: Partial<ChatAnswers>) => Partial<ChatAnswers>;
  required?: (a: Partial<ChatAnswers>) => boolean;
}

type Responses = {
  name?: string;
  birthDate?: string;
  born?: string;
  raised?: string;
  live?: string;
  school?: string;
  work?: string;
  extra?: string;
  confirm?: string;
};

const firstName = (n?: string) => (n ? n.trim().split(/\s+/)[0] : "");

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
    id: "extra",
    kind: "city",
    placeholder: "Another meaningful city",
    bot: () => "Anywhere else meaningful?",
    optional: true,
    skipLabel: "I'm good — let's launch",
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

export function ChatCreate({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<ChatAnswers>>({
    name: initialName,
    email,
    extras: [],
  });
  const [responses, setResponses] = useState<Responses>({});
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
    setAnswers((a) => ({ ...a, ...patch }));
    setStep((s) => Math.min(s + 1, lastIndex));
    setError(null);
  };

  const back = () => {
    if (step === 0) return;
    const prevId = STEPS[step - 1].id;
    setResponses((r) => {
      const next = { ...r };
      delete next[prevId];
      return next;
    });
    setStep((s) => s - 1);
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
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`chat-dot ${i <= step ? "is-active" : ""}`}
            />
          ))}
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
}: {
  step: StepDef;
  answers: Partial<ChatAnswers>;
  submitting: boolean;
  onAdvance: (display: string, patch: Partial<ChatAnswers>) => void;
  onSkip: () => void;
  onSubmit: () => void;
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
            else if (step.id === "work") patch.work = { city };
            else if (step.id === "extra") {
              patch.extras = [...(answers.extras ?? []), { city, type: "other" }];
            } else {
              (patch as Record<string, ResolvedCity>)[step.id] = city;
            }
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

function summarize(a: Partial<ChatAnswers>) {
  const lines: { emoji: string; text: string }[] = [];
  if (a.born) lines.push({ emoji: "👶", text: `Born in ${a.born.city}` });
  if (a.raised && a.raised.city !== a.born?.city)
    lines.push({ emoji: "🏡", text: `Grew up in ${a.raised.city}` });
  if (a.live) lines.push({ emoji: "📍", text: `Lives in ${a.live.city}` });
  if (a.school)
    lines.push({ emoji: "🎓", text: `Schooled in ${a.school.city.city}` });
  if (a.work) lines.push({ emoji: "💼", text: `Works in ${a.work.city.city}` });
  for (const extra of a.extras ?? []) {
    lines.push({ emoji: "📌", text: `Pinned ${extra.city.city}` });
  }
  return lines;
}
