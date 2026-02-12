import { getAiService, getCandidateRepository, getQuestionRepository } from "@/lib/container";
import { aiQuestionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = aiQuestionSchema.safeParse(body);

    if (!validated.success) {
      return new Response(
        JSON.stringify({ error: validated.error.issues[0]?.message ?? "パラメータが不正です" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question_id, question, candidate_name, candidate_id, trip_group_id } = validated.data;

    let candidateInfo = "";
    if (candidate_id) {
      const candidate = await (await getCandidateRepository()).findById(trip_group_id, candidate_id);
      if (candidate) {
        candidateInfo = `\n\n候補情報:\n名前: ${candidate.name}\n説明: ${candidate.description || "なし"}\n詳細: ${candidate.info || "なし"}`;
      }
    }

    const result = (await getAiService()).streamAnswer(question, candidate_name ?? null, candidateInfo);

    // ストリーム完了後にDB保存 + 候補カードのai_summaryにQ&A追記（fire-and-forget）
    // フロントが候補ごとに個別呼び出しするため、ここでは単一候補のみ処理
    result.fullText
      .then(async (text) => {
        const [questionRepo, candidateRepo] = await Promise.all([
          getQuestionRepository(),
          getCandidateRepository(),
        ]);
        await questionRepo.update(question_id, trip_group_id, { aiAnswer: text });

        // 指定候補の ai_summary.qa に追記
        if (candidate_id) {
          const c = await candidateRepo.findById(trip_group_id, candidate_id);
          if (c) {
            const current = c.ai_summary ?? { headline: "", qa: [] };
            await candidateRepo.update(candidate_id, trip_group_id, {
              ai_summary: { ...current, qa: [...current.qa, { q: question, a: text }] },
            });
          }
        }
      })
      .catch((e) => console.error("Failed to save AI answer", e));

    return new Response(result.stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Failed to generate AI answer", error);
    return new Response(JSON.stringify({ error: "AI回答の生成に失敗しました" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
