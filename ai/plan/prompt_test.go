package plan

import (
	"strings"
	"testing"
)

func TestBuildPlanPrompt(t *testing.T) {
	tests := []struct {
		name        string
		origin      string
		destination string
		questions   []string
		wantContain []string
	}{
		{
			name:        "正常: 出発地・目的地・質問がプロンプトに含まれる",
			origin:      "札幌",
			destination: "函館",
			questions:   []string{"子供も楽しめる？", "駐車場はある？"},
			wantContain: []string{"札幌", "函館", "- 子供も楽しめる？", "- 駐車場はある？"},
		},
		{
			name:        "正常: 質問が空でもエラーにならない",
			origin:      "東京",
			destination: "大阪",
			questions:   []string{},
			wantContain: []string{"東京", "大阪"},
		},
		{
			name:        "正常: 質問が nil でもエラーにならない",
			origin:      "東京",
			destination: "大阪",
			questions:   nil,
			wantContain: []string{"東京", "大阪"},
		},
		{
			name:        "正常: JSON スキーマの指示が含まれる（質問あり）",
			origin:      "札幌",
			destination: "函館",
			questions:   []string{"おすすめは？"},
			wantContain: []string{"budget_jpy", "travel_time", "survey"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := BuildPlanPrompt(tt.origin, tt.destination, tt.questions)

			for _, want := range tt.wantContain {
				if !strings.Contains(got, want) {
					t.Errorf("expected prompt to contain %q, but it didn't.\nprompt: %s", want, got)
				}
			}
		})
	}
}
