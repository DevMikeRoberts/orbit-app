"use client";

import { useState } from "react";
import { GlobeScene } from "@/components/globe/GlobeScene";
import { Header } from "@/components/Header";
import { ContactOverlay } from "@/components/ContactOverlay";
import { ProjectsOverlay } from "@/components/ProjectsOverlay";
import type { UserProfile } from "@/types/profile";

export type View = "home" | "contact" | "projects";

export default function ProfilePage({
  profile,
  isOwner = false,
}: {
  profile: UserProfile;
  isOwner?: boolean;
}) {
  const [view, setView] = useState<View>("home");

  const liveEntry = profile.locations.find((l) => l.connectionType === "live");
  const ll = profile.liveLocation;

  const matchesLl = (l: { lat: number; lng: number }) =>
    !!ll &&
    Math.abs(l.lat - ll.lat) < 0.01 &&
    Math.abs(l.lng - ll.lng) < 0.01;

  let liveLocation:
    | { lat: number; lng: number; city?: string; avatarUrl?: string }
    | undefined;

  if (ll) {
    const matching = liveEntry && matchesLl(liveEntry)
      ? liveEntry
      : profile.locations.find(matchesLl);
    liveLocation = {
      lat: ll.lat,
      lng: ll.lng,
      city: matching?.city,
      avatarUrl: profile.image,
    };
  } else if (liveEntry) {
    liveLocation = {
      lat: liveEntry.lat,
      lng: liveEntry.lng,
      city: liveEntry.city,
      avatarUrl: profile.image,
    };
  }

  return (
    <>
      <GlobeScene
        view={view}
        locations={profile.locations}
        liveLocation={liveLocation}
      />
      <Header
        view={view}
        onViewChange={setView}
        handle={profile.handle}
        resumeUrl={profile.resumeUrl}
        editHref={isOwner ? `/dashboard/${profile.id}/edit` : undefined}
      />
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
