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
