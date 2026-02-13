/**
 * デモAIサービス実装（モックレスポンス）
 */
import type { IAiService, AiSummaryResult, AiStreamResult } from "./interfaces";

export class DemoAiService implements IAiService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async summarize(_candidateName: string, _sourceUrl?: string | null, _origin?: string | null): Promise<AiSummaryResult> {
    await new Promise((r) => setTimeout(r, 500));
    return {
      description: "日本で人気の観光スポットです",
      tags: [
        { icon: "MapPin", label: "観光地", textColor: "#059669", iconColor: "#10B981", bgColor: "#ECFDF5" },
        { icon: "Clock", label: "所要2-3時間", textColor: "#D97706", iconColor: "#F59E0B", bgColor: "#FFFBEB" },
        { icon: "Star", label: "おすすめ", textColor: "#7C3AED", iconColor: "#8B5CF6", bgColor: "#F5F3FF" },
      ],
      info: "多くの観光客が訪れる人気スポットです。歴史や文化を感じながら、美しい景観を楽しめます。周辺にはお土産店や飲食店も充実しています。",
      aiSummary: {
        headline: "AIがおすすめする注目の旅行先",
        qa: [
          { q: "ベストシーズンは？", a: "春（3-5月）と秋（9-11月）が過ごしやすくおすすめです。" },
          { q: "所要時間は？", a: "ゆっくり楽しんで2-3時間程度です。" },
          { q: "アクセスは？", a: "最寄り駅から徒歩またはバスでアクセスできます。" },
        ],
      },
    };
  }

  streamAnswer(question: string, candidateName: string | null): AiStreamResult {
    const answer = candidateName
      ? `「${candidateName}」についてのご質問ですね。\n\n${question}に関してお答えします。\n\n${candidateName}は日本の人気観光スポットの一つです。訪問の際は事前にチケットを購入し、混雑する時間帯を避けるのがおすすめです。\n\n周辺には素敵な飲食店やお土産店もありますので、ぜひ合わせて楽しんでください。`
      : `旅行に関するご質問ですね。\n\n${question}についてお答えします。\n\n旅行を計画する際は、目的地の気候や文化を事前に調べておくと安心です。また、現地の交通手段や宿泊先も早めに手配しておくことをおすすめします。`;

    const encoder = new TextEncoder();
    const chunks = answer.split("");
    let index = 0;

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (index < chunks.length) {
          const end = Math.min(index + 3 + Math.floor(Math.random() * 3), chunks.length);
          const chunk = chunks.slice(index, end).join("");
          controller.enqueue(encoder.encode(chunk));
          index = end;
          await new Promise((r) => setTimeout(r, 30));
        } else {
          controller.close();
        }
      },
    });

    return {
      stream,
      fullText: Promise.resolve(answer),
    };
  }
}
