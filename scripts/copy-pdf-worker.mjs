// Copies the pdf.js worker out of node_modules into public/ so the app can
// serve it from its own origin (/pdf.worker.min.mjs) instead of relying on a
// CDN. Self-hosting guarantees the worker version always matches the installed
// pdfjs-dist and avoids CDN/CORS/MIME failures.
//
// Runs automatically via the "predev" and "prebuild" npm scripts.

import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

await mkdir(destDir, { recursive: true });
await copyFile(src, dest);
console.log("✓ copied pdf.worker.min.mjs -> public/");
