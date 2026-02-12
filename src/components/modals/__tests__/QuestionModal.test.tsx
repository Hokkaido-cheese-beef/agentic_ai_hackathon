import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionModal } from "../QuestionModal";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  candidateName: "美ら海水族館",
  candidatesCount: 3,
  onSubmit: vi.fn().mockResolvedValue(undefined),
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

  it("×クリック → onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QuestionModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /閉じる/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("候補数が1以上の場合 → チェックボックス有効", () => {
    render(<QuestionModal {...defaultProps} candidatesCount={3} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeDisabled();
    expect(checkbox).not.toBeChecked();
  });

  it("候補数が0の場合 → チェックボックス強制有効&disabled", () => {
    render(<QuestionModal {...defaultProps} candidatesCount={0} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
  });

  it("候補数が0→1に変化してもチェックは維持されるがdisabledは解除", async () => {
    const { rerender } = render(<QuestionModal {...defaultProps} candidatesCount={0} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();

    // 候補が追加されたシミュレーション
    rerender(<QuestionModal {...defaultProps} candidatesCount={1} />);
    expect(checkbox).not.toBeDisabled();
    expect(checkbox).toBeChecked(); // チェックは維持される
  });

  it("送信成功後はモーダルが閉じる", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<QuestionModal {...defaultProps} onClose={onClose} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("例: 入場料はいくらですか？"), "テスト質問");
    await user.click(screen.getByRole("button", { name: /質問を送信/ }));

    expect(onSubmit).toHaveBeenCalledWith("テスト質問", false);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("チェックボックスをオンにして送信 → isAllCandidates=true", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<QuestionModal {...defaultProps} onSubmit={onSubmit} candidatesCount={3} />);

    await user.type(screen.getByPlaceholderText("例: 入場料はいくらですか？"), "全体質問");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /質問を送信/ }));

    expect(onSubmit).toHaveBeenCalledWith("全体質問", true);
  });
});
