/**
 * サービス層インターフェース
 */
import type { CandidateTag, AiSummary } from "@/types";

export interface AiSummaryResult {
  description: string;
  rating: number;
  reviewCount: number;
  tags: CandidateTag[];
  info: string;
  aiSummary: AiSummary;
}

export interface AiStreamResult {
  stream: ReadableStream<Uint8Array>;
  fullText: Promise<string>;
}

export interface IAiService {
  summarize(candidateName: string, sourceUrl?: string | null): Promise<AiSummaryResult>;
  streamAnswer(question: string, candidateName: string | null, candidateInfo?: string): AiStreamResult;
}
