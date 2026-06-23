"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeScene } from "@/components/globe/GlobeScene";
import { Header } from "@/components/Header";
import { ContactOverlay } from "@/components/ContactOverlay";
import { ProjectsOverlay } from "@/components/ProjectsOverlay";
import type { ProfileLocation, UserProfile } from "@/types/profile";

export type View = "home" | "contact" | "projects";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ProfilePage({
  profile,
  isOwner = false,
}: {
  profile: UserProfile;
  isOwner?: boolean;
}) {
  const [view, setView] = useState<View>("home");
  const [locations, setLocations] = useState<ProfileLocation[]>(
    profile.locations,
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedRef = useRef<string>(JSON.stringify(profile.locations));
  const draggingRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSavesRef = useRef(0);
  const propLocationsKey = useMemo(
    () => JSON.stringify(profile.locations),
    [profile.locations],
  );

  // Re-sync from server only when (a) the server-rendered locations differ from
  // what we last saved AND (b) we're not in the middle of a drag.
  useEffect(() => {
    if (draggingRef.current) return;
    if (propLocationsKey === lastSavedRef.current) return;
    setLocations(profile.locations);
    lastSavedRef.current = propLocationsKey;
  }, [propLocationsKey, profile.locations]);

  const scheduleToastClear = useCallback((delayMs: number) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      if (pendingSavesRef.current === 0) setSaveStatus("idle");
    }, delayMs);
  }, []);

  const persistLocations = useCallback(
    async (next: ProfileLocation[]) => {
      if (!isOwner) return;
      const serialized = JSON.stringify(next);
      if (serialized === lastSavedRef.current) return;
      pendingSavesRef.current++;
      setSaveStatus("saving");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      try {
        const res = await fetch(`/api/profiles/${profile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locations: next }),
        });
        if (!res.ok) {
          setSaveStatus("error");
          scheduleToastClear(3000);
          return;
        }
        lastSavedRef.current = serialized;
        if (pendingSavesRef.current <= 1) {
          setSaveStatus("saved");
          scheduleToastClear(1600);
        }
      } catch {
        setSaveStatus("error");
        scheduleToastClear(3000);
      } finally {
        pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
      }
    },
    [isOwner, profile.id, scheduleToastClear],
  );

  const handleDragStart = useCallback(() => {
    draggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleCommitCardOffset = useCallback(
    (locationId: string, offset: { dLat: number; dLng: number } | null) => {
      setLocations((ls) => {
        const next = ls.map((l) =>
          l.id === locationId
            ? { ...l, cardOffset: offset ?? undefined }
            : l,
        );
        void persistLocations(next);
        return next;
      });
    },
    [persistLocations],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const liveEntry = locations.find((l) => l.connectionType === "live");
  const ll = profile.liveLocation;

  const liveLocation = useMemo(() => {
    const matchesLl = (l: { lat: number; lng: number }) =>
      !!ll &&
      Math.abs(l.lat - ll.lat) < 0.01 &&
      Math.abs(l.lng - ll.lng) < 0.01;

    if (ll) {
      const matching = liveEntry && matchesLl(liveEntry)
        ? liveEntry
        : locations.find(matchesLl);
      return {
        lat: ll.lat,
        lng: ll.lng,
        city: matching?.city,
        avatarUrl: profile.image,
      };
    }
    if (liveEntry) {
      return {
        lat: liveEntry.lat,
        lng: liveEntry.lng,
        city: liveEntry.city,
        avatarUrl: profile.image,
      };
    }
    return undefined;
  }, [ll, liveEntry, locations, profile.image]);

  return (
    <>
      <GlobeScene
        view={view}
        locations={locations}
        liveLocation={liveLocation}
        isOwner={isOwner}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onCommitCardOffset={handleCommitCardOffset}
      />
      <Header
        view={view}
        onViewChange={setView}
        handle={profile.handle}
        resumeUrl={profile.resumeUrl}
        editHref={isOwner ? `/dashboard/${profile.id}/edit` : undefined}
      />
      {isOwner && saveStatus !== "idle" && (
        <div className={`drag-save-toast drag-save-toast--${saveStatus}`} role="status">
          {saveStatus === "saving" && "Saving card position…"}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && "Couldn't save — try again"}
        </div>
      )}
      <ContactOverlay view={view} onViewChange={setView} email={profile.email} />
      <ProjectsOverlay
        view={view}
        onViewChange={setView}
        projects={profile.projects}
        isOwner={isOwner}
        profileId={profile.id}
      />
    </>
  );
}
