import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { withRetry } from "./retry";
import { isDemoMode } from "./demo/config";

export async function syncTripGroupToFirestore(tripGroup: {
  trip_group_id: string;
  name: string;
  departure?: string | null;
  status: string;
}) {
  if (isDemoMode()) return;
  try {
    await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroup.trip_group_id)
          .set({
            name: tripGroup.name,
            departure: tripGroup.departure || null,
            status: tripGroup.status,
            updated_at: FieldValue.serverTimestamp(),
          }),
      { label: "syncTripGroup" }
    );
  } catch (e) {
    console.error("Firestore sync failed (tripGroup):", e);
  }
}

export async function syncCandidateToFirestore(
  tripGroupId: string,
  candidate: {
    id: string;
    name: string;
    source_url?: string | null;
  }
) {
  if (isDemoMode()) return;
  try {
    await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroupId)
          .collection("candidates")
          .doc(candidate.id)
          .set({
            name: candidate.name,
            source_url: candidate.source_url || null,
            description: null,
            image_url: null,
            rating: null,
            review_count: null,
            tags: [],
            info: null,
            ai_summary: null,
            updated_at: FieldValue.serverTimestamp(),
          }),
      { label: "syncCandidate" }
    );
  } catch (e) {
    console.error("Firestore sync failed (candidate):", e);
  }
}

export async function syncQuestionToFirestore(
  tripGroupId: string,
  question: {
    id: string;
    content: string;
    candidate_id?: string | null;
  }
) {
  if (isDemoMode()) return;
  try {
    await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroupId)
          .collection("questions")
          .doc(question.id)
          .set({
            content: question.content,
            candidate_id: question.candidate_id || null,
            ai_answer: null,
            ai_streaming: true,
            updated_at: FieldValue.serverTimestamp(),
          }),
      { label: "syncQuestion" }
    );
  } catch (e) {
    console.error("Firestore sync failed (question):", e);
  }
}

export async function updateCandidateInFirestore(
  tripGroupId: string,
  candidateId: string,
  data: Record<string, unknown>
) {
  if (isDemoMode()) return;
  try {
    await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroupId)
          .collection("candidates")
          .doc(candidateId)
          .update({
            ...data,
            updated_at: FieldValue.serverTimestamp(),
          }),
      { label: "updateCandidate" }
    );
  } catch (e) {
    console.error("Firestore sync failed (candidate update):", e);
  }
}

export async function updateQuestionInFirestore(
  tripGroupId: string,
  questionId: string,
  data: Record<string, unknown>
) {
  if (isDemoMode()) return;
  try {
    await withRetry(
      () =>
        adminDb
          .collection("tripGroups")
          .doc(tripGroupId)
          .collection("questions")
          .doc(questionId)
          .update({
            ...data,
            updated_at: FieldValue.serverTimestamp(),
          }),
      { label: "updateQuestion" }
    );
  } catch (e) {
    console.error("Firestore sync failed (question update):", e);
  }
}
