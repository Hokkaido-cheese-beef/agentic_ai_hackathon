package plan

// PlanRequest はクライアントからの旅行プランリクエスト
type PlanRequest struct {
	Origin      string   `json:"origin"      validate:"required,max=100"`
	Destination string   `json:"destination"  validate:"required,max=100"`
	Questions   []string `json:"questions"    validate:"omitempty,max=10,dive,max=200"`
}

// TravelTag は旅行プランの概要タグ
type TravelTag struct {
	BudgetJPY  int    `json:"budget_jpy"`
	TravelTime string `json:"travel_time"`
}

// SurveyItem は調査質問と回答のペア
type SurveyItem struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

// TravelPlan はAIが生成する旅行プランのレスポンス
type TravelPlan struct {
	Tag         TravelTag    `json:"tag"`
	Description string       `json:"description"`
	Survey      []SurveyItem `json:"survey"`
	Image       string       `json:"image"`
}

