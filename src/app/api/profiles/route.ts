import { NextRequest } from "next/server";
import { saveProfile, getProfile } from "@/lib/profiles";
import { generateProfileId } from "@/lib/hash";
import type { UserProfile } from "@/types/profile";

export async function POST(req: NextRequest) {
  let body: Partial<UserProfile>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string") {
    return Response.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.email || typeof body.email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  let id = generateProfileId(body.name);
  while (await getProfile(id)) {
    id = generateProfileId(body.name);
  }

  const profile: UserProfile = {
    id,
    name: body.name,
    handle: body.handle ?? `@${body.name.toLowerCase().replace(/\s+/g, "")}`,
    email: body.email,
    title: body.title,
    resumeUrl: body.resumeUrl,
    liveLocation: body.liveLocation,
    locations: body.locations ?? [],
    projects: body.projects ?? [],
    createdAt: new Date().toISOString(),
  };

  await saveProfile(profile);

  return Response.json({ id, url: `/${id}` }, { status: 201 });
}
