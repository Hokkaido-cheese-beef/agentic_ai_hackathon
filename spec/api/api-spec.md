# TripVote API仕様書

## 1. API一覧

| # | メソッド | エンドポイント | 目的 | 認証 |
|---|---------|---------------|------|------|
| 1 | POST | /api/trip-groups | グループ作成 | なし |
| 2 | GET | /api/trip-groups/[tripGroupId] | グループ情報取得 | なし |
| 3 | POST | /api/candidates | 候補地追加 | なし |
| 4 | POST | /api/candidates/fetch-url | URL解析 | なし |
| 5 | POST | /api/questions | 質問追加 | なし |
| 6 | POST | /api/ai/question | AI質問回答 (SSE) | なし |
| 7 | POST | /api/ai/summarize | AI候補地要約 | なし |

## 2. API実行タイミングフローチャート

```
画面1 (TopPage)
  └── [グループ作成ボタン]
       → POST /api/trip-groups
       → 画面2へ遷移

画面2 (InvitePage)
  └── サーバーサイドデータフェッチ
       → GET /api/trip-groups/[id] (内部呼出し / Prisma直接)
  └── [候補地を追加する]
       → 画面3へ遷移

画面3-4 (CandidatesPage)
  ├── 初回: Firestoreリスナー設定
  ├── [FABボタン] → AddCandidateModal (画面6)
  └── [AIに質問する] → QuestionModal (画面5)

画面5 (QuestionModal)
  └── [送信ボタン]
       → POST /api/questions (質問保存)
       → POST /api/ai/question (AI回答ストリーミング)

画面6 (AddCandidateModal)
  ├── [情報を取得]
  │    → POST /api/candidates/fetch-url (URL解析)
  │    → POST /api/ai/summarize (AI要約)
  └── [候補地を追加する]
       → POST /api/candidates (候補地保存)
```

## 3. API詳細仕様

### 3.1 POST /api/trip-groups — グループ作成

**ファイル**: `src/app/api/trip-groups/route.ts`

**リクエストBody**:
```typescript
{
  name: string;        // 必須、1-100文字
  departure?: string;  // 任意、出発地点
}
```

**バリデーション**:
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| name | 必須、1-100文字 | "旅行名は1〜100文字で入力してください" |
| departure | 任意、0-100文字 | "出発地点は100文字以内で入力してください" |

**処理フロー**:
```
1. リクエストバリデーション
2. Prisma: TripGroup INSERT
   {
     trip_group_id: uuid(),
     name: body.name,
     departure: body.departure || null,
     status: "draft"
   }
3. firebase-admin: Firestore SET
   tripGroups/{trip_group_id} = {
     name, status, departure, updated_at: serverTimestamp()
   }
4. レスポンス返却 (201)
```

**レスポンス (201)**:
```json
{
  "trip_group_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "夏の沖縄旅行",
  "departure": "東京",
  "status": "draft",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**エラーレスポンス (400)**:
```json
{
  "error": "Validation Error",
  "message": "旅行名は1〜100文字で入力してください"
}
```

---

### 3.2 GET /api/trip-groups/[tripGroupId] — グループ情報取得

**ファイル**: `src/app/api/trip-groups/[tripGroupId]/route.ts`

**パスパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|---|------|
| tripGroupId | string (UUID) | グループID |

**処理フロー**:
```
1. Prisma: TripGroup findUnique
   include: { candidates: true }
