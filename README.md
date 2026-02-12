# TripVote - みんなの旅投票

AI が旅行候補を整理し、グループで比較・投票できるサービスです。

## クイックスタート
### デモモード
外部サービス不要。まず動かしたいときはこちら。

```bash
cp .env.sample .env
echo \"NEXT_PUBLIC_DEMO_MODE=true\" >> .env

npm install
npm run dev
```

### 実データ利用モード
Firebase / AI を使った通常モードです。必要な環境変数は `.env.sample` を参照してください。

**準備（Firebase / Google）**
1. ADC を取得

```bash
gcloud auth application-default login
```

**起動（Firebase + AI）**
1. `.env` を作成して必要値を設定

```bash
cp .env.sample .env
echo \"NEXT_PUBLIC_DEMO_MODE=false\" >> .env
source .env
```

2. 依存関係をインストール

```bash
npm install
```

3. Go API サーバーを起動

```bash
go -C ai run .
```

4. 開発サーバー起動

```bash
npm run dev
```

## デモモードの仕組み
- `isDemoMode()` が `true` の場合、外部依存をすべてインメモリモックに切替
- Firestore → `demoStore`（EventEmitter パターンのインメモリストア）
- AI API → `mockSummarize`（500ms遅延） / `mockQuestionStream`（擬似ストリーミング）
- リアルタイム更新 → `demoStore.subscribe()`（EventEmitter パターン）
- 初期データ: グループ1件 + 候補地3件（金閣寺 / 美ら海水族館 / 道頓堀）

## スクリプト
```bash
npm run dev          # 開発サーバー
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー
npm run lint         # ESLintチェック
npm run test         # テスト (watchモード)
npm run test:run     # テスト (1回実行)
```
