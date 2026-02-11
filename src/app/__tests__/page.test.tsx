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
    // デフォルト: geolocation 無効（自動推測が走らない環境）
    Object.defineProperty(global.navigator, "geolocation", {
      writable: true,
      value: undefined,
    });
  });

  it("つぎココタイトルが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText("つぎココ")).toBeInTheDocument();
  });

  it("サブタイトルが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText(/グループ旅行の行き先を/)).toBeInTheDocument();
    expect(screen.getByText(/みんなで決めよう/)).toBeInTheDocument();
  });

  it("グループ名ラベルとinputが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText(/グループ名/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例：沖縄旅行")).toBeInTheDocument();
  });

  it("出発地点ラベルと入力フィールドが表示される", () => {
    render(<TopPage />);
    expect(screen.getByText(/出発地点/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例：東京駅、渋谷区")).toBeInTheDocument();
  });

  it("グループ名空 → 作成ボタンdisabled", () => {
    render(<TopPage />);
    const btn = screen.getByRole("button", { name: /グループを作成する/ });
    expect(btn).toBeDisabled();
  });

  it("グループ名入力のみ → 作成ボタンdisabled（出発地点必須）", async () => {
    const user = userEvent.setup();
    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");
    const btn = screen.getByRole("button", { name: /グループを作成する/ });
    expect(btn).toBeDisabled();
  });

  it("グループ名＋出発地点入力 → 作成ボタンenabled", async () => {
    const user = userEvent.setup();
    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");
    await user.type(screen.getByPlaceholderText("例：東京駅、渋谷区"), "東京");
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
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");
    await user.type(screen.getByPlaceholderText("例：東京駅、渋谷区"), "東京");
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
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");
    await user.type(screen.getByPlaceholderText("例：東京駅、渋谷区"), "東京");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/trip-groups/test-id");
    });
  });

  it("送信失敗(400) → エラーメッセージ表示", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "出発地点は必須です" }),
    });

    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");
    await user.type(screen.getByPlaceholderText("例：東京駅、渋谷区"), "東京");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    await waitFor(() => {
      expect(screen.getByText("出発地点は必須です")).toBeInTheDocument();
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
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");
    await user.type(screen.getByPlaceholderText("例：東京駅、渋谷区"), "東京");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    expect(screen.getByText("作成中...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /作成中/ })).toBeDisabled();
  });

  it("出発地点未入力 → 作成ボタンdisabled", async () => {
    const user = userEvent.setup();
    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");

    const btn = screen.getByRole("button", { name: /グループを作成する/ });
    expect(btn).toBeDisabled();
  });

  it("位置情報取得後、フォーカスで候補がドロップダウン表示される", async () => {
    const user = userEvent.setup();
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 35.6595,
            longitude: 139.7004,
          },
        });
      }),
    };

    Object.defineProperty(global.navigator, "geolocation", {
      writable: true,
      value: mockGeolocation,
    });

    // 1回目: Nominatim
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        address: { postcode: "150-0001", city: "渋谷区", state: "東京都" },
        display_name: "渋谷区, 東京都, 日本",
      }),
    });
    // 2回目: zipcloud
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        results: [{ address1: "東京都", address2: "渋谷区", address3: "神宮前" }],
      }),
    });

    render(<TopPage />);

    // geolocation が呼ばれるのを待つ
    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    // 推測完了を待つ（Nominatim + zipcloud の2回）
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // input にフォーカス → ドロップダウンが表示
    const input = screen.getByPlaceholderText("例：東京駅、渋谷区");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("現在地から設定")).toBeInTheDocument();
      expect(screen.getByText("東京都渋谷区神宮前")).toBeInTheDocument();
    });
  });

  it("ドロップダウンの候補を選択 → 出発地点にセット", async () => {
    const user = userEvent.setup();
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 35.6595,
            longitude: 139.7004,
          },
        });
      }),
    };

    Object.defineProperty(global.navigator, "geolocation", {
      writable: true,
      value: mockGeolocation,
    });

    // 1回目: Nominatim
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        address: { postcode: "150-0001", city: "渋谷区", state: "東京都" },
        display_name: "渋谷区, 東京都, 日本",
      }),
    });
    // 2回目: zipcloud
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        results: [{ address1: "東京都", address2: "渋谷区", address3: "神宮前" }],
      }),
    });

    render(<TopPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    // フォーカスして候補表示
    const input = screen.getByPlaceholderText("例：東京駅、渋谷区") as HTMLInputElement;
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("現在地から設定")).toBeInTheDocument();
    });

    // 候補をクリック
    await user.click(screen.getByText("現在地から設定"));

    // input に住所がセットされる
    expect(input.value).toBe("東京都渋谷区神宮前");
    // ドロップダウンは消える
    expect(screen.queryByText("現在地から設定")).not.toBeInTheDocument();
  });

  it("手動入力 → departure_type が text になる", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tripGroup: { trip_group_id: "test-id", name: "沖縄旅行", status: "draft" },
      }),
    });

    render(<TopPage />);
    await user.type(screen.getByPlaceholderText("例：沖縄旅行"), "沖縄旅行");
    await user.type(screen.getByPlaceholderText("例：東京駅、渋谷区"), "東京駅");
    await user.click(screen.getByRole("button", { name: /グループを作成する/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/trip-groups",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"departure_type":"text"'),
        })
      );
    });
  });
});
