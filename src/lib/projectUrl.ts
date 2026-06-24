const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function parseProjectUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(u.protocol)) return null;
    return u;
  } catch {
    return null;
  }
}

export function isGithubUrl(u: URL): boolean {
  const host = u.hostname.toLowerCase();
  return host === "github.com" || host.endsWith(".github.com");
}

export function classifyProjectUrl(raw: string): {
  github: string | null;
  url: string | null;
} {
  const parsed = parseProjectUrl(raw);
  if (!parsed) return { github: null, url: null };
  const href = parsed.toString();
  return isGithubUrl(parsed)
    ? { github: href, url: null }
    : { github: null, url: href };
}
