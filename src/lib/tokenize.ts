import { encode as encodeO200k } from "gpt-tokenizer/encoding/o200k_base";
import { encode as encodeCl100k } from "gpt-tokenizer/encoding/cl100k_base";

/**
 * Count tokens for a given encoding.
 * - OpenAI: uses gpt-tokenizer (tiktoken-compatible BPE).
 * - Anthropic Claude: cl100k_base is a close approximation.
 * - Google Gemini: SentencePiece-based. We approximate at ~3.8 chars/token
 *   (Google's published average for English). For exact counts in production,
 *   call the Vertex AI countTokens endpoint.
 */
export function countTokens(text: string, encoding: string): number {
  if (!text) return 0;
  switch (encoding) {
    case "o200k_base":
      return encodeO200k(text).length;
    case "cl100k_base":
      return encodeCl100k(text).length;
    case "gemini":
      return Math.max(1, Math.ceil(text.length / 3.8));
    default:
      return Math.max(1, Math.ceil(text.length / 4));
  }
}
