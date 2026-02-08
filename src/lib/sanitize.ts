/**
 * AIプロンプト用のサニタイズ関数
 * 特殊文字を除去し、長さを制限する
 */
export function sanitizeForPrompt(input: string, maxLength = 200): string {
  return input.replace(/[<>{}[\]]/g, "").slice(0, maxLength).trim();
}
