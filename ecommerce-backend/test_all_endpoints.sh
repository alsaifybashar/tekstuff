#!/bin/bash

# =============================================================================
# E-commerce Backend API Test Suite
# =============================================================================
# This script tests all API endpoints comprehensively
# Run with: ./test_all_endpoints.sh
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api/v1"
LOGFILE="api_test_results.log"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Global variables for tokens
USER_TOKEN=""
ADMIN_TOKEN=""
CREATED_PRODUCT_ID=""
CREATED_ORDER_ID=""
CREATED_ADDRESS_ID=""

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log() {
    echo -e "$1" | tee -a "$LOGFILE"
}


test_header() {
    log "\n${PURPLE}===================================================${NC}"
    log "${PURPLE}$1${NC}"
    log "${PURPLE}===================================================${NC}"
}

test_section() {
    log "\n${CYAN}--- $1 ---${NC}"
}

test_endpoint() {
    local description="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local headers="$5"
    local expected_status="$6"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "\n${YELLOW}Test $TOTAL_TESTS: $description${NC}"
    log "Method: $method | URL: $url"
    
    # Construct curl command
    local curl_cmd="curl -s -w '\\n%{http_code}\\n%{time_total}'"
    
    if [ "$method" != "GET" ]; then
        curl_cmd="$curl_cmd -X $method"
    fi
    
    if [ ! -z "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$url'"
    
    # Execute request
    local response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | tail -n2 | head -n1)
    local time_total=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -2)
    


    # Check if expected status is provided
    if [ -z "$expected_status" ]; then
        expected_status="200"
    fi
    
    # Validate response
    if [[ "$http_code" -eq "$expected_status" ]] || [[ "$expected_status" == "2xx" && "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        log "${GREEN}✅ PASSED${NC} ($http_code) - ${time_total}s"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        

	
        # Pretty print JSON if possible
        if echo "$body" | jq empty 2>/dev/null; then
            echo "$body" | jq '.' >> "$LOGFILE" 2>/dev/null
        else
            echo "$body" >> "$LOGFILE"
        fi
        

        # Return response for further processing
        echo "$body"
    else
        log "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $http_code) - ${time_total}s"
        log "Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | jq -r ".$key" 2>/dev/null || echo "null"

}

wait_for_server() {
    log "${BLUE}Checking if server is running...${NC}"
    for i in {1..30}; do
        if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
            log "${GREEN}✅ Server is running${NC}"
            return 0
        fi
        log "Waiting for server... (attempt $i/30)"
        sleep 2
    done
    log "${RED}❌ Server is not responding${NC}"
    exit 1

}
# =============================================================================
# MAIN TEST EXECUTION
# =============================================================================

main() {
    # Initialize log file
    echo "E-commerce Backend API Test Results" > "$LOGFILE"
    echo "Test started at: $(date)" >> "$LOGFILE"
    echo "======================================" >> "$LOGFILE"
    
    test_header "E-COMMERCE BACKEND API TEST SUITE"
    log "Testing against: $BASE_URL"
    log "Log file: $LOGFILE"
    
    # Check if server is running
    wait_for_server
    
    # Run all test suites
    test_health_endpoints
    test_product_endpoints
    test_authentication_endpoints
    test_user_profile_endpoints
    test_address_management_endpoints
    test_admin_product_management
    test_order_management
    test_admin_order_management
    test_analytics_endpoints
    test_error_handling
    test_security_features
    
    # Final results
    show_final_results
}

# =============================================================================
# TEST SUITES
# =============================================================================

test_health_endpoints() {
    test_section "Health & System Endpoints"
    
    test_endpoint \
        "Health Check" \
        "GET" \
        "$BASE_URL/health" \
        "" \
        "" \
        "200"
}

test_product_endpoints() {
    test_section "Public Product Endpoints"
    
    # Get all products (should work even if empty)
    test_endpoint \
        "Get All Products" \
        "GET" \
        "$API_URL/products" \
        "" \
        "" \
        "200"
    
    # Get products with pagination
    test_endpoint \
        "Get Products with Pagination" \
        "GET" \
        "$API_URL/products?page=1&limit=5" \
        "" \
        "" \
        "200"
    
    # Get products with filters
    test_endpoint \
        "Get Products with Filters" \
        "GET" \
        "$API_URL/products?featured=true&in_stock=true&sort=price_asc" \
        "" \
        "" \
        "200"
    
    # Search products
    test_endpoint \
        "Search Products" \
        "GET" \
        "$API_URL/products?search=charger" \
        "" \
        "" \
        "200"
    
    # Get categories
    test_endpoint \
        "Get Categories" \
        "GET" \
        "$API_URL/products/categories" \
        "" \
        "" \
        "200"
    
    # Get non-existent product (should return 404)
    test_endpoint \
        "Get Non-existent Product" \
        "GET" \
        "$API_URL/products/non-existent-slug" \
        "" \
        "" \
        "404"

}

test_authentication_endpoints() {
    test_section "Authentication Endpoints"
    
    # Register new user
    local user_email="testuser$(date +%s)@example.com"
    local register_response=$(test_endpoint \
        "Register New User" \
        "POST" \
        "$API_URL/auth/register" \
        '{
            "email": "'$user_email'",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User",
            "phone": "+46701234567"
        }' \
        "-H 'Content-Type: application/json'" \
        "200")
    
    if [ $? -eq 0 ]; then
        USER_TOKEN=$(extract_json_value "$login_response" "token")
        log "Updated user token: ${USER_TOKEN:0:20}..."
    fi
    
    # Login with incorrect credentials
    test_endpoint \
        "Login with Wrong Password" \
        "POST" \
        "$API_URL/auth/login" \
        '{
            "email": "'$user_email'",
            "password": "wrongpassword"
        }' \
        "-H 'Content-Type: application/json'" \
        "401"
    
    # Login as admin
    local admin_response=$(test_endpoint \
        "Login as Admin" \
        "POST" \
        "$API_URL/auth/login" \
        '{
            "email": "admin@example.com",
            "password": "admin123"
        }' \
        "-H 'Content-Type: application/json'" \
        "200")
    
    if [ $? -eq 0 ]; then
        ADMIN_TOKEN=$(extract_json_value "$admin_response" "token")
        log "Admin token extracted: ${ADMIN_TOKEN:0:20}..."
    fi
    
    # Test forgot password
    test_endpoint \
        "Forgot Password" \
        "POST" \
        "$API_URL/auth/forgot-password" \
        '{
            "email": "'$user_email'"
        }' \
        "-H 'Content-Type: application/json'" \
        "200"
    
    # Test reset password (simplified implementation)
    test_endpoint \
        "Reset Password" \
        "POST" \
        "$API_URL/auth/reset-password" \
        '{
            "token": "reset-token-'$user_email'",
            "new_password": "newpassword123"
        }' \
        "-H 'Content-Type: application/json'" \
        "200"
}

