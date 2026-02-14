import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AppHeader } from "../AppHeader";

describe("AppHeader", () => {
  it("groupNameが未指定の場合、テキストを表示しない（ローディング中）", () => {
    render(<AppHeader />);
    expect(screen.queryByText("つぎココ")).not.toBeInTheDocument();
  });

  it("groupNameが渡された場合、グループ名を表示する", () => {
    render(<AppHeader groupName="沖縄旅行" />);
    expect(screen.getByText("沖縄旅行")).toBeInTheDocument();
  });

  it("ヘッダーの高さが56pxでborder-bottomがある", () => {
    const { container } = render(<AppHeader groupName="沖縄旅行" />);
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass("h-14");
  });
});
