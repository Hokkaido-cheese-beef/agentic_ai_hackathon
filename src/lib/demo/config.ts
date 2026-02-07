/**
 * デモモード判定
 * NEXT_PUBLIC_DEMO_MODE=true で全外部依存をインメモリモックに切り替え
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