test_user_profile_endpoints() {
    test_section "User Profile Management"
    
    if [ -z "$USER_TOKEN" ]; then
        log "${RED}❌ Skipping user profile tests - no user token${NC}"
        return
    fi
    
    # Get user profile
    test_endpoint \
        "Get User Profile" \
        "GET" \
        "$API_URL/user/profile" \
        "" \
        "-H 'Authorization: Bearer $USER_TOKEN'" \
        "200"
    
    # Update user profile
    test_endpoint \
        "Update User Profile" \
        "PUT" \
        "$API_URL/user/profile" \
        '{
            "first_name": "Updated",
            "last_name": "Name",
            "phone": "+46701234568"
        }' \
        "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
        "200"
    
    # Change password
    test_endpoint \
        "Change Password" \
        "POST" \
        "$API_URL/user/change-password" \
        '{
            "current_password": "password123",
            "new_password": "newpassword456"
        }' \
        "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
        "200"
    
    # Test with unauthorized access
    test_endpoint \
        "Get Profile Without Token" \
        "GET" \
        "$API_URL/user/profile" \
        "" \
        "" \
        "401"
    
    # Test with invalid token
    test_endpoint \
        "Get Profile with Invalid Token" \
        "GET" \
        "$API_URL/user/profile" \
        "" \
        "-H 'Authorization: Bearer invalid_token'" \
        "401"
}

