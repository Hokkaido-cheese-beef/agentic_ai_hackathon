"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { TripCandidate } from "@/types";

export function useCandidatesRealtime(tripGroupId: string) {
  const [candidates, setCandidates] = useState<TripCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // セッションIDを取得（localStorage から）
    const sessionId = typeof window !== "undefined"
      ? localStorage.getItem("tripvote_session_id") || ""
      : "";

    const unsub = onSnapshot(
      collection(getDb(), "tripGroups", tripGroupId, "candidates"),
      (snapshot) => {
        const allCandidates = snapshot.docs.map((doc) => ({
          id: doc.id,
          trip_group_id: tripGroupId,
          created_at: "",
          ...doc.data(),
          tags: doc.data().tags || [],
          ai_summary: doc.data().ai_summary || null,
        })) as TripCandidate[];

        // 自分が作成した候補のみフィルタリング
        const myCandidates = allCandidates.filter(
          (c) => c.createdBy === sessionId
        );

        setCandidates(myCandidates);
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe candidates", error);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [tripGroupId]);

  return { candidates, isLoading };
}
