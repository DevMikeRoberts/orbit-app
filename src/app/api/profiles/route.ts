import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { saveProfile, getProfile } from "@/lib/profiles";
import { generateProfileId } from "@/lib/hash";
import { sanitizeProfilePatch } from "@/lib/validateProfile";
import type { UserProfile } from "@/types/profile";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = sanitizeProfilePatch(raw);
  const userEmail = session.user.email;

  if (!body.name || !body.name.trim()) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (!userEmail) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  let id = generateProfileId(body.name);
  while (await getProfile(id)) {
    id = generateProfileId(body.name);
  }

  const profile: UserProfile = {
    id,
    name: body.name,
    handle: body.handle?.trim() || `@${body.name.toLowerCase().replace(/\s+/g, "")}`,
    email: userEmail,
    title: body.title,
    image: body.image,
    resumeUrl: body.resumeUrl,
    liveLocation: body.liveLocation,
    locations: body.locations ?? [],
    projects: body.projects ?? [],
    createdAt: new Date().toISOString(),
  };

  await saveProfile(profile, session.user.id);

  return Response.json({ id, url: `/${id}` }, { status: 201 });
}
