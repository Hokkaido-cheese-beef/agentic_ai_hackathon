/**
 * Firestore リポジトリ実装
 * Firestore をソース・オブ・トゥルースとして扱う
 */
import type { TripGroup, TripCandidate, Question } from "@/types";
import type { ITripGroupRepository, ICandidateRepository, IQuestionRepository, CandidateUpdateData } from "./interfaces";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { withRetry } from "@/lib/retry";

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeDate(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
}

function normalizeTags(value: unknown): TripCandidate["tags"] {
  return Array.isArray(value) ? (value as TripCandidate["tags"]) : [];
}

function normalizeAiSummary(value: unknown): TripCandidate["ai_summary"] {
  return value && typeof value === "object" ? (value as TripCandidate["ai_summary"]) : null;
}

function toTripGroupDomain(tripGroupId: string, data: Record<string, unknown>): TripGroup {
  return {
    trip_group_id: tripGroupId,
    name: (data.name as string) ?? "",
    departure: (data.departure as string | null) ?? null,
    status: (data.status as TripGroup["status"]) ?? "draft",
    created_at: normalizeDate(data.created_at) || nowIso(),
  };
}

function toCandidateDomain(tripGroupId: string, candidateId: string, data: Record<string, unknown>): TripCandidate {
  return {
    id: candidateId,
    trip_group_id: tripGroupId,
    name: (data.name as string) ?? "",
    description: (data.description as string | null) ?? null,
    image_url: (data.image_url as string | null) ?? null,
    tags: normalizeTags(data.tags),
    info: (data.info as string | null) ?? null,
    ai_summary: normalizeAiSummary(data.ai_summary),
    source_url: (data.source_url as string | null) ?? null,
    created_at: normalizeDate(data.created_at) || nowIso(),
    createdBy: (data.createdBy as string | undefined) ?? undefined,
  };
}

function toQuestionDomain(tripGroupId: string, questionId: string, data: Record<string, unknown>): Question {
  return {
    id: questionId,
    trip_group_id: tripGroupId,
    candidate_id: (data.candidate_id as string | null) ?? null,
    content: (data.content as string) ?? "",
    ai_answer: (data.ai_answer as string | null) ?? null,
    created_at: normalizeDate(data.created_at) || nowIso(),
  };
}

export class FirestoreTripGroupRepository implements ITripGroupRepository {
  async create(data: { name: string; departure?: string | null }): Promise<TripGroup> {
    const tripGroupId = crypto.randomUUID();
    const createdAt = nowIso();

    await withRetry(
      () =>
        adminDb.collection("tripGroups").doc(tripGroupId).set({
          name: data.name,
          departure: data.departure ?? null,
          status: "draft",
          created_at: createdAt,
          updated_at: FieldValue.serverTimestamp(),
        }),
      { label: "createTripGroup" }
    );

    return {
      trip_group_id: tripGroupId,
      name: data.name,
      departure: data.departure ?? null,
      status: "draft",
      created_at: createdAt,
    };
  }

  async findById(tripGroupId: string): Promise<TripGroup | null> {
    const snap = await withRetry(
      () => adminDb.collection("tripGroups").doc(tripGroupId).get(),
      { label: "findTripGroup" }
    );

    if (!snap.exists) return null;

    return toTripGroupDomain(tripGroupId, (snap.data() ?? {}) as Record<string, unknown>);
  }
}

export class FirestoreCandidateRepository implements ICandidateRepository {
  async create(data: { name: string; sourceUrl?: string | null; tripGroupId: string; createdBy?: string }): Promise<TripCandidate> {
    const candidateId = crypto.randomUUID();
    const createdAt = nowIso();

    await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(data.tripGroupId)
          .collection("candidates")
          .doc(candidateId)
          .set({
            name: data.name,
            source_url: data.sourceUrl ?? null,
            description: null,
            image_url: null,
            tags: [],
            info: null,
            ai_summary: null,
            createdBy: data.createdBy ?? null,
            created_at: createdAt,
            updated_at: FieldValue.serverTimestamp(),
          }),
      { label: "createCandidate" }
    );

