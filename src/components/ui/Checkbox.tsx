"use client";

import { Check } from "lucide-react";

type CheckboxProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
};

export function Checkbox({ checked, onChange, label, disabled = false }: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2.5 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <div
        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${
          checked
            ? "bg-primary border-primary"
            : "bg-white border-border-medium"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span className="text-[13px] font-medium text-text-secondary">
        {label}
      </span>
    </label>
  );
}
