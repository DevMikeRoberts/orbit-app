"use client";

import { useState } from "react";
import type { WizardState } from "../CreateWizard";
import type {
  ProfileLocation,
  SubEntry,
  ConnectionType,
} from "@/types/profile";
import {
  CONNECTION_LABELS,
  CONNECTION_EMOJIS,
  PIN_COLORS,
} from "@/types/profile";
import { searchCities } from "@/lib/cities";

const CONNECTION_TYPES = Object.keys(CONNECTION_LABELS) as ConnectionType[];

function newLocation(): ProfileLocation {
  return {
    id: `loc-${Date.now()}`,
    city: "",
    lat: 0,
    lng: 0,
    color: PIN_COLORS[0],
    connectionType: "live",
    subEntries: [newEntry("live")],
  };
}

function newEntry(ct: ConnectionType = "live"): SubEntry {
  return {
    emoji: CONNECTION_EMOJIS[ct],
    role: CONNECTION_LABELS[ct],
    place: "",
    description: "",
    date: "",
  };
}

export function LocationsStep({
  state,
  patch,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
}) {
  const [editing, setEditing] = useState<ProfileLocation | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [cityDropdown, setCityDropdown] = useState(false);

  const save = (loc: ProfileLocation) => {
    const existing = state.locations.find((l) => l.id === loc.id);
    const updated = existing
      ? state.locations.map((l) => (l.id === loc.id ? loc : l))
      : [...state.locations, loc];
    patch({ locations: updated });
    setEditing(null);
    setCityQuery("");
  };

  const remove = (id: string) =>
    patch({ locations: state.locations.filter((l) => l.id !== id) });

  const startAdd = () => setEditing(newLocation());
  const startEdit = (loc: ProfileLocation) => {
    setEditing({ ...loc, subEntries: loc.subEntries.map((e) => ({ ...e })) });
    setCityQuery(loc.city);
  };

  if (editing) {
    return (
      <LocationEditor
        loc={editing}
        cityQuery={cityQuery}
        cityDropdown={cityDropdown}
        onChange={setEditing}
        onCityQuery={(q) => {
          setCityQuery(q);
          setCityDropdown(true);
        }}
        onCityDropdown={setCityDropdown}
        onSave={save}
        onCancel={() => {
          setEditing(null);
          setCityQuery("");
        }}
      />
    );
  }

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <div className="wizard-step-eyebrow">Step 2 of 5</div>
        <h2 className="wizard-step-title">
          Your places<span className="wizard-period">.</span>
        </h2>
        <p className="wizard-step-sub">
          Pin the cities that shaped your story — where you were born, studied,
          worked, or dream of visiting.
        </p>
      </div>

      {state.locations.length === 0 ? (
        <div className="wizard-empty">
          <span className="wizard-empty-icon">🗺️</span>
          <p>No locations yet. Add your first pin below.</p>
        </div>
      ) : (
        <ul className="wizard-location-list">
          {state.locations.map((loc) => (
            <li key={loc.id} className="wizard-location-item">
              <span
                className="wizard-location-dot"
                style={{ background: loc.color }}
              />
              <div className="wizard-location-info">
                <span className="wizard-location-city">{loc.city || "Unnamed"}</span>
                <span className="wizard-location-type">
                  {loc.connectionType
                    ? CONNECTION_LABELS[loc.connectionType]
                    : ""}
                </span>
              </div>
              <div className="wizard-location-actions">
                <button
                  className="wizard-icon-btn"
                  onClick={() => startEdit(loc)}
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  className="wizard-icon-btn wizard-icon-btn--danger"
                  onClick={() => remove(loc.id)}
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
        + Add a location
      </button>
    </div>
  );
}

function LocationEditor({
  loc,
  cityQuery,
  cityDropdown,
  onChange,
  onCityQuery,
  onCityDropdown,
  onSave,
  onCancel,
}: {
  loc: ProfileLocation;
  cityQuery: string;
  cityDropdown: boolean;
  onChange: (l: ProfileLocation) => void;
  onCityQuery: (q: string) => void;
  onCityDropdown: (v: boolean) => void;
  onSave: (l: ProfileLocation) => void;
  onCancel: () => void;
}) {
  const citySuggestions = searchCities(cityQuery);

  const setConnectionType = (ct: ConnectionType) => {
    onChange({
      ...loc,
      connectionType: ct,
      subEntries:
        loc.subEntries.length === 0
          ? [newEntry(ct)]
          : loc.subEntries.map((e, i) =>
              i === 0 ? { ...e, emoji: CONNECTION_EMOJIS[ct] } : e,
            ),
    });
  };

  const patchEntry = (i: number, partial: Partial<SubEntry>) => {
    const entries = loc.subEntries.map((e, idx) =>
      idx === i ? { ...e, ...partial } : e,
    );
    onChange({ ...loc, subEntries: entries });
  };

  const addEntry = () => {
    onChange({
      ...loc,
      subEntries: [...loc.subEntries, newEntry(loc.connectionType)],
    });
  };

  const removeEntry = (i: number) => {
    onChange({
      ...loc,
      subEntries: loc.subEntries.filter((_, idx) => idx !== i),
    });
  };

  const valid = loc.city.trim() !== "" && loc.lat !== 0;

  return (
    <div className="wizard-step-content">
      <div className="wizard-step-header">
        <button className="wizard-back-link" onClick={onCancel}>
          ← Back to locations
        </button>
        <h2 className="wizard-step-title">
          Add a location<span className="wizard-period">.</span>
        </h2>
      </div>

      <div className="wizard-fields">
        <div className="wizard-field" style={{ position: "relative" }}>
          <label className="wizard-label">
            City <span className="wizard-required">*</span>
          </label>
          <input
            className="wizard-input"
            type="text"
            placeholder="Search cities…"
            value={cityQuery}
            onChange={(e) => onCityQuery(e.target.value)}
            onFocus={() => onCityDropdown(true)}
            onBlur={() => setTimeout(() => onCityDropdown(false), 150)}
            autoFocus
          />
          {cityDropdown && citySuggestions.length > 0 && (
            <ul className="wizard-city-dropdown">
              {citySuggestions.map((c) => (
                <li
                  key={`${c.city}-${c.country}`}
                  className="wizard-city-option"
                  onMouseDown={() => {
                    onChange({
                      ...loc,
                      city: c.city,
                      lat: c.lat,
                      lng: c.lng,
                    });
                    onCityQuery(c.city);
                    onCityDropdown(false);
                  }}
                >
                  <span>{c.city}</span>
                  <span className="wizard-city-country">{c.country}</span>
                </li>
              ))}
              <li className="wizard-city-option wizard-city-option--custom"
                onMouseDown={() => {
                  onChange({ ...loc, city: cityQuery, lat: 0, lng: 0 });
                  onCityDropdown(false);
                }}
              >
                <span>Use &ldquo;{cityQuery}&rdquo; with custom coordinates</span>
              </li>
            </ul>
          )}
        </div>

        {loc.lat === 0 && loc.city !== "" && (
          <div className="wizard-field-row">
            <div className="wizard-field">
              <label className="wizard-label">Latitude</label>
              <input
                className="wizard-input"
                type="number"
                step="0.001"
                placeholder="37.774"
                value={loc.lat || ""}
                onChange={(e) =>
                  onChange({ ...loc, lat: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="wizard-field">
              <label className="wizard-label">Longitude</label>
              <input
                className="wizard-input"
                type="number"
                step="0.001"
                placeholder="-122.419"
                value={loc.lng || ""}
                onChange={(e) =>
                  onChange({ ...loc, lng: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        )}

        <div className="wizard-field">
          <label className="wizard-label">Connection type</label>
          <div className="wizard-connection-grid">
            {CONNECTION_TYPES.map((ct) => (
              <button
                key={ct}
                type="button"
                className={`wizard-connection-btn ${
                  loc.connectionType === ct
                    ? "wizard-connection-btn--active"
                    : ""
                }`}
                onClick={() => setConnectionType(ct)}
              >
                <span>{CONNECTION_EMOJIS[ct]}</span>
                <span>{CONNECTION_LABELS[ct]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wizard-field">
          <label className="wizard-label">Pin color</label>
          <div className="wizard-color-row">
            {PIN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`wizard-color-swatch ${
                  loc.color === c ? "wizard-color-swatch--active" : ""
                }`}
                style={{ background: c }}
                onClick={() => onChange({ ...loc, color: c })}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="wizard-field">
          <label className="wizard-label">Details (shown in the card)</label>
          {loc.subEntries.map((entry, i) => (
            <div key={i} className="wizard-entry-block">
              <div className="wizard-entry-header">
                <span className="wizard-entry-num">Entry {i + 1}</span>
                {loc.subEntries.length > 1 && (
                  <button
                    className="wizard-icon-btn wizard-icon-btn--danger"
                    onClick={() => removeEntry(i)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="wizard-fields">
                <div className="wizard-field-row">
                  <div className="wizard-field" style={{ flex: "0 0 64px" }}>
                    <label className="wizard-label">Emoji</label>
                    <input
                      className="wizard-input wizard-input--emoji"
                      type="text"
                      value={entry.emoji}
                      onChange={(e) => patchEntry(i, { emoji: e.target.value })}
                    />
                  </div>
                  <div className="wizard-field" style={{ flex: 1 }}>
                    <label className="wizard-label">Role / Title</label>
                    <input
                      className="wizard-input"
                      type="text"
                      placeholder="Software Engineer"
                      value={entry.role}
                      onChange={(e) => patchEntry(i, { role: e.target.value })}
                    />
                  </div>
                </div>
                <div className="wizard-field-row">
                  <div className="wizard-field">
                    <label className="wizard-label">Company / Place</label>
                    <input
                      className="wizard-input"
                      type="text"
                      placeholder="Acme Corp."
                      value={entry.company ?? ""}
                      onChange={(e) =>
                        patchEntry(i, { company: e.target.value })
                      }
                    />
                  </div>
                  <div className="wizard-field">
                    <label className="wizard-label">Dates</label>
                    <input
                      className="wizard-input"
                      type="text"
                      placeholder="2022 — Present"
                      value={entry.date}
                      onChange={(e) => patchEntry(i, { date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="wizard-field">
                  <label className="wizard-label">Sub-location / Context</label>
                  <input
                    className="wizard-input"
                    type="text"
                    placeholder="📍 San Francisco, CA"
                    value={entry.place}
                    onChange={(e) => patchEntry(i, { place: e.target.value })}
                  />
                </div>
                <div className="wizard-field">
                  <label className="wizard-label">Description</label>
                  <textarea
                    className="wizard-textarea"
                    rows={2}
                    placeholder="A short description of what happened here…"
                    value={entry.description}
                    onChange={(e) =>
                      patchEntry(i, { description: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            className="wizard-add-btn wizard-add-btn--small"
            onClick={addEntry}
          >
            + Add another entry to this location
          </button>
        </div>
      </div>

      <div className="wizard-editor-footer">
        <button className="wizard-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="wizard-btn-primary"
          disabled={!valid}
          onClick={() => onSave(loc)}
        >
          Save location
        </button>
      </div>
    </div>
  );
}
