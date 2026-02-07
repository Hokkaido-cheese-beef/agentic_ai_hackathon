/**
 * TripVote 共通型定義
 */

// --- TripGroup ---
export interface TripGroup {
  trip_group_id: string;
  name: string;
  departure: string | null;
  status: "draft" | "active" | "completed";
  created_at: string;
}

// --- TripCandidate ---
export interface AiSummaryQA {
  q: string;
  a: string;
}

export interface AiSummary {
  headline: string;
  qa: AiSummaryQA[];
}

export interface CandidateTag {
  icon: string;
  label: string;
  textColor: string;
  iconColor: string;
  bgColor: string;
}

export interface TripCandidate {
  id: string;
  trip_group_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  tags: CandidateTag[];
  info: string | null;
  ai_summary: AiSummary | null;
  source_url: string | null;
  created_at: string;
}

// --- Question ---
export interface Question {
  id: string;
  candidate_id: string | null;
  trip_group_id: string;
  content: string;
  ai_answer: string | null;
  created_at: string;
}

// --- Firestore リアルタイムデータ ---
export interface FirestoreCandidate {
  name: string;
  description: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  tags: CandidateTag[];
  info: string | null;
  ai_summary: AiSummary | null;
  source_url: string | null;
  updated_at: unknown; // Firestore Timestamp
}

export interface FirestoreQuestion {
  candidate_id: string | null;
  content: string;
  ai_answer: string | null;
  ai_streaming: boolean;
  updated_at: unknown; // Firestore Timestamp
}
