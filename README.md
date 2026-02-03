# Agentic AI Hackathon

ハッカソン用プロジェクト - Next.js + TypeScript + Tailwind CSS

## 🚀 技術スタック

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
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

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local

# 開発サーバーの起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## 🗃️ データベース (MySQL + Prisma)

1. `.env.local` の `DATABASE_URL` と `MYSQL_*` を任意の値に変更します。
2. ローカルで MySQL を起動する場合は、用意した npm スクリプトで Docker の DB コンテナを起動します。

```bash
# MySQL だけを起動
npm run db:up

# 停止 / 完全削除
npm run db:down
npm run db:destroy

# Prisma のスキーマを DB に適用
npx prisma migrate dev --name init

# (任意) サンプルデータ投入
npx prisma db seed
```

Prisma Client は `src/lib/prisma.ts` で初期化されており、`import { prisma } from "@/lib/prisma";` でどこからでも利用できます。`/api/hello` では `Cheese` テーブルの読み書き例を実装しています。

## 🐳 Docker / コンテナ実行

Next.js アプリと MySQL を 1 コマンドで立ち上げる `docker-compose.yml` とビルド用 `Dockerfile` を追加しています。

```bash
# コンテナのビルドと起動
docker compose up --build

# バックグラウンドで起動したい場合
docker compose up -d --build

# 停止と後片付け
docker compose down -v
```

`app` サービスは `DATABASE_URL=mysql://app_user:app_password@db:3306/app_db` を参照し、`db` サービスの MySQL を利用します。開発環境からホストの MySQL に接続する場合は `.env.local` の `localhost:3307` を利用してください。`npm run db:up` スクリプトもこのコンテナを使います。

## 📝 利用可能なスクリプト

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLintチェック
```

## 🔌 API エンドポイント

- `GET /api/hello` - サンプルAPIエンドポイント
- `POST /api/hello` - データ送信のサンプル

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
