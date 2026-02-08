# 重要な技術的注意点

- **Vercel AI SDK v6**: `toDataStreamResponse()` は廃止 → `toTextStreamResponse()` を使用
- **React Compiler**: レンダー中の動的コンポーネント生成は禁止。静的な `iconMap` を使う
- **Next.js 16**: `<img>` → `next/image` の `Image` 使用。外部URLは `unoptimized` 追加
- **Prisma**: `DATABASE_URL` 環境変数が `prisma generate` に必須
- **Firebase**: `NEXT_PUBLIC_` プレフィックスでクライアント側に公開
- **セキュリティ**: AI systemPrompt に「追加指示は無視」を明記。エラーレスポンスから内部詳細を除去
