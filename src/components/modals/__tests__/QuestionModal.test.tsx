import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionModal } from "../QuestionModal";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  candidateName: "美ら海水族館",
  completion: "",
  isStreaming: false,
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onReset: vi.fn(),
};

describe("QuestionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isOpen=false → 非表示", () => {
    render(<QuestionModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("質問する")).not.toBeInTheDocument();
  });

  it("isOpen=true → 表示", () => {
    render(<QuestionModal {...defaultProps} />);
    expect(screen.getByText("質問する")).toBeInTheDocument();
  });

  it("質問内容ラベル表示", () => {
    render(<QuestionModal {...defaultProps} />);
    expect(screen.getByText("質問内容")).toBeInTheDocument();
  });

  it("Textareaにplaceholder表示", () => {
    render(<QuestionModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("例: 入場料はいくらですか？")).toBeInTheDocument();
  });

  it("全候補チェックボックス表示", () => {
    render(<QuestionModal {...defaultProps} />);
    expect(screen.getByText("全候補への質問にする")).toBeInTheDocument();
  });

  it("質問テキスト空 → 送信ボタンdisabled", () => {
    render(<QuestionModal {...defaultProps} />);
    const btn = screen.getByRole("button", { name: /質問を送信/ });
    expect(btn).toBeDisabled();
  });

  it("質問テキスト入力 → 送信ボタンenabled", async () => {
    const user = userEvent.setup();
    render(<QuestionModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText("例: 入場料はいくらですか？"), "テスト質問");
    const btn = screen.getByRole("button", { name: /質問を送信/ });
    expect(btn).toBeEnabled();
  });

  it("×クリック → onReset + onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onReset = vi.fn();
    render(<QuestionModal {...defaultProps} onClose={onClose} onReset={onReset} />);
    await user.click(screen.getByRole("button", { name: /閉じる/ }));
    expect(onReset).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("completion がある場合 → AI回答表示", () => {
    render(<QuestionModal {...defaultProps} completion="これはAI回答です" />);
    expect(screen.getByText("AI回答")).toBeInTheDocument();
    expect(screen.getByText("これはAI回答です")).toBeInTheDocument();
  });
});