test_address_management_endpoints() {
    test_section "Address Management"
    
    if [ -z "$USER_TOKEN" ]; then
        log "${RED}❌ Skipping address tests - no user token${NC}"
        return
    fi
    
    # Get user addresses (should be empty initially)
    test_endpoint \
        "Get User Addresses" \
        "GET" \
        "$API_URL/user/addresses" \
        "" \
        "-H 'Authorization: Bearer $USER_TOKEN'" \
        "200"
    
    # Create shipping address
    local address_response=$(test_endpoint \
        "Create Shipping Address" \
        "POST" \
        "$API_URL/user/addresses" \
        '{
            "type": "shipping",
            "first_name": "Test",
            "last_name": "User",
            "company": "Test Company",
            "address_line_1": "Storgatan 123",
            "address_line_2": "Apt 4B",
            "city": "Stockholm",
            "postal_code": "11122",
            "country": "SE",
            "is_default": true
        }' \
        "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
        "201")
    
    if [ $? -eq 0 ]; then
        CREATED_ADDRESS_ID=$(extract_json_value "$address_response" "id")
        log "Created address ID: $CREATED_ADDRESS_ID"
    fi
    
    # Create billing address
    test_endpoint \
        "Create Billing Address" \
        "POST" \
        "$API_URL/user/addresses" \
        '{
            "type": "billing",
            "first_name": "Test",
            "last_name": "User",
            "address_line_1": "Billing Street 456",
            "city": "Göteborg",
            "postal_code": "41101",
            "country": "SE",
            "is_default": false
        }' \
        "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
        "201"
    
    # Get addresses again (should have 2 now)
    test_endpoint \
        "Get User Addresses After Creation" \
        "GET" \
        "$API_URL/user/addresses" \
        "" \
        "-H 'Authorization: Bearer $USER_TOKEN'" \
        "200"
    
    # Update address
    if [ ! -z "$CREATED_ADDRESS_ID" ] && [ "$CREATED_ADDRESS_ID" != "null" ]; then
        test_endpoint \
            "Update Address" \
            "PUT" \
            "$API_URL/user/addresses/$CREATED_ADDRESS_ID" \
            '{
                "type": "shipping",
                "first_name": "Updated",
                "last_name": "User",
                "address_line_1": "Updated Street 789",
                "city": "Stockholm",
                "postal_code": "11133",
                "country": "SE",
                "is_default": true
            }' \
            "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
            "200"
    fi
}

