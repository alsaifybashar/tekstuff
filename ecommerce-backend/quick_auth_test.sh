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
