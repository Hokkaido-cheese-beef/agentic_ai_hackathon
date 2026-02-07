# 画面1: トップページ / グループ作成

## 概要

- **画面名**: TopPage
- **パス**: `/`
- **目的**: 旅行グループを新規作成し、候補地の検討を開始する
- **役割**: アプリのランディングページ兼グループ作成フォーム

## コンポーネント構成

```
TopPage (src/app/page.tsx)
├── LogoSection
│   ├── Logo (TripVote ロゴ)
│   └── Tagline ("みんなで決める、最高の旅先")
├── FormCard
│   ├── TripNameInput (旅行名入力)
│   ├── DepartureInput (出発地点入力、任意)
│   └── CreateButton (グループ作成ボタン)
├── FeatureCards (3枚の特徴カード)
│   ├── FeatureCard ("AIがサポート")
│   ├── FeatureCard ("リアルタイム共有")
│   └── FeatureCard ("かんたん操作")
└── HowToSection (使い方ステップ)
    ├── Step1 ("グループを作成")
    ├── Step2 ("候補地を追加")
    └── Step3 ("AIに質問して比較")
```

## コンポーネント詳細

### TopPage
- **ファイル**: `src/app/page.tsx`
- **種別**: Server Component (フォーム部分のみClient Component分離)
- **レイアウト**: 縦方向スクロール、中央寄せ、最大幅制限

### LogoSection
- **ファイル**: `src/components/top/LogoSection.tsx`
- **表示内容**:
  - TripVoteロゴ（飛行機アイコン + テキスト）
  - サブタイトル: "みんなで決める、最高の旅先"
- **スタイル**: 中央揃え、上部余白あり

### FormCard
- **ファイル**: `src/components/top/FormCard.tsx`
- **種別**: Client Component ("use client")
- **表示内容**:
  - 旅行名入力フィールド（必須）
  - 出発地点入力フィールド（任意）
  - グループ作成ボタン

### CreateButton
- **表示テキスト**: "グループを作成する"
- **アイコン**: ArrowRight (lucide-react)
- **状態**:
  | 状態 | 条件 | 表示 |
  |------|------|------|
  | disabled | 旅行名が空 | グレーアウト、クリック不可 |
  | enabled | 旅行名が1文字以上 | プライマリカラー、クリック可能 |
  | loading | API通信中 | スピナー表示、クリック不可 |

### FeatureCards
- **ファイル**: `src/components/top/FeatureCards.tsx`
- **表示内容**: 3枚のカード（横並び、モバイルでは縦並び）
  - カード1: Sparkles アイコン + "AIがサポート" + "気になることはAIに質問。旅先の情報をすぐに教えてくれます"
  - カード2: Users アイコン + "リアルタイム共有" + "グループのメンバーとリアルタイムで候補地を共有"
  - カード3: MousePointerClick アイコン + "かんたん操作" + "URLを共有するだけ。アカウント登録は不要です"

### HowToSection
- **ファイル**: `src/components/top/HowToSection.tsx`
- **表示内容**: 3ステップの使い方説明
  - Step1: "グループを作成" — "旅行の名前を入力してグループを作成します"
  - Step2: "候補地を追加" — "行きたい場所をURLで追加。AIが自動で情報を整理します"
  - Step3: "AIに質問して比較" — "候補地についてAIに質問して、みんなで比較検討しましょう"

## State定義

```typescript
// FormCard内のState
interface FormState {
  tripName: string;        // 旅行名（必須）
  departure: string;       // 出発地点（任意）
  isSubmitting: boolean;   // 送信中フラグ
  error: string | null;    // エラーメッセージ
}

// 初期値
const initialState: FormState = {
  tripName: "",
  departure: "",
  isSubmitting: false,
  error: null,
};
```

## ユーザーインタラクションフロー

### グループ作成フロー

```
1. ユーザーが旅行名を入力
   → tripName更新、CreateButton有効化

2. (任意) 出発地点を入力
   → departure更新

3. CreateButton クリック
   → isSubmitting = true
   → POST /api/trip-groups { name: tripName, departure: departure || null }

4a. 成功 (201)
   → レスポンスから trip_group_id を取得
   → router.push(`/trips/${trip_group_id}/invite`)

4b. 失敗
   → isSubmitting = false
   → error = エラーメッセージ表示
```

## API定義

### POST /api/trip-groups

**リクエスト**:
```json
{
  "name": "夏の沖縄旅行",
  "departure": "東京"
}
```

**レスポンス (201)**:
```json
{
  "trip_group_id": "uuid-xxx",
  "name": "夏の沖縄旅行",
  "departure": "東京",
  "status": "draft",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**処理フロー**:
1. Prisma: TripGroup INSERT
2. firebase-admin: Firestore tripGroups/{id} SET
3. レスポンス返却

## ボタン状態遷移

```
[disabled] ---(旅行名入力)--→ [enabled]
[enabled]  ---(クリック)----→ [loading]
[loading]  ---(成功)-------→ [画面遷移]
[loading]  ---(失敗)-------→ [enabled] + エラー表示
[enabled]  ---(旅行名クリア)→ [disabled]
```

## エラー表示

| エラー種別 | 表示方法 | メッセージ |
|-----------|---------|-----------|
| バリデーション | インライン | "旅行名を入力してください" |
| ネットワークエラー | トースト | "通信エラーが発生しました。もう一度お試しください" |
| サーバーエラー | トースト | "サーバーエラーが発生しました。しばらくしてからお試しください" |

## テストケース

### ユニットテスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | 初期表示時、CreateButtonがdisabled | ボタンがクリック不可 |
| 2 | 旅行名入力後、CreateButtonがenabled | ボタンがクリック可能 |
| 3 | 旅行名をクリア後、CreateButtonがdisabled | ボタンが再びクリック不可 |
| 4 | CreateButtonクリックでAPI呼び出し | POST /api/trip-groups が正しいbodyで呼ばれる |
| 5 | API成功時に画面遷移 | router.pushが /trips/{id}/invite で呼ばれる |
| 6 | API失敗時にエラー表示 | エラーメッセージが表示される |
| 7 | 送信中はボタンがloading状態 | スピナー表示、クリック不可 |
| 8 | 出発地点が空でもグループ作成可能 | departure: null でAPIが呼ばれる |

### 統合テスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | グループ作成→招待画面遷移 | 正常に画面遷移し、作成したグループ情報が表示される |
| 2 | MySQL・Firestore両方にデータ作成 | 同一IDでデータが存在する |
