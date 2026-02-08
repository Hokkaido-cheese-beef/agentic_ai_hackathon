"use client";

import { Plus, X, MapPin, MessageCircle } from "lucide-react";

type FABProps = {
  isOpen: boolean;
  onToggle: () => void;
  onAddSpot: () => void;
  onAddQuestion: () => void;
};

export function FAB({ isOpen, onToggle, onAddSpot, onAddQuestion }: FABProps) {
  return (
    <>
      {isOpen && (
        <div
          data-testid="fab-overlay"
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onToggle}
        />
      )}

      <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-2">
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-2">
            <button
              onClick={onAddSpot}
              className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-[0_4px_16px_var(--shadow-dark)]"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">候補を追加</span>
            </button>
            <button
              onClick={onAddQuestion}
              className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-[0_4px_16px_var(--shadow-dark)]"
            >
              <MessageCircle className="h-5 w-5 text-[#8B5CF6]" />
              <span className="text-sm font-medium text-foreground">質問を追加</span>
            </button>
          </div>
        )}

        <button
          onClick={onToggle}
          aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_4px_16px_#3B82F666]"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
    </>
  );
}