test_admin_product_management() {
    test_section "Admin Product Management"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log "${RED}❌ Skipping admin product tests - no admin token${NC}"
        return
    fi
    
    # Create a product
    local product_response=$(test_endpoint \
        "Create Product" \
        "POST" \
        "$API_URL/admin/products" \
        '{
            "name": "iPhone 15 USB-C Laddare",
            "slug": "iphone-15-usb-c-laddare-test",
            "description": "Officiell Apple USB-C laddare för iPhone 15 serien. Snabb och säker laddning.",
            "short_description": "20W USB-C snabbladdare",
            "sku": "APPLE-20W-USBC-TEST",
            "price": 299.00,
            "compare_price": 399.00,
            "cost_price": 150.00,
            "category_id": 1,
            "brand": "Apple",
            "weight": 0.15,
            "dimensions": {
                "length": 8.5,
                "width": 4.2,
                "height": 2.8,
                "unit": "cm"
            },
            "images": [
                "https://example.com/charger1.jpg",
                "https://example.com/charger2.jpg"
            ],
            "inventory": 50,
            "min_inventory": 5,
            "is_active": true,
            "is_featured": true,
            "meta_title": "iPhone 15 USB-C Laddare - Snabb laddning",
            "meta_description": "Köp officiell Apple USB-C laddare för iPhone 15. Snabb och säker 20W laddning.",
            "tags": ["apple", "charger", "usb-c", "20w", "iphone15"]
        }' \
        "-H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json'" \
        "201")
    
    if [ $? -eq 0 ]; then
        CREATED_PRODUCT_ID=$(extract_json_value "$product_response" "id")
        log "Created product ID: $CREATED_PRODUCT_ID"
    fi
    
    # Update product
    if [ ! -z "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
        test_endpoint \
            "Update Product" \
            "PUT" \
            "$API_URL/admin/products/$CREATED_PRODUCT_ID" \
            '{
                "name": "iPhone 15 USB-C Laddare - Uppdaterad",
                "price": 279.00,
                "inventory": 75,
                "is_featured": false
            }' \
            "-H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json'" \
            "200"
        
        # Update inventory
        test_endpoint \
            "Update Product Inventory" \
            "PATCH" \
            "$API_URL/admin/products/$CREATED_PRODUCT_ID/inventory" \
            '{
                "quantity": -10
            }' \
            "-H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json'" \
            "200"
        
        # Get the updated product by slug
        test_endpoint \
            "Get Created Product by Slug" \
            "GET" \
            "$API_URL/products/iphone-15-usb-c-laddare-test" \
            "" \
            "" \
            "200"
    fi
    
    # Test unauthorized product creation
    test_endpoint \
        "Create Product Without Auth" \
        "POST" \
        "$API_URL/admin/products" \
        '{
            "name": "Unauthorized Product",
            "slug": "unauthorized"
        }' \
        "-H 'Content-Type: application/json'" \
        "401"
    
    # Test product creation with user token (should fail)
    if [ ! -z "$USER_TOKEN" ]; then
        test_endpoint \
            "Create Product with User Token" \
            "POST" \
            "$API_URL/admin/products" \
            '{
                "name": "User Product",
                "slug": "user-product"
            }' \
            "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
            "403"
    fi
}

test_order_management() {
    test_section "Order Management"
    
    if [ -z "$USER_TOKEN" ]; then
        log "${RED}❌ Skipping order tests - no user token${NC}"
        return
    fi
    
    # Create an order (requires products to exist)
    local order_data='{
        "items": [
            {
                "product_id": 1,
                "quantity": 2
            }
        ],
        "customer_email": "test@example.com",
        "customer_phone": "+46701234567",
        "payment_method": "card",
        "shipping_method": "standard",
        "shipping_address": {
            "first_name": "Test",
            "last_name": "User",
            "address_line_1": "Storgatan 123",
            "city": "Stockholm",
            "postal_code": "11122",
            "country": "SE"
        },
        "billing_address": {
            "first_name": "Test",
            "last_name": "User",
            "address_line_1": "Storgatan 123",
            "city": "Stockholm",
            "postal_code": "11122",
            "country": "SE"
        },
        "notes": "Test order from API test suite"
    }'
    
    # If we created a product, use that ID
    if [ ! -z "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
        order_data='{
            "items": [
                {
                    "product_id": '$CREATED_PRODUCT_ID',
                    "quantity": 2
                }
            ],
            "customer_email": "test@example.com",
            "customer_phone": "+46701234567",
            "payment_method": "card",
            "shipping_method": "standard",
            "shipping_address": {
                "first_name": "Test",
                "last_name": "User",
                "address_line_1": "Storgatan 123",
                "city": "Stockholm",
                "postal_code": "11122",
                "country": "SE"
            },
            "billing_address": {
                "first_name": "Test",
                "last_name": "User",
                "address_line_1": "Storgatan 123",
                "city": "Stockholm",
                "postal_code": "11122",
                "country": "SE"
            },
            "notes": "Test order from API test suite"
        }'
    fi
    
    local order_response=$(test_endpoint \
        "Create Order" \
        "POST" \
        "$API_URL/orders" \
        "$order_data" \
        "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
        "201")
    
    if [ $? -eq 0 ]; then
        CREATED_ORDER_ID=$(extract_json_value "$order_response" "id")
        log "Created order ID: $CREATED_ORDER_ID"
    fi
    
    # Get user orders
    test_endpoint \
        "Get User Orders" \
        "GET" \
        "$API_URL/orders" \
        "" \
        "-H 'Authorization: Bearer $USER_TOKEN'" \
        "200"
    
    # Get specific order
    if [ ! -z "$CREATED_ORDER_ID" ] && [ "$CREATED_ORDER_ID" != "null" ]; then
        test_endpoint \
            "Get Specific Order" \
            "GET" \
            "$API_URL/orders/$CREATED_ORDER_ID" \
            "" \
            "-H 'Authorization: Bearer $USER_TOKEN'" \
            "200"
    fi
    
    # Test creating order without authentication
    test_endpoint \
        "Create Order Without Auth" \
        "POST" \
        "$API_URL/orders" \
        "$order_data" \
        "-H 'Content-Type: application/json'" \
        "401"
    
    # Test invalid order data
    test_endpoint \
        "Create Order with Invalid Data" \
        "POST" \
        "$API_URL/orders" \
        '{
            "items": [],
            "customer_email": "invalid-email"
        }' \
        "-H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json'" \
        "400"
}

