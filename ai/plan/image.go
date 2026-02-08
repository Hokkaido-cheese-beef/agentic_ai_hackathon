package plan

import "context"

const fallbackImageURL = "https://user-images.githubusercontent.com/45535345/155833011-e266b446-c371-4d42-b929-92fabc7d948b.jpeg"

// GetImageURL は destination から画像URLを返す。
func GetImageURL(_ context.Context, _ string) string {
	return fallbackImageURL
}
