import { NextResponse } from "next/server";
import { urlMetadataSchema } from "@/lib/validators";

const FETCH_TIMEOUT_MS = 5000;
const MAX_BODY_SIZE = 50 * 1024; // 50KB

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = urlMetadataSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message ?? "URLが不正です" },
        { status: 400 }
      );
    }

    const { url } = validated.data;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let html: string;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TripVoteBot/1.0)",
          Accept: "text/html",
        },
      });

      if (!res.ok) {
        return NextResponse.json({ title: null });
      }

      // サイズ制限: 最初の50KBのみ読み取り
      const reader = res.body?.getReader();
      if (!reader) {
        return NextResponse.json({ title: null });
      }

      const chunks: Uint8Array[] = [];
      let totalSize = 0;
      while (totalSize < MAX_BODY_SIZE) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalSize += value.length;
      }
      reader.cancel();

      html = new TextDecoder().decode(
        chunks.reduce((acc, chunk) => {
          const merged = new Uint8Array(acc.length + chunk.length);
          merged.set(acc);
          merged.set(chunk, acc.length);
          return merged;
        }, new Uint8Array())
      );
    } finally {
      clearTimeout(timeout);
    }

    // og:title を優先、なければ <title> を取得
    const ogTitleMatch = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
    );

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const title = ogTitleMatch?.[1]?.trim() || titleMatch?.[1]?.trim() || null;

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: null });
  }
}
