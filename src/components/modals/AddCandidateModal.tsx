"use client";

import { useState } from "react";
import { Search, MapPinPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

type AddCandidateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, sourceUrl: string | null) => Promise<void>;
};

export function AddCandidateModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCandidateModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const isUrl = /^https?:\/\//.test(inputValue.trim());
    const name = inputValue.trim();
    const sourceUrl = isUrl ? inputValue.trim() : null;

    try {
      await onSubmit(name, sourceUrl);
      setInputValue("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setInputValue("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="候補を追加">
      <div className="flex flex-col gap-4">
        {/* Input Label */}
        <label className="text-[13px] font-semibold text-foreground">
          店名・スポット名またはURL
        </label>

        {/* Search Input */}
        <div className="flex h-11 items-center gap-2 rounded-xl bg-surface border border-border px-3.5">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="名前やURLを入力..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-text-muted outline-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          variant="shadow"
          icon={<MapPinPlus className="h-4 w-4" />}
          isLoading={isSubmitting}
          loadingText="追加中..."
          disabled={!inputValue.trim()}
          onClick={handleSubmit}
          className="w-full"
        >
          候補を追加
        </Button>

        <ErrorMessage message={error} />
      </div>
    </Modal>
  );
}
