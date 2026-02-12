import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddCandidateModal } from "../AddCandidateModal";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

describe("AddCandidateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isOpen=false → 非表示", () => {
    render(<AddCandidateModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("候補を追加")).not.toBeInTheDocument();
  });

  it("isOpen=true → 表示", () => {
    render(<AddCandidateModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("候補を追加")).toHaveLength(2); // タイトル + ボタン
  });

  it("店名・スポット名またはURLラベル", () => {
    render(<AddCandidateModal {...defaultProps} />);
    expect(screen.getByText("店名・スポット名またはURL")).toBeInTheDocument();
  });

  it("検索入力フィールド", () => {
    render(<AddCandidateModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("名前やURLを入力...")).toBeInTheDocument();
  });

  it("入力空 → ボタンdisabled", () => {
    render(<AddCandidateModal {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => b.textContent?.includes("候補を追加"));
    expect(submitBtn).toBeDisabled();
  });

  it("テキスト入力 → ボタンenabled", async () => {
    const user = userEvent.setup();
    render(<AddCandidateModal {...defaultProps} />);
    await user.type(screen.getByPlaceholderText("名前やURLを入力..."), "美ら海水族館");
    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => b.textContent?.includes("候補を追加"));
    expect(submitBtn).toBeEnabled();
  });

  it("×クリック → onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddCandidateModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /閉じる/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("送信 → onSubmit呼ばれる", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddCandidateModal {...defaultProps} onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText("名前やURLを入力..."), "美ら海水族館");

    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => b.textContent?.includes("候補を追加"))!;
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("美ら海水族館", null);
    });
  });

  it("送信成功 → 入力リセット", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddCandidateModal {...defaultProps} onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText("名前やURLを入力..."), "美ら海水族館");

    const buttons = screen.getAllByRole("button");
    const submitBtn = buttons.find((b) => b.textContent?.includes("候補を追加"))!;
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    // 入力がリセットされていることを確認
    expect(screen.getByPlaceholderText("名前やURLを入力...")).toHaveValue("");
  });
});
