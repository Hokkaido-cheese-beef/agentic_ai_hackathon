# 画面5: 質問モーダル

## 概要

- **画面名**: QuestionModal
- **表示元**: CandidatesPage (画面3-4)
- **目的**: 候補地についてAIに質問し、リアルタイムで回答を受信する
- **特徴**: AIストリーミング回答、Firestoreリアルタイム同期で全メンバーに回答共有

## コンポーネント構成

```
QuestionModal (src/components/questions/QuestionModal.tsx)
├── Modal (共通モーダルコンポーネント)
│   ├── ModalHeader
│   │   ├── Title ("AIに質問する")
│   │   ├── CandidateName (対象候補地名、候補指定時)
│   │   └── CloseButton (X アイコン)
│   ├── ModalBody
│   │   ├── QuestionHistory (過去の質問・回答一覧)
│   │   │   └── QuestionItem[]
│   │   │       ├── QuestionText (質問テキスト)
│   │   │       ├── AiAnswer (AI回答テキスト)
│   │   │       └── StreamingIndicator (ストリーミング中インジケータ)
│   │   └── EmptyState ("まだ質問はありません")
│   └── ModalFooter
│       ├── QuestionInput (質問入力フィールド)
│       └── SendButton (送信ボタン)
```

## Props

```typescript
interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripGroupId: string;
  candidateId: string | null;    // nullの場合は全候補地が対象
  candidateName: string | null;  // 表示用候補地名
  questions: Question[];          // Firestoreからのリアルタイムデータ
}
```

## State定義

```typescript
interface QuestionModalState {
  questionText: string;          // 入力中の質問テキスト
  isSubmitting: boolean;         // 質問送信中
  isStreaming: boolean;          // AI回答ストリーミング中
  streamingQuestionId: string | null;  // 現在ストリーミング中の質問ID
  error: string | null;
}

const initialState: QuestionModalState = {
  questionText: "",
  isSubmitting: false,
  isStreaming: false,
  streamingQuestionId: null,
  error: null,
};
```

## コンポーネント詳細

### Modal (共通)
- **ファイル**: `src/components/ui/Modal.tsx`
- **Props**:
  ```typescript
  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg";
  }
  ```
- **動作**:
  - オーバーレイ背景（半透明黒）
  - ESCキーでクローズ
  - オーバーレイクリックでクローズ
  - 開閉アニメーション（フェードイン/アウト + スライドアップ）
- **スタイル**: 中央配置、角丸、白背景、max-height: 80vh、オーバーフロースクロール

### QuestionHistory
- **表示内容**: 対象候補地に紐づく過去の質問と回答
- **フィルタリング**:
  - candidateId != null: その候補地の質問のみ
  - candidateId == null: trip_group全体の質問
- **ソート**: created_at 昇順（古い順）
- **スクロール**: 新しい質問追加時に自動スクロールダウン

### QuestionItem
- **表示内容**:
  - 質問テキスト（右寄せ、吹き出しスタイル、青背景）
  - AI回答（左寄せ、吹き出しスタイル、グレー背景）
  - ストリーミング中: 点滅カーソル表示
- **Markdown対応**: AI回答はマークダウンレンダリング

### StreamingIndicator
- **表示条件**: question.ai_streaming === true (Firestore)
- **表示内容**: 3ドットアニメーション + "AIが回答中..."

### QuestionInput
- **タイプ**: textarea (自動リサイズ)
- **プレースホルダー**: "この候補地について質問する..." / "候補地全体について質問する..."
- **最大文字数**: 500文字
- **改行対応**: Shift+Enter で改行、Enter で送信

### SendButton
- **アイコン**: Send (lucide-react)
- **状態**: disabled / enabled / loading

## インタラクションフロー

### 質問送信フロー

```
1. ユーザーが質問テキストを入力
   → questionText 更新
   → 1文字以上で SendButton 有効化

2. SendButton クリック (または Enter キー)
   → isSubmitting = true
   → POST /api/questions
     { trip_group_id, candidate_id, content: questionText }

3. API応答 (201) — 質問レコード作成完了
   → questionText = "" (入力クリア)
   → isSubmitting = false
   → Firestore onSnapshot で新しい質問が QuestionHistory に表示

4. 自動的にAI回答リクエスト
   → POST /api/ai/question { question_id }
   → isStreaming = true
   → streamingQuestionId = question.id

5. AI回答ストリーミング
   → Firestore onSnapshot で question.ai_answer が段階的に更新
   → QuestionItem の AI回答テキストが逐次表示
   → question.ai_streaming = true の間、StreamingIndicator 表示

6. ストリーミング完了
   → Firestore: ai_streaming = false, ai_answer = 完全テキスト
   → isStreaming = false
   → streamingQuestionId = null
```

### SSEストリーミング表示フロー（質問送信者のブラウザ）

