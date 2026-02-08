package plan

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"mime"
	"net/http"
	"os"
	"strings"

	"github.com/go-playground/validator/v10"
)

// ContentGenerator は AI コンテンツ生成の抽象化インターフェース
type ContentGenerator interface {
	GenerateContent(ctx context.Context, prompt string) (string, error)
}

// Server はサーバーの依存関係を保持する構造体
type Server struct {
	generator ContentGenerator
	validate  *validator.Validate
}

// NewServer は新しい Server インスタンスを作成する
func NewServer(ctx context.Context) (*Server, error) {
	modelName := os.Getenv("GEMINI_MODEL")
	if modelName == "" {
		modelName = "gemini-2.5-flash-lite"
	}

	geminiClient, err := NewGeminiClient(ctx, modelName)
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	return &Server{
		generator: geminiClient,
		validate:  validator.New(),
	}, nil
}

// stripCodeFence はマークダウンのコードフェンスを除去する
func stripCodeFence(s string) string {
	s = strings.TrimSpace(s)
	if !strings.HasPrefix(s, "```") {
		return s
	}
	// 最初の行（```json, ```JSON 等）を除去
	if idx := strings.IndexByte(s, '\n'); idx != -1 {
		s = s[idx+1:]
	}
	s = strings.TrimSpace(s)
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}

// parseTravelPlan は JSON 文字列を TravelPlan に変換する
func parseTravelPlan(raw string) (*TravelPlan, error) {
	raw = stripCodeFence(raw)

	var plan TravelPlan
	if err := json.Unmarshal([]byte(raw), &plan); err != nil {
		return nil, fmt.Errorf("failed to parse travel plan: %w", err)
	}
	return &plan, nil
}

func isJSONContentType(ct string) bool {
	mediaType, _, _ := mime.ParseMediaType(ct)
	return mediaType == "application/json"
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(map[string]string{"error": msg}); err != nil {
		slog.Error("Failed to write error response", "error", err)
	}
}

// HandlePlan は旅行プラン生成の HTTP ハンドラ
func (s *Server) HandlePlan(w http.ResponseWriter, r *http.Request) {
	// Content-Type 検証
	if ct := r.Header.Get("Content-Type"); ct != "" && !isJSONContentType(ct) {
		jsonError(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
		return
	}

	var req PlanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// バリデーション
	if err := s.validate.Struct(req); err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	prompt := BuildPlanPrompt(req.Origin, req.Destination, req.Questions)

	text, err := s.generator.GenerateContent(ctx, prompt)
	if err != nil {
		slog.Error("Gemini generation error", "error", err)
		jsonError(w, "AI generation failed", http.StatusInternalServerError)
		return
	}

	plan, err := parseTravelPlan(text)
	if err != nil {
		slog.Error("JSON unmarshal error", "error", err, "raw", text)
		jsonError(w, "Failed to parse response", http.StatusInternalServerError)
		return
	}

	plan.Image = GetImageURL(ctx, req.Destination)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(plan); err != nil {
		slog.Error("Response encode error", "error", err)
	}
}
