package plan

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

const defaultAPIVersion = "v1"

// GeminiClient は Vertex AI の genai SDK クライアント
type GeminiClient struct {
	client    *genai.Client
	modelName string
}

// NewGeminiClient は新しい Gemini クライアントを作成
func NewGeminiClient(ctx context.Context, modelName string) (*GeminiClient, error) {
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		HTTPOptions: genai.HTTPOptions{APIVersion: defaultAPIVersion},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create genai client: %w", err)
	}

	return &GeminiClient{
		client:    client,
		modelName: modelName,
	}, nil
}

// GenerateContent は Vertex AI の genai SDK を使ってコンテンツを生成
func (g *GeminiClient) GenerateContent(ctx context.Context, prompt string) (string, error) {
	resp, err := g.client.Models.GenerateContent(ctx,
		g.modelName,
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return resp.Text(), nil
}
