"use client";

type PillTabProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export function PillTab({ label, isActive, onClick }: PillTabProps) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`
        flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[20px] px-3.5 py-2
        text-[13px] font-medium whitespace-nowrap transition-colors
        ${
          isActive
            ? "bg-primary text-white font-bold shadow-[0_2px_8px_var(--shadow-primary)]"
            : "bg-surface-raised text-text-secondary"
        }
      `}
    >
      {label}
    </button>
  );
}
