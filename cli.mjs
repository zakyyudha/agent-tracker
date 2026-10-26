#!/usr/bin/env node
// Shim: jalankan versi pre-compiled (dist/cli.mjs) jika ada, atau fallback ke tsx.
// Eksekusi dist/cli.mjs instan (<50ms) dan bebas timeout kompilasi.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST_CLI = path.join(HERE, 'dist/cli.mjs');
const args = process.argv.slice(2);

if (existsSync(DIST_CLI)) {
  const res = spawnSync('node', [DIST_CLI, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  process.exit(res.status ?? 1);
}

if (!existsSync(path.join(HERE, 'node_modules'))) {
  console.error('tracker belum ter-install. Jalankan: cd tracker && pnpm install');
  process.exit(1);
}

const res = spawnSync('pnpm', ['exec', 'tsx', path.join(HERE, 'src/cli.ts'), ...args], {
  cwd: HERE,
  stdio: 'inherit',
});
process.exit(res.status ?? 1);
