// config/config.go - Application configuration
package config

import (
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration
type Config struct {
	// Server settings
	Port        string
	Environment string

	// Database
	DatabaseURL string

	// Security
	JWTSecret      string
	AllowedOrigins []string

	// Email settings
	SMTPConfig SMTPConfig

	// File storage
	UploadDir   string
	MaxFileSize int64

	// Payment (for future integration)
	StripePublicKey string
	StripeSecretKey string

	// Rate limiting
	RateLimit int

	// Monitoring
	SentryDSN string
}

// SMTPConfig for email functionality
type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

// Load reads configuration from environment variables
func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://localhost/ecommerce?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),
		AllowedOrigins: strings.Split(
			getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"),
			",",
		),
		SMTPConfig: SMTPConfig{
			Host:     getEnv("SMTP_HOST", "localhost"),
			Port:     getEnvAsInt("SMTP_PORT", 587),
			Username: getEnv("SMTP_USERNAME", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", "noreply@example.com"),
		},
		UploadDir:       getEnv("UPLOAD_DIR", "./uploads"),
		MaxFileSize:     getEnvAsInt64("MAX_FILE_SIZE", 10*1024*1024), // 10MB
		StripePublicKey: getEnv("STRIPE_PUBLIC_KEY", ""),
		StripeSecretKey: getEnv("STRIPE_SECRET_KEY", ""),
		RateLimit:       getEnvAsInt("RATE_LIMIT", 100), // requests per minute
		SentryDSN:       getEnv("SENTRY_DSN", ""),
	}
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(name string, defaultValue int) int {
	valueStr := getEnv(name, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsInt64(name string, defaultValue int64) int64 {
	valueStr := getEnv(name, "")
	if value, err := strconv.ParseInt(valueStr, 10, 64); err == nil {
		return value
	}
	return defaultValue
}
