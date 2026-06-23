import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  getProfile,
  getProfileOwner,
  saveProfile,
  deleteProfile,
} from "@/lib/profiles";
import { hasKey, sanitizeProfilePatch } from "@/lib/validateProfile";
import type { UserProfile } from "@/types/profile";

async function authorize(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const ownerId = await getProfileOwner(id);
  if (ownerId === null) {
    return { error: Response.json({ error: "Not found" }, { status: 404 }) };
  }
  if (ownerId !== session.user.id) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await authorize(id);
  if ("error" in guard) return guard.error;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await getProfile(id);
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  const body = sanitizeProfilePatch(raw);

  const updated: UserProfile = {
    ...existing,
    name: body.name && body.name.trim() ? body.name : existing.name,
    handle:
      body.handle && body.handle.trim() ? body.handle : existing.handle,
    email: existing.email,
    title: hasKey(raw, "title") ? body.title : existing.title,
    image: hasKey(raw, "image") ? body.image : existing.image,
    resumeUrl: hasKey(raw, "resumeUrl") ? body.resumeUrl : existing.resumeUrl,
    liveLocation: body.liveLocation ?? existing.liveLocation,
    locations: body.locations ?? existing.locations,
    projects: body.projects ?? existing.projects,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  await saveProfile(updated, guard.userId);
  return Response.json({ id, url: `/${id}` });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await authorize(id);
  if ("error" in guard) return guard.error;

  await deleteProfile(id);
  return Response.json({ ok: true });
}
