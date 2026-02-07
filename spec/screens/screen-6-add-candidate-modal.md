# 画面6: 候補地追加モーダル

## 概要

- **画面名**: AddCandidateModal
- **表示元**: CandidatesPage (画面3-4) のFABボタン
- **目的**: URL入力で旅行候補地を追加し、AIが自動で情報を整理・要約する
- **特徴**: URL貼り付けでAIが自動解析、手動入力も可能

## コンポーネント構成

```
AddCandidateModal (src/components/candidates/AddCandidateModal.tsx)
├── Modal (共通モーダルコンポーネント)
│   ├── ModalHeader
│   │   ├── Title ("候補地を追加")
│   │   └── CloseButton (X アイコン)
│   ├── ModalBody
│   │   ├── URLInputSection
│   │   │   ├── URLInput (URL入力フィールド)
│   │   │   └── FetchButton ("情報を取得" ボタン)
│   │   ├── Divider ("または手動で入力")
│   │   ├── ManualInputSection
│   │   │   ├── NameInput (名前入力、必須)
│   │   │   ├── DescriptionInput (説明入力、任意)
│   │   │   └── TagsInput (タグ入力、任意)
│   │   └── PreviewSection (AI解析結果プレビュー)
│   │       ├── PreviewCard (取得した情報のプレビュー)
│   │       └── AiSummaryPreview (AI要約プレビュー)
│   └── ModalFooter
│       └── AddButton ("候補地を追加する")
```

## Props

```typescript
interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripGroupId: string;
}
```

## State定義

```typescript
interface AddCandidateModalState {
  // 入力値
  url: string;
  name: string;
  description: string;
  tags: string[];
  tagInput: string;            // タグ入力中テキスト

  // AI解析結果
  fetchedData: FetchedData | null;
  aiSummary: AiSummary | null;

  // UI状態
  isFetching: boolean;          // URL情報取得中
  isSummarizing: boolean;       // AI要約生成中
  isSubmitting: boolean;        // 候補地追加送信中
  inputMode: "url" | "manual";  // 現在の入力モード
  error: string | null;
}

interface FetchedData {
  name: string;
  description: string;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  tags: string[];
  info: string;
  source_url: string;
}

const initialState: AddCandidateModalState = {
  url: "",
  name: "",
  description: "",
  tags: [],
  tagInput: "",
  fetchedData: null,
  aiSummary: null,
  isFetching: false,
  isSummarizing: false,
  isSubmitting: false,
  inputMode: "url",
  error: null,
};
```

## コンポーネント詳細

### URLInputSection
- **URLInput**:
  - タイプ: text input
  - プレースホルダー: "旅行サイトのURLを貼り付け"
  - バリデーション: URL形式チェック（http/https）
- **FetchButton**:
  - テキスト: "情報を取得"
  - アイコン: Search (lucide-react)
  - 動作: URL解析APIを呼び出し

### ManualInputSection
- **NameInput**:
  - ラベル: "場所の名前"
  - プレースホルダー: "例: 美ら海水族館"
  - 必須
- **DescriptionInput**:
  - ラベル: "説明"
  - プレースホルダー: "例: 沖縄を代表する大型水族館..."
  - タイプ: textarea
  - 任意
- **TagsInput**:
  - ラベル: "タグ"
  - プレースホルダー: "タグを入力してEnter"
  - 動作: Enter キーでタグ追加、タグは×ボタンで削除可能
  - 任意

### PreviewSection
- **表示条件**: fetchedData != null (URL解析成功後)
- **PreviewCard**:
  - 画像サムネイル
  - 名前、説明（編集可能）
  - 評価、レビュー数
  - タグ一覧
- **AiSummaryPreview**:
  - AI要約のプレビュー表示
  - isSummarizing中はスケルトンアニメーション

### AddButton
- **テキスト**: "候補地を追加する"
- **アイコン**: Plus (lucide-react)
- **有効化条件**: name が1文字以上

## インタラクションフロー

### URL入力フロー

```
1. ユーザーがURLを入力/貼り付け
   → url 更新
   → URL形式バリデーション

2. FetchButton クリック
   → isFetching = true
   → POST /api/candidates/fetch-url { url }

3a. 成功
   → fetchedData = レスポンスデータ
   → name, description, tags を fetchedData で自動入力
   → isFetching = false
   → inputMode = "url"

3b. 失敗
   → isFetching = false
   → error = "URLから情報を取得できませんでした"

4. (自動) AI要約リクエスト
   → isSummarizing = true
   → POST /api/ai/summarize { candidate_data: fetchedData }

5a. AI要約成功
   → aiSummary = レスポンスデータ
   → isSummarizing = false

5b. AI要約失敗
   → isSummarizing = false
   → (要約なしで続行可能)
```

### 手動入力フロー

```
1. ユーザーが "または手動で入力" セクションに入力開始
   → inputMode = "manual"
   → name, description, tags を手動入力

2. (タグ追加)
   → tagInput にテキスト入力
   → Enter キーで tags 配列に追加
   → tagInput クリア
```

### 候補地追加フロー

```
1. AddButton クリック
   → isSubmitting = true
   → POST /api/candidates {
       trip_group_id,
       name,
       description,
       image_url: fetchedData?.image_url,
       rating: fetchedData?.rating,
       review_count: fetchedData?.review_count,
       tags: JSON.stringify(tags),
       info: fetchedData?.info,
       ai_summary: aiSummary ? JSON.stringify(aiSummary) : null,
       source_url: url || null
     }

2a. 成功 (201)
   → isSubmitting = false
   → onClose() (モーダルを閉じる)
   → Firestore onSnapshot で CandidateList に自動追加

2b. 失敗
   → isSubmitting = false
   → error = "候補地の追加に失敗しました"
```

