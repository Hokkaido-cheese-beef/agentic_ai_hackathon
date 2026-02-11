/**
 * リポジトリ層インターフェース
 * 戻り値は全てドメイン型（tags: CandidateTag[], ai_summary: AiSummary | null）
 * JSON serialize の詳細は各実装に隠蔽
 */
import type { TripGroup, TripCandidate, Question, CandidateTag, AiSummary } from "@/types";

export interface CandidateUpdateData {
  description: string | null;
  rating: number | null;
  review_count: number | null;
  tags: CandidateTag[];
  info: string | null;
  ai_summary: AiSummary | null;
}

export interface ITripGroupRepository {
  create(data: { name: string; departure?: string | null }): Promise<TripGroup>;
  findById(tripGroupId: string): Promise<TripGroup | null>;
}

export interface ICandidateRepository {
  create(data: { name: string; sourceUrl?: string | null; tripGroupId: string }): Promise<TripCandidate>;
  findById(tripGroupId: string, candidateId: string): Promise<TripCandidate | null>;
  findByGroupId(tripGroupId: string): Promise<TripCandidate[]>;
  update(candidateId: string, tripGroupId: string, data: Partial<CandidateUpdateData>): Promise<TripCandidate>;
}

export interface IQuestionRepository {
  create(data: { content: string; candidateId?: string | null; tripGroupId: string }): Promise<Question>;
  update(questionId: string, tripGroupId: string, data: { aiAnswer: string }): Promise<Question>;
}
