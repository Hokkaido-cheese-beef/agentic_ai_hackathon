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

    const result = await (await getAiService()).summarize(candidate_name, source_url, origin);

    const candidate = await (await getCandidateRepository()).update(candidate_id, trip_group_id, {
      description: result.description || null,
      tags: result.tags || [],
      info: result.info || null,
      ai_summary: result.aiSummary || null,
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
