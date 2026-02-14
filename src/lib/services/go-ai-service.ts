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
  private cachedIdToken: string | null = null;
  private cachedIdTokenExp = 0;

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
      // フォールバック: Unsplash のランダム旅行画像
      return `https://source.unsplash.com/800x600/?travel,${encodeURIComponent(query)}`;
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
      const authHeader = await this.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
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
      const authHeader = await this.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
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

  private async getAuthHeader(): Promise<string | undefined> {
    // ローカル検証や手動トークン指定向け
    const staticToken = process.env.GO_AI_ID_TOKEN?.trim();
    if (staticToken) {
      return `Bearer ${staticToken}`;
    }

    // Cloud Run 同士の private 呼び出し向けに metadata server から ID トークンを取得
    const audience = this.getAudience();
    if (!audience) return undefined;

    const now = Math.floor(Date.now() / 1000);
    if (this.cachedIdToken && this.cachedIdTokenExp - now > 60) {
      return `Bearer ${this.cachedIdToken}`;
    }

    try {
      const url =
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity" +
        `?audience=${encodeURIComponent(audience)}&format=full`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Metadata-Flavor": "Google" },
      });

      if (!response.ok) {
        return undefined;
      }

      const token = (await response.text()).trim();
      if (!token) return undefined;

      this.cachedIdToken = token;
      this.cachedIdTokenExp = this.getJwtExp(token) ?? now + 300;
      return `Bearer ${token}`;
    } catch {
      return undefined;
    }
  }

  private getAudience(): string | null {
    try {
      const parsed = new URL(this.baseUrl);
      if (parsed.protocol !== "https:") return null;
      return parsed.origin;
    } catch {
      return null;
    }
  }

  private getJwtExp(token: string): number | null {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(Buffer.from(this.toBase64(parts[1]), "base64").toString("utf8")) as { exp?: number };
      return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
      return null;
    }
  }

  private toBase64(input: string): string {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
    return normalized + padding;
  }
}