test_admin_order_management() {
    test_section "Admin Order Management"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log "${RED}❌ Skipping admin order tests - no admin token${NC}"
        return
    fi
    
    # Get all orders
    test_endpoint \
        "Get All Orders (Admin)" \
        "GET" \
        "$API_URL/admin/orders" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Get orders with filters
    test_endpoint \
        "Get Orders with Filters" \
        "GET" \
        "$API_URL/admin/orders?status=pending&page=1&limit=10" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    if [ ! -z "$CREATED_ORDER_ID" ] && [ "$CREATED_ORDER_ID" != "null" ]; then
        # Update order status
        test_endpoint \
            "Update Order Status" \
            "PATCH" \
            "$API_URL/admin/orders/$CREATED_ORDER_ID/status" \
            '{
                "status": "confirmed"
            }' \
            "-H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json'" \
            "200"
        
        # Update payment status
        test_endpoint \
            "Update Payment Status" \
            "PATCH" \
            "$API_URL/admin/orders/$CREATED_ORDER_ID/payment" \
            '{
                "payment_status": "paid"
            }' \
            "-H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json'" \
            "200"
        
        # Add tracking number
        test_endpoint \
            "Add Tracking Number" \
            "POST" \
            "$API_URL/admin/orders/$CREATED_ORDER_ID/tracking" \
            '{
                "tracking_number": "TRK123456789TEST"
            }' \
            "-H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json'" \
            "200"
        
        # Update to shipped status
        test_endpoint \
            "Update Order to Shipped" \
            "PATCH" \
            "$API_URL/admin/orders/$CREATED_ORDER_ID/status" \
            '{
                "status": "shipped"
            }' \
            "-H 'Authorization: Bearer $ADMIN_TOKEN' -H 'Content-Type: application/json'" \
            "200"
    fi
}

test_analytics_endpoints() {
    test_section "Analytics & Reporting"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log "${RED}❌ Skipping analytics tests - no admin token${NC}"
        return
    fi
    
    # Dashboard stats
    test_endpoint \
        "Get Dashboard Stats" \
        "GET" \
        "$API_URL/admin/analytics/dashboard" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Dashboard stats with custom period
    test_endpoint \
        "Get Dashboard Stats (7 days)" \
        "GET" \
        "$API_URL/admin/analytics/dashboard?days=7" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Sales data
    test_endpoint \
        "Get Sales Data" \
        "GET" \
        "$API_URL/admin/analytics/sales?days=30" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Top products
    test_endpoint \
        "Get Top Products" \
        "GET" \
        "$API_URL/admin/analytics/products?days=30&limit=5" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Customer stats
    test_endpoint \
        "Get Customer Stats" \
        "GET" \
        "$API_URL/admin/analytics/customers?days=30" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Inventory alerts
    test_endpoint \
        "Get Inventory Alerts" \
        "GET" \
        "$API_URL/admin/analytics/inventory" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Revenue by category
    test_endpoint \
        "Get Revenue by Category" \
        "GET" \
        "$API_URL/admin/analytics/categories?days=30" \
        "" \
        "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
        "200"
    
    # Test analytics with user token (should fail)
    if [ ! -z "$USER_TOKEN" ]; then
        test_endpoint \
            "Get Dashboard with User Token" \
            "GET" \
            "$API_URL/admin/analytics/dashboard" \
            "" \
            "-H 'Authorization: Bearer $USER_TOKEN'" \
            "403"
    fi
}

