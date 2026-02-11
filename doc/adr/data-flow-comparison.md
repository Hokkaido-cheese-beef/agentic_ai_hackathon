# ADR: Firestore 単独化の意思決定

## ステータス

採用

## 背景

UI は Firestore のリアルタイム更新を利用している一方、API は MySQL (Prisma) に書き込み、同時に Firestore へ同期していた。二重書き込み構成により整合性ズレのリスクと運用コストが発生していた。

## 決定

MySQL/Prisma を廃止し、Firestore を単一のソース・オブ・トゥルースとする。API は Firestore を直接読み書きする。デモモードは従来どおりインメモリのみ。

## 検討した選択肢

### 選択肢 A: MySQL (Prisma) + Firestore 同期（修正前）

データフロー

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

補足
- MySQL (Prisma) がソース・オブ・トゥルース
- Firestore 更新は非同期で、同一トランザクションではない
- Firestore 更新はリトライあり（最大3回リトライ、合計4回試行）で、失敗時はログのみ
- 同期対象は tripGroups / candidates / questions（テーブル単位では取りこぼしなし）
- カラム単位では同期されない／更新されないものがあった
  - `created_at` は Firestore に書き込まれない
  - `image_url` と `source_url` は作成時のみセットで更新パスなし
- Firestore 側にのみ存在するフィールドがある（例: `updated_at`, `ai_streaming`）

### 選択肢 B: Firestore 単独（採用）

データフロー

```
[候補追加]
  AddCandidateModal → POST /api/trip-groups/[id]/candidates
    → Firestore INSERT (tripGroups/{id}/candidates)
  → POST /api/ai/summarize
    → Gemini 2.0 Flash → JSON構造化出力
    → Firestore UPDATE
    → onSnapshot → UI即時更新

[質問]
  QuestionModal → POST /api/trip-groups/[id]/questions
    → Firestore INSERT (tripGroups/{id}/questions)
  → POST /api/ai/question
    → Gemini 2.0 Flash → streamText → toTextStreamResponse()
    → onFinish: Firestore UPDATE
```

## 影響（メリット/デメリット）

### Firestore 単独のメリット
- 構成がシンプルで運用コストが低い
- リアルタイム UI がソース・オブ・トゥルースと直結
- 二重書き込みによる整合性ズレがなくなる

### MySQL + 同期と比べたデメリット
- SQL 的な複雑検索や分析に弱い
- スキーマ強制が弱く、アプリ側で担保が必要
- 参照整合性や制約は手動管理になる

## 決定理由

現状のプロダクトはリアルタイム UI を中心に据えたシンプルなデータモデルであり、二重書き込み構成のメリットが小さい。Firestore 単独化により構成が簡潔になり、UI とソース・オブ・トゥルースの整合も取れるため採用した。
