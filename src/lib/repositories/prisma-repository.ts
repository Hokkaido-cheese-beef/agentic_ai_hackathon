/**
 * Prisma + Firestore同期 リポジトリ実装
 * JSON serialize/parse を一元化し、Firestore同期をリポジトリ内に統合
 */
import type { PrismaClient } from "@prisma/client";
import type { TripGroup, TripCandidate, Question } from "@/types";
import type { ITripGroupRepository, ICandidateRepository, IQuestionRepository, CandidateUpdateData } from "./interfaces";
import { safeJsonParse } from "@/lib/utils";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { withRetry } from "@/lib/retry";

// --- Firestore同期ヘルパー（fire-and-forget） ---

function syncTripGroup(group: { trip_group_id: string; name: string; departure?: string | null; status: string }) {
  withRetry(
    () =>
      adminDb.collection("tripGroups").doc(group.trip_group_id).set({
        name: group.name,
        departure: group.departure || null,
        status: group.status,
        updated_at: FieldValue.serverTimestamp(),
      }),
    { label: "syncTripGroup" }
  ).catch((e) => console.error("Firestore sync failed (tripGroup):", e));
}

function syncCandidate(tripGroupId: string, candidate: { id: string; name: string; source_url?: string | null; createdBy?: string }) {
  withRetry(
    () =>
      adminDb.collection("tripGroups").doc(tripGroupId).collection("candidates").doc(candidate.id).set({
        name: candidate.name,
        source_url: candidate.source_url || null,
        description: null,
        image_url: null,
        rating: null,
        review_count: null,
        tags: [],
        info: null,
        ai_summary: null,
        createdBy: candidate.createdBy || null,
        updated_at: FieldValue.serverTimestamp(),
      }),
    { label: "syncCandidate" }
  ).catch((e) => console.error("Firestore sync failed (candidate):", e));
}

function updateCandidateFirestore(tripGroupId: string, candidateId: string, data: Record<string, unknown>) {
  withRetry(
    () =>
      adminDb.collection("tripGroups").doc(tripGroupId).collection("candidates").doc(candidateId).update({
        ...data,
        updated_at: FieldValue.serverTimestamp(),
      }),
    { label: "updateCandidate" }
  ).catch((e) => console.error("Firestore sync failed (candidate update):", e));
}

function syncQuestion(tripGroupId: string, question: { id: string; content: string; candidate_id?: string | null }) {
  withRetry(
    () =>
      adminDb.collection("tripGroups").doc(tripGroupId).collection("questions").doc(question.id).set({
        content: question.content,
        candidate_id: question.candidate_id || null,
        ai_answer: null,
        ai_streaming: true,
        updated_at: FieldValue.serverTimestamp(),
      }),
    { label: "syncQuestion" }
  ).catch((e) => console.error("Firestore sync failed (question):", e));
}

function updateQuestionFirestore(tripGroupId: string, questionId: string, data: Record<string, unknown>) {
  withRetry(
    () =>
      adminDb.collection("tripGroups").doc(tripGroupId).collection("questions").doc(questionId).update({
        ...data,
        updated_at: FieldValue.serverTimestamp(),
      }),
    { label: "updateQuestion" }
  ).catch((e) => console.error("Firestore sync failed (question update):", e));
}

// --- JSON parse 一元化 ---

function toCandidateDomain(row: Record<string, unknown>): TripCandidate {
  return {
    ...row,
    tags: safeJsonParse(row.tags as string | null, []),
    ai_summary: safeJsonParse(row.ai_summary as string | null, null),
  } as unknown as TripCandidate;
}

// --- Repository実装 ---

export class PrismaTripGroupRepository implements ITripGroupRepository {
  constructor(private db: PrismaClient) {}

  async create(data: { name: string; departure?: string | null }): Promise<TripGroup> {
    const group = await this.db.tripGroup.create({
      data: { name: data.name, departure: data.departure ?? null, status: "draft" },
    });
    const result = group as unknown as TripGroup;
    syncTripGroup(result);
    return result;
  }

