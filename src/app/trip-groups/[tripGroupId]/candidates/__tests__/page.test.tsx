import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

// isDemo() → false にして ProdCandidatesPage が描画されるようにする
vi.mock("@/lib/config", () => ({
  isDemo: () => false,
}));

// @ai-sdk/react mock (used by ProdCandidatesPage)
vi.mock("@ai-sdk/react", () => ({
  useCompletion: () => ({
    completion: "",
    isLoading: false,
    complete: vi.fn(),
    setCompletion: vi.fn(),
  }),
}));

// next/navigation mock
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ tripGroupId: "test-group-id" }),
}));

// firebase/firestore mock
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((_ref, callback) => {
    callback({
      docs: [
        {
          id: "candidate-1",
          data: () => ({
            name: "美ら海水族館",
            description: "世界最大級のジンベエザメ",
            image_url: null,
            tags: [
              { icon: "wallet", label: "¥2,000", textColor: "#059669", iconColor: "#10B981", bgColor: "#ECFDF5" },
            ],
            info: "沖縄本島北部にある水族館",
            ai_summary: { headline: "家族連れに最適", qa: [{ q: "入場料は？", a: "2,000円" }] },
          }),
        },
        {
          id: "candidate-2",
          data: () => ({
            name: "首里城",
            description: "世界遺産",
            image_url: null,
            tags: [],
            info: null,
            ai_summary: null,
          }),
        },
      ],
    });
    return vi.fn(); // unsubscribe
  }),
  getFirestore: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
  getDb: () => ({}),
}));

// fetch mock
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Import page AFTER mocks are set up
import CandidatesPage from "../page";

describe("画面3-4: 候補閲覧 + FAB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        tripGroup: { trip_group_id: "test-group-id", name: "沖縄旅行" },
      }),
    });
  });

  it("タブが候補数分表示される", async () => {
    render(<CandidatesPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });
  });

  it("最初のタブがアクティブ", async () => {
    render(<CandidatesPage />);
    await waitFor(() => {
      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });
  });

  it("タブクリックで切替", async () => {
    const user = userEvent.setup();
    render(<CandidatesPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });

    await user.click(screen.getAllByRole("tab")[1]);
    await waitFor(() => {
      expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    });
  });

  it("SpotCard: 候補名・説明が表示される", async () => {
    render(<CandidatesPage />);
    await waitFor(() => {
      expect(screen.getByText("世界最大級のジンベエザメ")).toBeInTheDocument();
    });
  });

  it("FABボタン(+)が表示される", async () => {
    render(<CandidatesPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /メニューを開く/i })).toBeInTheDocument();
    });
  });

  it("FABクリックでメニュー展開", async () => {
    const user = userEvent.setup();
    render(<CandidatesPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /メニューを開く/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /メニューを開く/i }));
    expect(screen.getByText("候補を追加")).toBeInTheDocument();
    expect(screen.getByText("質問を追加")).toBeInTheDocument();
  });

  it("スワイプヒント表示", async () => {
    render(<CandidatesPage />);
    await waitFor(() => {
      expect(screen.getByText("スワイプで切り替え")).toBeInTheDocument();
    });
  });

  it("AiSummaryCard表示", async () => {
    render(<CandidatesPage />);
    await waitFor(() => {
      expect(screen.getByText("AI分析")).toBeInTheDocument();
      expect(screen.getByText("家族連れに最適")).toBeInTheDocument();
    });
  });
});
