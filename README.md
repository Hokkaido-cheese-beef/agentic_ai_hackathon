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
