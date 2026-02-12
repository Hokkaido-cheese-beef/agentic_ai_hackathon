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

interface GoAiPlanResponse {
  tag: { budget_jpy: number; travel_time: string };
  description: string;
  survey: Array<{ question: string; answer: string }> | null;
  image?: string;
}

export class GoAiService implements IAiService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.GO_AI_SERVER_URL || "http://localhost:8080";
    this.timeout = Number(process.env.GO_AI_TIMEOUT_MS || "30000");
  }

  private isLocalAiEndpoint(): boolean {
    try {
      const url = new URL(this.baseUrl);
      return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname);
    } catch {
      return false;
    }
  }

  private async getCloudRunIdToken(audience: string): Promise<string> {
    const token = process.env.GO_AI_ID_TOKEN;
    if (token) return token;

    const metadataUrl =
      `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity` +
      `?audience=${encodeURIComponent(audience)}&format=full`;
    const response = await fetch(metadataUrl, {
      headers: { "Metadata-Flavor": "Google" },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Cloud Run ID token: ${response.status}`);
    }

    return await response.text();
  }

  async summarize(candidateName: string, sourceUrl?: string | null, origin?: string | null): Promise<AiSummaryResult> {
    const request: GoAiPlanRequest = {
      origin: origin || "日本",
      destination: candidateName,
      questions: [],
    };

    // /plan と /image を並行して呼び出す
    const [response, imageUrl] = await Promise.all([
      this.callPlanApi(request),
      this.callImageApi(candidateName),
    ]);

    // Go の /plan レスポンスを AiSummaryResult に変換
    // TODO: Go AI側でinfo/headline用の個別フィールドが追加されたら対応する
    // 現状は description のみ使用し、info と headline は重複させない
    return {
      description: response.description || "",
      rating: 4.0, // デフォルト値（/plan では rating なし）
      reviewCount: 0, // デフォルト値（/plan では review_count なし）
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
      info: "",
      aiSummary: {
        headline: "",
        qa: response.survey ? response.survey.map((s) => ({ q: s.question, a: s.answer })) : [],
      },
      imageUrl,
    };
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

  private async callImageApi(query: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!this.isLocalAiEndpoint()) {
        const audience = new URL(this.baseUrl).origin;
        headers.Authorization = `Bearer ${await this.getCloudRunIdToken(audience)}`;
      }

      const response = await fetch(`${this.baseUrl}/image`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`Image API returned ${response.status} for query: ${query}`);
        return null;
      }

      const data = (await response.json()) as { url?: string };
      return data.url || null;
    } catch (error) {
      console.warn("Image API call failed, skipping image", error);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async callPlanApi(request: GoAiPlanRequest): Promise<GoAiPlanResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!this.isLocalAiEndpoint()) {
        const audience = new URL(this.baseUrl).origin;
        headers.Authorization = `Bearer ${await this.getCloudRunIdToken(audience)}`;
      }

      const response = await fetch(`${this.baseUrl}/plan`, {
        method: "POST",
        headers,
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
}
