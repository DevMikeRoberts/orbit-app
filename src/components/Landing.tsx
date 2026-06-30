"use client";

import { GlobeScene } from "@/components/globe/GlobeScene";
import { AuthNav, type AuthNavUser } from "@/components/AuthNav";
import { GlobeCounter } from "@/components/GlobeCounter";
import { locations } from "@/data/locations";

const LIVE_LOCATION = { lat: 37.774, lng: -122.419 };

export function Landing({ user }: { user: AuthNavUser | null }) {
  return (
    <>
      <GlobeScene view="home" locations={locations} liveLocation={LIVE_LOCATION} />

      <header className="landing-topbar">
        <AuthNav user={user} />
      </header>

      <main className="landing-overlay">
        <div className="landing-hero">
          <p className="landing-eyebrow">Orbit</p>
          <h1 className="landing-headline">
            Your life,<br />on a globe.
          </h1>
          <p className="landing-sub">
            Build an interactive 3D portfolio that shows where you&apos;ve been,
            what you&apos;ve built, and who you are — in minutes.
          </p>
          <div className="landing-ctas">
            <a href="/create" className="landing-btn-primary">
              {user ? "Create your Orbit →" : "Get started →"}
            </a>
          </div>
        </div>

        <div className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-icon">🌍</span>
            <span className="landing-feature-label">Interactive 3D globe</span>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">📍</span>
            <span className="landing-feature-label">Biographical pins</span>
          </div>
          <div className="landing-feature">
            <span className="landing-feature-icon">🚀</span>
            <span className="landing-feature-label">Live in minutes</span>
          </div>
          <GlobeCounter />
        </div>
      </main>
    </>
  );
}
