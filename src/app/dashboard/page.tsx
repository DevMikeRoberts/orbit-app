import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listProfilesByOwner } from "@/lib/profiles";
import { signOutAction } from "@/lib/auth-actions";
import { DashboardList } from "@/components/DashboardList";

export const metadata: Metadata = {
  title: "Orbit — Your globes",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  const profiles = await listProfilesByOwner(session.user.id);

  return (
    <main className="dash-root">
      <header className="dash-header">
        <a href="/" className="landing-eyebrow">
          ← Orbit
        </a>
        <form action={signOutAction}>
          <button type="submit" className="dash-signout">
            Sign out
          </button>
        </form>
      </header>

      <section className="dash-body">
        <div className="dash-intro">
          <h1 className="dash-title">
            Your globes<span className="wizard-period">.</span>
          </h1>
          <p className="dash-sub">
            Signed in as <strong>{session.user.email}</strong>
          </p>
        </div>

        {profiles.length === 0 ? (
          <div className="dash-empty">
            <p>You haven&apos;t built a globe yet.</p>
            <a href="/create" className="landing-btn-primary">
              Create your first →
            </a>
          </div>
        ) : (
          <DashboardList
            items={profiles.map((p) => ({
              id: p.id,
              name: p.data.name,
              handle: p.data.handle,
              locationCount: p.data.locations.length,
              createdAt: p.createdAt,
            }))}
          />
        )}

        {profiles.length > 0 && (
          <div className="dash-cta-row">
            <a href="/create" className="dash-cta">
              + Create another globe
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
