# Agentic AI Hackathon – Agent Brief

## プロジェクトルール
- `.codex/AGENTS.md` と `.claude/CLAUDE.md` は常に同じ内容（表現上の細かな差異を除く）を保つこと。片方を更新したら、必ずもう片方にも同じ変更を反映して同期する。
- 仕様・画面デザインは **隣接リポジトリ** `../agentic_ai_hackathon_spec/` を参照する。
  - 主要仕様: `../agentic_ai_hackathon_spec/spec/tripvote_spec.md`
  - 画面デザイン: `../agentic_ai_hackathon_spec/design/`
- 仕様と実装がズレる場合は、理由を README か仕様側に明記する。

## プロジェクト概要
- プロダクト名: **みんなの旅投票 (TripVote)** – AI が旅行候補を整理し、グループで比較・投票できるデスクトップ向けサービス。
- ターゲット: 幅1280px/高さ800px基準。ブランドカラー: プライマリ #3B82F6、アクセント #10B981、背景 #F8FAFC。
- Typography: 仕様は「Outfit または IBM Plex Sans」。実装は IBM Plex Sans を `next/font` 経由で使用。

## 技術スタック & ツール
- Next.js 16 (App Router) + React 19 + TypeScript。
- Tailwind CSS v4（`@theme inline` + CSS変数）、IBM Plex Sans。
- DB: MySQL 8.4 + Prisma。
- リアルタイム: Firebase Firestore (`onSnapshot`)。
- AI: Google Gemini 2.0 Flash (Vercel AI SDK v6)。
- テスト: Vitest + React Testing Library。
- バリデーション: Zod。
- ESLint 9 + `eslint-config-next`、React Compiler 有効化 (`next.config.ts`)。
- npm scripts: `npm run dev|build|start|lint|test|test:run`、DB系は `db:*`。

## リポジトリ構成（抜粋）
```
src/
├─ app/
│  ├─ page.tsx                          # LP
│  ├─ layout.tsx                        # ルートレイアウト
│  ├─ globals.css                       # Tailwind v4 トークン
│  ├─ api/
│  │  ├─ ai/{summarize,question}/route.ts
│  │  └─ trip-groups/...                # グループ/候補/質問 API
│  └─ trip-groups/...
├─ components/
│  ├─ layout/{Header,AppHeader,Footer}.tsx
│  ├─ ui/{Button,Modal,FAB,PillTab,...}.tsx
│  ├─ candidates/{SpotCard,AiSummaryCard}.tsx
│  └─ modals/{AddCandidateModal,QuestionModal}.tsx
├─ hooks/{useApi,useFormSubmit,useCandidatesRealtime}.ts
├─ lib/{api,utils,validators,sanitize,retry,prisma,firebase,...}.ts
├─ types/index.ts
├─ middleware.ts                         # レートリミット
└─ test/setup.ts                         # Vitest setup

prisma/
├─ schema.prisma
├─ migrations/
└─ seed.mjs
```

## 実装メモ / 重要注意点
- `.env.sample` を基に `.env` を作成する。
- デモモード: `NEXT_PUBLIC_DEMO_MODE=true` で外部依存なし (Prisma/Firestore/AI がモックに切替)。
- Vercel AI SDK v6: `toDataStreamResponse()` は廃止 → `toTextStreamResponse()` を使用。
- React Compiler: レンダー中に動的コンポーネント生成は禁止。静的 `iconMap` を使う。
- Next.js 16: 画像は `next/image`。外部URLは必要に応じて `unoptimized`。
- Prisma: `DATABASE_URL` が `prisma generate` に必須。
- Firebase: クライアント側 env は `NEXT_PUBLIC_` プレフィックス。
- `/api/ai/*` は `middleware.ts` でレートリミット (10req/min/IP)。
- AI systemPrompt は追加指示を無視する明示、`lib/sanitize.ts` で入力サニタイズ。

## 次のアクション候補
1. 仕様書 §4.1–§4.8 の画面・コピーと現行 UI を突き合わせて差分を解消する。
2. 仕様未確定の DetailCard 等は TODO として明示し、仮のダミーで UI をブロックしない。
3. API/AI/Firestore の実連携変更時は `lib/` と `hooks/` のユーティリティを再利用し、テストの更新を同時に行う。
4. 仕上げに `npm run lint` と `npm run test:run` を実行して回帰を確認する。