2. 存在しない場合: 404
3. candidates の tags, ai_summary をJSONパース
4. レスポンス返却 (200)
```

**レスポンス (200)**:
```json
{
  "trip_group_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "夏の沖縄旅行",
  "departure": "東京",
  "status": "active",
  "created_at": "2025-01-01T00:00:00.000Z",
  "candidates": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "美ら海水族館",
      "description": "沖縄を代表する大型水族館",
      "image_url": "https://example.com/image.jpg",
      "rating": 4.5,
      "review_count": 1234,
      "tags": ["観光", "家族向け"],
      "info": "営業時間: 8:30-18:30",
      "ai_summary": {
        "highlights": ["ジンベエザメが圧巻"],
        "considerations": ["混雑時は待ち時間あり"],
        "best_season": "通年",
        "budget_range": "大人1,880円"
      },
      "source_url": "https://example.com/spot/123",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**エラーレスポンス (404)**:
```json
{
  "error": "Not Found",
  "message": "指定されたグループが見つかりません"
}
```

---

### 3.3 POST /api/candidates — 候補地追加

**ファイル**: `src/app/api/candidates/route.ts`

**リクエストBody**:
```typescript
{
  trip_group_id: string;    // 必須、UUID
  name: string;             // 必須、1-200文字
  description?: string;     // 任意
  image_url?: string;       // 任意、URL形式
  rating?: number;          // 任意、0-5
  review_count?: number;    // 任意、0以上
  tags?: string;            // 任意、JSON文字列
  info?: string;            // 任意
  ai_summary?: string;      // 任意、JSON文字列
  source_url?: string;      // 任意、URL形式
}
```

**バリデーション**:
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| trip_group_id | 必須、UUID形式 | "グループIDが不正です" |
| name | 必須、1-200文字 | "候補地名は1〜200文字で入力してください" |
| rating | 0-5の範囲 | "評価は0〜5の範囲で入力してください" |

**処理フロー**:
```
1. リクエストバリデーション
2. Prisma: TripGroup 存在確認
3. Prisma: TripCandidate INSERT
4. firebase-admin: Firestore ADD
   tripGroups/{trip_group_id}/candidates/{id} = {
     name, description, image_url, rating, review_count,
     tags: JSON.parse(tags), info, ai_summary: JSON.parse(ai_summary),
     updated_at: serverTimestamp()
   }
5. レスポンス返却 (201)
```

**レスポンス (201)**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "trip_group_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "美ら海水族館",
  "description": "沖縄を代表する大型水族館",
  "image_url": "https://example.com/image.jpg",
  "rating": 4.5,
  "review_count": 1234,
  "tags": ["観光", "家族向け"],
  "ai_summary": { "highlights": ["..."] },
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

---

### 3.4 POST /api/candidates/fetch-url — URL解析

**ファイル**: `src/app/api/candidates/fetch-url/route.ts`

**リクエストBody**:
```typescript
{
  url: string;  // 必須、http/https URL
}
```

**バリデーション**:
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| url | 必須、http/https URL形式 | "有効なURLを入力してください" |

**処理フロー**:
```
1. リクエストバリデーション
2. URLのWebページを取得 (fetch)
3. HTMLをテキストに変換 (cheerio でパース、メインコンテンツ抽出)
4. Vertex AI Gemini: ページ内容から構造化データを抽出
   プロンプト:
   "以下のWebページから旅行候補地の情報を抽出してJSON形式で返してください..."
5. Geminiレスポンスをパース
6. レスポンス返却 (200)
```

**レスポンス (200)**:
```json
{
  "name": "美ら海水族館",
  "description": "沖縄を代表する大型水族館。ジンベエザメやマンタが泳ぐ巨大水槽が人気。",
  "image_url": "https://example.com/image.jpg",
  "rating": 4.5,
  "review_count": 1234,
  "tags": ["観光", "家族向け", "水族館"],
  "info": "営業時間: 8:30-18:30\n料金: 大人1,880円\nアクセス: 那覇空港から車で約2時間",
  "source_url": "https://example.com/spot/123"
}
```

**エラーレスポンス (422)**:
```json
{
  "error": "Parse Error",
  "message": "URLから情報を取得できませんでした。別のURLをお試しください"
}
```

**タイムアウト**: 30秒

---

### 3.5 POST /api/questions — 質問追加

**ファイル**: `src/app/api/questions/route.ts`

**リクエストBody**:
```typescript
{
  trip_group_id: string;    // 必須、UUID
  candidate_id?: string;    // 任意、UUID (nullの場合は全候補対象)
  content: string;          // 必須、1-500文字
}
```

**バリデーション**:
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| trip_group_id | 必須、UUID形式 | "グループIDが不正です" |
| candidate_id | 任意、UUID形式 | "候補地IDが不正です" |
| content | 必須、1-500文字 | "質問は1〜500文字で入力してください" |

**処理フロー**:
```
1. リクエストバリデーション
2. Prisma: TripGroup 存在確認
3. candidate_id が指定されている場合: TripCandidate 存在確認
4. Prisma: Question INSERT
5. firebase-admin: Firestore ADD
   tripGroups/{trip_group_id}/questions/{id} = {
     candidate_id, content, ai_answer: null,
     ai_streaming: false, updated_at: serverTimestamp()
   }
6. レスポンス返却 (201)
```

**レスポンス (201)**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "trip_group_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidate_id": "770e8400-e29b-41d4-a716-446655440002",
  "content": "冬の気候はどうですか？",
  "ai_answer": null,
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

---

### 3.6 POST /api/ai/question — AI質問回答 (SSE)

**ファイル**: `src/app/api/ai/question/route.ts`

**リクエストBody**:
```typescript
{
  question_id: string;  // 必須、UUID
}
```

**レスポンス**: `Content-Type: text/event-stream`

**処理フロー**:
```
1. リクエストバリデーション
2. Prisma: Question + TripCandidate + 同一候補の過去質問 取得
3. firebase-admin: Firestore
   tripGroups/{trip_group_id}/questions/{question_id}
     → ai_streaming = true
4. Vertex AI Gemini: streamText
   モデル: gemini-2.0-flash
   プロンプト:
     - システム: "あなたは旅行アドバイザーです..."
     - ユーザー: 候補地情報 + 過去Q&A + 今回の質問
5. ストリーミング:
   - SSEでクライアントにトークン送信
   - 500msインターバルで firebase-admin: Firestore ai_answer 部分更新
6. ストリーム完了:
   - Prisma: Question UPDATE ai_answer = 完全テキスト
   - firebase-admin: Firestore
     ai_streaming = false, ai_answer = 完全テキスト
```

**SSEフォーマット**:
```
data: {"type":"text-delta","textDelta":"沖縄"}

data: {"type":"text-delta","textDelta":"の冬は"}

data: {"type":"text-delta","textDelta":"比較的"}

data: {"type":"finish","finishReason":"stop"}
```

**Vercel AI SDK使用例**:
```typescript
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

const result = streamText({
  model: google("gemini-2.0-flash"),
  system: "あなたは旅行アドバイザーです。...",
  prompt: `【候補地情報】\n${candidateInfo}\n\n【質問】\n${question.content}`,
});

return result.toDataStreamResponse();
```

**エラーレスポンス (404)**:
```json
{
  "error": "Not Found",
  "message": "指定された質問が見つかりません"
}
```

---

### 3.7 POST /api/ai/summarize — AI候補地要約

**ファイル**: `src/app/api/ai/summarize/route.ts`

**リクエストBody**:
```typescript
{
  candidate_data: {
    name: string;
    description?: string;
    info?: string;
  }
}
```

**バリデーション**:
| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| candidate_data | 必須、オブジェクト | "候補地データが不正です" |
| candidate_data.name | 必須 | "候補地名は必須です" |

**処理フロー**:
```
1. リクエストバリデーション
2. Vertex AI Gemini: generateText (非ストリーミング)
   プロンプト:
     "以下の旅行候補地の情報を要約してJSON形式で返してください..."
3. Geminiレスポンスをパース (JSON)
4. レスポンス返却 (200)
```

**レスポンス (200)**:
```json
{
  "highlights": [
    "ジンベエザメが泳ぐ世界最大級の水槽",
    "イルカショーが大人気",
    "沖縄の海洋生物を学べる教育的施設"
  ],
  "considerations": [
    "繁忙期は非常に混雑する",
    "那覇市内からのアクセスに時間がかかる"
  ],
  "best_season": "通年（特に夏がおすすめ）",
  "budget_range": "大人1,880円 / 高校生1,250円 / 小中学生620円"
}
```

**プロンプト構成**:
```
以下の旅行候補地の情報を要約してください。

【候補地情報】
名前: {name}
説明: {description}
情報: {info}

以下のJSON形式で回答してください:
{
  "highlights": ["おすすめポイント1", "おすすめポイント2", "おすすめポイント3"],
  "considerations": ["注意点1", "注意点2"],
  "best_season": "ベストシーズン",
  "budget_range": "予算目安"
}

回答はJSON形式のみで、余計な説明は不要です。日本語で回答してください。
```

## 4. Firestoreリアルタイム同期設計

### 4.1 書き込みタイミング

全てのFirestore書き込みはサーバーサイド（API Route）から `firebase-admin` SDK を使用して行う。
クライアントサイドからの直接書き込みは行わない（セキュリティ上の理由）。

### 4.2 書き込みパターン

```typescript
// lib/firebase-admin.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!)),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

export const adminDb = getFirestore();
```

```typescript
// API Route内での使用例
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// グループ作成時
await adminDb.doc(`tripGroups/${tripGroupId}`).set({
  name,
  status: "draft",
  departure,
  updated_at: FieldValue.serverTimestamp(),
});

// 候補地追加時
await adminDb
  .doc(`tripGroups/${tripGroupId}/candidates/${candidateId}`)
  .set({
    name, description, image_url, rating, review_count,
    tags, info, ai_summary,
    updated_at: FieldValue.serverTimestamp(),
  });

// AI回答ストリーミング中の部分更新
await adminDb
  .doc(`tripGroups/${tripGroupId}/questions/${questionId}`)
  .update({
    ai_answer: partialText,
    ai_streaming: true,
    updated_at: FieldValue.serverTimestamp(),
  });
```

### 4.3 クライアントサイドリスナー

```typescript
// lib/firebase.ts (クライアント用)
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
```

```typescript
// hooks/useFirestoreTrip.ts
import { db } from "@/lib/firebase";
import { doc, collection, onSnapshot } from "firebase/firestore";

export function useFirestoreTrip(tripGroupId: string) {
  const [tripGroup, setTripGroup] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const unsubGroup = onSnapshot(
      doc(db, "tripGroups", tripGroupId),
      (snap) => setTripGroup(snap.data())
    );

    const unsubCandidates = onSnapshot(
      collection(db, "tripGroups", tripGroupId, "candidates"),
      (snap) => setCandidates(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubQuestions = onSnapshot(
      collection(db, "tripGroups", tripGroupId, "questions"),
      (snap) => setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubGroup();
      unsubCandidates();
      unsubQuestions();
    };
  }, [tripGroupId]);

  return { tripGroup, candidates, questions };
}
```

## 5. 共通エラーハンドリング

### 5.1 エラーレスポンス形式

```typescript
interface ErrorResponse {
  error: string;    // エラー種別
  message: string;  // ユーザー向けメッセージ
}
```

### 5.2 HTTPステータスコード

| コード | 意味 | 使用場面 |
|--------|------|---------|
| 200 | OK | GET成功、AI要約成功 |
| 201 | Created | POST成功（リソース作成） |
| 400 | Bad Request | バリデーションエラー |
| 404 | Not Found | リソース未発見 |
| 422 | Unprocessable Entity | URL解析失敗 |
| 500 | Internal Server Error | サーバー内部エラー |

### 5.3 共通エラーハンドラー

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string
  ) {
    super(message);
  }
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: err.error, message: err.message },
      { status: err.statusCode }
    );
  }

  console.error("Unexpected error:", err);
  return NextResponse.json(
    { error: "Internal Server Error", message: "予期しないエラーが発生しました" },
    { status: 500 }
  );
}
```

### 5.4 バリデーション共通ユーティリティ

```typescript
// lib/validation.ts
import { z } from "zod";

