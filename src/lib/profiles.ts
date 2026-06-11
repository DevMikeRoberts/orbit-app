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

export async function saveProfile(profile: UserProfile): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO profiles (id, data)
    VALUES (${profile.id}, ${JSON.stringify(profile)})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}

export async function listProfileIds(): Promise<string[]> {
  const sql = getSql();
  const rows = await sql`SELECT id FROM profiles ORDER BY created_at DESC`;
  return rows.map((r) => r.id as string);
}
