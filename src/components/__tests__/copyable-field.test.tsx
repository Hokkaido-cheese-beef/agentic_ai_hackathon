import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CopyableField from "../copyable-field";

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

describe("CopyableField", () => {
  it("値を表示する", () => {
    render(<CopyableField value="https://example.com/invite" />);
    expect(screen.getByText("https://example.com/invite")).toBeInTheDocument();
  });

  it("コピーボタンが表示される", () => {
    render(<CopyableField value="test" />);
    expect(screen.getByRole("button", { name: "コピー" })).toBeInTheDocument();
  });

  it("コピー成功後にコピー済みが表示される", async () => {
    const user = userEvent.setup();
    render(<CopyableField value="test" />);
    await user.click(screen.getByRole("button", { name: "コピー" }));
    expect(await screen.findByText("コピー済み")).toBeInTheDocument();
  });
});
