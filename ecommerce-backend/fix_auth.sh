#!/bin/bash

# Quick Fix Commands for Authentication Issues
# Run these commands one by one to debug and fix the remaining issues

echo "=== QUICK AUTHENTICATION FIXES ==="

# Step 1: Test authentication manually first
echo "Step 1: Manual authentication test..."

# Test admin login manually
echo "Testing admin login:"
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq '.'

echo -e "\nIf you see a token above, authentication works. If not, we need to fix it."
echo "Continue? (Press Enter)"
read

# Step 2: Check if admin user exists
echo "Step 2: Checking if admin user exists..."
sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "
SELECT id, email, role, is_active, 
       length(password_hash) as password_hash_length 
FROM users WHERE email = 'admin@example.com';"

echo -e "\nIf no rows returned, admin user doesn't exist. Continue? (Press Enter)"
read

# Step 3: Create admin user if missing
echo "Step 3: Creating/updating admin user..."
sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "
-- Delete existing admin if any
DELETE FROM users WHERE email = 'admin@example.com';

-- Insert new admin user with correct password hash for 'admin123'
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) 
VALUES (
  'admin@example.com', 
  '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiCobDMVTzM6', 
  'Admin', 
  'User', 
  'admin', 
  true
);

-- Verify admin user was created
SELECT id, email, role, is_active FROM users WHERE email = 'admin@example.com';
"

# Step 4: Test admin login again
echo -e "\nStep 4: Testing admin login after user creation..."
admin_response=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

echo "Admin login response:"
echo "$admin_response" | jq '.'

# Extract token
admin_token=$(echo "$admin_response" | jq -r '.token' 2>/dev/null)
echo "Extracted token: $admin_token"

if [ "$admin_token" != "null" ] && [ ! -z "$admin_token" ]; then
    echo "SUCCESS: Admin token extracted!"
    
    # Step 5: Test admin endpoint
    echo -e "\nStep 5: Testing admin endpoint with token..."
    curl -s -H "Authorization: Bearer $admin_token" \
      http://localhost:8080/api/v1/admin/analytics/dashboard | jq '.'
else
    echo "ERROR: Still no token. Let's check JWT secret..."
    
    # Check JWT secret
    if [ -f .env ]; then
        echo "JWT_SECRET in .env:"
        grep JWT_SECRET .env
    else
        echo "No .env file found!"
        echo "Creating .env file..."
        cat > .env << 'EOF'
# Server Configuration
PORT=8080
ENVIRONMENT=development

# Database Configuration  
DATABASE_URL=postgres://ecommerce_user:ecommerce_password@localhost:5432/ecommerce?sslmode=disable

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080
EOF
        echo "Created .env file. Please restart the backend:"
        echo "pkill -f 'go run main.go'"
        echo "go run main.go"
    fi
fi

# Step 6: Create a working test command
echo -e "\nStep 6: Creating quick test command..."
cat > quick_auth_test.sh << 'EOF'
#!/bin/bash

echo "=== QUICK AUTH TEST ==="

# Test admin login
echo "1. Admin login:"
admin_response=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

echo "$admin_response"
admin_token=$(echo "$admin_response" | jq -r '.token' 2>/dev/null)

if [ "$admin_token" != "null" ] && [ ! -z "$admin_token" ]; then
    echo -e "\n✅ Admin login successful!"
    echo "Token: ${admin_token:0:50}..."
    
    echo -e "\n2. Testing dashboard:"
    curl -s -H "Authorization: Bearer $admin_token" \
      http://localhost:8080/api/v1/admin/analytics/dashboard | jq '.'
else
    echo "❌ Admin login failed"
fi

# Test user registration
echo -e "\n3. User registration:"
user_response=$(curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser123@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }')

echo "$user_response"
user_token=$(echo "$user_response" | jq -r '.token' 2>/dev/null)

if [ "$user_token" != "null" ] && [ ! -z "$user_token" ]; then
    echo -e "\n✅ User registration successful!"
    echo "Token: ${user_token:0:50}..."
else
    echo "❌ User registration failed"
fi
EOF

chmod +x quick_auth_test.sh

echo -e "\n=== SUMMARY ==="
echo "1. Run: ./quick_auth_test.sh to test authentication"
echo "2. If admin login works, your backend is mostly fixed"
echo "3. The main issue was likely missing/incorrect admin user"
echo "4. Run your full test suite again: ./test_all_endpoints.sh"

echo -e "\nReady to test? Run: ./quick_auth_test.sh"
