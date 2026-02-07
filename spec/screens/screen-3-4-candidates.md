# 画面3-4: 候補地一覧ページ

## 概要

- **画面名**: CandidatesPage
- **パス**: `/trips/[tripGroupId]/candidates`
- **目的**: 旅行候補地の一覧表示、AI要約の閲覧、質問・候補追加のハブ
- **役割**: アプリのメイン画面。Firestoreリアルタイム同期によりグループメンバー全員が同じ情報を共有

## コンポーネント構成

```
CandidatesPage (src/app/trips/[tripGroupId]/candidates/page.tsx)
├── AppHeader
│   ├── BackButton (← 戻るボタン)
│   └── Title (グループ名)
├── PillTabNav
│   ├── PillTab ("すべて" | "温泉" | "ビーチ" | ...)
│   └── (タグベースのフィルタリング)
├── CandidateList
│   └── SpotCard[] (候補地カード一覧)
│       ├── SpotImage (画像)
│       ├── SpotInfo
│       │   ├── SpotName (名前)
│       │   ├── Rating (星評価)
│       │   ├── ReviewCount (レビュー数)
│       │   ├── TagList (タグ一覧)
│       │   └── Description (概要)
│       ├── AiSummaryCard (AI要約、展開/折りたたみ)
│       │   ├── SummaryHeader ("AIまとめ" + ChevronDown)
│       │   └── SummaryContent (箇条書き要約)
│       └── QuestionButton ("AIに質問する")
├── FAB (フローティングアクションボタン)
│   └── Plus アイコン → AddCandidateModal を開く
├── QuestionModal (画面5 - 別ファイル)
└── AddCandidateModal (画面6 - 別ファイル)
```

## コンポーネント詳細

### CandidatesPage
- **ファイル**: `src/app/trips/[tripGroupId]/candidates/page.tsx`
- **種別**: Client Component ("use client") — Firestoreリアルタイムリスナーが必要
- **レイアウト**: 縦スクロール、パディングあり

### PillTabNav
- **ファイル**: `src/components/candidates/PillTabNav.tsx`
- **Props**:
  ```typescript
  interface PillTabNavProps {
    tabs: string[];           // タブラベル一覧
    activeTab: string;        // 現在選択中のタブ
    onTabChange: (tab: string) => void;
  }
  ```
- **動作**:
  - "すべて" タブ: 全候補地を表示
  - 各タグタブ: 該当タグを持つ候補地のみ表示
  - タブ一覧は候補地のタグから動的に生成
- **スタイル**: 横スクロール可能な水平配置、選択中はプライマリカラー背景

### PillTab
- **ファイル**: `src/components/ui/PillTab.tsx`
- **Props**:
  ```typescript
  interface PillTabProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }
  ```
- **スタイル**:
  - アクティブ: `bg-primary text-white rounded-full px-4 py-1`
  - 非アクティブ: `bg-gray-100 text-gray-600 rounded-full px-4 py-1`

### SpotCard
- **ファイル**: `src/components/candidates/SpotCard.tsx`
- **Props**:
  ```typescript
  interface SpotCardProps {
    candidate: {
      id: string;
      name: string;
      description: string | null;
      image_url: string | null;
      rating: number | null;
      review_count: number | null;
      tags: string[];
      info: string | null;
      ai_summary: AiSummary | null;
    };
    onQuestionClick: (candidateId: string) => void;
  }

  interface AiSummary {
    highlights: string[];      // おすすめポイント
    considerations: string[];  // 注意点
    best_season: string;       // ベストシーズン
    budget_range: string;      // 予算目安
  }
  ```
- **レイアウト**:
  - 上部: 画像（アスペクト比 16:9、画像なしの場合はプレースホルダー）
  - 中部: 名前、評価、タグ、説明
  - 下部: AI要約カード（展開/折りたたみ）、質問ボタン

### AiSummaryCard
- **ファイル**: `src/components/candidates/AiSummaryCard.tsx`
- **Props**:
  ```typescript
  interface AiSummaryCardProps {
    summary: AiSummary | null;
    isLoading: boolean;
  }
  ```
- **動作**:
  - 初期状態: 折りたたみ（ヘッダーのみ表示）
  - クリックで展開/折りたたみ切り替え
  - summary が null の場合: "AI要約はまだありません" 表示
  - isLoading が true の場合: スケルトンアニメーション表示
- **表示内容（展開時）**:
  - おすすめポイント（箇条書き、Sparkles アイコン）
  - 注意点（箇条書き、AlertTriangle アイコン）
  - ベストシーズン（Calendar アイコン）
  - 予算目安（Wallet アイコン）

### FAB (フローティングアクションボタン)
- **ファイル**: `src/components/ui/FAB.tsx`
- **Props**:
  ```typescript
  interface FABProps {
    onClick: () => void;
    icon?: React.ReactNode;
    label?: string;
  }
  ```
- **スタイル**: 右下固定、円形、プライマリカラー、影付き
- **アイコン**: Plus (lucide-react)
- **動作**: クリックで AddCandidateModal を開く

### Tag
- **ファイル**: `src/components/ui/Tag.tsx`
- **Props**:
  ```typescript
  interface TagProps {
    label: string;
    variant?: "default" | "primary";
  }
  ```
- **スタイル**: 小さめ丸角バッジ、背景色グレーまたはプライマリ

