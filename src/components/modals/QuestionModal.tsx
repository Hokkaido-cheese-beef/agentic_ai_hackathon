"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Checkbox } from "@/components/ui/Checkbox";

type QuestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string | null;
  onSubmit: (questionText: string, isAllCandidates: boolean) => Promise<void>;
};

export function QuestionModal({
  isOpen,
  onClose,
  candidateName,
  onSubmit,
}: QuestionModalProps) {
  const [questionText, setQuestionText] = useState("");
  const [isAllCandidates, setIsAllCandidates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // candidateName を利用して lint unused 警告を防止（将来の表示拡張用）
  void candidateName;

  const handleSubmit = async () => {
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(questionText.trim(), isAllCandidates);
      // 送信成功 → 即クローズ（AI回答はバックグラウンドでカードに反映）
      setQuestionText("");
      setIsAllCandidates(false);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuestionText("");
    setIsAllCandidates(false);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="質問する">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-foreground">
            質問内容
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="例: 入場料はいくらですか？"
            className="h-20 resize-none rounded-xl bg-surface border border-border p-3.5 text-sm text-foreground placeholder:text-text-muted outline-none"
          />
        </div>

        <Checkbox
          checked={isAllCandidates}
          onChange={() => setIsAllCandidates(!isAllCandidates)}
          label="全候補への質問にする"
        />

        <Button
          variant="shadow"
          icon={<Send className="h-4 w-4" />}
          isLoading={isSubmitting}
          loadingText="送信中..."
          disabled={!questionText.trim()}
          onClick={handleSubmit}
          className="w-full"
        >
          質問を送信
        </Button>

        <ErrorMessage message={error} />
      </div>
    </Modal>
  );
}
