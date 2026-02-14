/**
 * サービス層インターフェース
 */
import type { CandidateTag, AiSummary } from "@/types";

export interface AiSummaryResult {
  description: string;
  tags: CandidateTag[];
  info: string;
  aiSummary: AiSummary;
}

export interface AiStreamResult {
  stream: ReadableStream<Uint8Array>;
  fullText: Promise<string>;
}

export interface IAiService {
  summarize(candidateName: string, sourceUrl?: string | null, origin?: string | null): Promise<AiSummaryResult>;
  fetchImage(query: string): Promise<string | null>;
  streamAnswer(question: string, candidateName: string | null, candidateInfo?: string): AiStreamResult;
}
