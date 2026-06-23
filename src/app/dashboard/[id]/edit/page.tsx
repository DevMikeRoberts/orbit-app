import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile, getProfileOwner } from "@/lib/profiles";
import { EditProfile } from "@/components/EditProfile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orbit — Edit globe",
};

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/dashboard/${id}/edit`);
  }

  const owner = await getProfileOwner(id);
  if (owner === null) notFound();
  if (owner !== session.user.id) {
    return (
      <main className="dash-root">
        <div className="dash-body">
          <h1 className="dash-title">Not your globe</h1>
          <p className="dash-sub">
            You can only edit globes you created.{" "}
            <a href="/dashboard">Back to your globes</a>.
          </p>
        </div>
      </main>
    );
  }

  const profile = await getProfile(id);
  if (!profile) notFound();

  return <EditProfile profile={profile} />;
}
