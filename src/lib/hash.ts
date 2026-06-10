const CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generateProfileId(name: string): string {
  const slug = name
    .toLowerCase()
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  let hash = '';
  for (let i = 0; i < 4; i++) {
    hash += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `${slug || 'user'}-${hash}`;
}
