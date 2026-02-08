package main

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"log"
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
	maxCandidates    = 5
	maxPhotos        = 5
	defaultPort      = "8080"
	photoMaxWidthPx  = 800
	photoMaxHeightPx = 600
)

type AuthMode string

const (
	authAPIKey AuthMode = "api_key"
	authOAuth  AuthMode = "oauth"
)

//go:embed templates/index.html
var templateFS embed.FS

type App struct {
	apiKey    string
	authMode  AuthMode
	tokenSrc  oauth2.TokenSource
	projectID string
	authErr   error
	client    *http.Client
	tmpl      *template.Template
}

type ViewData struct {
	Query        string
	Errors       []string
	Geocode      *GeocodeView
	Candidates   []CandidateView
	PlaceDetails *PlaceDetailsView
	Photos       []PhotoView
	AuthMode     string
	ProjectID    string
	MissingAuth  bool
}

type GeocodeView struct {
	FormattedAddress string
	PlaceID          string
	Lat              float64
	Lng              float64
	ResultCount      int
}

type CandidateView struct {
	Name    string
	PlaceID string
	Address string
}

type PlaceDetailsView struct {
	Name    string
	PlaceID string
	Address string
}

type AttributionView struct {
	DisplayName string
	Uri         string
	PhotoUri    string
}

type PhotoView struct {
	Name         string
	Src          string
	WidthPx      int
	HeightPx     int
	Attributions []AttributionView
}

type geocodeResponse struct {
	Results []struct {
		FormattedAddress string `json:"formattedAddress"`
		PlaceID          string `json:"placeId"`
		Location         struct {
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
		} `json:"location"`
	} `json:"results"`
}

type textSearchRequest struct {
	TextQuery string `json:"textQuery"`
}

type textSearchResponse struct {
	Places []struct {
		ID               string `json:"id"`
		FormattedAddress string `json:"formattedAddress"`
		DisplayName      struct {
			Text string `json:"text"`
		} `json:"displayName"`
	} `json:"places"`
}

type placeDetailsResponse struct {
	ID               string `json:"id"`
	FormattedAddress string `json:"formattedAddress"`
	DisplayName      struct {
		Text string `json:"text"`
	} `json:"displayName"`
	Photos []struct {
		Name               string `json:"name"`
		WidthPx            int    `json:"widthPx"`
		HeightPx           int    `json:"heightPx"`
		AuthorAttributions []struct {
			DisplayName string `json:"displayName"`
			Uri         string `json:"uri"`
			PhotoUri    string `json:"photoUri"`
		} `json:"authorAttributions"`
	} `json:"photos"`
}

type googleAPIErrorResponse struct {
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error"`
}

func (m AuthMode) String() string {
	if m == authOAuth {
		return "oauth"
	}
	return "api_key"
}

