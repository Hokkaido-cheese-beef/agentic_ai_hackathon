import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// Mock container
const mockFindById = vi.fn();
vi.mock("@/lib/container", () => ({
  getTripGroupRepository: async () => ({
    findById: mockFindById,
  }),
}));

function makeRequest(): Request {
  return new Request("http://localhost:3000/api/trip-groups/test-id", {
    method: "GET",
  });
}

const makeParams = (tripGroupId: string) => ({
  params: Promise.resolve({ tripGroupId }),
});

describe("GET /api/trip-groups/[tripGroupId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("200: グループ取得成功", async () => {
    const mockGroup = {
      trip_group_id: "test-id",
      name: "沖縄旅行",
      departure: null,
      status: "draft",
      created_at: new Date().toISOString(),
    };
    mockFindById.mockResolvedValueOnce(mockGroup);

    const res = await GET(makeRequest(), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.tripGroup.name).toBe("沖縄旅行");
  });

  it("404: グループが見つからない場合", async () => {
    mockFindById.mockResolvedValueOnce(null);

    const res = await GET(makeRequest(), makeParams("nonexistent"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("グループが見つかりません");
  });

  it("500: DBエラー時", async () => {
    mockFindById.mockRejectedValueOnce(new Error("DB error"));

    const res = await GET(makeRequest(), makeParams("test-id"));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("エラーが発生しました");
  });
});
