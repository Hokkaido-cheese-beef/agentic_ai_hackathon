import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCandidatesRealtime } from "../useCandidatesRealtime";
import type { TripCandidate } from "@/types";

// Firebase のモック
vi.mock("@/lib/firebase", () => ({
  getDb: vi.fn(() => ({})),
}));

// Firestore のモック
const mockOnSnapshot = vi.fn();
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
}));

describe("useCandidatesRealtime", () => {
  const tripGroupId = "test-group-id";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("同じグループの候補をすべて返す", async () => {
    const mockCandidates = [
      {
        id: "candidate-1",
        name: "自分の候補",
        trip_group_id: tripGroupId,
        createdBy: "test-session-id",
        tags: [],
        ai_summary: null,
      },
      {
        id: "candidate-2",
        name: "他人の候補",
        trip_group_id: tripGroupId,
        createdBy: "other-session-id",
        tags: [],
        ai_summary: null,
      },
    ];

    // onSnapshot が即座にコールバックを実行するようにモック
    mockOnSnapshot.mockImplementation((_, callback: (snapshot: unknown) => void) => {
      callback({
        docs: mockCandidates.map((c) => ({
          id: c.id,
          data: () => c,
        })),
      });
      return vi.fn(); // unsubscribe 関数
    });

    const { result } = renderHook(() => useCandidatesRealtime(tripGroupId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.candidates).toHaveLength(2);
    expect(result.current.candidates[0]?.id).toBe("candidate-1");
    expect(result.current.candidates[0]?.name).toBe("自分の候補");
    expect(result.current.candidates[1]?.id).toBe("candidate-2");
    expect(result.current.candidates[1]?.name).toBe("他人の候補");
  });

  it("createdBy がない候補も返す", async () => {
    const mockCandidates = [
      {
        id: "candidate-1",
        name: "自分の候補",
        trip_group_id: tripGroupId,
        createdBy: "test-session-id",
        tags: [],
        ai_summary: null,
      },
      {
        id: "candidate-2",
        name: "createdBy なし",
        trip_group_id: tripGroupId,
        // createdBy なし
        tags: [],
        ai_summary: null,
      },
    ];

    mockOnSnapshot.mockImplementation((_, callback: (snapshot: unknown) => void) => {
      callback({
        docs: mockCandidates.map((c) => ({
          id: c.id,
          data: () => c,
        })),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useCandidatesRealtime(tripGroupId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.candidates).toHaveLength(2);
    expect(result.current.candidates[1]?.id).toBe("candidate-2");
  });

  it("他人の候補のみでも返す", async () => {
    const mockCandidates: TripCandidate[] = [
      {
        id: "candidate-1",
        name: "他人の候補",
        trip_group_id: tripGroupId,
        description: null,
        image_url: null,
        rating: null,
        review_count: null,
        tags: [],
        info: null,
        ai_summary: null,
        source_url: null,
        created_at: "",
        createdBy: "other-session-id",
      },
    ];

    mockOnSnapshot.mockImplementation((_, callback: (snapshot: unknown) => void) => {
      callback({
        docs: mockCandidates.map((c) => ({
          id: c.id,
          data: () => c,
        })),
      });
      return vi.fn();
    });

    const { result } = renderHook(() => useCandidatesRealtime(tripGroupId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.candidates).toHaveLength(1);
    expect(result.current.candidates[0]?.id).toBe("candidate-1");
  });

  it("エラー発生時は isLoading が false になる", async () => {
    mockOnSnapshot.mockImplementation((_, __, errorCallback: () => void) => {
      errorCallback();
      return vi.fn();
    });

    const { result } = renderHook(() => useCandidatesRealtime(tripGroupId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.candidates).toHaveLength(0);
  });
});