func main() {
	apiKey := strings.TrimSpace(os.Getenv("GOOGLE_MAPS_API_KEY"))
	authModeEnv := strings.ToLower(strings.TrimSpace(os.Getenv("GOOGLE_MAPS_AUTH_MODE")))
	projectID := strings.TrimSpace(os.Getenv("GOOGLE_MAPS_PROJECT_ID"))
	if projectID == "" {
		projectID = strings.TrimSpace(os.Getenv("GOOGLE_CLOUD_PROJECT"))
	}
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = defaultPort
	}

	tmpl := template.Must(template.ParseFS(templateFS, "templates/index.html"))

	authMode := authAPIKey
	switch authModeEnv {
	case "oauth":
		authMode = authOAuth
	case "api_key":
		authMode = authAPIKey
	default:
		if apiKey == "" {
			authMode = authOAuth
		}
	}

	var tokenSrc oauth2.TokenSource
	var authErr error
	if authMode == authOAuth {
		creds, err := google.FindDefaultCredentials(context.Background(),
			"https://www.googleapis.com/auth/cloud-platform",
		)
		if err != nil {
			authErr = fmt.Errorf("OAuth 認証情報が見つかりません: %w", err)
		} else {
			tokenSrc = creds.TokenSource
			if projectID == "" {
				projectID = creds.ProjectID
			}
			if projectID == "" {
				authErr = errors.New("OAuth 使用時は GOOGLE_MAPS_PROJECT_ID または GOOGLE_CLOUD_PROJECT を設定してください")
			}
		}
	} else if apiKey == "" {
		authErr = errors.New("GOOGLE_MAPS_API_KEY が未設定です。環境変数を設定してください")
	}

	app := &App{
		apiKey:    apiKey,
		authMode:  authMode,
		tokenSrc:  tokenSrc,
		projectID: projectID,
		authErr:   authErr,
		client:    &http.Client{Timeout: apiTimeout},
		tmpl:      tmpl,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", app.handleIndex)
	mux.HandleFunc("/search", app.handleSearch)
	mux.HandleFunc("/photo", app.handlePhoto)

	log.Printf("Listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}

func (a *App) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	if r.URL.Query().Get("q") != "" {
		a.handleSearch(w, r)
		return
	}
	data := &ViewData{
		AuthMode:  a.authMode.String(),
		ProjectID: a.projectID,
	}
	if a.authErr != nil {
		data.Errors = append(data.Errors, a.authErr.Error())
		data.MissingAuth = true
	}
	a.render(w, data)
}

func (a *App) handleSearch(w http.ResponseWriter, r *http.Request) {
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	placeID := strings.TrimSpace(r.URL.Query().Get("place_id"))

	data := &ViewData{
		Query:       query,
		AuthMode:    a.authMode.String(),
		ProjectID:   a.projectID,
		MissingAuth: a.authErr != nil,
	}

	if a.authErr != nil {
		data.Errors = append(data.Errors, a.authErr.Error())
		a.render(w, data)
		return
	}

	if query == "" {
		data.Errors = append(data.Errors, "住所/地名を入力してください。")
		a.render(w, data)
		return
	}

	geo, err := a.geocode(r.Context(), query)
	if err != nil {
		data.Errors = append(data.Errors, err.Error())
	}
	data.Geocode = geo

	candidates, err := a.textSearch(r.Context(), query)
	if err != nil {
		data.Errors = append(data.Errors, err.Error())
	}
	data.Candidates = candidates

	if placeID != "" {
		details, photos, err := a.placeDetails(r.Context(), placeID)
		if details != nil {
			data.PlaceDetails = details
		}
		if photos != nil {
			data.Photos = photos
		}
		if err != nil {
			data.Errors = append(data.Errors, err.Error())
		}
	}

	a.render(w, data)
}

func (a *App) handlePhoto(w http.ResponseWriter, r *http.Request) {
	if a.authErr != nil {
		http.Error(w, a.authErr.Error(), http.StatusInternalServerError)
		return
	}

	name := strings.TrimSpace(r.URL.Query().Get("name"))
	if name == "" {
		http.Error(w, "missing name", http.StatusBadRequest)
		return
	}

	maxW := parseIntDefault(r.URL.Query().Get("max_w"), photoMaxWidthPx)
	maxH := parseIntDefault(r.URL.Query().Get("max_h"), photoMaxHeightPx)

	apiURL := url.URL{
		Scheme: "https",
		Host:   "places.googleapis.com",
		Path:   "/v1/" + name + "/media",
	}
	q := apiURL.Query()
	q.Set("maxWidthPx", strconv.Itoa(maxW))
	q.Set("maxHeightPx", strconv.Itoa(maxH))

	ctx, cancel := context.WithTimeout(r.Context(), apiTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL.String(), nil)
	if err != nil {
		http.Error(w, "failed to build request", http.StatusInternalServerError)
		return
	}
	if err := a.applyAuth(req, q, true); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	apiURL.RawQuery = q.Encode()
	req.URL.RawQuery = apiURL.RawQuery

	resp, err := a.client.Do(req)
	if err != nil {
		http.Error(w, "failed to fetch photo", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	log.Printf("[Place Photos] http=%d name=%s", resp.StatusCode, name)

	copyImageResponse(w, resp)
}

func (a *App) geocode(ctx context.Context, query string) (*GeocodeView, error) {
	ctx, cancel := context.WithTimeout(ctx, apiTimeout)
	defer cancel()

	apiURL := url.URL{
		Scheme: "https",
		Host:   "geocode.googleapis.com",
		Path:   "/v4beta/geocode/address/" + url.PathEscape(query),
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Goog-FieldMask", "results.formattedAddress,results.placeId,results.location")
	if err := a.applyAuth(req, nil, false); err != nil {
		return nil, err
	}

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var gr geocodeResponse
	if err := json.Unmarshal(body, &gr); err != nil {
		return nil, err
	}

	view := &GeocodeView{
		ResultCount: len(gr.Results),
	}
	if len(gr.Results) > 0 {
		result := gr.Results[0]
		view.FormattedAddress = result.FormattedAddress
		view.PlaceID = result.PlaceID
		view.Lat = result.Location.Latitude
		view.Lng = result.Location.Longitude
	}

	log.Printf("[Geocoding] http=%d results=%d", resp.StatusCode, len(gr.Results))

	if resp.StatusCode != http.StatusOK {
		return view, parseGoogleAPIError("Geocoding API", resp.StatusCode, body)
	}
	if len(gr.Results) == 0 {
		return view, errors.New("Geocoding API が結果 0 件を返しました")
	}

	return view, nil
}

func (a *App) textSearch(ctx context.Context, query string) ([]CandidateView, error) {
	ctx, cancel := context.WithTimeout(ctx, apiTimeout)
	defer cancel()

	payload := textSearchRequest{TextQuery: query}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://places.googleapis.com/v1/places:searchText", bytes.NewReader(payloadBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-FieldMask", "places.displayName,places.formattedAddress,places.id")
	if err := a.applyAuth(req, nil, false); err != nil {
		return nil, err
	}

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Places Text Search] http=%d", resp.StatusCode)
		return nil, parseGoogleAPIError("Places Text Search", resp.StatusCode, body)
	}

	var tr textSearchResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return nil, err
	}

	log.Printf("[Places Text Search] http=%d candidates=%d", resp.StatusCode, len(tr.Places))

	if len(tr.Places) > maxCandidates {
		tr.Places = tr.Places[:maxCandidates]
	}
	candidates := make([]CandidateView, 0, len(tr.Places))
	for _, p := range tr.Places {
		name := strings.TrimSpace(p.DisplayName.Text)
		if name == "" {
			name = "(no name)"
		}
		candidates = append(candidates, CandidateView{
			Name:    name,
			PlaceID: p.ID,
			Address: p.FormattedAddress,
		})
	}

	if len(candidates) == 0 {
		return candidates, errors.New("Places Text Search が結果 0 件を返しました")
	}

	return candidates, nil
}

func (a *App) placeDetails(ctx context.Context, placeID string) (*PlaceDetailsView, []PhotoView, error) {
	ctx, cancel := context.WithTimeout(ctx, apiTimeout)
	defer cancel()

	apiURL := url.URL{
		Scheme: "https",
		Host:   "places.googleapis.com",
		Path:   "/v1/places/" + placeID,
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL.String(), nil)
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("X-Goog-FieldMask", "id,displayName,formattedAddress,photos")
	if err := a.applyAuth(req, nil, false); err != nil {
		return nil, nil, err
	}

	resp, err := a.client.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, err
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Place Details] http=%d", resp.StatusCode)
		return nil, nil, parseGoogleAPIError("Place Details", resp.StatusCode, body)
	}

	var pr placeDetailsResponse
	if err := json.Unmarshal(body, &pr); err != nil {
		return nil, nil, err
	}

	photos := pr.Photos
	if len(photos) > maxPhotos {
		photos = photos[:maxPhotos]
	}

	photoViews := make([]PhotoView, 0, len(photos))
	for _, p := range photos {
		attributions := make([]AttributionView, 0, len(p.AuthorAttributions))
		for _, a := range p.AuthorAttributions {
			attributions = append(attributions, AttributionView{
				DisplayName: a.DisplayName,
				Uri:         a.Uri,
				PhotoUri:    a.PhotoUri,
			})
		}
		photoViews = append(photoViews, PhotoView{
			Name:         p.Name,
			Src:          fmt.Sprintf("/photo?name=%s&max_w=%d&max_h=%d", url.QueryEscape(p.Name), photoMaxWidthPx, photoMaxHeightPx),
			WidthPx:      p.WidthPx,
			HeightPx:     p.HeightPx,
			Attributions: attributions,
		})
	}

	log.Printf("[Place Details] http=%d place_id=%s photos=%d", resp.StatusCode, placeID, len(photoViews))

	details := &PlaceDetailsView{
		Name:    pr.DisplayName.Text,
		PlaceID: pr.ID,
		Address: pr.FormattedAddress,
	}

	if details.Name == "" {
		details.Name = "(no name)"
	}

	if len(photoViews) == 0 {
		return details, photoViews, errors.New("Place Details が写真 0 件を返しました")
	}

	return details, photoViews, nil
}