  async findById(tripGroupId: string): Promise<TripGroup | null> {
    const group = await this.db.tripGroup.findUnique({
      where: { trip_group_id: tripGroupId },
    });
    return group as unknown as TripGroup | null;
  }
}

export class PrismaCandidateRepository implements ICandidateRepository {
  constructor(private db: PrismaClient) {}

  async create(data: { name: string; sourceUrl?: string | null; tripGroupId: string; createdBy?: string }): Promise<TripCandidate> {
    const candidate = await this.db.tripCandidate.create({
      data: { name: data.name, source_url: data.sourceUrl ?? null, trip_group_id: data.tripGroupId },
    });
    const result = toCandidateDomain(candidate as unknown as Record<string, unknown>);
    // createdBy を含めて Firestore に同期
    syncCandidate(data.tripGroupId, { ...candidate, createdBy: data.createdBy });
    return result;
  }

  async findById(candidateId: string): Promise<TripCandidate | null> {
    const candidate = await this.db.tripCandidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) return null;
    return toCandidateDomain(candidate as unknown as Record<string, unknown>);
  }

  async findByGroupId(tripGroupId: string): Promise<TripCandidate[]> {
    const candidates = await this.db.tripCandidate.findMany({
      where: { trip_group_id: tripGroupId },
      orderBy: { created_at: "asc" },
    });
    return candidates.map((c) => toCandidateDomain(c as unknown as Record<string, unknown>));
  }

  async update(candidateId: string, tripGroupId: string, data: Partial<CandidateUpdateData>): Promise<TripCandidate> {
    // DB用: tags/ai_summary を JSON文字列化
    const dbData: Record<string, unknown> = {};
    if (data.description !== undefined) dbData.description = data.description;
    if (data.rating !== undefined) dbData.rating = data.rating;
    if (data.review_count !== undefined) dbData.review_count = data.review_count;
    if (data.tags !== undefined) dbData.tags = JSON.stringify(data.tags);
    if (data.info !== undefined) dbData.info = data.info;
    if (data.ai_summary !== undefined) dbData.ai_summary = JSON.stringify(data.ai_summary);

    const candidate = await this.db.tripCandidate.update({
      where: { id: candidateId },
      data: dbData,
    });

    // Firestore用: tags/ai_summary はオブジェクトのまま
    const firestoreData: Record<string, unknown> = {};
    if (data.description !== undefined) firestoreData.description = data.description;
    if (data.rating !== undefined) firestoreData.rating = data.rating;
    if (data.review_count !== undefined) firestoreData.review_count = data.review_count;
    if (data.tags !== undefined) firestoreData.tags = data.tags;
    if (data.info !== undefined) firestoreData.info = data.info;
    if (data.ai_summary !== undefined) firestoreData.ai_summary = data.ai_summary;
    updateCandidateFirestore(tripGroupId, candidateId, firestoreData);

    return toCandidateDomain(candidate as unknown as Record<string, unknown>);
  }
}

export class PrismaQuestionRepository implements IQuestionRepository {
  constructor(private db: PrismaClient) {}

  async create(data: { content: string; candidateId?: string | null; tripGroupId: string }): Promise<Question> {
    const question = await this.db.question.create({
      data: { content: data.content, candidate_id: data.candidateId ?? null, trip_group_id: data.tripGroupId },
    });
    const result = question as unknown as Question;
    syncQuestion(data.tripGroupId, result);
    return result;
  }

  async update(questionId: string, tripGroupId: string, data: { aiAnswer: string }): Promise<Question> {
    const question = await this.db.question.update({
      where: { id: questionId },
      data: { ai_answer: data.aiAnswer },
    });
    updateQuestionFirestore(tripGroupId, questionId, { ai_answer: data.aiAnswer, ai_streaming: false });
    return question as unknown as Question;
  }
}
