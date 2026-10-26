const esbuild = require('esbuild');
const path = require('node:path');

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