test_error_handling() {
    test_section "Error Handling & Edge Cases"
    
    # Test malformed JSON
    test_endpoint \
        "Malformed JSON Request" \
        "POST" \
        "$API_URL/auth/register" \
        '{"email": "test@example.com", "password":}' \
        "-H 'Content-Type: application/json'" \
        "400"
    
    # Test missing required fields
    test_endpoint \
        "Missing Required Fields" \
        "POST" \
        "$API_URL/auth/register" \
        '{"email": "test@example.com"}' \
        "-H 'Content-Type: application/json'" \
        "400"
    
    # Test invalid email format
    test_endpoint \
        "Invalid Email Format" \
        "POST" \
        "$API_URL/auth/register" \
        '{
            "email": "invalid-email",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User"
        }' \
        "-H 'Content-Type: application/json'" \
        "400"
    
    # Test short password
    test_endpoint \
        "Short Password" \
        "POST" \
        "$API_URL/auth/register" \
        '{
            "email": "test2@example.com",
            "password": "123",
            "first_name": "Test",
            "last_name": "User"
        }' \
        "-H 'Content-Type: application/json'" \
        "400"
    
    # Test non-existent endpoint
    test_endpoint \
        "Non-existent Endpoint" \
        "GET" \
        "$API_URL/non-existent" \
        "" \
        "" \
        "404"
    
    # Test wrong HTTP method
    test_endpoint \
        "Wrong HTTP Method" \
        "POST" \
        "$API_URL/products" \
        "" \
        "" \
        "404"
}

test_security_features() {
    test_section "Security Features"
    
    # Test CORS headers
    log "\n${YELLOW}Testing CORS Headers${NC}"
    local cors_response=$(curl -s -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET" -X OPTIONS "$API_URL/products")
    if echo "$cors_response" | grep -q "Access-Control-Allow-Origin"; then
        log "${GREEN}✅ CORS headers present${NC}"
    else
        log "${RED}❌ CORS headers missing${NC}"
    fi
    
    # Test rate limiting (make multiple requests quickly)
    log "\n${YELLOW}Testing Rate Limiting${NC}"
    local rate_limit_failed=false
    for i in {1..10}; do
        local status=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/products")
        if [ "$status" = "429" ]; then
            log "${GREEN}✅ Rate limiting working (got 429 on request $i)${NC}"
            rate_limit_failed=false
            break
        fi
        rate_limit_failed=true
    done
    
    if [ "$rate_limit_failed" = true ]; then
        log "${YELLOW}⚠️  Rate limiting not triggered (may be configured for higher limits)${NC}"
    fi
    
    # Test SQL injection attempt
    test_endpoint \
        "SQL Injection Attempt" \
        "GET" \
        "$API_URL/products?search='; DROP TABLE products; --" \
        "" \
        "" \
        "200"
    
    # Test XSS attempt
    test_endpoint \
        "XSS Attempt in Registration" \
        "POST" \
        "$API_URL/auth/register" \
        '{
            "email": "xss@example.com",
            "password": "password123",
            "first_name": "<script>alert(\"xss\")</script>",
            "last_name": "User"
        }' \
        "-H 'Content-Type: application/json'" \
        "2xx"
}

