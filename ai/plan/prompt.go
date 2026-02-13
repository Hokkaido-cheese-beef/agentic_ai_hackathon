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

	hasQuestions := questionsBuilder.String() != ""

	var surveySection string
	if hasQuestions {
		surveySection = fmt.Sprintf(`
【重要：調査リクエスト】
以下の質問リストの**すべて**に対して、1つずつ調査を行い回答してください。
回答漏れがないようにしてください。

質問リスト：
%s`, questionsBuilder.String())
	}

	var surveyExample string
	if hasQuestions {
		surveyExample = `,
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
    ]`
	}

	var jsonKeyNote string
	if hasQuestions {
		jsonKeyNote = "JSONキーは、tag、budget_jpy、travel_time、info、description、survey、question、answerのみを使用してください。"
	} else {
		jsonKeyNote = "JSONキーは、tag、budget_jpy、travel_time、info、descriptionのみを使用してください。survey、question、answerキーは含めないでください。"
	}

	return fmt.Sprintf(`あなたは熟練の旅行サポーターです。
出発地「%s」から目的地「%s」への旅行プランを提案してください。
%s
回答は必ず以下のJSON形式を守ってください。
注意：現在あるjsonキー以外は追加しないでください。

{
    "tag": {
        "budget_jpy": 1000,
        "travel_time": "車1時間"
    },
	"info": "目的地の詳細な説明を2-3文200文字程度（目的地名は含めない）"
    "description": "魅力的な紹介文（100文字程度）"%s
}

%s`,
		origin, destination, surveySection, surveyExample, jsonKeyNote)
}
