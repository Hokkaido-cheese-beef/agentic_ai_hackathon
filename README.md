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

ローカルでクリーンな状態から MySQL を起動し、シード投入～Next.js を立ち上げるまでの一連の手順です。

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

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## 🗃️ データベース (MySQL + Prisma)

- `.env` の `DATABASE_URL` / `MYSQL_*` を環境に合わせて調整
- MySQL コンテナの操作: `npm run db:up` / `db:down` / `db:destroy`
- マイグレーション: `npx prisma migrate dev --name init`
- シード投入: `npm run db:seed`
- Prisma Client は `src/lib/prisma.ts` で初期化、`/api/hello` が利用例

> NOTE: 開発環境では root アカウントで MySQL に接続するため、Prisma が shadow DB を自動で作成・削除します。一般ユーザーで接続したい場合は、`CREATE/DROP DATABASE` 権限を付与しつつ `SHADOW_DATABASE_URL` を別途設定してください。

## 🐳 Docker / コンテナ実行

Next.js アプリと MySQL をまとめて動かす場合は `docker compose` を利用します。

```bash
docker compose up --build        # 前面起動
docker compose up -d --build     # バックグラウンド起動
docker compose down -v           # 停止＆ボリューム削除
```

`app` サービスは `DATABASE_URL=mysql://root:root_password@db:3306/app_db` で `db` サービスに接続します。ホストから直接 MySQL に触りたいときは `.env` 設定どおり `localhost:3307` を利用します。

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
