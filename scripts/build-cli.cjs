const path = require('node:path');

// pnpm's strict layout does not hoist esbuild to the project root. Resolve it
// directly when available, otherwise through tsx (which always depends on it).
function loadEsbuild() {
  try {
    return require('esbuild');
  } catch {
    // fall through
  }
  try {
    const tsxDir = path.dirname(require.resolve('tsx/package.json'));
    return require(require.resolve('esbuild', { paths: [tsxDir] }));
  } catch {
    // fall through
  }
  throw new Error('esbuild tidak ditemukan. Jalankan `pnpm install` di direktori tracker.');
}

const esbuild = loadEsbuild();

const HERE = path.resolve(__dirname, '..');
esbuild.buildSync({
  entryPoints: [path.join(HERE, 'src/cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: path.join(HERE, 'dist/cli.mjs'),
  packages: 'external',
  format: 'esm',
});
console.log('✓ tracker CLI compiled to dist/cli.mjs');
