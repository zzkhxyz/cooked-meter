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
// doesn't reach it. Prepend the Safari polyfills pdf.js needs:
//  - ReadableStream async iteration (Safari lacks Symbol.asyncIterator on streams)
//  - Promise.withResolvers (missing on iOS Safari < 17.4)
// Without these pdf.js crashes with "undefined is not a function".
const POLYFILL = [
  `if(typeof Promise.withResolvers!=="function"){Promise.withResolvers=function(){let r,j;const p=new Promise((res,rej)=>{r=res;j=rej});return{promise:p,resolve:r,reject:j}}}`,
  `if(typeof ReadableStream!=="undefined"&&typeof ReadableStream.prototype[Symbol.asyncIterator]!=="function"){var __v=function(){var rd=this.getReader();return{next:function(){return rd.read().then(function(r){if(r.done)rd.releaseLock();return r})},return:function(v){var c=rd.cancel(v);rd.releaseLock();return c.then(function(){return{done:true,value:v}})},[Symbol.asyncIterator]:function(){return this}}};if(typeof ReadableStream.prototype.values!=="function")ReadableStream.prototype.values=__v;ReadableStream.prototype[Symbol.asyncIterator]=ReadableStream.prototype.values}`,
  ``,
].join("\n");

await mkdir(destDir, { recursive: true });
const worker = await readFile(src, "utf8");
await writeFile(dest, POLYFILL + worker);
console.log("✓ copied pdf.worker.min.mjs (+ polyfill) -> public/");
