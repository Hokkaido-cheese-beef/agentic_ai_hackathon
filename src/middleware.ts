import { NextResponse, type NextRequest } from "next/server";

/**
 * インメモリ・トークンバケット方式のレートリミッター
 * AI APIエンドポイント (/api/ai/*) に対して 1分あたり10リクエスト/IP
 */

const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

const ipBuckets = new Map<string, { tokens: number; lastRefill: number }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);

  if (!bucket) {
    ipBuckets.set(ip, { tokens: RATE_LIMIT - 1, lastRefill: now });
    return true;
  }

  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor((elapsed / WINDOW_MS) * RATE_LIMIT);

  if (refill > 0) {
    bucket.tokens = Math.min(RATE_LIMIT, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

// 定期的に古いエントリを掃除（メモリリーク防止）
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 5;
  for (const [ip, bucket] of ipBuckets) {
    if (bucket.lastRefill < cutoff) {
      ipBuckets.delete(ip);
    }
  }
}, WINDOW_MS * 2);

export function middleware(request: NextRequest) {
  // AI APIエンドポイントのみレートリミット適用
  if (!request.nextUrl.pathname.startsWith("/api/ai/")) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const allowed = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらくしてから再度お試しください。" },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/ai/:path*",
};
