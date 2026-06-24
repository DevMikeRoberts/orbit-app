import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { getProfileOwner } from "@/lib/profiles";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await authorize(id);
  if ("error" in guard) return guard.error;

  const lengthHeader = req.headers.get("content-length");
  if (lengthHeader) {
    const len = Number(lengthHeader);
    if (Number.isFinite(len) && len > MAX_BYTES + 4096) {
      return Response.json(
        { error: `Image too large — max ${MAX_BYTES / (1024 * 1024)} MB` },
        { status: 413 },
      );
    }
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json(
      { error: "Image must be PNG, JPEG, WebP, or GIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `Image too large — max ${MAX_BYTES / (1024 * 1024)} MB` },
      { status: 413 },
    );
  }

  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = extMap[file.type] ?? "bin";
  const key = `avatars/${id}-${Date.now()}.${ext}`;

  try {
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });
    return Response.json({ url: blob.url });
  } catch (err) {
    console.error("[avatar] upload failed", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
