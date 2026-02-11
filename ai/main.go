package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Hokkaido-cheese-beef/agentic_ai_hackathon/ai/plan"
	"github.com/joho/godotenv"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func loadDotEnv() {
	paths := []string{}
	if _, err := os.Stat(".env"); err == nil {
		paths = append(paths, ".env")
	}
	if _, err := os.Stat("../.env"); err == nil {
		paths = append(paths, "../.env")
	}
	if len(paths) == 0 {
		return
	}
	if err := godotenv.Load(paths...); err != nil {
		slog.Warn("Failed to load .env", "error", err)
	}
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
	defer stop()

	loadDotEnv()

	// Server の初期化
	server, err := plan.NewServer(ctx)
	if err != nil {
		slog.Error("Failed to create server", "error", err)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /plan", server.HandlePlan)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: corsMiddleware(mux),
	}

	// Graceful Shutdown
	go func() {
		<-ctx.Done()
		slog.Info("Received signal, shutting down...")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			slog.Error("Shutdown error", "error", err)
		}
	}()

	slog.Info("Server starting", "port", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		slog.Error("Server error", "error", err)
		os.Exit(1)
	}
	slog.Info("Server stopped")
}
