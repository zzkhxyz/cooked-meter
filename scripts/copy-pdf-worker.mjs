// Copies the pdf.js worker out of node_modules into public/ so the app can
// serve it from its own origin (/pdf.worker.min.mjs) instead of relying on a
// CDN. Self-hosting guarantees the worker version always matches the installed
// pdfjs-dist and avoids CDN/CORS/MIME failures.
//
// Runs automatically via the "predev" and "prebuild" npm scripts.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Legacy build = transpiled for broad browser support (older mobile Safari etc.).
const src = join(
  root,
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.min.mjs",
);
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

// The worker runs in its own context, so a polyfill set on the main thread
// doesn't reach it. Prepend Promise.withResolvers (missing on iOS Safari < 17.4,
// where pdf.js otherwise crashes with "undefined is not a function").
const POLYFILL = `if(typeof Promise.withResolvers!=="function"){Promise.withResolvers=function(){let r,j;const p=new Promise((res,rej)=>{r=res;j=rej});return{promise:p,resolve:r,reject:j}}}\n`;

await mkdir(destDir, { recursive: true });
const worker = await readFile(src, "utf8");
await writeFile(dest, POLYFILL + worker);
console.log("✓ copied pdf.worker.min.mjs (+ polyfill) -> public/");
