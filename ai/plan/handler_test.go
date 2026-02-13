package plan

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-playground/validator/v10"
)

// --- モック ---

type mockGenerator struct {
	response string
	err      error
}

func (m *mockGenerator) GenerateContent(_ context.Context, _ string) (string, error) {
	return m.response, m.err
}

func newTestServer(g ContentGenerator) *Server {
	return &Server{
		generator: g,
		validate:  validator.New(),
	}
}

// --- モックデータ ---

// budget_jpy が文字列 "3000円" のため TravelTag.BudgetJPY(int) との型不一致が発生する
const mockResponseJSON = `{
  "tag": {
    "budget_jpy": "3000円",
    "travel_time": "車で約1時間"
  },
  "description": "函館の星形要塞、五稜郭公園と五稜郭タワーを巡る旅。歴史と絶景を家族みんなで楽しめます。",
  "survey": [
    {
      "question": "子供も楽しめる？",
      "answer": "はい、楽しめます。五稜郭タワーに登ったり、公園で貸ボートに乗ったりできます。"
    }
  ]
}`

// budget_jpy を int に修正した正常系モック
const validMockResponseJSON = `{
  "tag": {
    "budget_jpy": 3000,
    "travel_time": "車で約1時間"
  },
  "info": "五稜郭は函館市にある星形の西洋式城郭で、国の特別史跡に指定されています。春は桜の名所として約1600本のソメイヨシノが咲き誇り、冬はイルミネーションが楽しめます。",
  "description": "函館の星形要塞、五稜郭公園と五稜郭タワーを巡る旅。歴史と絶景を家族みんなで楽しめます。",
  "survey": [
    {
      "question": "子供も楽しめる？",
      "answer": "はい、楽しめます。五稜郭タワーに登ったり、公園で貸ボートに乗ったりできます。"
    },
    {
      "question": "近くに駐車場はある？",
      "answer": "専用駐車場はありませんが、周辺に多数の有料駐車場や予約制駐車場があります。"
    },
    {
      "question": "ご飯屋さんはありますか？",
      "answer": "五稜郭公園前駅や五稜郭タワー周辺にはラーメン店や海鮮居酒屋など多くのお店があります。"
    }
  ]
}`

const validRequestBody = `{"origin":"札幌","destination":"函館","questions":["子供も楽しめる？","近くに駐車場はある？","ご飯屋さんはありますか？"]}`

// =============================================================
// stripCodeFence 単体テスト
// =============================================================

