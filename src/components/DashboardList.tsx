"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface DashboardItem {
  id: string;
  name: string;
  handle: string;
  locationCount: number;
  createdAt: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function DashboardList({ items }: { items: DashboardItem[] }) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Couldn't delete that globe.");
        return;
      }
      setConfirmId(null);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {error && <p className="chat-error">{error}</p>}
      <ul className="dash-list">
        {items.map((item) => (
          <li key={item.id} className="dash-row">
            <div className="dash-row-main">
              <a href={`/${item.id}`} className="dash-row-title">
                {item.name}
              </a>
              <div className="dash-row-meta">
                <span>{item.handle}</span>
                <span>·</span>
                <span>{item.locationCount} pins</span>
                <span>·</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="dash-row-actions">
              <a
                href={`/${item.id}`}
                className="dash-action dash-action--ghost"
              >
                View
              </a>
              <a
                href={`/dashboard/${item.id}/edit`}
                className="dash-action dash-action--ghost"
              >
                Edit
              </a>
              {confirmId === item.id ? (
                <>
                  <button
                    className="dash-action dash-action--danger"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    className="dash-action dash-action--ghost"
                    onClick={() => setConfirmId(null)}
                    disabled={deletingId === item.id}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="dash-action dash-action--danger"
                  onClick={() => setConfirmId(item.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
