# Plan: Replace file-based profile storage with Vercel Postgres (Neon)

## Problem

`src/lib/profiles.ts` reads and writes JSON files under `profiles/*.json`.
Vercel runs each serverless function in an ephemeral container — filesystem writes
disappear when the function exits. Any profile created in production is lost on
the next cold start. The app must migrate to a real persistent database before
the deployment is meaningful.

---

## Solution: Vercel Postgres (Neon)

**Why Neon / Vercel Postgres**
- Free tier: 0.5 GB storage, 60 compute-hours/month — plenty for launch
- Serverless-native HTTP transport — no persistent connection pool needed
- One-click attachment from the Vercel dashboard; env vars auto-injected
- `@vercel/postgres` package wraps it with a `sql` tagged-template helper

**Schema — single `profiles` table, JSONB payload**

Store the entire `UserProfile` object as a JSONB column called `data`. This
keeps the DB schema stable even as `UserProfile` gains new optional fields.

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id          TEXT        PRIMARY KEY,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Affected files (every change is listed)

| File | Action |
|------|--------|
| `package.json` | add `@vercel/postgres` |
| `src/lib/profiles.ts` | full rewrite — sync fs → async SQL |
| `src/app/api/profiles/route.ts` | add `await` to `getProfile` + `saveProfile` calls |
| `src/app/[profileId]/page.tsx` | add `await` to both `getProfile` calls |
| `.gitignore` | remove `/profiles/*.json` line |
| `profiles/.gitkeep` | delete (directory no longer needed) |
| `.env.local` *(new, gitignored)* | add `POSTGRES_URL` for local dev |

---

## Step-by-step implementation

### Step 1 — Install the package

```bash
cd /Users/michael/Documents/code/orbit-app
npm install @vercel/postgres
```

`@vercel/postgres` reads the `POSTGRES_URL` (or `POSTGRES_URL_NON_POOLING`)
environment variable that Vercel injects when a Postgres store is attached.

---

### Step 2 — Provision the database

**Option A — Vercel dashboard (recommended for deploy)**
1. Go to vercel.com → New Project → import `DevMikeRoberts/orbit-app` → Deploy
2. After the first deploy, open the project → **Storage** tab → **Connect Store**
3. Create a new Postgres store (free tier) or attach an existing one
4. Vercel injects `POSTGRES_URL`, `POSTGRES_PRISMA_URL`,
   `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_HOST`,
   `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` as environment variables
5. Trigger a redeploy so the new env vars are picked up

**Option B — pull env vars for local dev (requires Vercel CLI)**
```bash
npm install -g vercel
vercel login
vercel link   # point local dir at the DevMikeRoberts/orbit-app project
vercel env pull .env.local   # writes all env vars to .env.local
```
`.env.local` is already in `.gitignore` — never commit it.

**Option C — local Postgres for offline dev**
Install Postgres locally (or use Docker), create a database, and set:
```
# .env.local
POSTGRES_URL=postgresql://localhost:5432/orbit_dev
```

---

### Step 3 — Create the table (one-time DDL)

Run this SQL exactly once — in the Neon console (Storage → Open in Neon),
in the Vercel Postgres query editor, or via `psql $POSTGRES_URL`:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id          TEXT        PRIMARY KEY,
  data        JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles (created_at DESC);
```

Do **not** auto-run DDL inside route handlers on every request — run it once
and leave it. The `IF NOT EXISTS` guards make it idempotent if ever re-run.

---

### Step 4 — Rewrite `src/lib/profiles.ts`

Replace the entire file content with:

```typescript
import { sql } from '@vercel/postgres';
import type { UserProfile } from '@/types/profile';