export const tripGroupSchema = z.object({
  name: z.string().min(1, "旅行名は1〜100文字で入力してください").max(100),
  departure: z.string().max(100, "出発地点は100文字以内で入力してください").optional(),
});

export const candidateSchema = z.object({
  trip_group_id: z.string().uuid("グループIDが不正です"),
  name: z.string().min(1, "候補地名は1〜200文字で入力してください").max(200),
  description: z.string().optional(),
  image_url: z.string().url().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  review_count: z.number().min(0).optional().nullable(),
  tags: z.string().optional().nullable(),
  info: z.string().optional().nullable(),
  ai_summary: z.string().optional().nullable(),
  source_url: z.string().url().optional().nullable(),
});

export const questionSchema = z.object({
  trip_group_id: z.string().uuid("グループIDが不正です"),
  candidate_id: z.string().uuid("候補地IDが不正です").optional().nullable(),
  content: z.string().min(1, "質問は1〜500文字で入力してください").max(500),
});

export const fetchUrlSchema = z.object({
  url: z.string().url("有効なURLを入力してください"),
});

export const aiQuestionSchema = z.object({
  question_id: z.string().uuid("質問IDが不正です"),
});

export const aiSummarizeSchema = z.object({
  candidate_data: z.object({
    name: z.string().min(1, "候補地名は必須です"),
    description: z.string().optional(),
    info: z.string().optional(),
  }),
});
```
