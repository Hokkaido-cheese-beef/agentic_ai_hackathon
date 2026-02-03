# Agentic AI Hackathon

ハッカソン用プロジェクト - Next.js + TypeScript + Tailwind CSS

## 🚀 技術スタック

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Linting**: ESLint

## 📁 プロジェクト構成

```
src/
├── app/                    # App Router (ページ & APIルート)
│   ├── api/               # バックエンドAPI
│   │   └── hello/         # サンプルAPIエンドポイント
│   ├── about/             # Aboutページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/            # Reactコンポーネント
│   ├── layout/            # レイアウトコンポーネント
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/                # UIコンポーネント
│       └── Button.tsx
├── hooks/                 # カスタムフック
│   └── useApi.ts
├── lib/                   # ユーティリティ・ヘルパー
│   ├── api.ts             # API呼び出しユーティリティ
│   └── utils.ts           # 共通ユーティリティ
└── types/                 # TypeScript型定義
    └── index.ts
```

## 🛠️ セットアップ

### 💻 Next.js はホスト実行 / DB はコンテナ

ローカルマシン上で Next.js を動かし、MySQL だけ Docker コンテナで起動するパターンです。最も手軽に開発を進められる想定の手順になります。

```bash
# 1. リポジトリをクローン
git clone https://github.com/Hokkaido-cheese-beef/agentic_ai_hackathon.git
cd agentic_ai_hackathon

# 2. 依存関係をインストール
npm install

# 3. 環境変数ファイルを作成
cp .env.sample .env

# 4. MySQL コンテナを起動
npm run db:up

# 5. Prisma マイグレーションを適用（最新スキーマを DB に反映）
npx prisma migrate dev --name init

# 6. サンプルデータを投入
npm run db:seed

# 7. Next.js 開発サーバーを起動
npm run dev
```


### 🐳 docker compose でまとめて実行

Next.js アプリも MySQL もすべてコンテナで動かしたい場合はこちらを利用します。ホスト側では `docker compose` のみを操作すればよい構成です。

```bash
docker compose up --build        # フォアグラウンド起動
docker compose up -d --build     # バックグラウンド起動
docker compose down -v           # 停止＆ボリューム削除
```

`app` サービスは `DATABASE_URL=mysql://root:root_password@db:3306/app_db` で `db` サービスに接続します。ホストから直接 MySQL に触りたいときは `.env` 設定どおり `localhost:3307` を利用します。


[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## 📝 利用可能なスクリプト

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLintチェック
```

## DB スキーマ変更時のローカル適用と確認フロー

1. **スキーマを編集**: `prisma/schema.prisma` に変更を加える。
2. **マイグレーション生成・適用**: MySQL を起動した状態で `npx prisma migrate dev --name <migration-name>` を実行し、ローカル DB とマイグレーションファイルを更新。
3. **マイグレーションを確認・コミット**: 生成された `prisma/migrations/<timestamp>_<migration-name>/migration.sql` をレビューして Git にコミット。
4. **Prisma Client の再生成**: 型を即座に更新したい場合は `npx prisma generate` を実行（`npm install` 後は `postinstall` で自動生成）。
5. **動作確認**: `npm run dev` を起動し、該当の画面/API で挙動を確認。必要に応じて `npm run db:seed` でテストデータを再投入。