export async function getProfile(id: string): Promise<UserProfile | null> {
  try {
    const { rows } = await sql`SELECT data FROM profiles WHERE id = ${id}`;
    return rows.length > 0 ? (rows[0].data as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await sql`
    INSERT INTO profiles (id, data)
    VALUES (${profile.id}, ${JSON.stringify(profile)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}

export async function listProfileIds(): Promise<string[]> {
  const { rows } = await sql`SELECT id FROM profiles ORDER BY created_at DESC`;
  return rows.map((r) => r.id as string);
}
```

Key changes vs the old file:
- All three functions are now `async` and return Promises
- `getProfile` uses a parameterized query — no injection risk
- `saveProfile` uses `INSERT … ON CONFLICT DO UPDATE` (upsert) so it works
  for both creates and future updates
- `listProfileIds` orders by `created_at DESC` so newest profiles surface first
- No filesystem imports (`fs`, `path`) remain

---

### Step 5 — Update `src/app/api/profiles/route.ts`

Two changes:
1. The collision-check `while` loop must `await getProfile`
2. `saveProfile(profile)` must be awaited

Full updated file:

```typescript
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
```

The only diff from the current file: `while (await getProfile(id))` and
`await saveProfile(profile)`. Everything else is identical.

---

### Step 6 — Update `src/app/[profileId]/page.tsx`

`getProfile` is called twice — once in `generateMetadata`, once in `Page`.
Both are already inside `async` functions, so just add `await`:

```typescript
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import ProfilePage from "@/components/ProfilePage";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  const profile = await getProfile(profileId);   // ← await added
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
  const profile = await getProfile(profileId);   // ← await added
  if (!profile) notFound();
  return <ProfilePage profile={profile} />;
}
```

---

### Step 7 — Clean up the filesystem storage artefacts

```bash
# Remove the profiles directory entirely (no longer needed)
rm -rf /Users/michael/Documents/code/orbit-app/profiles
```

In `.gitignore`, remove this line:
```
/profiles/*.json
```

---

### Step 8 — TypeScript check and build

```bash
cd /Users/michael/Documents/code/orbit-app

# Type check — should be clean; the only risk is the sync→async change
npx tsc --noEmit

# Full build — POSTGRES_URL must be set; if not, skip this locally
# and rely on Vercel's build step instead
POSTGRES_URL=postgresql://placeholder/placeholder npm run build
```

`@vercel/postgres` does not make a real DB connection at build time for static
pages, so a dummy `POSTGRES_URL` is enough to let the build complete. The
`/[profileId]` route is dynamic (`ƒ`) so it is not statically generated.

---

## Vercel deployment end-to-end

1. **Push** the completed changes to `main` on GitHub:
   ```bash
   git add src/lib/profiles.ts src/app/api/profiles/route.ts \
           src/app/\[profileId\]/page.tsx package.json package-lock.json \
           .gitignore
   git commit -m "migrate profile storage from filesystem to Vercel Postgres"
   git push origin main
   ```

2. **Import** the project on vercel.com if not already done:
   - New Project → import `DevMikeRoberts/orbit-app` → Deploy

3. **Attach Postgres** (Storage tab → Connect Store → Postgres):
   - Creates a Neon database and sets all `POSTGRES_*` env vars automatically
   - Trigger a redeploy so the new env vars are live

4. **Run the DDL** once in the Neon console (Storage → Open in Neon → SQL Editor):
   ```sql
   CREATE TABLE IF NOT EXISTS profiles (
     id          TEXT        PRIMARY KEY,
     data        JSONB       NOT NULL,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles (created_at DESC);
   ```

5. **Verify**: visit `{deploy-url}/create` → complete the wizard → confirm the
   success screen shows a URL → visit that URL → globe loads with your data.

---

## Verification checklist

- [ ] `npx tsc --noEmit` passes with zero errors after the changes
- [ ] `npm run build` completes (with a valid or dummy `POSTGRES_URL`)
- [ ] `POST /api/profiles` returns `201` with `{ id, url }` in local dev
- [ ] `GET /{id}` renders the profile globe (not 404) in local dev
- [ ] Restarting the dev server (`Ctrl-C` + `npm run dev`) does **not** lose the
  profile — confirms data is in the DB, not memory/filesystem
- [ ] Vercel preview deploy: create a profile and reload the URL — profile persists

---

## What is NOT in scope here

- Rate limiting on `POST /api/profiles` (anyone can create profiles)
- Profile editing or deletion (no `PUT`/`DELETE` routes)
- Auth / ownership — profiles are public and anonymous once created
- Pagination on `listProfileIds` (not called from any route yet)

These can be addressed in follow-on work once the storage layer is solid.
