# Complete E-commerce Backend Setup Guide
# Follow these steps exactly to get your backend running

# ============================================================================
# STEP 1: STOP CONFLICTING SERVICES
# ============================================================================

echo "=== Step 1: Cleaning up conflicting services ==="

# Stop Docker container if running
sudo docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

# Stop local PostgreSQL if running
sudo systemctl stop postgresql 2>/dev/null || true

# Kill any processes using port 5432
sudo lsof -ti:5432 | xargs sudo kill -9 2>/dev/null || true

# Kill any processes using port 8080
sudo lsof -ti:8080 | xargs sudo kill -9 2>/dev/null || true

echo "✅ Cleaned up conflicting services"

# ============================================================================
# STEP 2: SET UP DOCKER DATABASE (RECOMMENDED APPROACH)
# ============================================================================

echo "=== Step 2: Setting up PostgreSQL with Docker ==="

# Create updated docker-compose file without version warning
cat > docker-compose.dev.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: ecommerce_db_dev
    environment:
      POSTGRES_USER: ecommerce_user
      POSTGRES_PASSWORD: ecommerce_password
      POSTGRES_DB: ecommerce
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecommerce_user -d ecommerce"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_dev_data:
EOF

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
sudo docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 15

# Test database connection
echo "Testing database connection..."
sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo "✅ Database is ready!"
else
    echo "❌ Database not ready, waiting longer..."
    sleep 10
    sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "SELECT version();"
fi

# ============================================================================
# STEP 3: CREATE PROJECT STRUCTURE
# ============================================================================

echo "=== Step 3: Creating project structure ==="

# Ensure you're in the right directory
pwd

# Create all necessary directories
mkdir -p config database middleware models services routes uploads logs

# Create uploads directory placeholder
touch uploads/.gitkeep

echo "✅ Project structure created"

# ============================================================================
# STEP 4: CREATE ENVIRONMENT FILE
# ============================================================================

echo "=== Step 4: Creating .env file ==="

cat > .env << 'EOF'
# Server Configuration
PORT=8080
ENVIRONMENT=development

# Database Configuration (Docker container)
DATABASE_URL=postgres://ecommerce_user:ecommerce_password@localhost:5432/ecommerce?sslmode=disable

# Security
JWT_SECRET=super-secret-jwt-key-for-development-$(date +%s)-make-this-very-long-and-random-in-production

# CORS (add your React app URL)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Email Configuration (optional - emails will be logged)
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@yourwebshop.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting (requests per minute)
RATE_LIMIT=100

# Monitoring (optional)
SENTRY_DSN=
EOF

echo "✅ .env file created"

# ============================================================================
# STEP 5: INSTALL GO DEPENDENCIES
# ============================================================================

echo "=== Step 5: Installing Go dependencies ==="

# Initialize go.mod if it doesn't exist
if [ ! -f go.mod ]; then
    go mod init ecommerce-backend
fi

# Clean any existing dependencies
go mod tidy

# Install all required dependencies
go get github.com/gin-gonic/gin@v1.9.1
go get github.com/gin-contrib/cors@v1.4.0
go get github.com/gin-contrib/secure@v0.0.1
go get github.com/lib/pq@v1.10.9
go get github.com/golang-jwt/jwt/v5@v5.0.0
go get github.com/joho/godotenv@v1.4.0
go get github.com/google/uuid@v1.3.0
go get golang.org/x/crypto@v0.14.0
go get golang.org/x/time@v0.3.0
go get github.com/pressly/goose/v3@v3.15.0

# Ensure dependencies are clean
go mod tidy

echo "✅ Go dependencies installed"

# ============================================================================
# STEP 6: VERIFY ALL SOURCE FILES EXIST
# ============================================================================

echo "=== Step 6: Checking source files ==="

# Check if all required files exist
required_files=(
    "main.go"
    "config/config.go"
    "database/database.go"
    "middleware/middleware.go"
    "models/models.go"
    "services/auth_service.go"
    "services/product_service.go"
    "services/order_service.go"
    "services/analytics_service.go"
    "services/email_service.go"
    "routes/routes.go"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "❌ Missing required files:"
    printf '%s\n' "${missing_files[@]}"
    echo ""
    echo "Please create these files with the code provided in the artifacts."
    echo "You can copy the code from the Claude conversation above."
    exit 1
else
    echo "✅ All required source files found"
fi

# ============================================================================
# STEP 7: CREATE MISSING FILES AUTOMATICALLY
# ============================================================================

echo "=== Step 7: Creating any missing configuration files ==="

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
cat > .gitignore << 'EOF'
# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib
main
ecommerce-backend

# Test binary
*.test

# Output of go coverage tool
*.out

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Uploads
uploads/*
!uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
.dockerignore

# Database
*.db
*.sqlite
*.sqlite3

# Temporary files
tmp/
temp/
EOF
echo "✅ .gitignore created"
fi

# ============================================================================
# STEP 8: TEST DATABASE CONNECTION BEFORE STARTING
# ============================================================================

echo "=== Step 8: Testing database connection ==="

# Test connection using Docker
test_result=$(sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "SELECT 1;" 2>&1)

if echo "$test_result" | grep -q "1"; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed:"
    echo "$test_result"
    echo ""
    echo "Trying to restart database container..."
    sudo docker-compose -f docker-compose.dev.yml restart
    sleep 10
    
    # Test again
    test_result=$(sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "SELECT 1;" 2>&1)
    if echo "$test_result" | grep -q "1"; then
        echo "✅ Database connection successful after restart"
    else
        echo "❌ Database still not working. Please check Docker logs:"
        sudo docker logs ecommerce_db_dev
        exit 1
    fi
fi

# ============================================================================
# STEP 9: RUN THE BACKEND
# ============================================================================

echo "=== Step 9: Starting the backend ==="

echo "Starting Go backend..."
echo "If you see any missing import errors, make sure all source files are in place."
echo ""

# Build first to catch any compilation errors
if go build -o ecommerce-backend .; then
    echo "✅ Build successful"
    
    # Run the application
    echo "Starting server..."
    ./ecommerce-backend
else
    echo "❌ Build failed. Please check the error messages above."
    echo ""
    echo "Common issues:"
    echo "1. Missing source files - copy all code from the Claude artifacts"
    echo "2. Import path issues - make sure 'go mod init ecommerce-backend' was run"
    echo "3. Missing dependencies - run 'go mod tidy'"
    exit 1
fi
