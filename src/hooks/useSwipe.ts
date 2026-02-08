"use client";

import { useRef, useEffect, type RefObject } from "react";

type SwipeHandlers = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
};

const SWIPE_THRESHOLD = 50;

/**
 * 横スワイプを検知するフック
 * Pointer Events API でタッチ・マウス両対応
 */
export function useSwipe<T extends HTMLElement>(
  handlers: SwipeHandlers
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // モバイル: 横方向のタッチをJSで処理し、縦スクロールはブラウザに委譲
    el.style.touchAction = "pan-y";

    const onPointerDown = (e: PointerEvent) => {
      dragging.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;

      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;

      // 縦スクロールが大きい場合はスワイプとみなさない
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;

      if (deltaX < -SWIPE_THRESHOLD) {
        handlers.onSwipeLeft?.();
      } else if (deltaX > SWIPE_THRESHOLD) {
        handlers.onSwipeRight?.();
      }
    };

    const onPointerCancel = () => {
      dragging.current = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  });

  return ref;
}
