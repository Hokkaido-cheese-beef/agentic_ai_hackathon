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
Firebase / DB / AI を使った通常モードです。必要な環境変数は `.env.sample` を参照してください。

**準備（Firebase / Google）**
1. ADC を取得

```bash
gcloud auth application-default login
```

**起動（DB + Firebase + AI）**
1. `.env` を作成して必要値を設定

```bash
cp .env.sample .env
echo \"NEXT_PUBLIC_DEMO_MODE=false\" >> .env
source .env
```

2. 依存関係をインストールし、DB を起動

```bash
npm install
npm run db:up
```

3. マイグレーション適用 → 開発サーバー起動

```bash
npx prisma migrate dev --name init
npm run dev
```

## デモモードの仕組み
- `isDemoMode()` が `true` の場合、外部依存をすべてインメモリモックに切替
- Prisma → `demoPrisma`（Map ベースのインメモリDB）
- Firestore sync → 無効化（早期リターン）
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
npm run db:up        # MySQLコンテナ起動
npm run db:down      # MySQLコンテナ停止
npm run db:seed      # サンプルデータ投入
npm run db:destroy   # MySQLコンテナ削除
```

## DBスキーマ変更フロー
1. `prisma/schema.prisma` を編集
2. `npx prisma migrate dev --name <migration-name>` でマイグレーション生成・適用
3. 生成された `prisma/migrations/` をレビュー・コミット
4. 型を即更新したい場合: `npx prisma generate`
5. `npm run dev` で動作確認
