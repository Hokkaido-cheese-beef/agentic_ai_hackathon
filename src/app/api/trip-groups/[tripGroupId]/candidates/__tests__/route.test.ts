import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";

// Mock container
const mockFindByGroupId = vi.fn();
const mockCandidateCreate = vi.fn();
const mockGroupFindById = vi.fn();
vi.mock("@/lib/container", () => ({
  getTripGroupRepository: async () => ({
    findById: mockGroupFindById,
  }),
  getCandidateRepository: async () => ({
    findByGroupId: mockFindByGroupId,
    create: mockCandidateCreate,
  }),
}));

const makeParams = (tripGroupId: string) => ({
  params: Promise.resolve({ tripGroupId }),
});

function makeGetRequest(): Request {
  return new Request("http://localhost:3000/api/trip-groups/test-id/candidates", {
    method: "GET",
  });
}

function makePostRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/trip-groups/test-id/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/trip-groups/[tripGroupId]/candidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("200: 候補一覧を取得", async () => {
    mockFindByGroupId.mockResolvedValueOnce([
      {
        id: "c1",
        trip_group_id: "test-id",
        name: "美ら海水族館",
        description: null,
        image_url: null,
        rating: null,
        review_count: null,
        tags: [],
        info: null,
        ai_summary: null,
        source_url: null,
        created_at: new Date().toISOString(),
      },
    ]);

    const res = await GET(makeGetRequest(), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.candidates).toHaveLength(1);
    expect(data.candidates[0].name).toBe("美ら海水族館");
  });

  it("200: 空の候補一覧", async () => {
    mockFindByGroupId.mockResolvedValueOnce([]);

    const res = await GET(makeGetRequest(), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.candidates).toEqual([]);
  });
});

describe("POST /api/trip-groups/[tripGroupId]/candidates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("201: 候補を追加", async () => {
    mockGroupFindById.mockResolvedValueOnce({
      trip_group_id: "test-id",
      name: "沖縄旅行",
      departure: null,
      status: "draft",
      created_at: new Date().toISOString(),
    });
    mockCandidateCreate.mockResolvedValueOnce({
      id: "new-c",
      trip_group_id: "test-id",
      name: "首里城",
      description: null,
      image_url: null,
      rating: null,
      review_count: null,
      tags: [],
      info: null,
      ai_summary: null,
      source_url: null,
      created_at: new Date().toISOString(),
    });

    const res = await POST(makePostRequest({ name: "首里城" }), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.candidate.name).toBe("首里城");
  });

  it("400: nameが空の場合", async () => {
    const res = await POST(makePostRequest({ name: "" }), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("404: グループが見つからない", async () => {
    mockGroupFindById.mockResolvedValueOnce(null);

    const res = await POST(makePostRequest({ name: "テスト" }), makeParams("nonexistent"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("グループが見つかりません");
  });
});
