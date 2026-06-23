import { parseProjectUrl } from "@/lib/projectUrl";
import type {
  ProfileLocation,
  ProfileProject,
  SubEntry,
  UserProfile,
} from "@/types/profile";

const MAX_LOCATIONS = 100;
const MAX_PROJECTS = 50;
const MAX_SUBENTRIES = 25;
const MAX_TAGS = 20;
const MAX_STR = 500;

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function clip(v: unknown, max = MAX_STR): string | undefined {
  if (!isString(v)) return undefined;
  return v.length > max ? v.slice(0, max) : v;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isAllowedImageUrl(v: unknown): v is string {
  if (!isString(v) || !v) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSubEntry(s: unknown): SubEntry | null {
  if (!s || typeof s !== "object") return null;
  const r = s as Record<string, unknown>;
  return {
    emoji: clip(r.emoji, 16) ?? "",
    role: clip(r.role) ?? "",
    company: clip(r.company),
    logo: clip(r.logo),
    place: clip(r.place) ?? "",
    description: clip(r.description, 2000) ?? "",
    date: clip(r.date, 64) ?? "",
  };
}

function validateLocation(l: unknown): ProfileLocation | null {
  if (!l || typeof l !== "object") return null;
  const r = l as Record<string, unknown>;
  if (
    !isString(r.id) ||
    !isString(r.city) ||
    !isFiniteNumber(r.lat) ||
    !isFiniteNumber(r.lng) ||
    !isString(r.color)
  ) {
    return null;
  }
  const subRaw = Array.isArray(r.subEntries) ? r.subEntries : [];
  const subEntries: SubEntry[] = [];
  for (const s of subRaw.slice(0, MAX_SUBENTRIES)) {
    const v = validateSubEntry(s);
    if (v) subEntries.push(v);
  }
  let cardOffset: ProfileLocation["cardOffset"] | undefined;
  if (r.cardOffset && typeof r.cardOffset === "object") {
    const co = r.cardOffset as Record<string, unknown>;
    if (isFiniteNumber(co.dLat) && isFiniteNumber(co.dLng)) {
      const dLat = Math.max(-180, Math.min(180, co.dLat));
      const dLng = Math.max(-360, Math.min(360, co.dLng));
      cardOffset = { dLat, dLng };
    }
  }

  return {
    id: clip(r.id, 128) ?? "",
    city: clip(r.city, 200) ?? "",
    lat: r.lat,
    lng: r.lng,
    color: clip(r.color, 32) ?? "",
    connectionType: isString(r.connectionType)
      ? (clip(r.connectionType, 32) as ProfileLocation["connectionType"])
      : undefined,
    subEntries,
    spread: isFiniteNumber(r.spread) ? r.spread : undefined,
    cardOffset,
  };
}

function validateProject(p: unknown): ProfileProject | null {
  if (!p || typeof p !== "object") return null;
  const r = p as Record<string, unknown>;
  if (!isString(r.title) || r.title.trim().length === 0) return null;
  const githubRaw = isString(r.github) ? r.github : null;
  const urlRaw = isString(r.url) ? r.url : null;
  const githubParsed = githubRaw ? parseProjectUrl(githubRaw) : null;
  const urlParsed = urlRaw ? parseProjectUrl(urlRaw) : null;
  const tagsRaw = Array.isArray(r.tags) ? r.tags : [];
  return {
    title: clip(r.title, 200) ?? "",
    blurb: clip(r.blurb, 500) ?? "",
    github: githubParsed ? githubParsed.toString() : null,
    url: urlParsed ? urlParsed.toString() : null,
    tags: tagsRaw
      .filter(isString)
      .slice(0, MAX_TAGS)
      .map((t) => clip(t, 64) ?? ""),
    accent: clip(r.accent, 32) ?? "#60a5fa",
  };
}

export type SanitizedPatch = Partial<UserProfile>;

export function sanitizeProfilePatch(body: unknown): SanitizedPatch {
  if (!body || typeof body !== "object") return {};
  const r = body as Record<string, unknown>;
  const out: SanitizedPatch = {};

  if ("name" in r) out.name = clip(r.name, 200) ?? "";
  if ("handle" in r) out.handle = clip(r.handle, 64) ?? "";
  if ("title" in r) out.title = clip(r.title, 200);
  if ("resumeUrl" in r) {
    out.resumeUrl = isAllowedImageUrl(r.resumeUrl) ? (r.resumeUrl as string) : undefined;
  }
  if ("image" in r) {
    if (r.image === "" || r.image == null) {
      out.image = undefined;
    } else if (isAllowedImageUrl(r.image)) {
      out.image = r.image as string;
    } else {
      out.image = undefined;
    }
  }
  if ("liveLocation" in r) {
    const ll = r.liveLocation;
    if (ll && typeof ll === "object") {
      const lr = ll as Record<string, unknown>;
      if (isFiniteNumber(lr.lat) && isFiniteNumber(lr.lng)) {
        out.liveLocation = { lat: lr.lat, lng: lr.lng };
      }
    }
  }
  if ("locations" in r && Array.isArray(r.locations)) {
    const locs: ProfileLocation[] = [];
    for (const l of (r.locations as unknown[]).slice(0, MAX_LOCATIONS)) {
      const v = validateLocation(l);
      if (v) locs.push(v);
    }
    out.locations = locs;
  }
  if ("projects" in r && Array.isArray(r.projects)) {
    const projects: ProfileProject[] = [];
    for (const p of (r.projects as unknown[]).slice(0, MAX_PROJECTS)) {
      const v = validateProject(p);
      if (v) projects.push(v);
    }
    out.projects = projects;
  }

  return out;
}

export function hasKey(body: unknown, key: keyof UserProfile): boolean {
  return !!body && typeof body === "object" && key in (body as object);
}
