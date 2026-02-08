# プロジェクト構成

```
src/
├── app/
│   ├── page.tsx                          # LP (グループ作成フォーム + CTA)
│   ├── layout.tsx                        # ルートレイアウト (IBM Plex Sans)
│   ├── globals.css                       # Tailwind v4 デザイントークン
│   ├── about/page.tsx                    # Aboutプレースホルダー
│   │
│   ├── api/
│   │   ├── ai/
│   │   │   ├── summarize/route.ts        # POST: AI候補要約 (JSON構造化出力)
│   │   │   └── question/route.ts         # POST: AI質問回答 (ストリーミング)
│   │   └── trip-groups/
│   │       ├── route.ts                  # POST: グループ作成
│   │       └── [tripGroupId]/
│   │           ├── route.ts              # GET: グループ詳細
│   │           ├── candidates/route.ts   # GET/POST: 候補CRUD
│   │           └── questions/route.ts    # POST: 質問作成
│   │
│   └── trip-groups/
│       ├── new/page.tsx                  # 画面2: グループ作成フォーム
│       └── [tripGroupId]/
│           ├── page.tsx                  # 画面2.5: 招待・QRコード画面
│           └── candidates/page.tsx       # 画面3-4: 候補閲覧 + FAB (メインUI)
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx                 # アプリ内ヘッダー (戻るボタン+グループ名)
│   │   ├── Header.tsx                    # LP用ヘッダー
│   │   └── Footer.tsx                    # フッター
│   ├── ui/
│   │   ├── Button.tsx                    # 共通ボタン (variant/size/icon/isLoading)
│   │   ├── Modal.tsx                     # モーダルベース
│   │   ├── FAB.tsx                       # フローティングアクションボタン
│   │   ├── PillTab.tsx                   # タブナビゲーション
│   │   ├── Tag.tsx / Checkbox.tsx        # 小型UI部品
│   │   ├── ErrorMessage.tsx              # エラー表示
│   │   ├── LoadingSpinner.tsx            # ローディング
│   │   └── SectionLabel.tsx              # セクションラベル
│   ├── candidates/
│   │   ├── SpotCard.tsx                  # 候補スポットカード (メイン表示)
│   │   └── AiSummaryCard.tsx             # AI要約カード
│   ├── modals/
│   │   ├── AddCandidateModal.tsx         # 候補追加モーダル
│   │   └── QuestionModal.tsx             # 質問追加モーダル (ストリーミング回答)
│   ├── landing/
│   │   ├── FeatureCard.tsx               # LP機能カード
│   │   └── StepCard.tsx                  # LPステップカード
│   └── copyable-field.tsx                # コピー可能フィールド (招待URL)
│
├── hooks/
│   ├── useApi.ts                         # API呼び出し (loading/error管理)
│   ├── useFormSubmit.ts                  # フォーム送信 (isSubmitting/error)
│   └── useCandidatesRealtime.ts          # リアルタイム候補監視 (デモ/本番両対応)
│
├── lib/
│   ├── api.ts                            # fetch ラッパー (get/post/ApiError)
│   ├── utils.ts                          # safeJsonParse / cn / sleep / formatDate
│   ├── validators.ts                     # Zodスキーマ (入力/AI応答検証)
│   ├── sanitize.ts                       # AIプロンプトサニタイズ (<>{}[] 除去)
│   ├── retry.ts                          # 指数バックオフリトライ (3回/500ms基底)
│   ├── prisma.ts                         # Prismaクライアント (デモモード切替)
│   ├── firebase.ts                       # Firebase Client SDK初期化
│   ├── firebase-admin.ts                 # Firebase Admin SDK初期化
│   ├── firestore-sync.ts                 # Prisma→Firestore同期 (5関数)
│   └── demo/                             # デモモード用モジュール
│       ├── config.ts                     # isDemoMode() 判定
│       ├── store.ts                      # インメモリリアクティブストア
│       ├── mock-data.ts                  # 初期デモデータ (3候補地)
│       ├── mock-prisma.ts                # Prisma互換モック
│       └── mock-ai.ts                    # AI応答モック (要約+ストリーミング)
│
├── types/
│   └── index.ts                          # 共通型 (TripGroup/TripCandidate/Question等)
│
├── middleware.ts                          # レートリミット (10req/min/IP, /api/ai/*)
└── test/
    └── setup.ts                          # Vitestセットアップ
```
