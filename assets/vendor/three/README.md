# Three.js 0.180.0

MIT licensed, from https://registry.npmjs.org/three/-/three-0.180.0.tgz.
`build/three.core.js` and `build/three.webgpu.js` were minified with Terser 5.44.0:
`terser INPUT --module -c -m --comments '/@license/' -o OUTPUT`.
No imports were rewritten. Retain LICENSE when updating.
Only the paper view imports these files. The production site has no npm/build step.

Pinned to 0.180.0 for compatibility with Chromium 141 as well as current browsers; 0.186.1 failed GPUTextureViewDescriptor.swizzle on Chromium 141 in CI.
