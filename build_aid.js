// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['./src/aid_hooks.js'], // starting point
  bundle: true,                   // combine into one file
  minify: false,                    // minify output
  outfile: 'dist/aid_hooks.js',        // output file
  sourcemap: true,                 // optional: for debugging
  keepNames: true,                 // preserve function/class names
  define: {
    // Optional: define constants at build time
  },
  external: [],                    // external deps if needed
  globalName: 'ono',         // optional: UMD global name
  legalComments: 'none',           // remove license comments
  inject: [],                      // optional: inject polyfills
  banner: {},                      // optional: add header
  footer: {},                      // optional: add footer
  
  define: {
    history: 'history',
    state: 'state'
  }
}).catch(() => process.exit(1));
