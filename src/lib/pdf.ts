import * as pdfjs from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: unknown) => (it as { str?: string }).str ?? "")
      .join(" ");
    parts.push(text);
  }
  return parts.join("\n\n");
}

/**
 * Heuristic estimate of expected output tokens from an input prompt.
 * Short prompts → short answers; long context → bounded summarization-sized output.
 */
export function estimateOutputTokens(inputTokens: number): number {
  if (inputTokens <= 0) return 0;
  if (inputTokens < 100) return Math.max(64, Math.round(inputTokens * 1.2));
  if (inputTokens < 1000) return Math.round(inputTokens * 0.6);
  if (inputTokens < 10000) return Math.min(2048, Math.round(inputTokens * 0.25));
  return Math.min(4096, Math.round(inputTokens * 0.1));
}