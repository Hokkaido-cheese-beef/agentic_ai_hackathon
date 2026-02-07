# TripVote システムアーキテクチャ設計書

## 1. 技術スタック

| レイヤー | 技術 | バージョン | 理由 |
|---------|------|-----------|------|
| フロントエンド | Next.js (App Router) + React + Tailwind CSS | 16 / 19 / 4 | 既存 |
| マスターDB | MySQL + Prisma ORM | 8.4 / latest | 既存 |
| リアルタイム同期 | Cloud Firestore | — | GCP純正、onSnapshotでpush型同期 |
| AI | Vertex AI + Gemini | gemini-2.0-flash | ハッカソン必須要件 |
| AIストリーミング | Vercel AI SDK + @ai-sdk/google | latest | SSEでGemini応答をトークン単位表示 |
| デプロイ | Cloud Run (Docker) | — | ハッカソン必須要件 |
| アイコン | lucide-react | latest | .penデザイン準拠 |
| フォント | IBM Plex Sans (next/font) | — | .penデザイン準拠 |
| テスト | Vitest + React Testing Library | latest | TDD |

## 2. システム構成図

```
[ブラウザA]                     [Cloud Run: Next.js]
    │                                │
    ├─ POST /api/trip-groups ──────→ ├─ Prisma → MySQL (マスター保存)
    │                                └─ firebase-admin → Firestore (ミラー書込み)
    │                                       │
    │                                       ↓ onSnapshot push
[ブラウザB,C,D] ←──────────────── Firestore リアルタイムリスナー

[ブラウザA]
    ├─ POST /api/ai/question ────→ [Vertex AI Gemini]
    │                                  │ streamText (SSE)
    │  ←─ トークン逐次受信 ──────────┘
    │  完了後:
    │     → POST 内で firebase-admin → Firestore 更新
    │                                       │
    │                                       ↓ onSnapshot push
[ブラウザB,C,D] ←──────────────── AI回答をリアルタイム受信
```

## 3. データモデル

### 3.1 MySQL (Prisma) — マスターDB

model TripGroup:
  - trip_group_id: String @id @default(uuid()) @db.Char(36)
  - name: String
  - departure: String? (出発地点、任意)
  - status: String ("draft" | "active" | "completed")
  - created_at: DateTime @default(now())
  - candidates: TripCandidate[] (リレーション)

model TripCandidate:
  - id: String @id @default(uuid()) @db.Char(36)
  - trip_group_id: String @db.Char(36) → TripGroup.trip_group_id
  - name: String
  - description: String? @db.Text
  - image_url: String?
  - rating: Float?
  - review_count: Int?
  - tags: String? @db.Text (JSON文字列)
  - info: String? @db.Text
  - ai_summary: String? @db.Text (JSON文字列)
  - source_url: String?
  - created_at: DateTime @default(now())
  - questions: Question[] (リレーション)

model Question:
  - id: String @id @default(uuid()) @db.Char(36)
  - candidate_id: String? @db.Char(36) → TripCandidate.id (nullの場合は全候補対象)
  - trip_group_id: String @db.Char(36)
  - content: String @db.Text
  - ai_answer: String? @db.Text
  - created_at: DateTime @default(now())

### 3.2 Firestore — リアルタイム同期ミラー

コレクション構造:
```
tripGroups/{tripGroupId}
  ├── name: string
  ├── status: string
  ├── departure: string | null
  ├── updated_at: Timestamp
  │
  ├── candidates (サブコレクション)
  │   └── {candidateId}
  │       ├── name: string
  │       ├── description: string
  │       ├── image_url: string
  │       ├── rating: number
  │       ├── review_count: number
  │       ├── tags: array
  │       ├── info: string
  │       ├── ai_summary: object | null
  │       └── updated_at: Timestamp
  │
  └── questions (サブコレクション)
      └── {questionId}
          ├── candidate_id: string | null
          ├── content: string
          ├── ai_answer: string | null
          ├── ai_streaming: boolean (ストリーミング中フラグ)
          └── updated_at: Timestamp
```

### 3.3 MySQL ↔ Firestore 同期ルール

| 操作 | MySQL | Firestore | タイミング |
|------|-------|-----------|-----------|
| グループ作成 | INSERT | doc SET | API POST完了直後、同一トランザクション内 |
| 候補追加 | INSERT | subcollection ADD | API POST完了直後 |
| 質問追加 | INSERT | subcollection ADD | API POST完了直後 |
| AI回答開始 | — | ai_streaming=true | streamText開始前 |
| AI回答中 | — | ai_answer=部分テキスト | 500msごとに更新 |
| AI回答完了 | UPDATE ai_answer | ai_streaming=false, ai_answer=完全テキスト | streamText完了後 |

## 4. 環境変数

```
DATABASE_URL=mysql://user:pass@host:3306/tripvote
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GOOGLE_GENERATIVE_AI_API_KEY=gemini-api-key
NEXT_PUBLIC_FIREBASE_API_KEY=firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 5. 共通UIコンポーネント一覧

| コンポーネント | ファイル | 使用画面 |
|---|---|---|
| AppHeader | src/components/layout/AppHeader.tsx | 画面2,3,4 |
| PillTab | src/components/ui/PillTab.tsx | 画面3 |
| FAB | src/components/ui/FAB.tsx | 画面3,4 |
| Modal | src/components/ui/Modal.tsx | 画面5,6 |
| Tag | src/components/ui/Tag.tsx | 画面3 |
| SpotCard | src/components/candidates/SpotCard.tsx | 画面3 |
| AiSummaryCard | src/components/candidates/AiSummaryCard.tsx | 画面3 |