## API定義

### POST /api/candidates

**リクエスト**:
```json
{
  "trip_group_id": "uuid-xxx",
  "name": "美ら海水族館",
  "description": "沖縄を代表する大型水族館...",
  "image_url": "https://...",
  "rating": 4.5,
  "review_count": 1234,
  "tags": "[\"観光\", \"家族向け\"]",
  "info": "営業時間: 8:30-18:30...",
  "ai_summary": "{\"highlights\": [...], ...}",
  "source_url": "https://example.com/spot/123"
}
```

**レスポンス (201)**:
```json
{
  "id": "uuid-yyy",
  "trip_group_id": "uuid-xxx",
  "name": "美ら海水族館",
  "description": "沖縄を代表する大型水族館...",
  "image_url": "https://...",
  "rating": 4.5,
  "review_count": 1234,
  "tags": ["観光", "家族向け"],
  "ai_summary": { "highlights": [...], ... },
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**処理フロー**:
1. Prisma: TripCandidate INSERT
2. firebase-admin: Firestore candidates サブコレクション ADD
3. レスポンス返却

### POST /api/candidates/fetch-url

**リクエスト**:
```json
{
  "url": "https://example.com/spot/123"
}
```

**レスポンス (200)**:
```json
{
  "name": "美ら海水族館",
  "description": "沖縄を代表する大型水族館...",
  "image_url": "https://...",
  "rating": 4.5,
  "review_count": 1234,
  "tags": ["観光", "家族向け"],
  "info": "営業時間: 8:30-18:30, 料金: 大人1,880円...",
  "source_url": "https://example.com/spot/123"
}
```

**処理フロー**:
1. URLのWebページを取得（fetch/cheerio）
2. Vertex AI Gemini: ページ内容を解析し構造化データを抽出
3. レスポンス返却

**プロンプト構成**:
```
以下のWebページの内容から、旅行候補地の情報を抽出してください。

【ページ内容】
{pageContent}

以下のJSON形式で回答してください:
{
  "name": "場所の名前",
  "description": "場所の説明（2-3文）",
  "rating": 数値またはnull,
  "review_count": 数値またはnull,
  "tags": ["タグ1", "タグ2"],
  "info": "営業時間、料金、アクセスなどの実用情報"
}
```

### POST /api/ai/summarize

**リクエスト**:
```json
{
  "candidate_data": {
    "name": "美ら海水族館",
    "description": "...",
    "info": "..."
  }
}
```

**レスポンス (200)**:
```json
{
  "highlights": ["ジンベエザメが圧巻", "イルカショーが人気"],
  "considerations": ["混雑時は待ち時間あり", "駐車場が混む"],
  "best_season": "通年（夏がおすすめ）",
  "budget_range": "大人1,880円 / 子供630円"
}
```

**処理フロー**:
1. Vertex AI Gemini: 候補地情報からハイライト・注意点・ベストシーズン・予算を要約
2. レスポンス返却

**プロンプト構成**:
```
以下の旅行候補地の情報を要約してください。

【候補地情報】
名前: {name}
説明: {description}
情報: {info}

以下のJSON形式で回答してください:
{
  "highlights": ["おすすめポイント1", "おすすめポイント2"],
  "considerations": ["注意点1", "注意点2"],
  "best_season": "ベストシーズン",
  "budget_range": "予算目安"
}
```

## ボタン状態

### FetchButton

| 状態 | 条件 | 表示 |
|------|------|------|
| disabled | url が空、または無効なURL形式 | グレーアウト |
| enabled | 有効なURL | プライマリカラー |
| loading | isFetching = true | スピナー + "取得中..." |

### AddButton

| 状態 | 条件 | 表示 |
|------|------|------|
| disabled | name が空 | グレーアウト |
| enabled | name が1文字以上 | プライマリカラー |
| loading | isSubmitting = true | スピナー + "追加中..." |

### タグ削除ボタン

| 状態 | 条件 | 表示 |
|------|------|------|
| enabled | 常時 | × アイコン、クリックでタグ削除 |

## テストケース

### ユニットテスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | モーダルが正しく表示される | isOpen=true でモーダル表示 |
| 2 | URL入力でFetchButton有効化 | 有効なURL入力でボタン有効 |
| 3 | 無効なURL形式でFetchButton無効 | http/https以外で無効 |
| 4 | FetchButtonクリックでAPI呼び出し | POST /api/candidates/fetch-url が呼ばれる |
| 5 | URL解析成功で各フィールド自動入力 | name, description, tags が設定される |
| 6 | URL解析失敗でエラー表示 | エラーメッセージが表示 |
| 7 | 手動入力で名前入力後AddButton有効化 | name入力でボタン有効 |
| 8 | タグ入力→Enterでタグ追加 | tags配列にタグ追加 |
| 9 | タグ×ボタンクリックでタグ削除 | tags配列からタグ削除 |
| 10 | AddButtonクリックでAPI呼び出し | POST /api/candidates が正しいbodyで呼ばれる |
| 11 | 候補地追加成功でモーダルクローズ | onClose が呼ばれる |
| 12 | 候補地追加失敗でエラー表示 | エラーメッセージが表示 |
| 13 | AI要約取得中にスケルトン表示 | ローディングアニメーション表示 |
| 14 | ESCキーでモーダルクローズ | onClose が呼ばれる |

### 統合テスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | URL入力→解析→追加の一連フロー | 候補地が追加され、一覧に表示される |
| 2 | 手動入力→追加フロー | 候補地が追加され、一覧に表示される |
| 3 | AI要約が自動生成される | URL解析後にAI要約が表示される |
| 4 | 追加した候補地がFirestore経由で他メンバーに表示 | リアルタイム同期で表示 |