func TestStripCodeFence(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "コードフェンスなし",
			in:   `{"key": "value"}`,
			want: `{"key": "value"}`,
		},
		{
			name: "```json で囲まれている",
			in:   "```json\n{\"key\": \"value\"}\n```",
			want: `{"key": "value"}`,
		},
		{
			name: "```JSON (大文字) で囲まれている",
			in:   "```JSON\n{\"key\": \"value\"}\n```",
			want: `{"key": "value"}`,
		},
		{
			name: "``` のみで囲まれている",
			in:   "```\n{\"key\": \"value\"}\n```",
			want: `{"key": "value"}`,
		},
		{
			name: "前後に空白がある",
			in:   "  \n```json\n{\"key\": \"value\"}\n```\n  ",
			want: `{"key": "value"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := stripCodeFence(tt.in)
			if got != tt.want {
				t.Errorf("stripCodeFence() = %q, want %q", got, tt.want)
			}
		})
	}
}

// =============================================================
// parseTravelPlan 単体テスト
// =============================================================

func TestParseTravelPlan(t *testing.T) {
	tests := []struct {
		name       string
		raw        string
		wantErr    bool
		wantBudget int
		wantSurvey int
	}{
		{
			name:       "正常: 有効な JSON をパースできる",
			raw:        validMockResponseJSON,
			wantBudget: 3000,
			wantSurvey: 3,
		},
		{
			name:    "異常: budget_jpy が文字列で型不一致",
			raw:     mockResponseJSON,
			wantErr: true,
		},
		{
			name:    "異常: 不正な JSON",
			raw:     `{invalid`,
			wantErr: true,
		},
		{
			name:       "正常: survey が空配列",
			raw:        `{"tag":{"budget_jpy":0,"travel_time":""},"description":"","survey":[]}`,
			wantBudget: 0,
			wantSurvey: 0,
		},
		{
			name:       "正常: コードフェンスで囲まれた JSON をパースできる",
			raw:        "```json\n" + validMockResponseJSON + "\n```",
			wantBudget: 3000,
			wantSurvey: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			plan, err := parseTravelPlan(tt.raw)

			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if plan.Tag.BudgetJPY != tt.wantBudget {
				t.Errorf("expected budget %d, got %d", tt.wantBudget, plan.Tag.BudgetJPY)
			}
			if len(plan.Survey) != tt.wantSurvey {
				t.Errorf("expected %d survey items, got %d", tt.wantSurvey, len(plan.Survey))
			}
		})
	}
}

// =============================================================
// HandlePlan ハンドラテスト (Table Driven)
// =============================================================

func TestHandlePlan(t *testing.T) {
	// 11個の質問を持つリクエストボディ (バリデーション用)
	tooManyQuestions := make([]string, 11)
	for i := range tooManyQuestions {
		tooManyQuestions[i] = "質問"
	}
	tooManyQuestionsBody, _ := json.Marshal(PlanRequest{
		Origin: "札幌", Destination: "函館", Questions: tooManyQuestions,
	})

	// 長すぎる質問 (201文字)
	longQuestion := strings.Repeat("あ", 201)
	longQuestionBody, _ := json.Marshal(PlanRequest{
		Origin: "札幌", Destination: "函館", Questions: []string{longQuestion},
	})

	// 長すぎる origin (101文字)
	longOrigin, _ := json.Marshal(PlanRequest{
		Origin: strings.Repeat("あ", 101), Destination: "函館",
	})

	tests := []struct {
		name        string
		contentType string
		body        string
		generator   ContentGenerator
		wantStatus  int
	}{
		{
			name:        "正常: 旅行プランが返される",
			contentType: "application/json",
			body:        validRequestBody,
			generator:   &mockGenerator{response: validMockResponseJSON},
			wantStatus:  http.StatusOK,
		},
		{
			name:        "正常: questions 省略でも 200",
			contentType: "application/json",
			body:        `{"origin":"札幌","destination":"函館"}`,
			generator:   &mockGenerator{response: validMockResponseJSON},
			wantStatus:  http.StatusOK,
		},
		{
			name:        "異常: Content-Type が text/plain で 415",
			contentType: "text/plain",
			body:        validRequestBody,
			generator:   &mockGenerator{},
			wantStatus:  http.StatusUnsupportedMediaType,
		},
		{
			name:        "正常: Content-Type に charset 付きでも 200",
			contentType: "application/json; charset=utf-8",
			body:        validRequestBody,
			generator:   &mockGenerator{response: validMockResponseJSON},
			wantStatus:  http.StatusOK,
		},
		{
			name:        "異常: 不正な JSON は 400",
			contentType: "application/json",
			body:        "{invalid",
			generator:   &mockGenerator{},
			wantStatus:  http.StatusBadRequest,
		},
		{
			name:        "異常: origin が空で 400",
			contentType: "application/json",
			body:        `{"origin":"","destination":"函館"}`,
			generator:   &mockGenerator{},
			wantStatus:  http.StatusBadRequest,
		},
		{
			name:        "異常: destination が空で 400",
			contentType: "application/json",
			body:        `{"origin":"札幌","destination":""}`,
			generator:   &mockGenerator{},
			wantStatus:  http.StatusBadRequest,
		},
		{
			name:        "異常: origin が 101 文字で 400",
			contentType: "application/json",
			body:        string(longOrigin),
			generator:   &mockGenerator{},
			wantStatus:  http.StatusBadRequest,
		},
		{
			name:        "異常: questions が 11 個で 400",
			contentType: "application/json",
			body:        string(tooManyQuestionsBody),
			generator:   &mockGenerator{},
			wantStatus:  http.StatusBadRequest,
		},
		{
			name:        "異常: question が 201 文字で 400",
			contentType: "application/json",
			body:        string(longQuestionBody),
			generator:   &mockGenerator{},
			wantStatus:  http.StatusBadRequest,
		},
		{
			name:        "異常: AI API エラーで 500",
			contentType: "application/json",
			body:        validRequestBody,
			generator:   &mockGenerator{err: errors.New("API error")},
			wantStatus:  http.StatusInternalServerError,
		},
		{
			name:        "異常: 空レスポンスで 500",
			contentType: "application/json",
			body:        validRequestBody,
			generator:   &mockGenerator{response: ""},
			wantStatus:  http.StatusInternalServerError,
		},
		{
			name:        "異常: budget_jpy 型不一致で 500",
			contentType: "application/json",
			body:        validRequestBody,
			generator:   &mockGenerator{response: mockResponseJSON},
			wantStatus:  http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := newTestServer(tt.generator)
			req := httptest.NewRequest(http.MethodPost, "/plan", strings.NewReader(tt.body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}
			rec := httptest.NewRecorder()

			s.HandlePlan(rec, req)

			if rec.Code != tt.wantStatus {
				t.Errorf("expected status %d, got %d: %s", tt.wantStatus, rec.Code, rec.Body.String())
			}
			if rec.Code >= 400 {
				if got := rec.Header().Get("Content-Type"); got != "application/json" {
					t.Errorf("expected error Content-Type application/json, got %q", got)
				}
			}
		})
	}
}

// HandlePlan の正常系レスポンスボディを詳細検証するテスト
func TestHandlePlan_SuccessResponseBody(t *testing.T) {
	s := newTestServer(&mockGenerator{response: validMockResponseJSON})
	req := httptest.NewRequest(http.MethodPost, "/plan", strings.NewReader(validRequestBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	s.HandlePlan(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rec.Code, rec.Body.String())
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", got)
	}

	var plan TravelPlan
	if err := json.NewDecoder(rec.Body).Decode(&plan); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if plan.Tag.BudgetJPY != 3000 {
		t.Errorf("expected budget_jpy 3000, got %d", plan.Tag.BudgetJPY)
	}
	if plan.Tag.TravelTime != "車で約1時間" {
		t.Errorf("expected travel_time '車で約1時間', got %q", plan.Tag.TravelTime)
	}
	if plan.Description == "" {
		t.Error("expected non-empty description")
	}
	if len(plan.Survey) != 3 {
		t.Errorf("expected 3 survey items, got %d", len(plan.Survey))
	}
}
