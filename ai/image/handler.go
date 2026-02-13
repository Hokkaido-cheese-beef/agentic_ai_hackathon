package image

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

const (
	apiTimeout       = 10 * time.Second
	photoMaxWidthPx  = 800
	photoMaxHeightPx = 600
)

type authMode string

const (
	authAPIKey authMode = "api_key"
	authOAuth  authMode = "oauth"
)

// Handler は画像検索 API のハンドラ
type Handler struct {
	apiKey    string
	auth      authMode
	tokenSrc  oauth2.TokenSource
	projectID string
	client    *http.Client
}

// NewHandler は新しい Handler を作成する。
// GOOGLE_MAPS_API_KEY があれば API Key 認証、なければ ADC (OAuth) にフォールバックする。
func NewHandler() (*Handler, error) {
	apiKey := strings.TrimSpace(os.Getenv("GOOGLE_MAPS_API_KEY"))
	projectID := strings.TrimSpace(os.Getenv("GOOGLE_MAPS_PROJECT_ID"))
	if projectID == "" {
		projectID = strings.TrimSpace(os.Getenv("GOOGLE_CLOUD_PROJECT"))
	}

	h := &Handler{
		client: &http.Client{Timeout: apiTimeout},
	}

	if apiKey != "" {
		h.apiKey = apiKey
		h.auth = authAPIKey
		slog.Info("Image handler: using API key auth")
		return h, nil
	}

	// API Key が無い → ADC で OAuth トークンを使う
	creds, err := google.FindDefaultCredentials(context.Background(),
		"https://www.googleapis.com/auth/cloud-platform",
	)
	if err != nil {
		return nil, fmt.Errorf("GOOGLE_MAPS_API_KEY も ADC も利用できません: %w", err)
	}
	h.tokenSrc = creds.TokenSource
	h.auth = authOAuth

	if projectID == "" {
		projectID = creds.ProjectID
	}
	if projectID == "" {
		return nil, fmt.Errorf("OAuth 使用時は GOOGLE_MAPS_PROJECT_ID または GOOGLE_CLOUD_PROJECT を設定してください")
	}
	h.projectID = projectID

	slog.Info("Image handler: using OAuth (ADC) auth", "projectID", projectID)
	return h, nil
}

// applyAuth はリクエストに認証情報を付与する。
// keyInQuery が true の場合、API Key をクエリパラメータに追加する。
func (h *Handler) applyAuth(req *http.Request, q url.Values, keyInQuery bool) error {
	switch h.auth {
	case authAPIKey:
		if keyInQuery {
			q.Set("key", h.apiKey)
		} else {
			req.Header.Set("X-Goog-Api-Key", h.apiKey)
		}
		return nil
	case authOAuth:
		token, err := h.tokenSrc.Token()
		if err != nil {
			return fmt.Errorf("OAuth トークン取得失敗: %w", err)
		}
		req.Header.Set("Authorization", "Bearer "+token.AccessToken)
		req.Header.Set("X-Goog-User-Project", h.projectID)
		return nil
	default:
		return fmt.Errorf("unknown auth mode")
	}
}

// imageRequest はリクエストボディ
type imageRequest struct {
	Query string `json:"query"`
}

// imageResponse はレスポンスボディ
type imageResponse struct {
	URL string `json:"url"`
}

type textSearchRequest struct {
	TextQuery string `json:"textQuery"`
}

type textSearchResponse struct {
	Places []struct {
		ID string `json:"id"`
	} `json:"places"`
}

type placeDetailsResponse struct {
	Photos []struct {
		Name     string `json:"name"`
		WidthPx  int    `json:"widthPx"`
		HeightPx int    `json:"heightPx"`
	} `json:"photos"`
}

