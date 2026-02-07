import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("isOpen=false → 非表示", () => {
    render(<Modal isOpen={false} onClose={() => {}} title="テスト"><p>内容</p></Modal>);
    expect(screen.queryByText("テスト")).not.toBeInTheDocument();
  });

  it("isOpen=true → 表示", () => {
    render(<Modal isOpen={true} onClose={() => {}} title="テスト"><p>内容</p></Modal>);
    expect(screen.getByText("テスト")).toBeInTheDocument();
    expect(screen.getByText("内容")).toBeInTheDocument();
  });

  it("×ボタンクリックでonCloseが呼ばれる", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="テスト"><p>内容</p></Modal>);
    await user.click(screen.getByRole("button", { name: /閉じる/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("オーバーレイクリックでonCloseが呼ばれる", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="テスト"><p>内容</p></Modal>);
    await user.click(screen.getByTestId("modal-overlay"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("モーダル幅が340px", () => {
    render(<Modal isOpen={true} onClose={() => {}} title="テスト"><p>内容</p></Modal>);
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
  });
});
