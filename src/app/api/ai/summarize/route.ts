import { NextResponse } from "next/server";
import { getAiService, getCandidateRepository } from "@/lib/container";
import { aiSummarizeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = aiSummarizeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message ?? "パラメータが不正です" },
        { status: 400 }
      );
    }

    const { candidate_id, candidate_name, source_url, trip_group_id, origin } = validated.data;

    const [aiSvc, candRepo] = await Promise.all([getAiService(), getCandidateRepository()]);
    const [result, existing] = await Promise.all([
      aiSvc.summarize(candidate_name, source_url, origin),
      candRepo.findById(trip_group_id, candidate_id),
    ]);

    // 既存の qa を保持しつつ ai_summary をマージ（レースコンディション防止）
    const existingQa = existing?.ai_summary?.qa ?? [];
    const newQa = result.aiSummary?.qa ?? [];
    const mergedAiSummary = result.aiSummary
      ? { ...result.aiSummary, qa: [...existingQa, ...newQa] }
      : existing?.ai_summary ?? null;

    const candidate = await candRepo.update(candidate_id, trip_group_id, {
      description: result.description || null,
      rating: result.rating || null,
      review_count: result.reviewCount || null,
      tags: result.tags || [],
      info: result.info || null,
      ai_summary: mergedAiSummary,
      image_url: result.imageUrl || null,
    });

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Failed to summarize candidate", error);
    return NextResponse.json(
      { error: "AI分析に失敗しました" },
      { status: 500 }
    );
  }
}
