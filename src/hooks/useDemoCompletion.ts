"use client";

import { useState, useCallback } from "react";
import { mockQuestionStream } from "@/lib/demo/mock-ai";

/**
 * useCompletion (@ai-sdk/react) のデモ代替フック
 * 同じインターフェースを返し、mockQuestionStream でストリーミングを模擬
 */
export function useDemoCompletion(): {
  completion: string;
  isLoading: boolean;
  complete: (prompt: string, options?: { body?: Record<string, unknown> }) => Promise<string>;
  setCompletion: (value: string) => void;
} {
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const complete = useCallback(
    async (prompt: string, options?: { body?: Record<string, unknown> }) => {
      setIsLoading(true);
      setCompletion("");

      const candidateName = (options?.body?.candidate_name as string) ?? null;
      const stream = mockQuestionStream(prompt, candidateName);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let result = "";

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          setCompletion(result);
        }
      } finally {
        reader.releaseLock();
        setIsLoading(false);
      }

      return result;
    },
    []
  );

  return { completion, isLoading, complete, setCompletion };
}
