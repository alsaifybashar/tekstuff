#!/bin/bash

# Improved test script with fixes for the issues found

BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_count=0
passed_count=0

run_test() {
    local description="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    
    test_count=$((test_count + 1))
    echo -e "\n${YELLOW}Test $test_count: $description${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED ($http_code)${NC}"
        passed_count=$((passed_count + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo "$body"  # Return for token extraction
    else
        echo -e "${RED}❌ FAILED (Expected: $expected_status, Got: $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

echo "=== TESTING FIXES ==="

# Test 1: Health check
run_test "Health Check" "GET" "$BASE_URL/health" "" "200"

# Test 2: Categories (should work now)
run_test "Get Categories" "GET" "$API_URL/products/categories" "" "200"

# Test 3: Register user
register_response=$(run_test "Register New User" "POST" "$API_URL/auth/register" '{
    "email": "testuser@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
}' "201")

# Extract token
if [ $? -eq 0 ]; then
    user_token=$(echo "$register_response" | jq -r '.token' 2>/dev/null)
    echo "User token: ${user_token:0:20}..."
fi

# Test 4: Login admin
admin_response=$(run_test "Login Admin" "POST" "$API_URL/auth/login" '{
    "email": "admin@example.com",
    "password": "admin123"
}' "200")

# Extract admin token
if [ $? -eq 0 ]; then
    admin_token=$(echo "$admin_response" | jq -r '.token' 2>/dev/null)
    echo "Admin token: ${admin_token:0:20}..."
fi

# Test 5: Get user profile (with token)
if [ ! -z "$user_token" ] && [ "$user_token" != "null" ]; then
    run_test "Get User Profile" "GET" "$API_URL/user/profile" "" "200" "-H 'Authorization: Bearer $user_token'"
fi

# Test 6: Create product (with admin token)
if [ ! -z "$admin_token" ] && [ "$admin_token" != "null" ]; then
    product_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $admin_token" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Product",
            "slug": "test-product",
            "description": "A test product",
            "sku": "TEST-001",
            "price": 99.99,
            "category_id": 1,
            "inventory": 10,
            "is_active": true
        }' \
        "$API_URL/admin/products")
    
    http_code=$(echo "$product_response" | tail -n1)
    body=$(echo "$product_response" | head -n -1)
    
    test_count=$((test_count + 1))
    echo -e "\n${YELLOW}Test $test_count: Create Product${NC}"
    
    if [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ PASSED ($http_code)${NC}"
        passed_count=$((passed_count + 1))
        product_id=$(echo "$body" | jq -r '.id' 2>/dev/null)
        echo "Created product ID: $product_id"
    else
        echo -e "${RED}❌ FAILED (Expected: 201, Got: $http_code)${NC}"
        echo "Response: $body"
    fi
fi

# Test 7: Get dashboard stats (with admin token)
if [ ! -z "$admin_token" ] && [ "$admin_token" != "null" ]; then
    curl -s -w "\n%{http_code}" -H "Authorization: Bearer $admin_token" "$API_URL/admin/analytics/dashboard" | {
        read body
        read http_code
        
        test_count=$((test_count + 1))
        echo -e "\n${YELLOW}Test $test_count: Dashboard Stats${NC}"
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✅ PASSED ($http_code)${NC}"
            passed_count=$((passed_count + 1))
        else
            echo -e "${RED}❌ FAILED (Expected: 200, Got: $http_code)${NC}"
            echo "Response: $body"
        fi
    }
fi

# Final results
echo -e "\n${YELLOW}=== TEST RESULTS ===${NC}"
echo "Total Tests: $test_count"
echo -e "Passed: ${GREEN}$passed_count${NC}"
echo -e "Failed: ${RED}$((test_count - passed_count))${NC}"

if [ $passed_count -eq $test_count ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Backend is working correctly!${NC}"
else
    echo -e "\n${YELLOW}Some tests failed, but this is much better than before!${NC}"
fi
