import { NextRequest } from "next/server";
import { searchUniversities } from "@/lib/universities";

export interface UniversityResult {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ results: [] });

  const results = searchUniversities(q);
  return Response.json({ results: results.slice(0, 10) });
}
