"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { PillTab } from "@/components/ui/PillTab";
import { FAB } from "@/components/ui/FAB";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CardCarousel } from "@/components/candidates/CardCarousel";
import { QuestionModal } from "@/components/modals/QuestionModal";
import { AddCandidateModal } from "@/components/modals/AddCandidateModal";
import { useCandidatesRealtime } from "@/hooks/useCandidatesRealtime";
import { useSwipe } from "@/hooks/useSwipe";
import { post } from "@/lib/api";

type Props = {
  tripGroupId: string;
};

export function ProdCandidatesPage({ tripGroupId }: Props) {
  const [groupName, setGroupName] = useState("");
  const { candidates, isLoading: isInitialLoading } = useCandidatesRealtime(tripGroupId);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);

  const swipeLeft = useCallback(() => {
    setActiveTabIndex((i) => Math.min(i + 1, candidates.length - 1));
  }, [candidates.length]);

  const swipeRight = useCallback(() => {
    setActiveTabIndex((i) => Math.max(i - 1, 0));
  }, []);

  const swipeRef = useSwipe<HTMLDivElement>({
    onSwipeLeft: swipeLeft,
    onSwipeRight: swipeRight,
  });

  // グループ名取得
  useEffect(() => {
    fetch(`/api/trip-groups/${tripGroupId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tripGroup) setGroupName(data.tripGroup.name);
      })
      .catch(() => {});
  }, [tripGroupId]);

  const activeCandidate = candidates[activeTabIndex];

  const handleAddCandidate = async (name: string, sourceUrl: string | null) => {
    const data = await post<{ candidate: { id: string } }>(
      `/api/trip-groups/${tripGroupId}/candidates`,
      { name, source_url: sourceUrl }
    );

    // バックグラウンドでAI分析
    post("/api/ai/summarize", {
      candidate_id: data.candidate.id,
      candidate_name: name,
      source_url: sourceUrl,
      trip_group_id: tripGroupId,
    }).catch(() => {});

    setShowAddCandidateModal(false);
  };

  const handleQuestionSubmit = async (questionText: string, isAllCandidates: boolean) => {
    const data = await post<{ question: { id: string } }>(
      `/api/trip-groups/${tripGroupId}/questions`,
      {
        content: questionText,
        candidate_id: isAllCandidates ? null : activeCandidate?.id ?? null,
      }
    );

    // 各対象候補に個別のAI回答をバックグラウンドで生成（fire-and-forget）
    // バックエンドが候補ごとのコンテキストで回答を生成し ai_summary.qa に追記
    const targets = isAllCandidates ? candidates : (activeCandidate ? [activeCandidate] : []);
    for (const c of targets) {
      fetch("/api/ai/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: data.question.id,
          question: questionText,
          candidate_name: c.name,
          candidate_id: c.id,
          trip_group_id: tripGroupId,
        }),
      }).catch(() => {});
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <AppHeader groupName={groupName} />

      {/* Pill Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto bg-white px-4 py-1 border-b border-border" style={{ height: 48 }}>
        {candidates.map((c, i) => (
          <PillTab
            key={c.id}
            label={c.name}
            isActive={i === activeTabIndex}
            onClick={() => setActiveTabIndex(i)}
          />
        ))}
      </div>

      {/* Main Content */}
      <div ref={swipeRef} className="flex flex-col gap-3 p-4">
        {/* Swipe Hint */}
        <div className="flex items-center justify-center gap-1.5">
          <ChevronLeft className="h-3 w-3 text-border-medium" />
          <span className="text-[11px] text-border-medium">スワイプで切り替え</span>
          <ChevronRight className="h-3 w-3 text-border-medium" />
        </div>

        {/* Loading */}
        {isInitialLoading && (
          <LoadingSpinner fullHeight />
        )}

        {/* SpotCard Carousel */}
        {!isInitialLoading && candidates.length > 0 && (
          <CardCarousel candidates={candidates} activeIndex={activeTabIndex} />
        )}

        {!isInitialLoading && candidates.length === 0 && (
          <div className="flex h-[300px] flex-col items-center justify-center gap-4 text-center">
            <p className="text-text-secondary">まだ候補がありません</p>
            <p className="text-sm text-text-muted">FABボタンから候補を追加しましょう</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <FAB
        isOpen={isFabOpen}
        onToggle={() => setIsFabOpen(!isFabOpen)}
        onAddSpot={() => {
          setIsFabOpen(false);
          setShowAddCandidateModal(true);
        }}
        onAddQuestion={() => {
          setIsFabOpen(false);
          setShowQuestionModal(true);
        }}
      />

      {/* Modals */}
      <QuestionModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        candidateName={activeCandidate?.name ?? null}
        onSubmit={handleQuestionSubmit}
      />
      <AddCandidateModal
        isOpen={showAddCandidateModal}
        onClose={() => setShowAddCandidateModal(false)}
        onSubmit={handleAddCandidate}
      />
    </main>
  );
}
