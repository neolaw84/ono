// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/aid.js'], // starting point
  bundle: true,                   // combine into one file
  minify: true,                    // minify output
  outfile: 'dist/index.js',        // output file
  sourcemap: true,                 // optional: for debugging
  keepNames: true,                 // preserve function/class names
  define: {
    // Optional: define constants at build time
  },
  external: [],                    // external deps if needed
  globalName: 'ono',         // optional: UMD global name
  legalComments: 'none',           // remove license comments
  // Tell esbuild about globals so it won't complain
  inject: [],                      // optional: inject polyfills
  banner: {},                      // optional: add header
  footer: {},                      // optional: add footer
  // Mark your global singletons as external so they aren't bundled
  // and no "not defined" errors occur
  // Example: if you have `MY_GLOBAL_ARRAY` and `MY_GLOBAL_JSON`
  // in the runtime environment:
  // This prevents esbuild from trying to resolve them
  // and keeps them as references in the output
  // (no import or require)
  // You can pass them via `--define` or here:
  // define: { MY_GLOBAL_ARRAY: 'MY_GLOBAL_ARRAY', MY_GLOBAL_JSON: 'MY_GLOBAL_JSON' }
  // But better: use `--external` for non-module globals
  // However, esbuild doesn't have direct "globals" config,
  // so we use `--define` trick:
  define: {
    history: 'history',
    state: 'state'
  }
}).catch(() => process.exit(1));
