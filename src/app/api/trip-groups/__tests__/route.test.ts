import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// Mock container
const mockCreate = vi.fn();
vi.mock("@/lib/container", () => ({
  getTripGroupRepository: async () => ({
    create: mockCreate,
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/trip-groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/trip-groups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("201: 正常にグループを作成", async () => {
    const mockGroup = {
      trip_group_id: "test-uuid",
      name: "沖縄旅行",
      departure: null,
      status: "draft",
      created_at: new Date().toISOString(),
      departure_type: "text",
      departure_value: "東京",
      departure_raw: "東京",
    };
    mockCreate.mockResolvedValueOnce(mockGroup);

    const res = await POST(makeRequest({
      name: "沖縄旅行",
      departure_value: "東京",
      departure_type: "text",
    }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.tripGroup.name).toBe("沖縄旅行");
  });

  it("400: nameが空の場合", async () => {
    const res = await POST(makeRequest({ name: "", departure_value: "東京" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("400: nameがない場合", async () => {
    const res = await POST(makeRequest({ departure_value: "東京" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("400: nameが数値の場合", async () => {
    const res = await POST(makeRequest({ name: 123, departure_value: "東京" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("400: departure_valueが空の場合", async () => {
    const res = await POST(makeRequest({ name: "テスト", departure_value: "" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("出発地点は必須です");
  });

  it("400: departure_valueがない場合", async () => {
    const res = await POST(makeRequest({ name: "テスト" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error).toContain("string");
  });

  it("500: リポジトリエラー時", async () => {
    mockCreate.mockRejectedValueOnce(new Error("DB error"));

    const res = await POST(makeRequest({ name: "テスト", departure_value: "東京" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("グループの作成に失敗しました");
  });
});
