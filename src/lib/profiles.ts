import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { UserProfile } from '@/types/profile';

const PROFILES_DIR = join(process.cwd(), 'profiles');

function ensureDir() {
  if (!existsSync(PROFILES_DIR)) {
    mkdirSync(PROFILES_DIR, { recursive: true });
  }
}

export function getProfile(id: string): UserProfile | null {
  ensureDir();
  const file = join(PROFILES_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as UserProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  ensureDir();
  const file = join(PROFILES_DIR, `${profile.id}.json`);
  writeFileSync(file, JSON.stringify(profile, null, 2), 'utf8');
}

export function listProfileIds(): string[] {
  ensureDir();
  return readdirSync(PROFILES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}
