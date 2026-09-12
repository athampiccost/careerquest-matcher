import { PDFParse } from "pdf-parse";

const MAX_PDF_BYTES = 7 * 1024 * 1024;
const MIN_RESUME_TEXT_LENGTH = 80;

export function decodeResumePdf(base64: string) {
  const normalized = base64.replace(/\s/g, "");
  if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error("The uploaded file could not be read as a PDF.");
  }

  const bytes = Buffer.from(normalized, "base64");
  if (bytes.length < 4 || bytes.subarray(0, 4).toString("ascii") !== "%PDF") {
    throw new Error("Please upload a valid PDF resume.");
  }
  if (bytes.length > MAX_PDF_BYTES) {
    throw new Error("Please upload a PDF smaller than 7 MB.");
  }
  return bytes;
}

export async function extractResumeTextFromPdf(base64: string) {
  const parser = new PDFParse({ data: decodeResumePdf(base64) });
  try {
    const result = await parser.getText();
    const text = result.text.replace(/\s+/g, " ").trim();
    if (text.length < MIN_RESUME_TEXT_LENGTH) {
      throw new Error("We could not find enough selectable text in this PDF. Please upload a text-based resume PDF.");
    }
    return text.slice(0, 15_000);
  } finally {
    await parser.destroy();
  }
}

export const resumePdfLimits = { maxBytes: MAX_PDF_BYTES, minTextLength: MIN_RESUME_TEXT_LENGTH };
