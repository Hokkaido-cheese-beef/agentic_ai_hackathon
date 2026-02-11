"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { PillTab } from "@/components/ui/PillTab";
import { FAB } from "@/components/ui/FAB";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CardCarousel } from "@/components/candidates/CardCarousel";
import { QuestionModal } from "@/components/modals/QuestionModal";
import { AddCandidateModal } from "@/components/modals/AddCandidateModal";
import { useSwipe } from "@/hooks/useSwipe";
import {
  demoGetTripGroup,
  demoAddCandidate,
  demoAddQuestion,
  demoGenerateAndAppendQA,
  demoSubscribeCandidates,
} from "@/lib/demo/demo-client-service";
import type { TripCandidate } from "@/types";

type Props = {
  tripGroupId: string;
};

export function DemoCandidatesPage({ tripGroupId }: Props) {
  const groupName = useMemo(() => {
    const group = demoGetTripGroup(tripGroupId);
    return group?.name ?? "";
  }, [tripGroupId]);
  const [candidates, setCandidates] = useState<TripCandidate[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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

  // 候補データ: demoSubscribeCandidates でリアルタイム反映
  useEffect(() => {
    const unsub = demoSubscribeCandidates(tripGroupId, (data) => {
      setCandidates(data);
      setIsInitialLoading(false);
    });
    return unsub;
  }, [tripGroupId]);

  const activeCandidate = candidates[activeTabIndex];

  const handleAddCandidate = async (name: string, sourceUrl: string | null) => {
    await demoAddCandidate(tripGroupId, name, sourceUrl);
    setShowAddCandidateModal(false);
  };

  const handleQuestionSubmit = async (questionText: string, isAllCandidates: boolean) => {
    await demoAddQuestion(
      tripGroupId,
      questionText,
      isAllCandidates ? null : activeCandidate?.id ?? null
    );

    // 各対象候補に個別のAI回答を生成して追記
    const targets = isAllCandidates ? candidates : (activeCandidate ? [activeCandidate] : []);
    for (const c of targets) {
      demoGenerateAndAppendQA(c.id, questionText);
    }
  };

  return (
    <main className="relative mx-auto min-h-screen max-w-[430px] bg-surface shadow-lg">
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
        hasCandidates={candidates.length > 0}
      />

      {/* Modals */}
      <QuestionModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        candidateName={activeCandidate?.name ?? null}
        candidatesCount={candidates.length}
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