func (a *App) render(w http.ResponseWriter, data *ViewData) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := a.tmpl.Execute(w, data); err != nil {
		log.Printf("template error: %v", err)
	}
}

func (a *App) applyAuth(req *http.Request, q url.Values, keyInQuery bool) error {
	switch a.authMode {
	case authAPIKey:
		if a.apiKey == "" {
			return errors.New("GOOGLE_MAPS_API_KEY が未設定です。環境変数を設定してください")
		}
		if keyInQuery {
			if q == nil {
				return errors.New("internal error: missing query params for API key")
			}
			q.Set("key", a.apiKey)
		} else {
			req.Header.Set("X-Goog-Api-Key", a.apiKey)
		}
		return nil
	case authOAuth:
		if a.tokenSrc == nil {
			return errors.New("OAuth 認証情報が見つかりません")
		}
		if a.projectID == "" {
			return errors.New("OAuth 使用時は GOOGLE_MAPS_PROJECT_ID または GOOGLE_CLOUD_PROJECT を設定してください")
		}
		token, err := a.tokenSrc.Token()
		if err != nil {
			return fmt.Errorf("OAuth トークン取得失敗: %w", err)
		}
		req.Header.Set("Authorization", "Bearer "+token.AccessToken)
		req.Header.Set("X-Goog-User-Project", a.projectID)
		return nil
	default:
		return errors.New("unknown auth mode")
	}
}

func parseGoogleAPIError(prefix string, statusCode int, body []byte) error {
	var apiErr googleAPIErrorResponse
	if err := json.Unmarshal(body, &apiErr); err == nil {
		if apiErr.Error.Message != "" {
			return fmt.Errorf("%s エラー: http=%d status=%s message=%s", prefix, statusCode, apiErr.Error.Status, apiErr.Error.Message)
		}
	}
	return fmt.Errorf("%s エラー: http=%d body=%s", prefix, statusCode, truncate(string(body), 300))
}

func truncate(s string, limit int) string {
	if len(s) <= limit {
		return s
	}
	return s[:limit] + "..."
}

func parseIntDefault(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func copyImageResponse(w http.ResponseWriter, resp *http.Response) {
	if contentType := resp.Header.Get("Content-Type"); contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}
	if cacheControl := resp.Header.Get("Cache-Control"); cacheControl != "" {
		w.Header().Set("Cache-Control", cacheControl)
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}
