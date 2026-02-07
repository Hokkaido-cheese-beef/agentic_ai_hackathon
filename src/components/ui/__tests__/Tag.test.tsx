import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tag } from "../Tag";

describe("Tag", () => {
  it("ラベルを表示する", () => {
    render(<Tag label="¥2,000" icon="wallet" textColor="#059669" iconColor="#10B981" bgColor="#ECFDF5" />);
    expect(screen.getByText("¥2,000")).toBeInTheDocument();
  });

  it("背景色が適用される", () => {
    const { container } = render(
      <Tag label="車1時間" icon="car" textColor="#2563EB" iconColor="#3B82F6" bgColor="#EFF6FF" />
    );
    const tag = container.firstChild as HTMLElement;
    expect(tag.style.backgroundColor).toBe("rgb(239, 246, 255)");
  });
});
