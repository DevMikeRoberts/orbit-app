"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CityPicker } from "@/components/create/CityPicker";
import {
  CONNECTION_EMOJIS,
  CONNECTION_LABELS,
  PIN_COLORS,
} from "@/types/profile";
import type {
  ConnectionType,
  ProfileLocation,
  UserProfile,
} from "@/types/profile";
import type { ResolvedCity } from "@/lib/inferProfile";

const CONNECTION_TYPES = Object.keys(CONNECTION_LABELS) as ConnectionType[];

export function EditProfile({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [title, setTitle] = useState(profile.title ?? "");
  const [image, setImage] = useState(profile.image ?? "");
  const [locations, setLocations] = useState<ProfileLocation[]>(profile.locations);
  const [adding, setAdding] = useState(false);
  const [pendingType, setPendingType] = useState<ConnectionType>("other");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(() => {
    if (name !== profile.name) return true;
    if (handle !== profile.handle) return true;
    if (title !== (profile.title ?? "")) return true;
    if (image !== (profile.image ?? "")) return true;
    if (locations.length !== profile.locations.length) return true;
    if (JSON.stringify(locations) !== JSON.stringify(profile.locations)) return true;
    return false;
  }, [name, handle, title, image, locations, profile]);

  const removeLocation = (id: string) => {
    setLocations((ls) => ls.filter((l) => l.id !== id));
  };

  const resetCardOffset = (id: string) => {
    setLocations((ls) =>
      ls.map((l) => (l.id === id ? { ...l, cardOffset: undefined } : l)),
    );
  };

  const addLocation = (city: ResolvedCity) => {
    const id = `loc-${city.lat.toFixed(3)},${city.lng.toFixed(3)}`.replace(
      /[^\w-]/g,
      "_",
    );
    const color = PIN_COLORS[locations.length % PIN_COLORS.length];
    const next: ProfileLocation = {
      id,
      city: city.city,
      lat: city.lat,
      lng: city.lng,
      color,
      connectionType: pendingType,
      subEntries: [
        {
          emoji: CONNECTION_EMOJIS[pendingType],
          role: CONNECTION_LABELS[pendingType],
          place: [city.city, city.region, city.country].filter(Boolean).join(", "),
          description: "",
          date: "",
        },
      ],
    };
    setLocations((ls) => [...ls, next]);
    setAdding(false);
  };

  const onPickFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/profiles/${profile.id}/avatar`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Couldn't upload photo.");
        return;
      }
      const { url } = await res.json();
      setImage(url);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          handle: handle.trim(),
          title: title.trim(),
          image,
          locations,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Couldn't save changes.");
        return;
      }
      router.push(`/${profile.id}`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (isDirty) {
      const ok = window.confirm("Discard your changes?");
      if (!ok) return;
    }
    router.push("/dashboard");
  };

  return (
    <main className="dash-root">
      <header className="dash-header">
        <a href="/dashboard" className="landing-eyebrow">
          ← My globes
        </a>
        <a href={`/${profile.id}`} className="dash-signout">
          View live
        </a>
      </header>

      <section className="dash-body">
        <div className="dash-intro">
          <h1 className="dash-title">
            Edit globe<span className="accent-period">.</span>
          </h1>
        </div>

        <div className="edit-avatar-row">
          <div
            className="edit-avatar"
            style={
              image
                ? { backgroundImage: `url(${image})` }
                : { backgroundColor: "rgba(255,255,255,0.06)" }
            }
            aria-label="Profile photo"
          >
            {!image && <span className="edit-avatar-fallback">{name.charAt(0) || "?"}</span>}
          </div>
          <div className="edit-avatar-actions">
            <button
              type="button"
              className="dash-action"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : image ? "Change photo" : "Upload photo"}
            </button>
            {image && (
              <button
                type="button"
                className="dash-action dash-action--ghost"
                onClick={() => setImage("")}
                disabled={uploading}
              >
                Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="edit-fields">
          <div className="edit-field">
            <label className="edit-label">Name</label>
            <input
              className="chat-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="edit-field">
            <label className="edit-label">Handle</label>
            <input
              className="chat-input"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <div className="edit-field">
            <label className="edit-label">Title</label>
            <input
              className="chat-input"
              placeholder="Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="edit-section">
          <div className="edit-section-head">
            <h2 className="edit-section-title">Pins</h2>
            <span className="edit-section-count">{locations.length}</span>
          </div>
          <ul className="edit-pin-list">
            {locations.map((loc) => (
              <li key={loc.id} className="edit-pin">
                <span
                  className="edit-pin-dot"
                  style={{ background: loc.color }}
                />
                <div className="edit-pin-main">
                  <span className="edit-pin-city">{loc.city}</span>
                  <span className="edit-pin-type">
                    {loc.connectionType
                      ? `${CONNECTION_EMOJIS[loc.connectionType]} ${CONNECTION_LABELS[loc.connectionType]}`
                      : ""}
                    {loc.subEntries.length > 1 &&
                      ` · ${loc.subEntries.length} entries`}
                    {loc.cardOffset && " · card repositioned"}
                  </span>
                </div>
                {loc.cardOffset && (
                  <button
                    className="dash-action dash-action--ghost"
                    onClick={() => resetCardOffset(loc.id)}
                    title="Move the card back to its default position on the globe"
                  >
                    Reset card
                  </button>
                )}
                <button
                  className="dash-action dash-action--danger"
                  onClick={() => removeLocation(loc.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          {adding ? (
            <div className="edit-add-pin">
              <div className="edit-add-types">
                {CONNECTION_TYPES.map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    className={`edit-type-btn ${pendingType === ct ? "is-active" : ""}`}
                    onClick={() => setPendingType(ct)}
                  >
                    <span>{CONNECTION_EMOJIS[ct]}</span>
                    <span>{CONNECTION_LABELS[ct]}</span>
                  </button>
                ))}
              </div>
              <CityPicker autoFocus onPick={addLocation} placeholder="City…" />
              <button
                className="dash-action dash-action--ghost"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="edit-add-btn"
              onClick={() => setAdding(true)}
              type="button"
            >
              + Add another place
            </button>
          )}
        </div>

        {error && <p className="chat-error">{error}</p>}

        <div className="edit-footer">
          <button
            type="button"
            className={`edit-cancel ${isDirty ? "is-dirty" : ""}`}
            onClick={cancel}
          >
            {isDirty ? "Discard changes" : "Back to dashboard"}
          </button>
          <button
            className="chat-launch"
            onClick={save}
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>
    </main>
  );
}
