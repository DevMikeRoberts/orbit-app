import {
  CONNECTION_EMOJIS,
  CONNECTION_LABELS,
  PIN_COLORS,
} from "@/types/profile";
import type {
  ConnectionType,
  ProfileLocation,
  SubEntry,
  UserProfile,
} from "@/types/profile";

export interface ResolvedCity {
  city: string;
  region?: string;
  country: string;
  lat: number;
  lng: number;
}

export interface ExtraPlace {
  city: ResolvedCity;
  type: ConnectionType;
  note?: string;
}

export interface ChatAnswers {
  name: string;
  email: string;
  title?: string;
  handle?: string;
  image?: string;
  birthDate?: string;
  born?: ResolvedCity;
  raised?: ResolvedCity;
  live: ResolvedCity;
  education?: Array<{ university: string; city: ResolvedCity; degree?: string; major?: string }>;
  work?: { city: ResolvedCity; company?: string; role?: string };
  extras?: ExtraPlace[];
  projects?: import("@/types/profile").ProfileProject[];
}

function slugifyHandle(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "");
  return `@${slug || "you"}`;
}

function birthYear(birthDate?: string): string {
  if (!birthDate) return "";
  const match = /\b(19|20)\d{2}\b/.exec(birthDate);
  return match ? match[0] : "";
}

function placeLabel(city: ResolvedCity): string {
  const tail = [city.region, city.country].filter(Boolean).join(", ");
  return tail ? `${city.city}, ${tail}` : city.city;
}

function cityKey(city: ResolvedCity): string {
  return `${city.lat.toFixed(3)},${city.lng.toFixed(3)}`;
}

interface PendingEntry {
  type: ConnectionType;
  city: ResolvedCity;
  entry: SubEntry;
}

function entryFor(type: ConnectionType, opts: Partial<SubEntry> = {}): SubEntry {
  return {
    emoji: opts.emoji ?? CONNECTION_EMOJIS[type],
    role: opts.role ?? CONNECTION_LABELS[type],
    company: opts.company,
    place: opts.place ?? "",
    description: opts.description ?? "",
    date: opts.date ?? "",
  };
}

export function inferProfile(
  answers: ChatAnswers,
): Omit<UserProfile, "id" | "createdAt"> {
  const pending: PendingEntry[] = [];
  const year = birthYear(answers.birthDate);

  if (answers.born) {
    pending.push({
      type: "born",
      city: answers.born,
      entry: entryFor("born", {
        role: "Born here",
        place: placeLabel(answers.born),
        date: year,
      }),
    });
  }

  if (answers.raised) {
    pending.push({
      type: "raised",
      city: answers.raised,
      entry: entryFor("raised", {
        role: "Grew up here",
        place: placeLabel(answers.raised),
      }),
    });
  }

  pending.push({
    type: "live",
    city: answers.live,
    entry: entryFor("live", {
      role: "Currently living",
      place: placeLabel(answers.live),
      date: "Present",
    }),
  });

  for (const edu of answers.education ?? []) {
    const role = [edu.degree, edu.major].filter(Boolean).join(" ") || "School / University";
    pending.push({
      type: "school",
      city: edu.city,
      entry: entryFor("school", {
        role,
        place: edu.university,
        prefix: "Studied at",
      }),
    });
  }

  if (answers.work) {
    const { city, company, role } = answers.work;
    pending.push({
      type: "work",
      city,
      entry: entryFor("work", {
        role: role || answers.title || "Currently working",
        company,
        place: placeLabel(city),
        date: "Present",
      }),
    });
  }

  for (const extra of answers.extras ?? []) {
    pending.push({
      type: extra.type,
      city: extra.city,
      entry: entryFor(extra.type, {
        place: placeLabel(extra.city),
        description: extra.note ?? "",
      }),
    });
  }

  const grouped = new Map<string, ProfileLocation>();
  const order: string[] = [];
  for (const { type, city, entry } of pending) {
    const key = cityKey(city);
    let loc = grouped.get(key);
    if (!loc) {
      loc = {
        id: `loc-${key.replace(/[^\w]/g, "_")}`,
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        color: PIN_COLORS[order.length % PIN_COLORS.length],
        connectionType: type,
        subEntries: [],
      };
      grouped.set(key, loc);
      order.push(key);
    }
    if (!loc.subEntries.some((e) => e.role === entry.role && e.company === entry.company)) {
      loc.subEntries.push(entry);
    }
  }

  const locations = order.map((k) => grouped.get(k)!);

  return {
    name: answers.name,
    handle: answers.handle?.trim() || slugifyHandle(answers.name),
    email: answers.email,
    title: answers.title,
    image: answers.image,
    liveLocation: { lat: answers.live.lat, lng: answers.live.lng },
    locations,
    projects: answers.projects ?? [],
  };
}

export function describeAnswers(answers: Partial<ChatAnswers>): string[] {
  const missing: string[] = [];
  if (!answers.name?.trim()) missing.push("your name");
  if (!answers.live) missing.push("where you live now");
  return missing;
}
