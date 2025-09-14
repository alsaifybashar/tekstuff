#!/bin/bash

# Optimized Test Script for Clean Backend
# This script includes delays to avoid rate limiting

BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api/v1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test_count=0
passed_count=0

run_test() {
    local description="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    local headers="$6"
    
    test_count=$((test_count + 1))
    echo -e "\n${YELLOW}Test $test_count: $description${NC}"
    
    # Add small delay to avoid rate limiting
    sleep 0.1
    
    if [ "$method" = "GET" ]; then
        if [ ! -z "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" $headers "$url")
        else
            response=$(curl -s -w "\n%{http_code}" "$url")
        fi
    else
        if [ ! -z "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" $headers -H "Content-Type: application/json" -d "$data" "$url")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED ($http_code)${NC}"
        passed_count=$((passed_count + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        echo "$body"  # Return body for token extraction
    else
        echo -e "${RED}❌ FAILED (Expected: $expected_status, Got: $http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

echo -e "${BLUE}=== CLEAN BACKEND TEST SUITE ===${NC}"
echo "Testing against: $BASE_URL"

# Test 1: Health check
run_test "Health Check" "GET" "$BASE_URL/health" "" "200"

# Test 2: Categories
run_test "Get Categories" "GET" "$API_URL/products/categories" "" "200"

# Test 3: Products
run_test "Get Products" "GET" "$API_URL/products" "" "200"

# Test 4: User registration
register_response=$(run_test "Register User" "POST" "$API_URL/auth/register" '{
    "email": "testuser@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
}' "201")

user_token=""
if [ $? -eq 0 ]; then
    user_token=$(echo "$register_response" | jq -r '.token' 2>/dev/null)
    if [ "$user_token" != "null" ] && [ ! -z "$user_token" ]; then
        echo -e "${GREEN}User token extracted: ${user_token:0:30}...${NC}"
    fi
fi

# Test 5: Admin login
admin_response=$(run_test "Admin Login" "POST" "$API_URL/auth/login" '{
    "email": "admin@example.com",
    "password": "admin123"
}' "200")

admin_token=""
if [ $? -eq 0 ]; then
    admin_token=$(echo "$admin_response" | jq -r '.token' 2>/dev/null)
    if [ "$admin_token" != "null" ] && [ ! -z "$admin_token" ]; then
        echo -e "${GREEN}Admin token extracted: ${admin_token:0:30}...${NC}"
    fi
fi

# Test 6: User profile (if we have user token)
if [ ! -z "$user_token" ] && [ "$user_token" != "null" ]; then
    run_test "Get User Profile" "GET" "$API_URL/user/profile" "" "200" "-H 'Authorization: Bearer $user_token'"
fi

# Test 7: Dashboard stats (if we have admin token)
if [ ! -z "$admin_token" ] && [ "$admin_token" != "null" ]; then
    run_test "Dashboard Stats" "GET" "$API_URL/admin/analytics/dashboard" "" "200" "-H 'Authorization: Bearer $admin_token'"
fi

# Test 8: Create product (if we have admin token)
if [ ! -z "$admin_token" ] && [ "$admin_token" != "null" ]; then
    run_test "Create Product" "POST" "$API_URL/admin/products" '{
        "name": "Test Product",
        "slug": "test-product",
        "description": "A test product",
        "sku": "TEST-001",
        "price": 99.99,
        "category_id": 1,
        "inventory": 10,
        "is_active": true
    }' "201" "-H 'Authorization: Bearer $admin_token'"
fi

# Results
echo -e "\n${BLUE}=== TEST RESULTS ===${NC}"
echo "Total Tests: $test_count"
echo -e "Passed: ${GREEN}$passed_count${NC}"
echo -e "Failed: ${RED}$((test_count - passed_count))${NC}"

success_rate=$((passed_count * 100 / test_count))
echo "Success Rate: $success_rate%"

if [ $success_rate -ge 90 ]; then
    echo -e "\n${GREEN}🎉 EXCELLENT! Backend is working great!${NC}"
elif [ $success_rate -ge 70 ]; then
    echo -e "\n${YELLOW}⚠️ Good, but some issues remain${NC}"
else
    echo -e "\n${RED}❌ Multiple issues detected${NC}"
fi
