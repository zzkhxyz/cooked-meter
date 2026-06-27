// Client-side PDF text extraction with pdf.js.
//
// We extract text in the browser (not on the server) on purpose: Vercel's free
// serverless functions cap the request body at ~4.5 MB, and PDFs are often
// bigger. By extracting here we send only plain text to /api/analyze.
//
// pdfjs-dist is imported dynamically (not at module top-level) so it never runs
// during server-side rendering, where its browser-only APIs would crash.

"use client";

export class ScannedPdfError extends Error {
  constructor() {
    super("scanned-pdf");
    this.name = "ScannedPdfError";
  }
}

/**
 * Polyfills the APIs pdf.js needs that Safari lacks. The critical one:
 * `ReadableStream` async iteration (`for await...of`) — Safari does NOT implement
 * `ReadableStream.prototype[Symbol.asyncIterator]`, so pdf.js's getTextContent
 * crashes with "undefined is not a function". We also add Promise.withResolvers
 * (missing on iOS Safari < 17.4) for good measure.
 */
function applySafariPolyfills() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const P = Promise as any;
  if (typeof P.withResolvers !== "function") {
    P.withResolvers = function () {
      let resolve: any, reject: any;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }

  const RS = (globalThis as any).ReadableStream;
  if (RS && typeof RS.prototype[Symbol.asyncIterator] !== "function") {
    const values = function (this: any) {
      const reader = this.getReader();
      return {
        next() {
          return reader.read().then((r: any) => {
            if (r.done) reader.releaseLock();
            return r;
          });
        },
        return(value: any) {
          const cancel = reader.cancel(value);
          reader.releaseLock();
          return cancel.then(() => ({ done: true, value }));
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };
    };
    if (typeof RS.prototype.values !== "function") RS.prototype.values = values;
    RS.prototype[Symbol.asyncIterator] = RS.prototype.values;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/**
 * Extract all text from a PDF file. Throws ScannedPdfError when the document
 * has no extractable text layer (i.e. it's a scan / images only).
 */
export async function extractPdfText(file: File): Promise<string> {
  applySafariPolyfills();

  // Use the LEGACY build: it's transpiled for broad browser support, including
  // older mobile Safari where the modern build crashes with
  // "undefined is not a function" (missing APIs like Promise.withResolvers).
  const pdfjsLib = (await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as unknown as typeof import("pdfjs-dist");
  // Self-hosted worker copied into /public by scripts/copy-pdf-worker.mjs.
  // Same origin + version-matched = no CDN/CORS/MIME failures.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    if (pageText.trim()) parts.push(pageText);
  }

  const text = parts.join("\n").replace(/[ \t]+/g, " ").trim();
  if (text.length < 30) throw new ScannedPdfError();
  return text;
}
