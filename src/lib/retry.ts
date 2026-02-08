/**
 * 指数バックオフ付きリトライユーティリティ
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, label = "operation" } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`[withRetry] ${label} failed after ${maxRetries + 1} attempts`, error);
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[withRetry] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // TypeScript: unreachable but required
  throw new Error(`${label} failed`);
}
