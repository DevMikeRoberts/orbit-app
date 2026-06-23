#!/usr/bin/env node
// Apply SQL files in infra/migrations/ in lexical order against $DATABASE_URL.
// Idempotent — every migration uses IF NOT EXISTS / IF EXISTS guards.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run: vercel env pull .env.local && set -a && . ./.env.local && set +a");
  process.exit(1);
}

const sql = neon(url);
const dir = new URL("../infra/migrations/", import.meta.url).pathname;
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const f of files) {
  const body = await readFile(join(dir, f), "utf8");
  process.stdout.write(`→ ${f} ... `);
  await sql.query(body);
  console.log("ok");
}
console.log(`Applied ${files.length} migration(s).`);
