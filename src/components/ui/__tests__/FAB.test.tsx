import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FAB } from "../FAB";

describe("FAB", () => {
  it("閉じた状態ではPlusアイコンのボタンが表示される", () => {
    render(<FAB isOpen={false} onToggle={() => {}} onAddSpot={() => {}} onAddQuestion={() => {}} />);
    expect(screen.getByRole("button", { name: /メニューを開く/i })).toBeInTheDocument();
  });

  it("開いた状態ではメニューアイテムが表示される", () => {
    render(<FAB isOpen={true} onToggle={() => {}} onAddSpot={() => {}} onAddQuestion={() => {}} />);
    expect(screen.getByText("候補を追加")).toBeInTheDocument();
    expect(screen.getByText("質問を追加")).toBeInTheDocument();
  });

  it("開いた状態ではオーバーレイが表示される", () => {
    render(<FAB isOpen={true} onToggle={() => {}} onAddSpot={() => {}} onAddQuestion={() => {}} />);
    expect(screen.getByTestId("fab-overlay")).toBeInTheDocument();
  });

  it("FABボタンクリックでonToggleが呼ばれる", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FAB isOpen={false} onToggle={onToggle} onAddSpot={() => {}} onAddQuestion={() => {}} />);
    await user.click(screen.getByRole("button", { name: /メニューを開く/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("候補を追加クリックでonAddSpotが呼ばれる", async () => {
    const user = userEvent.setup();
    const onAddSpot = vi.fn();
    render(<FAB isOpen={true} onToggle={() => {}} onAddSpot={onAddSpot} onAddQuestion={() => {}} />);
    await user.click(screen.getByText("候補を追加"));
    expect(onAddSpot).toHaveBeenCalledOnce();
  });

  it("質問を追加クリックでonAddQuestionが呼ばれる", async () => {
    const user = userEvent.setup();
    const onAddQuestion = vi.fn();
    render(<FAB isOpen={true} onToggle={() => {}} onAddSpot={() => {}} onAddQuestion={onAddQuestion} />);
    await user.click(screen.getByText("質問を追加"));
    expect(onAddQuestion).toHaveBeenCalledOnce();
  });
});
