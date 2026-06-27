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
 * Extract all text from a PDF file. Throws ScannedPdfError when the document
 * has no extractable text layer (i.e. it's a scan / images only).
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
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