    return {
      id: candidateId,
      trip_group_id: data.tripGroupId,
      name: data.name,
      description: null,
      image_url: null,
      tags: [],
      info: null,
      ai_summary: null,
      source_url: data.sourceUrl ?? null,
      created_at: createdAt,
      createdBy: data.createdBy,
    };
  }

  async findById(tripGroupId: string, candidateId: string): Promise<TripCandidate | null> {
    const snap = await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroupId)
          .collection("candidates")
          .doc(candidateId)
          .get(),
      { label: "findCandidate" }
    );

    if (!snap.exists) return null;
    return toCandidateDomain(tripGroupId, candidateId, (snap.data() ?? {}) as Record<string, unknown>);
  }

  async findByGroupId(tripGroupId: string): Promise<TripCandidate[]> {
    const snap = await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroupId)
          .collection("candidates")
          .orderBy("created_at", "asc")
          .get(),
      { label: "listCandidates" }
    );

    return snap.docs.map((doc) =>
      toCandidateDomain(tripGroupId, doc.id, (doc.data() ?? {}) as Record<string, unknown>)
    );
  }

  async update(candidateId: string, tripGroupId: string, data: Partial<CandidateUpdateData>): Promise<TripCandidate> {
    const updateData: Record<string, unknown> = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.info !== undefined) updateData.info = data.info;
    if (data.ai_summary !== undefined) updateData.ai_summary = data.ai_summary;
    updateData.updated_at = FieldValue.serverTimestamp();

    const docRef = adminDb
      .collection("tripGroups")
      .doc(tripGroupId)
      .collection("candidates")
      .doc(candidateId);

    await withRetry(() => docRef.update(updateData), { label: "updateCandidate" });

    const snap = await withRetry(() => docRef.get(), { label: "getCandidateAfterUpdate" });
    return toCandidateDomain(tripGroupId, candidateId, (snap.data() ?? {}) as Record<string, unknown>);
  }
}

export class FirestoreQuestionRepository implements IQuestionRepository {
  async create(data: { content: string; candidateId?: string | null; tripGroupId: string }): Promise<Question> {
    const questionId = crypto.randomUUID();
    const createdAt = nowIso();

    await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(data.tripGroupId)
          .collection("questions")
          .doc(questionId)
          .set({
            content: data.content,
            candidate_id: data.candidateId ?? null,
            ai_answer: null,
            ai_streaming: true,
            created_at: createdAt,
            updated_at: FieldValue.serverTimestamp(),
          }),
      { label: "createQuestion" }
    );

    return {
      id: questionId,
      trip_group_id: data.tripGroupId,
      candidate_id: data.candidateId ?? null,
      content: data.content,
      ai_answer: null,
      created_at: createdAt,
    };
  }

  async update(questionId: string, tripGroupId: string, data: { aiAnswer: string }): Promise<Question> {
    const docRef = adminDb
      .collection("tripGroups")
      .doc(tripGroupId)
      .collection("questions")
      .doc(questionId);

    await withRetry(
      () =>
        docRef.update({
          ai_answer: data.aiAnswer,
          ai_streaming: false,
          updated_at: FieldValue.serverTimestamp(),
        }),
      { label: "updateQuestion" }
    );

    const snap = await withRetry(() => docRef.get(), { label: "getQuestionAfterUpdate" });
    return toQuestionDomain(tripGroupId, questionId, (snap.data() ?? {}) as Record<string, unknown>);
  }

  async findGlobalByGroupId(tripGroupId: string): Promise<Question[]> {
    const snap = await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroupId)
          .collection("questions")
          .where("candidate_id", "==", null)
          .get(),
      { label: "findGlobalQuestions" }
    );

    return snap.docs
      .map((doc) =>
        toQuestionDomain(tripGroupId, doc.id, (doc.data() ?? {}) as Record<string, unknown>)
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
}
