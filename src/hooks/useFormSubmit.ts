"use client";

import { useState, useCallback } from "react";

interface UseFormSubmitReturn {
  isSubmitting: boolean;
  error: string | null;
  submit: (fn: () => Promise<void>) => Promise<void>;
  clearError: () => void;
}

export function useFormSubmit(): UseFormSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (fn: () => Promise<void>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { isSubmitting, error, submit, clearError };
}
