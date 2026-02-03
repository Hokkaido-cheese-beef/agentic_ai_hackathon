# Agentic AI Hackathon – Agent Brief

## プロジェクトルール
- `.codex/AGENTS.md` と `.claude/CLAUDE.md` は常に同じ内容（表現上の細かな差異を除く）を保つこと。片方を更新したら、必ずもう片方にも同じ変更を反映して同期する。
- サブモジュール `agentic_ai_hackathon_spec`（例: `spec/tripvote_spec.md`, `design/`）にある仕様書・画面デザインを作業前に読み込み、常に最新コンテキストとして参照する。

## プロジェクト概要
- プロダクト名: **みんなの旅投票 (TripVote)** – AI が旅行候補を整理し、グループで比較・投票できるデスクトップ向けサービス。
- ターゲット: 幅1280px/高さ800pxを基準。ブランドカラー: プライマリ #3B82F6、アクセント #10B981、背景 #F8FAFC。ロゴはマップピン＋テキスト。
- 主要ドキュメント: `agentic_ai_hackathon_spec/spec/tripvote_spec.md`（8画面仕様・UIルール・TODO）、`agentic_ai_hackathon_spec/design/`（画面デザイン）。

## 技術スタック & ツール
- Next.js 16 (App Router) + React 19 + TypeScript。
- Tailwind CSS 4（`@import "tailwindcss"` + `@theme inline`）、IBM Plex Sans を `next/font` で読み込み。
- ESLint 9 + `eslint-config-next`、React Compiler 有効化 (`next.config.ts`)。
- npm scripts: `npm run dev|build|start|lint`。`.env.local.example` を基に `.env.local` を作成。

## リポジトリ構成（抜粋）
```
src/
├─ app/
│  ├─ page.tsx            # LP (TripVoteヒーロー/CTA/価値訴求)
│  ├─ about/page.tsx      # プレースホルダー
│  ├─ api/hello/route.ts  # GET/POSTサンプル
│  ├─ layout.tsx          # ルートレイアウト (IBM Plex Sans + globals)
│  └─ globals.css         # Tailwind/トークン
├─ components/
│  ├─ layout/{Header,Footer}.tsx
│  └─ ui/Button.tsx
├─ hooks/useApi.ts        # fetch用フック (loading/error管理)
├─ lib/{api,utils}.ts     # fetcher/get/post, cn/sleep/formatDate
└─ types/index.ts         # 共通レスポンス/ユーザー型
```

## 実装メモ
- `tsconfig` は `moduleResolution: "bundler"`、パスエイリアス `@/*` → `src/*`。
- Tailwindトークン/背景は `globals.css` で `--font-plex-sans` を使用。
- React Compilerが有効なので新規コンポーネントもコンパイラ前提で記述。

## 次のアクション候補
1. 仕様 §4.2–§4.8 に対応する App Router ルートとセクションを順次実装し、共通レイアウトを導入。
2. `app/layout.tsx` へ Header/Footer を組み込み（またはラップコンポーネント作成）全画面で統一ナビを提供。
3. 旅行グループ・候補・投票モデルを `src/types` に定義し、API Route のスタブを追加して UI をブロックしないようにする。
4. 実API/AI連携時は `useApi` + `lib/api.ts` を利用し、`NEXT_PUBLIC_API_URL` を設定。エラーハンドリング/ローディングUIを揃える。
5. テスト・Lint: `npm run lint` を常習化し、必要に応じて React Testing Library 等でコンポーネントテストを追加。

## 進め方のガイド
- 仕様の文言やコピーは可能な限り仕様書に合わせる。差異が出る場合は `agentic_ai_hackathon_spec` や README に理由を追記。
- UI実装は「骨組み → データ接続 → 状態遷移」の順で行い、ダミーデータでも `src/types` を介して整合性を保つ。
- 引き継ぎ前にLint/ビルド確認 (`npm run lint`, `npm run build`) を実施し、気づきはドキュメントに残す。
