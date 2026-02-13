import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../image/route";

const mockFetchImage = vi.fn();
const mockCandidateUpdate = vi.fn();

vi.mock("@/lib/container", () => ({
  getAiService: async () => ({
    fetchImage: mockFetchImage,
  }),
  getCandidateRepository: async () => ({
    update: mockCandidateUpdate,
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/ai/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  candidate_id: "550e8400-e29b-41d4-a716-446655440000",
  candidate_name: "美ら海水族館",
  trip_group_id: "550e8400-e29b-41d4-a716-446655440001",
};

describe("POST /api/ai/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("200: 画像URL取得成功", async () => {
    mockFetchImage.mockResolvedValueOnce("https://example.com/image.jpg");
    mockCandidateUpdate.mockResolvedValueOnce({
      id: validBody.candidate_id,
      trip_group_id: validBody.trip_group_id,
      name: validBody.candidate_name,
      description: null,
      image_url: "https://example.com/image.jpg",
      tags: [],
      info: null,
      ai_summary: null,
      source_url: null,
      created_at: new Date().toISOString(),
    });

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.candidate.image_url).toBe("https://example.com/image.jpg");
  });

  it("200: 画像URL未取得", async () => {
    mockFetchImage.mockResolvedValueOnce(null);

    const res = await POST(makeRequest(validBody));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.image_url).toBeNull();
    expect(mockCandidateUpdate).not.toHaveBeenCalled();
  });

  it("400: 不正パラメータ", async () => {
    const res = await POST(makeRequest({ candidate_name: "" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
