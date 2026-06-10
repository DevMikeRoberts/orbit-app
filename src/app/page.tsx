"use client";

import { GlobeScene } from "@/components/globe/GlobeScene";
import { locations } from "@/data/locations";

export type View = "home" | "contact" | "projects";

const LIVE_LOCATION = { lat: 37.774, lng: -122.419 };
const VIEW: View = "home";

export default function Home() {
  return (
    <>
      <GlobeScene view={VIEW} locations={locations} liveLocation={LIVE_LOCATION} />

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
              Create your Orbit →
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
        </div>
      </main>
    </>
  );
}
