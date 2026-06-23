// One-shot verification via temp file that converts @/ imports to relative paths.
import { readFile, writeFile, rm } from "node:fs/promises";

const src = await readFile(
  new URL("../src/lib/inferProfile.ts", import.meta.url),
  "utf8",
);
const rewritten = src.replaceAll('"@/types/profile"', '"./src/types/profile.ts"');
const tmp = new URL("../.tmp-infer.ts", import.meta.url);
await writeFile(tmp, rewritten);

try {
  const { inferProfile } = await import(tmp.href);

  const profile = inferProfile({
    name: "Alex Chen",
    email: "alex@example.com",
    birthDate: "1995-06-12",
    born: { city: "Austin", country: "US", lat: 30.267, lng: -97.743 },
    raised: { city: "Austin", country: "US", lat: 30.267, lng: -97.743 },
    live: { city: "San Francisco", country: "US", lat: 37.774, lng: -122.419 },
    school: {
      city: { city: "Boston", country: "US", lat: 42.36, lng: -71.059 },
      name: "B.S. Computer Science, MIT",
    },
    work: {
      city: { city: "San Francisco", country: "US", lat: 37.774, lng: -122.419 },
      company: "Acme Corp.",
      role: "Senior Software Engineer",
    },
    extras: [
      {
        city: { city: "Tokyo", country: "JP", lat: 35.676, lng: 139.65 },
        type: "travel",
        note: "First international trip.",
      },
    ],
  });

  console.log(JSON.stringify(profile, null, 2));

  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg);
  };
  assert(profile.handle === "@alexchen", "handle should slugify name");
  assert(profile.liveLocation.lat === 37.774, "liveLocation set from live answer");
  assert(profile.locations.length === 4, `expected 4 cities, got ${profile.locations.length}`);

  const austin = profile.locations.find((l) => l.city === "Austin");
  assert(austin && austin.subEntries.length === 2, "Austin: born + raised");

  const sf = profile.locations.find((l) => l.city === "San Francisco");
  assert(sf && sf.subEntries.length === 2, "SF: live + work");
  const work = sf.subEntries.find((e) => e.company === "Acme Corp.");
  assert(work && work.role === "Senior Software Engineer", "work entry");

  const born = austin.subEntries.find((e) => e.role === "Born here");
  assert(born && born.date === "1995", `born year should be 1995, got '${born?.date}'`);

  console.log("\n✓ All assertions passed");
} finally {
  await rm(tmp).catch(() => {});
}