```
1. POST /api/ai/question をfetchで呼び出し
   → ReadableStream でSSEレスポンス受信

2. トークン受信ごと
   → ローカルstateで回答テキストを逐次更新
   → 同時にサーバー側で500msごとにFirestore更新

3. ストリーム完了
   → サーバー側でMySQL + Firestoreに最終回答を保存
   → ローカルstateをFirestoreの値で上書き（整合性確保）
```

### 他メンバーのブラウザでの表示フロー

```
1. Firestore onSnapshot で新しい question ドキュメント検知
   → QuestionHistory に新しい質問が表示

2. ai_streaming = true を検知
   → StreamingIndicator 表示

3. ai_answer の段階的更新を検知（500msごと）
   → AI回答テキストが逐次表示

4. ai_streaming = false を検知
   → StreamingIndicator 非表示
   → 完全な回答テキスト表示
```

## API定義

### POST /api/questions

**リクエスト**:
```json
{
  "trip_group_id": "uuid-xxx",
  "candidate_id": "uuid-yyy",
  "content": "この場所の冬の気候はどうですか？"
}
```

**レスポンス (201)**:
```json
{
  "id": "uuid-zzz",
  "trip_group_id": "uuid-xxx",
  "candidate_id": "uuid-yyy",
  "content": "この場所の冬の気候はどうですか？",
  "ai_answer": null,
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

**処理フロー**:
1. Prisma: Question INSERT
2. firebase-admin: Firestore questions サブコレクション ADD
3. レスポンス返却

### POST /api/ai/question

**リクエスト**:
```json
{
  "question_id": "uuid-zzz"
}
```

**レスポンス**: SSE (text/event-stream)

**処理フロー**:
1. Prisma: Question + 関連TripCandidate取得
2. firebase-admin: Firestore ai_streaming = true
3. Vertex AI Gemini: streamText (候補地情報 + 質問をプロンプトに含める)
4. SSEでトークン逐次送信
5. 500msごとに firebase-admin: Firestore ai_answer 部分更新
6. ストリーム完了:
   - Prisma: Question.ai_answer UPDATE
   - firebase-admin: Firestore ai_streaming = false, ai_answer = 最終テキスト

**プロンプト構成**:
```
あなたは旅行アドバイザーです。以下の候補地について質問に回答してください。

【候補地情報】
名前: {candidate.name}
説明: {candidate.description}
情報: {candidate.info}
AI要約: {candidate.ai_summary}

【過去の質問と回答】
{previousQuestions.map(q => `Q: ${q.content}\nA: ${q.ai_answer}`)}

【今回の質問】
{question.content}

回答は日本語で、簡潔かつ具体的にお願いします。
```

## ボタン状態

### SendButton

| 状態 | 条件 | 表示 |
|------|------|------|
| disabled | questionText が空、またはストリーミング中 | グレーアウト、クリック不可 |
| enabled | questionText が1文字以上 | プライマリカラー |
| loading | isSubmitting = true | スピナー表示 |

### CloseButton

| 状態 | 条件 | 表示 |
|------|------|------|
| enabled | 常時 | X アイコン、クリック可能 |
| ストリーミング中 | isStreaming = true | クローズ可能（ストリーミングはバックグラウンド継続） |

## テストケース

### ユニットテスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | モーダルが正しく表示される | isOpen=true でモーダル表示 |
| 2 | 候補地名がヘッダーに表示される | candidateName がサブタイトルに表示 |
| 3 | 過去の質問一覧が表示される | questions配列の内容が表示 |
| 4 | 質問入力でSendButton有効化 | テキスト入力でボタンが有効に |
| 5 | SendButtonクリックでAPI呼び出し | POST /api/questions が呼ばれる |
| 6 | 送信成功後に入力クリア | questionText が空になる |
| 7 | ストリーミング中にインジケータ表示 | "AIが回答中..." が表示 |
| 8 | ストリーミング完了でインジケータ非表示 | インジケータが消える |
| 9 | ESCキーでモーダルクローズ | onClose が呼ばれる |
| 10 | オーバーレイクリックでクローズ | onClose が呼ばれる |
| 11 | Enter キーで送信 | SendButtonクリックと同じ動作 |
| 12 | Shift+Enter で改行 | テキストに改行が追加 |
| 13 | 500文字制限 | 500文字を超えると入力不可 |
| 14 | 質問追加時に自動スクロール | 最新の質問が画面内に表示 |

### 統合テスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | 質問送信→AI回答ストリーミング表示 | 質問送信後にAI回答が逐次表示される |
| 2 | 別ブラウザでの質問・回答のリアルタイム表示 | Firestore経由で他メンバーにも表示 |
| 3 | ストリーミング中にモーダルを閉じても回答継続 | バックグラウンドでストリーミング完了 |
