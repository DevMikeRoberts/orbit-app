import { NextRequest } from "next/server";
import { searchCities } from "@/lib/cities";

export interface CityResult {
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    region?: string;
    country_code?: string;
    country?: string;
  };
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ results: [] });

  const local: CityResult[] = searchCities(q).map((c) => ({
    city: c.city,
    region: "",
    country: c.country,
    lat: c.lat,
    lng: c.lng,
  }));

  let remote: CityResult[] = [];
  if (local.length < 5) {
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q,
          format: "jsonv2",
          limit: "6",
          addressdetails: "1",
          "accept-language": "en",
        });
      const res = await fetch(url, {
        headers: { "User-Agent": "orbit-app (https://github.com/DevMikeRoberts/orbit-app)" },
        next: { revalidate: 60 * 60 * 24 },
      });
      if (res.ok) {
        const items = (await res.json()) as NominatimItem[];
        remote = items
          .map((d): CityResult | null => {
            const lat = parseFloat(d.lat);
            const lng = parseFloat(d.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            const a = d.address ?? {};
            const city =
              a.city ?? a.town ?? a.village ?? a.hamlet ?? d.display_name.split(",")[0]?.trim() ?? "";
            if (!city) return null;
            return {
              city,
              region: a.state ?? a.region ?? "",
              country: (a.country_code ?? a.country ?? "").toUpperCase().slice(0, 2),
              lat,
              lng,
            };
          })
          .filter((x): x is CityResult => x !== null);
      }
    } catch {
      // Network or Nominatim hiccup — fall back to local-only.
    }
  }

  const byKey = new Map<string, CityResult>();
  const order: string[] = [];
  for (const c of [...local, ...remote]) {
    const key = `${c.city.toLowerCase()}|${c.country}|${c.lat.toFixed(1)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, c);
      order.push(key);
    } else if (!existing.region && c.region) {
      byKey.set(key, c);
    }
  }

  return Response.json({ results: order.slice(0, 8).map((k) => byKey.get(k)!) });
}
