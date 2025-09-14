#!/bin/bash

# Quick Authentication Debug Script
# This will help us identify the exact authentication issues

echo "=== DEBUGGING AUTHENTICATION ==="

BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api/v1"

# Test 1: Register a new user and show full response
echo "1. Testing user registration..."
echo "Request:"
cat << 'EOF'
{
  "email": "debug@example.com",
  "password": "password123",
  "first_name": "Debug",
  "last_name": "User"
}
EOF

echo -e "\nResponse:"
register_response=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "debug@example.com",
    "password": "password123",
    "first_name": "Debug",
    "last_name": "User"
  }')

echo "$register_response" | jq '.' 2>/dev/null || echo "$register_response"

# Extract token using different methods
echo -e "\nToken extraction attempts:"
token1=$(echo "$register_response" | jq -r '.token' 2>/dev/null)
token2=$(echo "$register_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Method 1 (jq): '$token1'"
echo "Method 2 (grep): '$token2'"

# Test 2: Admin login
echo -e "\n2. Testing admin login..."
echo "Request:"
cat << 'EOF'
{
  "email": "admin@example.com",
  "password": "admin123"
}
EOF

echo -e "\nResponse:"
admin_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

echo "$admin_response" | jq '.' 2>/dev/null || echo "$admin_response"

# Extract admin token
echo -e "\nAdmin token extraction:"
admin_token1=$(echo "$admin_response" | jq -r '.token' 2>/dev/null)
admin_token2=$(echo "$admin_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Method 1 (jq): '$admin_token1'"
echo "Method 2 (grep): '$admin_token2'"

# Test 3: Check if admin user exists in database
echo -e "\n3. Checking admin user in database..."
sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "
SELECT id, email, role, is_active FROM users WHERE email = 'admin@example.com';
"

# Test 4: Try to use token if we got one
if [ "$admin_token1" != "null" ] && [ ! -z "$admin_token1" ]; then
    echo -e "\n4. Testing admin token with dashboard endpoint..."
    curl -s -H "Authorization: Bearer $admin_token1" "$API_URL/admin/analytics/dashboard" | jq '.' 2>/dev/null || echo "Token test failed"
elif [ ! -z "$admin_token2" ]; then
    echo -e "\n4. Testing admin token (method 2) with dashboard endpoint..."
    curl -s -H "Authorization: Bearer $admin_token2" "$API_URL/admin/analytics/dashboard" | jq '.' 2>/dev/null || echo "Token test failed"
else
    echo -e "\n4. No valid token extracted - cannot test dashboard"
fi

# Test 5: Check JWT secret in environment
echo -e "\n5. Checking JWT configuration..."
if [ -f .env ]; then
    echo "JWT_SECRET exists in .env: $(grep JWT_SECRET .env | head -1)"
else
    echo ".env file not found"
fi

echo -e "\n=== DEBUG COMPLETE ==="
