"use client";

import { useState, useEffect, useRef } from "react";
import { SpotCard } from "./SpotCard";
import type { TripCandidate } from "@/types";

type Props = {
  candidates: TripCandidate[];
  activeIndex: number;
};

/**
 * パフォーマンス重視カルーセル (Web Animations API)
 * - アイドル時: 1枚のみ DOM に描画
 * - アニメ中: 退場+入場の2枚をトラック配置し translateX で物理スライド
 * - 候補数 N に依存しない O(1) レンダリング
 * - CSS 不要: Web Animations API でコンポーネント内完結
 */
export function CardCarousel({ candidates, activeIndex }: Props) {
  const [anim, setAnim] = useState<{
    prevIndex: number;
    direction: "left" | "right";
  } | null>(null);
  const lastIndex = useRef(activeIndex);
  const trackRef = useRef<HTMLDivElement>(null);

  // activeIndex 変更を検知してアニメ開始
  useEffect(() => {
    const prev = lastIndex.current;
    if (activeIndex !== prev) {
      setAnim({
        prevIndex: prev,
        direction: activeIndex > prev ? "left" : "right",
      });
      lastIndex.current = activeIndex;
    }
  }, [activeIndex]);

  // Web Animations API でスライド実行
  useEffect(() => {
    const track = trackRef.current;
    if (!anim || !track) return;

    const keyframes =
      anim.direction === "left"
        ? [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }]
        : [{ transform: "translateX(-50%)" }, { transform: "translateX(0)" }];

    const animation = track.animate(keyframes, {
      duration: 300,
      easing: "ease-out",
      fill: "both",
    });

    const onFinish = () => setAnim(null);
    animation.addEventListener("finish", onFinish);

    return () => {
      animation.removeEventListener("finish", onFinish);
      animation.cancel();
    };
  }, [anim]);

  const current = candidates[activeIndex];
  if (!current) return null;

  // アイドル: 1枚のみ描画
  if (!anim) {
    return <SpotCard candidate={current} />;
  }

  const prev = candidates[anim.prevIndex];
  if (!prev) {
    return <SpotCard candidate={current} />;
  }

  // アニメーション中: 2枚トラック
  // left  = [退場, 入場] → translateX(0 → -50%)
  // right = [入場, 退場] → translateX(-50% → 0)
  const cards =
    anim.direction === "left" ? [prev, current] : [current, prev];

  return (
    <div className="overflow-hidden">
      <div ref={trackRef} className="flex" style={{ width: "200%" }}>
        {cards.map((c, i) => (
          <div key={i} className="w-1/2 flex-shrink-0">
            <SpotCard candidate={c} />
          </div>
        ))}
      </div>
    </div>
  );
}
