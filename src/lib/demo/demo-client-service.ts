/**
 * デモモード用クライアントサービス
 * API通信を一切せず、demoStore + mock-ai だけで完結する
 */
import { demoStore } from "./store";
import { seedDemoData } from "./mock-data";
import { mockSummarize, mockQuestionAnswer } from "./mock-ai";
import type { TripGroup, TripCandidate, Question } from "@/types";

const SEEDED_KEY = "__tripvote_demo_seeded__";
function ensureClientSeeded() {
  const g = globalThis as Record<string, unknown>;
  if (g[SEEDED_KEY]) return;
  g[SEEDED_KEY] = true;
  seedDemoData();
}

// --- TripGroup ---

export async function demoCreateTripGroup(name: string): Promise<TripGroup> {
  ensureClientSeeded();
  const group: TripGroup = {
    trip_group_id: crypto.randomUUID(),
    name,
    departure: null,
    status: "draft",
    created_at: new Date().toISOString(),
  };
  demoStore.addTripGroup(group);
  return group;
}

export function demoGetTripGroup(id: string): TripGroup | undefined {
  ensureClientSeeded();
  return demoStore.getTripGroup(id);
}

// --- Candidate ---

export async function demoAddCandidate(
  tripGroupId: string,
  name: string,
  sourceUrl: string | null
): Promise<TripCandidate> {
  ensureClientSeeded();
  const candidate: TripCandidate = {
    id: crypto.randomUUID(),
    trip_group_id: tripGroupId,
    name,
    description: null,
    image_url: null,
    rating: null,
    review_count: null,
    tags: [],
    info: null,
    ai_summary: null,
    source_url: sourceUrl,
    created_at: new Date().toISOString(),
  };
  demoStore.addCandidate(candidate);

  // バックグラウンドでAI要約を実行
  mockSummarize(name).then((summary) => {
    demoStore.updateCandidate(candidate.id, {
      description: summary.description,
      tags: summary.tags,
      info: summary.info,
      ai_summary: summary.ai_summary,
    });
  });

  return candidate;
}

// --- Question ---

export async function demoAddQuestion(
  tripGroupId: string,
  content: string,
  candidateId: string | null
): Promise<Question> {
  ensureClientSeeded();
  const question: Question = {
    id: crypto.randomUUID(),
    trip_group_id: tripGroupId,
    candidate_id: candidateId,
    content,
    ai_answer: null,
    created_at: new Date().toISOString(),
  };
  demoStore.addQuestion(question);
  return question;
}

// --- Q&A生成 + 追記（候補ごとに個別回答） ---

export function demoGenerateAndAppendQA(candidateId: string, question: string): void {
  ensureClientSeeded();
  const candidate = demoStore.getCandidate(candidateId);
  if (!candidate) return;
  const answer = mockQuestionAnswer(question, candidate.name);
  const current = candidate.ai_summary ?? { headline: "", qa: [] };
  demoStore.updateCandidate(candidateId, {
    ai_summary: { ...current, qa: [...current.qa, { q: question, a: answer }] },
  });
}

// --- Subscribe ---

export function demoSubscribeCandidates(
  tripGroupId: string,
  cb: (candidates: TripCandidate[]) => void
): () => void {
  ensureClientSeeded();
  return demoStore.subscribe(
    `tripGroups/${tripGroupId}/candidates`,
    () => {
      cb(demoStore.getCandidatesByGroup(tripGroupId));
    }
  );
}
