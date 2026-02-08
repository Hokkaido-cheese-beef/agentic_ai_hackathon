import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TopPage from "../page";

// next/navigation mock
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// fetch mock
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("画面1: トップ＆グループ作成", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TripVoteタイトルが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText("TripVote")).toBeInTheDocument();
  });

  it("サブタイトルが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText(/グループ旅行の行き先を/)).toBeInTheDocument();
    expect(screen.getByText(/みんなで決めよう/)).toBeInTheDocument();
  });

  it("グループ名ラベルとinputが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText("グループ名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例：沖縄旅行 2026")).toBeInTheDocument();
  });

  it("出発地点ラベルと現在地を取得ボタンが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText("出発地点（任意）")).toBeInTheDocument();
    expect(screen.getByText("現在地を取得")).toBeInTheDocument();
  });

  it("グループ名空 → 作成ボタンdisabled", () => {
    render(<TopPage />);
    const btn = screen.getByRole("button", { name: /グループを作成する/ });
    expect(btn).toBeDisabled();
  });

  it("グループ名入力 → 作成ボタンenabled", async () => {
    const user = userEvent.setup();
    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行 2026"), "沖縄旅行");
    const btn = screen.getByRole("button", { name: /グループを作成する/ });
    expect(btn).toBeEnabled();
  });

  it("特徴カード3枚が表示される", () => {
    const { container } = render(<TopPage />);
    const featureTexts = container.querySelectorAll("[data-testid='feature-card']");
    expect(featureTexts).toHaveLength(3);
  });

  it("HOW TO USEセクション + 3ステップが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText("HOW TO USE")).toBeInTheDocument();
    expect(screen.getByText(/3ステップで/)).toBeInTheDocument();
    expect(screen.getByText("グループを作成")).toBeInTheDocument();
    expect(screen.getByText("知りたいことを質問")).toBeInTheDocument();
    expect(screen.getByText("AIが情報を比較・整理")).toBeInTheDocument();
  });

  it("フォーム送信 → POST /api/trip-groups が呼ばれる", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tripGroup: { trip_group_id: "test-id", name: "沖縄旅行", status: "draft" },
      }),
    });

    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行 2026"), "沖縄旅行");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/trip-groups", expect.objectContaining({
        method: "POST",
      }));
    });
  });

  it("送信成功(201) → router.pushが呼ばれる", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tripGroup: { trip_group_id: "test-id", name: "沖縄旅行", status: "draft" },
      }),
    });

    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行 2026"), "沖縄旅行");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/trip-groups/test-id");
    });
  });

  it("送信失敗(400) → エラーメッセージ表示", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "グループ名を入力してください" }),
    });

    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行 2026"), "沖縄旅行");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    await waitFor(() => {
      expect(screen.getByText("グループ名を入力してください")).toBeInTheDocument();
    });
  });

  it("送信中 → ボタンdisabled + 作成中...", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          tripGroup: { trip_group_id: "test-id", name: "沖縄旅行", status: "draft" },
        }),
      }), 1000))
    );

    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行 2026"), "沖縄旅行");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    expect(screen.getByText("作成中...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /作成中/ })).toBeDisabled();
  });
});