type photoMediaResponse struct {
	PhotoURI string `json:"photoUri"`
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// HandleImage は画像検索の HTTP ハンドラ
func (h *Handler) HandleImage(w http.ResponseWriter, r *http.Request) {
	var req imageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	query := strings.TrimSpace(req.Query)
	if query == "" {
		jsonError(w, "query is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// 1. Text Search でプレイスIDを取得
	placeID, err := h.textSearch(ctx, query)
	if err != nil {
		slog.Error("Text search failed", "error", err, "query", query)
		jsonError(w, "Place not found", http.StatusNotFound)
		return
	}

	// 2. Place Details で写真名を取得
	photoName, err := h.placeDetails(ctx, placeID)
	if err != nil {
		slog.Error("Place details failed", "error", err, "placeID", placeID)
		jsonError(w, "Photo not found", http.StatusNotFound)
		return
	}

	// 3. Photo Media API をサーバー側で叩いて実際の画像URLを取得
	photoURL, err := h.fetchPhotoURI(ctx, photoName)
	if err != nil {
		slog.Error("Fetch photo URI failed", "error", err, "photoName", photoName)
		jsonError(w, "Failed to fetch photo URL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(imageResponse{URL: photoURL})
}

func (h *Handler) textSearch(ctx context.Context, query string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, apiTimeout)
	defer cancel()

	payload, err := json.Marshal(textSearchRequest{TextQuery: query})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://places.googleapis.com/v1/places:searchText",
		strings.NewReader(string(payload)))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-FieldMask", "places.id")
	if err := h.applyAuth(req, nil, false); err != nil {
		return "", err
	}

	resp, err := h.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("text search API error: http=%d body=%s", resp.StatusCode, truncate(string(body), 200))
	}

	var result textSearchResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if len(result.Places) == 0 {
		return "", fmt.Errorf("no places found for query: %s", query)
	}

	slog.Info("Text search completed", "query", query, "placeID", result.Places[0].ID)
	return result.Places[0].ID, nil
}

func (h *Handler) placeDetails(ctx context.Context, placeID string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, apiTimeout)
	defer cancel()

	apiURL := "https://places.googleapis.com/v1/places/" + placeID

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("X-Goog-FieldMask", "photos")
	if err := h.applyAuth(req, nil, false); err != nil {
		return "", err
	}

	resp, err := h.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("place details API error: http=%d body=%s", resp.StatusCode, truncate(string(body), 200))
	}

	var result placeDetailsResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if len(result.Photos) == 0 {
		return "", fmt.Errorf("no photos found for place: %s", placeID)
	}

	slog.Info("Place details completed", "placeID", placeID, "photos", len(result.Photos))
	return result.Photos[0].Name, nil
}

// fetchPhotoURI はサーバー側で Photo Media API を叩き、実際の画像URLを取得する。
func (h *Handler) fetchPhotoURI(ctx context.Context, photoName string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, apiTimeout)
	defer cancel()

	u := url.URL{
		Scheme: "https",
		Host:   "places.googleapis.com",
		Path:   "/v1/" + photoName + "/media",
	}
	q := u.Query()
	q.Set("maxWidthPx", strconv.Itoa(photoMaxWidthPx))
	q.Set("maxHeightPx", strconv.Itoa(photoMaxHeightPx))
	q.Set("skipHttpRedirect", "true")

	// API Key 認証の場合はクエリパラメータに key を付与
	if h.auth == authAPIKey {
		q.Set("key", h.apiKey)
	}
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return "", err
	}
	// OAuth 認証の場合はヘッダで認証
	if h.auth == authOAuth {
		if err := h.applyAuth(req, nil, false); err != nil {
			return "", err
		}
	}

	resp, err := h.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("photo media API error: http=%d body=%s", resp.StatusCode, truncate(string(body), 200))
	}

	var result photoMediaResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}

	if result.PhotoURI == "" {
		return "", fmt.Errorf("photo media API returned empty photoUri")
	}

	slog.Info("Photo URI fetched", "photoName", photoName, "photoUri", truncate(result.PhotoURI, 100))
	return result.PhotoURI, nil
}

func truncate(s string, limit int) string {
	if len(s) <= limit {
		return s
	}
	return s[:limit] + "..."
}