## State定義

```typescript
interface CandidatesPageState {
  // データ
  tripGroup: TripGroup | null;
  candidates: TripCandidate[];
  questions: Question[];

  // UI状態
  activeTab: string;                    // "すべて" or タグ名
  isQuestionModalOpen: boolean;
  isAddCandidateModalOpen: boolean;
  selectedCandidateId: string | null;   // 質問対象の候補地ID
  expandedSummaries: Set<string>;       // 展開中のAI要約カードID

  // Firestoreリスナー状態
  isLoading: boolean;                   // 初回データ読み込み中
  error: string | null;
}
```

## リアルタイム同期 (Firestore)

### リスナー設定

```typescript
// useFirestoreTrip.ts カスタムフック
useEffect(() => {
  // 1. tripGroup ドキュメント監視
  const unsubGroup = onSnapshot(
    doc(db, "tripGroups", tripGroupId),
    (snapshot) => {
      setTripGroup(snapshot.data() as TripGroup);
    }
  );

  // 2. candidates サブコレクション監視
  const unsubCandidates = onSnapshot(
    collection(db, "tripGroups", tripGroupId, "candidates"),
    (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCandidates(items);
    }
  );

  // 3. questions サブコレクション監視
  const unsubQuestions = onSnapshot(
    collection(db, "tripGroups", tripGroupId, "questions"),
    (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuestions(items);
    }
  );

  return () => {
    unsubGroup();
    unsubCandidates();
    unsubQuestions();
  };
}, [tripGroupId]);
```

### リアルタイム更新シナリオ

| シナリオ | トリガー | Firestore変更 | UI反映 |
|---------|---------|--------------|--------|
| メンバーが候補追加 | POST /api/candidates | candidates サブコレクション追加 | SpotCard が自動追加 |
| AI要約完了 | POST /api/ai/summarize 完了 | candidate.ai_summary 更新 | AiSummaryCard が自動更新 |
| 質問追加 | POST /api/questions | questions サブコレクション追加 | QuestionModal内に表示 |
| AI回答ストリーミング | POST /api/ai/question | question.ai_answer 段階的更新 | 回答テキストが逐次表示 |

## ユーザーインタラクションフロー

### タブフィルタリング

```
1. PillTab クリック
   → activeTab 更新
   → candidates をタグでフィルタリング
   → "すべて" の場合は全候補表示
```

### AI要約展開/折りたたみ

```
1. AiSummaryCard ヘッダークリック
   → expandedSummaries に candidateId を追加/削除
   → カード展開/折りたたみアニメーション
```

### 質問モーダル開く

```
1. SpotCard の "AIに質問する" ボタンクリック
   → selectedCandidateId = candidate.id
   → isQuestionModalOpen = true
   → QuestionModal 表示
```

### 候補追加モーダル開く

```
1. FAB クリック
   → isAddCandidateModalOpen = true
   → AddCandidateModal 表示
```

## API定義

### GET /api/trip-groups/[tripGroupId]

**レスポンス (200)**:
```json
{
  "trip_group_id": "uuid-xxx",
  "name": "夏の沖縄旅行",
  "departure": "東京",
  "status": "active",
  "candidates": [
    {
      "id": "uuid-yyy",
      "name": "美ら海水族館",
      "description": "沖縄を代表する水族館...",
      "image_url": "https://...",
      "rating": 4.5,
      "review_count": 1234,
      "tags": ["観光", "家族向け"],
      "info": "...",
      "ai_summary": {
        "highlights": ["ジンベエザメが圧巻", "..."],
        "considerations": ["混雑時は待ち時間あり"],
        "best_season": "通年",
        "budget_range": "大人1,880円"
      }
    }
  ]
}
```

**備考**: 初回データフェッチ用。以降はFirestoreリアルタイム同期で更新を受信

## テストケース

### ユニットテスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | 候補地一覧が正しく表示される | 各SpotCardが表示される |
| 2 | "すべて" タブで全候補表示 | 全候補が表示される |
| 3 | タグタブで候補フィルタリング | 該当タグの候補のみ表示 |
| 4 | AI要約カードの展開/折りたたみ | クリックでトグルする |
| 5 | AI要約がない場合のフォールバック表示 | "AI要約はまだありません" 表示 |
| 6 | FABクリックでAddCandidateModal表示 | モーダルが開く |
| 7 | "AIに質問する" クリックでQuestionModal表示 | 対象候補IDと共にモーダルが開く |
| 8 | 候補地が0件の場合の空状態表示 | "候補地はまだありません" + 追加案内表示 |
| 9 | Firestoreからの更新で候補リスト更新 | 新しい候補が自動追加される |
| 10 | AI要約ストリーミング中のローディング表示 | スケルトンアニメーション表示 |

### 統合テスト

| # | テスト内容 | 期待結果 |
|---|-----------|---------|
| 1 | Firestoreリアルタイム同期 | 別ブラウザでの候補追加がリアルタイム反映 |
| 2 | 候補追加→一覧更新フロー | AddCandidateModalで追加した候補がリストに表示 |
| 3 | 質問→AI回答ストリーミングフロー | 質問送信後、AI回答が逐次表示される |
| 4 | タブフィルタリング + リアルタイム更新 | フィルタ中に新候補追加されても正しくフィルタリング |
