"use client";

import { useState } from "react";

export default function CopyableField({
  value,
  className = "",
  label = "",
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  return (
    <div className={`flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-mono text-zinc-900 ${className}`}>
      <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {label ? `${label}: ${value}` : value}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-full bg-black px-4 py-1 text-xs font-semibold text-white transition hover:bg-zinc-800"
      >
        {copied ? "コピー済み" : "コピー"}
      </button>
    </div>
  );
}
