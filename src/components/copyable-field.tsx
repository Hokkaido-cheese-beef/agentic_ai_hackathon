"use client";

import { useState } from "react";

export default function CopyableField({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: ignore
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl bg-surface p-3 ${className}`}
    >
      <span className="text-[13px] text-text-body truncate flex-1">
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${
          copied ? "bg-accent" : "bg-primary"
        }`}
      >
        {copied ? "コピー済み" : "コピー"}
      </button>
    </div>
  );
}