show_final_results() {
    test_header "TEST RESULTS SUMMARY"
    
    log "${BLUE}Total Tests Run: $TOTAL_TESTS${NC}"
    log "${GREEN}Passed: $PASSED_TESTS${NC}"
    log "${RED}Failed: $FAILED_TESTS${NC}"
    
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    log "${PURPLE}Success Rate: $success_rate%${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log "\n${GREEN}🎉 ALL TESTS PASSED! Your backend is working perfectly!${NC}"
    elif [ $success_rate -ge 80 ]; then
        log "\n${YELLOW}⚠️  Most tests passed, but some issues need attention.${NC}"
    else
        log "\n${RED}❌ Multiple test failures detected. Please review the backend implementation.${NC}"
    fi
    
    # Summary of created resources
    log "\n${CYAN}=== CREATED TEST RESOURCES ===${NC}"
    if [ ! -z "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
        log "Product ID: $CREATED_PRODUCT_ID"
    fi
    if [ ! -z "$CREATED_ORDER_ID" ] && [ "$CREATED_ORDER_ID" != "null" ]; then
        log "Order ID: $CREATED_ORDER_ID"
    fi
    if [ ! -z "$CREATED_ADDRESS_ID" ] && [ "$CREATED_ADDRESS_ID" != "null" ]; then
        log "Address ID: $CREATED_ADDRESS_ID"
    fi
    
    log "\n${BLUE}Full test log saved to: $LOGFILE${NC}"
    log "${BLUE}Test completed at: $(date)${NC}"
}

# =============================================================================
# CLEANUP FUNCTION
# =============================================================================

cleanup_test_data() {
    test_header "CLEANING UP TEST DATA"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log "${YELLOW}⚠️  No admin token available for cleanup${NC}"
        return
    fi
    
    # Delete created product
    if [ ! -z "$CREATED_PRODUCT_ID" ] && [ "$CREATED_PRODUCT_ID" != "null" ]; then
        test_endpoint \
            "Delete Test Product" \
            "DELETE" \
            "$API_URL/admin/products/$CREATED_PRODUCT_ID" \
            "" \
            "-H 'Authorization: Bearer $ADMIN_TOKEN'" \
            "200"
    fi
    
    # Delete created address
    if [ ! -z "$USER_TOKEN" ] && [ ! -z "$CREATED_ADDRESS_ID" ] && [ "$CREATED_ADDRESS_ID" != "null" ]; then
        test_endpoint \
            "Delete Test Address" \
            "DELETE" \
            "$API_URL/user/addresses/$CREATED_ADDRESS_ID" \
            "" \
            "-H 'Authorization: Bearer $USER_TOKEN'" \
            "200"
    fi
    
    log "${GREEN}✅ Cleanup completed${NC}"
}

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Check if cleanup flag is provided
if [ "$1" = "--cleanup" ]; then
    log "${YELLOW}Running cleanup only...${NC}"
    wait_for_server
    
    # Try to login as admin for cleanup
    admin_response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@example.com", "password": "admin123"}')
    ADMIN_TOKEN=$(echo "$admin_response" | jq -r '.token' 2>/dev/null)
    
    cleanup_test_data
    exit 0
fi

# Check if help is requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "E-commerce Backend API Test Suite"
    echo ""
    echo "Usage:"
    echo "  ./test_all_endpoints.sh         Run all tests"
    echo "  ./test_all_endpoints.sh --cleanup    Clean up test data only"
    echo "  ./test_all_endpoints.sh --help       Show this help"
    echo ""
    echo "The script will test all API endpoints and generate a detailed log file."
    echo "Make sure your backend server is running on http://localhost:8080"
    exit 0
fi

# Run main test suite
main

# Ask if user wants to clean up
echo ""
read -p "Do you want to clean up test data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cleanup_test_data
fi

log "\n${GREEN}🏁 Test suite execution completed!${NC}" \
        "201")
    
    if [ $? -eq 0 ]; then
        USER_TOKEN=$(extract_json_value "$register_response" "token")
        log "User token extracted: ${USER_TOKEN:0:20}..."
    fi
    
    # Try to register same user again (should fail)
    test_endpoint \
        "Register Duplicate User" \
        "POST" \
        "$API_URL/auth/register" \
        '{
            "email": "'$user_email'",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User"
        }' \
        "-H 'Content-Type: application/json'" \
        "409"

	sleep(8)
    
    # Login with correct credentials
    local login_response=$(test_endpoint \
        "Login User" \
        "POST" \
        "$API_URL/auth/login" \
        '{
            "email": "'$user_email'",
            "password": "password123"
        }' \
        "-H 'Content-Type: application/json'"
