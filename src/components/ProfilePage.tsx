"use client";

import { useState } from "react";
import { GlobeScene } from "@/components/globe/GlobeScene";
import { Header } from "@/components/Header";
import { ContactOverlay } from "@/components/ContactOverlay";
import { ProjectsOverlay } from "@/components/ProjectsOverlay";
import type { UserProfile } from "@/types/profile";

export type View = "home" | "contact" | "projects";

export default function ProfilePage({ profile }: { profile: UserProfile }) {
  const [view, setView] = useState<View>("home");

  const liveLocation =
    profile.liveLocation ??
    (profile.locations.find((l) => l.connectionType === "live")
      ? {
          lat: profile.locations.find((l) => l.connectionType === "live")!.lat,
          lng: profile.locations.find((l) => l.connectionType === "live")!.lng,
        }
      : profile.locations[0]
        ? { lat: profile.locations[0].lat, lng: profile.locations[0].lng }
        : undefined);

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
      />
      <ContactOverlay view={view} onViewChange={setView} email={profile.email} />
      <ProjectsOverlay view={view} onViewChange={setView} projects={profile.projects} />
    </>
  );
}
