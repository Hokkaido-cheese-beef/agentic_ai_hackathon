# 画面2: 招待ページ

## 概要

- **画面名**: InvitePage
- **パス**: `/trips/[tripGroupId]/invite`
- **目的**: グループ作成後に招待リンク・QRコードを表示し、メンバーを招待する
- **役割**: グループ共有のハブ画面

## コンポーネント構成

```
InvitePage (src/app/trips/[tripGroupId]/invite/page.tsx)
├── AppHeader
│   ├── BackButton (← 戻るボタン)
│   └── Title ("メンバーを招待")
├── GroupCard
│   ├── GroupName (旅行グループ名)
│   └── GroupStatus (ステータスバッジ)
├── LinkCard
│   ├── ShareURL (共有URL表示)
│   └── CopyButton (コピーボタン)
├── QRCard
│   └── QRCode (QRコード画像)
└── NextButton ("候補地を追加する" → 画面3へ)
```

## コンポーネント詳細

### InvitePage
- **ファイル**: `src/app/trips/[tripGroupId]/invite/page.tsx`
- **種別**: Server Component (データフェッチ) + Client Component (インタラクション)
- **レイアウト**: 縦方向中央寄せ、カード型レイアウト

### AppHeader
- **ファイル**: `src/components/layout/AppHeader.tsx`
- **Props**:
  ```typescript
  interface AppHeaderProps {
    title: string;
    showBack?: boolean;
    backHref?: string;
  }
  ```
- **表示内容**:
  - 左: 戻るボタン (ChevronLeft アイコン)
  - 中央: タイトルテキスト
- **スタイル**: 固定ヘッダー、背景白、下部ボーダー

### GroupCard
- **ファイル**: `src/components/invite/GroupCard.tsx`
- **表示内容**:
  - グループ名（太字、大きめフォント）
  - ステータスバッジ ("draft" → "準備中")
  - 出発地点（設定されている場合のみ表示）
- **データソース**: サーバーコンポーネントからprops渡し

### LinkCard
- **ファイル**: `src/components/invite/LinkCard.tsx`
- **種別**: Client Component ("use client")
- **表示内容**:
  - 共有URL: `{origin}/trips/{tripGroupId}`
  - コピーボタン (Copy アイコン)
- **インタラクション**:
  - コピーボタンクリック → `navigator.clipboard.writeText(url)`
  - コピー成功 → ボタンテキスト "コピー済み!" に2秒間変更 (Check アイコン)

### QRCard
- **ファイル**: `src/components/invite/QRCard.tsx`
- **表示内容**:
  - QRコードは `qrcode` ライブラリで生成
  - 共有URLをエンコード
- **サイズ**: 200x200px

### NextButton
- **表示テキスト**: "候補地を追加する"
- **アイコン**: ArrowRight (lucide-react)
- **遷移先**: `/trips/{tripGroupId}/candidates`

## データフェッチタイミング

```
InvitePage (Server Component)
  └── prisma.tripGroup.findUnique({ where: { trip_group_id } })
      → GroupCard に props渡し
      → LinkCard に tripGroupId 渡し
      → QRCard に url 渡し
```

## クライアントサイドインタラクション

### URLコピーフロー

```
1. CopyButtonクリック
   → navigator.clipboard.writeText(shareUrl)

2a. 成功
   → copied = true
   → ボタンテキスト "コピー済み!" + Check アイコン
   → 2秒後に自動リセット

2b. 失敗 (clipboard API非対応)
   → フォールバック: input.select() + document.execCommand('copy')
```

### 画面遷移

```
NextButton クリック
  → router.push(`/trips/${tripGroupId}/candidates`)
```

## ボタン状態

### CopyButton

| 状態 | 表示 |
|------|------|
| default | "リンクをコピー" + Copy アイコン |
| copied | "コピー済み!" + Check アイコン (2秒間) |

### NextButton

| 状態 | 条件 | 表示 |
|------|------|------|
| enabled | 常時 | プライマリカラー、クリック可能 |

## エラーケース

| エラー | 条件 | 対応 |
|--------|------|------|
| グループ未発見 | tripGroupIdが不正 | 404ページ表示 (notFound()) |
| クリップボードエラー | clipboard API非対応 | フォールバック処理 |

## テストケース

### ユニットテスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | グループ名が正しく表示される | GroupCardにグループ名が表示 |
| 2 | 共有URLが正しく生成される | `/trips/{tripGroupId}` 形式のURL |
| 3 | コピーボタンクリックでclipboard API呼び出し | writeText が正しいURLで呼ばれる |
| 4 | コピー成功後にテキストが変わる | "コピー済み!" が表示される |
| 5 | 2秒後にコピーボタンがリセットされる | "リンクをコピー" に戻る |
| 6 | NextButtonクリックで画面遷移 | `/trips/{id}/candidates` へ遷移 |
| 7 | QRコードが表示される | QRコードのimg/canvas要素が存在 |
| 8 | 出発地点ありの場合に表示される | 出発地点テキストが表示 |
| 9 | 出発地点なしの場合に非表示 | 出発地点セクションが非表示 |

### 統合テスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | 存在するグループIDでアクセス | グループ情報が正しく表示される |
| 2 | 存在しないグループIDでアクセス | 404ページが表示される |
| 3 | 招待ページ→候補地ページ遷移 | 正常に遷移し候補地ページが表示される |
