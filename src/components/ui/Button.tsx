"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "shadow";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  isLoading,
  loadingText,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary text-white",
    secondary: "bg-surface-raised text-foreground",
    outline: "border-2 border-primary text-primary",
    shadow: "bg-primary text-white shadow-[0_2px_8px_var(--shadow-primary)]",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-14 px-6 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        loadingText ?? "処理中..."
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
