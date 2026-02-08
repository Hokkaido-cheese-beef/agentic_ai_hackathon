package plan

import (
	"fmt"
	"strings"
)

// BuildPlanPrompt は旅行プラン生成用のプロンプトを組み立てる
func BuildPlanPrompt(origin, destination string, questions []string) string {
	var questionsBuilder strings.Builder
	for _, q := range questions {
		questionsBuilder.WriteString(fmt.Sprintf("- %s\n", q))
	}

	return fmt.Sprintf(`あなたは熟練の旅行サポーターです。
出発地「%s」から目的地「%s」への旅行プランを提案してください。

【重要：調査リクエスト】
以下の質問リストの**すべて**に対して、1つずつ調査を行い回答してください。
回答漏れがないようにしてください。

質問リスト：
%s
回答は必ず以下のJSON形式を守ってください。
注意：現在あるjsonキー以外は追加しないでください。

{
    "tag": {
        "budget_jpy": 1000,
        "travel_time": "車1時間"
    },
    "description": "魅力的な紹介文（100文字程度）",
    "survey": [
        // 質問リストにある数だけ、以下のオブジェクトを作成してください
        {
            "question": "ここに入力された質問が入ります",
            "answer": "ここへの回答（80文字以内、URL禁止）"
        },
        {
            "question": "次の質問...",
            "answer": "次の回答..."
        }
    ]
}

JSONキーは、tag、budget_jpy、travel_time、description、survey、question、answerのみを使用してください。`,
		origin, destination, questionsBuilder.String())
}
