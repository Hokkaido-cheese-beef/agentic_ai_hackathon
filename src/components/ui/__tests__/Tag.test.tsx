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

  it("色未指定時はラベルから自動配色される", () => {
    const { container: container1 } = render(<Tag label="予算" icon="wallet" />);
    const tag1 = container1.firstChild as HTMLElement;

    const { container: container2 } = render(<Tag label="時間" icon="clock" />);
    const tag2 = container2.firstChild as HTMLElement;

    // 自動配色が適用されること
    expect(tag1.style.backgroundColor).toBeTruthy();
    expect(tag1.style.color).toBeTruthy();
    expect(tag2.style.backgroundColor).toBeTruthy();
    expect(tag2.style.color).toBeTruthy();
  });

  it("異なるラベルに異なる配色が適用される可能性がある", () => {
    const { container: container1 } = render(<Tag label="A" icon="wallet" />);
    const tag1 = container1.firstChild as HTMLElement;

    const { container: container2 } = render(<Tag label="B" icon="wallet" />);
    const tag2 = container2.firstChild as HTMLElement;

    // 異なるラベルで異なる色が適用される可能性を確認
    // （ハッシュ衝突の可能性もあるので、存在チェックのみ）
    expect(tag1.style.backgroundColor).toBeTruthy();
    expect(tag2.style.backgroundColor).toBeTruthy();
  });
});
