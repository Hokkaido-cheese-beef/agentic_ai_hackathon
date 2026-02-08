import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// Mock container
const mockGroupFindById = vi.fn();
const mockQuestionCreate = vi.fn();
vi.mock("@/lib/container", () => ({
  getTripGroupRepository: async () => ({
    findById: mockGroupFindById,
  }),
  getQuestionRepository: async () => ({
    create: mockQuestionCreate,
  }),
}));

const makeParams = (tripGroupId: string) => ({
  params: Promise.resolve({ tripGroupId }),
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/trip-groups/test-id/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/trip-groups/[tripGroupId]/questions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("201: 質問を作成", async () => {
    mockGroupFindById.mockResolvedValueOnce({
      trip_group_id: "test-id",
      name: "沖縄旅行",
      departure: null,
      status: "draft",
      created_at: new Date().toISOString(),
    });
    mockQuestionCreate.mockResolvedValueOnce({
      id: "q1",
      trip_group_id: "test-id",
      candidate_id: null,
      content: "入場料は？",
      ai_answer: null,
      created_at: new Date().toISOString(),
    });

    const res = await POST(makeRequest({ content: "入場料は？" }), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.question.content).toBe("入場料は？");
  });

  it("400: contentが空", async () => {
    const res = await POST(makeRequest({ content: "" }), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("400: contentがない", async () => {
    const res = await POST(makeRequest({}), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("404: グループが見つからない", async () => {
    mockGroupFindById.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ content: "テスト質問" }), makeParams("nonexistent"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("グループが見つかりません");
  });

  it("500: DBエラー時", async () => {
    mockGroupFindById.mockRejectedValueOnce(new Error("DB error"));

    const res = await POST(makeRequest({ content: "テスト" }), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("質問の保存に失敗しました");
  });
});
