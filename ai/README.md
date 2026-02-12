# AI サーバー (旅行プラン生成 API)

Gemini を使って旅行プランを生成する Go API サーバー。

## 環境変数

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `GOOGLE_GENAI_USE_VERTEXAI` | いいえ | - | `True` で Vertex AI バックエンドを使用 |
| `GOOGLE_CLOUD_PROJECT` | Vertex AI 時 | - | GCP プロジェクト ID |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI 時 | - | GCP リージョン (例: `global`) |
| `GOOGLE_API_KEY` | Gemini API 時 | - | Gemini API キー (Vertex AI 不使用時) |
| `GEMINI_MODEL` | いいえ | `gemini-2.5-flash-lite` | 使用する Gemini モデル名 |
| `PORT` | いいえ | `8080` | サーバーのリッスンポート |

## ローカル実行

### 前提条件

- Go 1.25 以上
- Google Cloud 認証 (以下いずれか)
  - **Vertex AI**: `gcloud auth application-default login` を実行済み
  - **Gemini API**: `GOOGLE_API_KEY` を設定
  - `.env` が作成&設定済み

### Vertex AI で実行

```bash
# ADC を設定 (初回のみ)
gcloud auth application-default login

# 環境変数を設定して起動
go run .
```

### テスト

```bash
go test ./...
```

### 動作確認

```bash
curl -X POST http://localhost:8080/plan \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "札幌",
    "destination": "函館",
    "questions": ["子供も楽しめる？", "駐車場はある？"]
  }'
```

## デプロイ (Cloud Run)

### 前提条件

- `gcloud` CLI がインストール済み
- 対象プロジェクトで Cloud Run API と Vertex AI API が有効

### 手順

```bash
cd ai

# 1. イメージをビルドして Artifact Registry にプッシュ
gcloud builds submit --tag gcr.io/<your-project-id>/ai-server

# 2. Cloud Run にデプロイ
gcloud run deploy ai-server \
  --image gcr.io/<your-project-id>/ai-server \
  --region asia-northeast1 \
  --set-env-vars "GOOGLE_GENAI_USE_VERTEXAI=True,GOOGLE_CLOUD_PROJECT=<your-project-id>,GOOGLE_CLOUD_LOCATION=global" \
```

Cloud Run ではデフォルトのサービスアカウントが ADC として自動で使用されるため、`gcloud auth` は不要です。サービスアカウントに **Vertex AI User** ロールが付与されていることを確認してください。

## API 仕様

### `POST /plan`

旅行プランを生成します。

**リクエスト**

```json
{
  "origin": "札幌",
  "destination": "函館",
  "questions": ["子供も楽しめる？", "駐車場はある？"]
}
```

| フィールド | 型 | 必須 | 制約 |
|-----------|------|------|------|
| `origin` | string | はい | 最大100文字 |
| `destination` | string | はい | 最大100文字 |
| `questions` | string[] | いいえ | 最大10件、各最大200文字 |

**レスポンス (200)**

```json
{
  "tag": {
    "budget_jpy": 3000,
    "travel_time": "車で約1時間"
  },
  "description": "魅力的な紹介文...",
  "survey": [
    {
      "question": "子供も楽しめる？",
      "answer": "はい、楽しめます。..."
    }
  ]
}
```
