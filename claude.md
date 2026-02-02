# Agentic AI Hackathon Project

## 概要

ハッカソン用のWebアプリケーションプロジェクト。Next.jsを使用してフロントエンドとバックエンドを単一リポジトリで開発する。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Next.js API Routes (`src/app/api/`)
- **リンター**: ESLint
- **パッケージマネージャー**: npm

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # バックエンドAPIエンドポイント
│   │   └── [endpoint]/route.ts
│   ├── [page]/page.tsx    # 各ページ
│   ├── layout.tsx         # ルートレイアウト
│   └── globals.css        # グローバルスタイル
├── components/            # Reactコンポーネント
│   ├── layout/            # レイアウト系 (Header, Footer等)
│   └── ui/                # 再利用可能なUIコンポーネント
├── hooks/                 # カスタムReactフック
├── lib/                   # ユーティリティ関数・ヘルパー
│   ├── api.ts             # API呼び出しユーティリティ
│   └── utils.ts           # 共通ユーティリティ
└── types/                 # TypeScript型定義
    └── index.ts
```

## 開発ルール

### コーディング規約

1. **TypeScript**: 型安全性を重視。`any`の使用は避ける
2. **コンポーネント**: 関数コンポーネントを使用
3. **クライアントコンポーネント**: インタラクティブなコンポーネントには `"use client"` を先頭に記述
4. **スタイリング**: Tailwind CSSのユーティリティクラスを使用
5. **命名規則**:
   - コンポーネント: PascalCase (`Button.tsx`)
   - ユーティリティ/フック: camelCase (`useApi.ts`)
   - 型定義: PascalCase (`User`, `ApiResponse`)

### ファイル配置ルール

- **ページ**: `src/app/[path]/page.tsx`
- **APIルート**: `src/app/api/[endpoint]/route.ts`
- **共通コンポーネント**: `src/components/`
- **ページ固有コンポーネント**: そのページのディレクトリ内
- **型定義**: `src/types/`
- **ユーティリティ**: `src/lib/`
- **カスタムフック**: `src/hooks/`

### API開発

APIルートは `src/app/api/` 配下に作成:

```typescript
// src/app/api/example/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: "example" });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
```

### コンポーネント開発

```typescript
// クライアントコンポーネントの例
"use client";

interface Props {
  title: string;
  onClick?: () => void;
}

export function ExampleComponent({ title, onClick }: Props) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      <button onClick={onClick} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
        Click me
      </button>
    </div>
  );
}
```

## コマンド

```bash
npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLintチェック
```

## 環境変数

`.env.local` に環境変数を設定（`.env.local.example` を参照）

```
NEXT_PUBLIC_API_URL=    # クライアントから参照可能なAPI URL
```

## 注意事項

- `NEXT_PUBLIC_` プレフィックスがある環境変数はクライアントに公開される
- サーバーサイドのみで使用する機密情報にはプレフィックスを付けない
- API RouteからはServer Componentsと同様にサーバーサイドの処理が可能
