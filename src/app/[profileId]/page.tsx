import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProfile, getProfileOwner } from "@/lib/profiles";
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
  const [profile, owner, session] = await Promise.all([
    getProfile(profileId),
    getProfileOwner(profileId),
    auth(),
  ]);
  if (!profile) notFound();
  const isOwner = !!session?.user?.id && session.user.id === owner;
  return <ProfilePage profile={profile} isOwner={isOwner} />;
}
