import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import ProfilePage from "@/components/ProfilePage";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  const profile = await getProfile(profileId);
  if (!profile) return {};
  return {
    title: `Orbit — ${profile.name}`,
    description: profile.title
      ? `${profile.name} · ${profile.title}`
      : `${profile.name}'s interactive globe portfolio`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const profile = await getProfile(profileId);
  if (!profile) notFound();
  return <ProfilePage profile={profile} />;
}
