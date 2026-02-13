import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../summarize/route";

// Mock container
const mockSummarize = vi.fn();
const mockCandidateUpdate = vi.fn();
const mockCandidateFindById = vi.fn();
vi.mock("@/lib/container", () => ({
  getAiService: async () => ({
    summarize: mockSummarize,
  }),
  getCandidateRepository: async () => ({
    update: mockCandidateUpdate,
    findById: mockCandidateFindById,
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  candidate_id: "550e8400-e29b-41d4-a716-446655440000",
  candidate_name: "美ら海水族館",
  source_url: null,
  trip_group_id: "550e8400-e29b-41d4-a716-446655440001",
};

describe("POST /api/ai/summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("200: AI分析成功", async () => {
    const aiResult = {
      description: "沖縄を代表する水族館",
      tags: [{ icon: "waves", label: "海洋", textColor: "#059669", iconColor: "#10B981", bgColor: "#ECFDF5" }],
      info: "詳細情報",
      aiSummary: { headline: "必見スポット", qa: [{ q: "料金は？", a: "大人1880円" }] },
    };

    mockSummarize.mockResolvedValueOnce(aiResult);
    // findById: 既存候補（ai_summary に既存 qa がある場合のマージテスト）
    mockCandidateFindById.mockResolvedValueOnce({
      id: validBody.candidate_id,
      trip_group_id: validBody.trip_group_id,
      name: "美ら海水族館",
      ai_summary: null,
    });
    mockCandidateUpdate.mockResolvedValueOnce({
      id: validBody.candidate_id,
      trip_group_id: validBody.trip_group_id,
      name: "美ら海水族館",
      description: "沖縄を代表する水族館",
      image_url: null,
      rating: null,
      review_count: null,
      tags: aiResult.tags,
      info: "詳細情報",
      ai_summary: aiResult.aiSummary,
      source_url: null,
      created_at: new Date().toISOString(),
    });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.candidate).toBeDefined();
  });

  it("400: candidate_idがない", async () => {
    const res = await POST(makeRequest({ candidate_name: "テスト" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("400: candidate_nameが空", async () => {
    const res = await POST(makeRequest({ ...validBody, candidate_name: "" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("400: 不正なUUID形式", async () => {
    const res = await POST(makeRequest({ ...validBody, candidate_id: "not-a-uuid" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
