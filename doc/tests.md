# テスト構成 (15ファイル / 84テスト)

| カテゴリ | ファイル | テスト数 |
|---|---|---|
| ページ | `app/__tests__/page.test.tsx` | LP表示 |
| 候補閲覧 | `candidates/__tests__/page.test.tsx` | タブ/SpotCard/FAB (8テスト) |
| UIコンポーネント | `ui/__tests__/{PillTab,FAB,Modal,Tag}.test.tsx` | 各コンポーネント |
| モーダル | `modals/__tests__/{AddCandidateModal,QuestionModal}.test.tsx` | フォーム送信 |
| レイアウト | `layout/__tests__/AppHeader.test.tsx` | ヘッダー表示 |
| コピー | `__tests__/copyable-field.test.tsx` | クリップボード |
| API | `api/trip-groups/__tests__/route.test.ts` | グループCRUD (5テスト) |
| API | `api/trip-groups/[id]/__tests__/route.test.ts` | グループ詳細 (3テスト) |
| API | `api/trip-groups/[id]/candidates/__tests__/route.test.ts` | 候補CRUD (5テスト) |
| API | `api/trip-groups/[id]/questions/__tests__/route.test.ts` | 質問作成 |
| API | `api/ai/__tests__/summarize.test.ts` | AI要約 (4テスト) |
