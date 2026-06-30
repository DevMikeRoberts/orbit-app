import { neon } from '@neondatabase/serverless';
import type { UserProfile } from '@/types/profile';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export async function getProfile(id: string): Promise<UserProfile | null> {
  try {
    const sql = getSql();
    const rows = await sql`SELECT data FROM profiles WHERE id = ${id}`;
    return rows.length > 0 ? (rows[0].data as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function getProfileOwner(id: string): Promise<string | null> {
  try {
    const sql = getSql();
    const rows = await sql`SELECT owner_id FROM profiles WHERE id = ${id}`;
    return rows.length > 0 ? ((rows[0].owner_id as string | null) ?? null) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(
  profile: UserProfile,
  ownerId?: string | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO profiles (id, data, owner_id)
    VALUES (${profile.id}, ${JSON.stringify(profile)}, ${ownerId ?? null})
    ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data,
          owner_id = COALESCE(profiles.owner_id, EXCLUDED.owner_id)
  `;
}

export async function deleteProfile(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM profiles WHERE id = ${id}`;
}

export async function listProfilesByOwner(
  ownerId: string,
): Promise<{ id: string; data: UserProfile; createdAt: string }[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, data, created_at
    FROM profiles
    WHERE owner_id = ${ownerId}
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id as string,
    data: r.data as UserProfile,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function listProfileIds(): Promise<string[]> {
  const sql = getSql();
  const rows = await sql`SELECT id FROM profiles ORDER BY created_at DESC`;
  return rows.map((r) => r.id as string);
}

export async function getProfileCount(): Promise<number> {
  try {
    const sql = getSql();
    const rows = await sql`SELECT COUNT(*) as count FROM profiles`;
    return rows.length > 0 ? (rows[0].count as number) : 0;
  } catch {
    return 0;
  }
}
