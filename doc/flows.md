# 画面フロー

```
LP (/) → グループ作成 (/trip-groups/new)
       → 招待・QR (/trip-groups/[id])
       → 候補閲覧 (/trip-groups/[id]/candidates)
           ├── タブ切替で候補スポット表示
           ├── FAB → 候補追加モーダル → AI要約自動生成
           └── FAB → 質問モーダル → AIストリーミング回答
```

# データフロー

```
[候補追加]
  AddCandidateModal → POST /api/trip-groups/[id]/candidates
    → Prisma INSERT → Firestore sync (fire-and-forget)
  → POST /api/ai/summarize
    → Gemini 2.0 Flash → JSON構造化出力
    → Prisma UPDATE → Firestore sync
    → onSnapshot → UI即時更新

[質問]
  QuestionModal → POST /api/trip-groups/[id]/questions
    → Prisma INSERT → Firestore sync
  → POST /api/ai/question
    → Gemini 2.0 Flash → streamText → toTextStreamResponse()
    → onFinish: Prisma UPDATE + Firestore sync
```
