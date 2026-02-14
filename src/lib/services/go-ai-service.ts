/**
 * Go AI サーバー統合サービス
 * Go の /plan エンドポイントを呼び出して既存の IAiService インターフェースに適応
 */
import type { IAiService, AiSummaryResult, AiStreamResult } from "./interfaces";

interface GoAiPlanRequest {
  origin: string;
  destination: string;
  questions?: string[];
}

interface GoAiImageRequest {
  query: string;
}

interface GoAiPlanResponse {
  tag: { budget_jpy: number; travel_time: string };
  info: string;
  description: string;
  survey: Array<{ question: string; answer: string }> | null;
  image?: string;
}

interface GoAiImageResponse {
  url: string;
}

export class GoAiService implements IAiService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.GO_AI_SERVER_URL || "http://localhost:8080";
    this.timeout = Number(process.env.GO_AI_TIMEOUT_MS || "30000");
  }

  async summarize(candidateName: string, sourceUrl?: string | null, origin?: string | null): Promise<AiSummaryResult> {
    const request: GoAiPlanRequest = {
      origin: origin || "日本",
      destination: candidateName,
      questions: [],
    };

    const response = await this.callPlanApi(request);

    // Go の /plan レスポンスを AiSummaryResult に変換
    return {
      description: response.description || "",
      tags: [
        {
          icon: "Wallet",
          label: `予算: ${response.tag.budget_jpy}円`,
          textColor: "#059669",
          iconColor: "#10B981",
          bgColor: "#ECFDF5",
        },
        {
          icon: "Clock",
          label: response.tag.travel_time,
          textColor: "#D97706",
          iconColor: "#F59E0B",
          bgColor: "#FFFBEB",
        },
      ],
      info: response.info || "",
      aiSummary: {
        headline: "",
        qa: response.survey ? response.survey.map((s) => ({ q: s.question, a: s.answer })) : [],
      },
    };
  }

  async fetchImage(query: string): Promise<string | null> {
    const request: GoAiImageRequest = {
      query: query.trim(),
    };

    if (!request.query) {
      return null;
    }

    try {
      const response = await this.callImageApi(request);
      return response.url || null;
    } catch (error) {
      console.error("Failed to fetch image from Go AI Server", error);
      return null;
    }
  }

  streamAnswer(question: string, candidateName: string | null): AiStreamResult {
    const request: GoAiPlanRequest = {
      origin: "日本",
      destination: candidateName || "一般的な旅行先",
      questions: [question],
    };

    let fullTextResolve: (text: string) => void;
    const fullText = new Promise<string>((resolve) => {
      fullTextResolve = resolve;
    });

    const callPlanApi = this.callPlanApi.bind(this);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const response = await callPlanApi(request);
          const answer = response.survey?.[0]?.answer || "回答を取得できませんでした";

          // ストリーミング風にチャンク分割して送信
          const encoder = new TextEncoder();
          const chunks = answer.match(/.{1,5}/g) || [answer];

          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
            await new Promise((r) => setTimeout(r, 30));
          }

          fullTextResolve(answer);
          controller.close();
        } catch {
          const errorMsg = "回答の取得に失敗しました";
          controller.enqueue(new TextEncoder().encode(errorMsg));
          fullTextResolve(errorMsg);
          controller.close();
        }
      },
    });

    return { stream, fullText };
  }

  private async callPlanApi(request: GoAiPlanRequest): Promise<GoAiPlanResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Go AI Server error: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callImageApi(request: GoAiImageRequest): Promise<GoAiImageResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Go AI Server image error: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
