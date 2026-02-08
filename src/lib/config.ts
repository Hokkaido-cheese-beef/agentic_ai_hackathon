/**
 * デモモード判定
 * NEXT_PUBLIC_DEMO_MODE=true で全外部依存をインメモリモックに切り替え
 * Client/Server 両方で安全に使える唯一の判定関数
 */
export function isDemo(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
