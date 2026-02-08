import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PillTab } from "../PillTab";

describe("PillTab", () => {
  it("ラベルを表示する", () => {
    render(<PillTab label="美ら海水族館" isActive={false} onClick={() => {}} />);
    expect(screen.getByText("美ら海水族館")).toBeInTheDocument();
  });

  it("アクティブ時は青背景・白文字", () => {
    render(<PillTab label="test" isActive={true} onClick={() => {}} />);
    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("aria-selected", "true");
  });

  it("非アクティブ時はグレー背景", () => {
    render(<PillTab label="test" isActive={false} onClick={() => {}} />);
    const tab = screen.getByRole("tab");
    expect(tab).toHaveAttribute("aria-selected", "false");
  });

  it("クリック時にonClickが呼ばれる", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PillTab label="test" isActive={false} onClick={onClick} />);
    await user.click(screen.getByRole("tab"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
