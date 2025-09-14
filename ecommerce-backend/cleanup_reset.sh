#!/bin/bash

echo "=== COMPLETE BACKEND RESET ==="

# Stop all backend processes
pkill -f "go run main.go" 2>/dev/null || true
pkill -f "ecommerce-backend" 2>/dev/null || true
sleep 2

# Reset database completely
sudo docker-compose -f docker-compose.dev.yml down
sudo docker volume rm ecommerce-backend_postgres_dev_data 2>/dev/null || true
sudo docker-compose -f docker-compose.dev.yml up -d

# Wait for database
echo "Waiting for database..."
sleep 15

# Disable rate limiting for testing
cat > .env << 'ENVEOF'
PORT=8080
ENVIRONMENT=development
DATABASE_URL=postgres://ecommerce_user:ecommerce_password@localhost:5432/ecommerce?sslmode=disable
JWT_SECRET=super-secret-jwt-key-for-development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
RATE_LIMIT=10000
ENVEOF

# Clean Go cache and rebuild
go clean -cache
rm -f ecommerce-backend
go build -o ecommerce-backend .

# Start fresh backend
./ecommerce-backend &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo "Waiting for backend..."
sleep 10

# Test basic functionality
echo "Testing health:"
curl -s http://localhost:8080/health | jq '.'

echo "Testing admin login:"
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq '.'

echo "✅ Reset complete! Backend PID: $BACKEND_PID"
echo "Run: kill $BACKEND_PID to stop when done"
