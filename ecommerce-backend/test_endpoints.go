// Complete Backend Endpoint Tester
// File: test_endpoints.go
package main

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// Configuration
const (
	BASE_URL   = "http://localhost:8080"
	API_URL    = BASE_URL + "/api/v1"
	SLEEP_TIME = 5 * time.Second
	LOG_FILE   = "api_test_results.log"
	TIMEOUT    = 30 * time.Second
)

// Global variables for tokens and test data
var (
	userToken     string
	adminToken    string
	testUserID    int
	testOrderID   int
	testProductID int
	logger        *log.Logger
	client        *http.Client
)

// Response structures
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type User struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Role      string `json:"role"`
}

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	CategoryID  int     `json:"category_id"`
	Inventory   int     `json:"inventory"`
	IsActive    bool    `json:"is_active"`
}

type Order struct {
	ID          int         `json:"id"`
	UserID      int         `json:"user_id"`
	OrderNumber string      `json:"order_number"`
	Status      string      `json:"status"`
	TotalAmount float64     `json:"total_amount"`
	Items       []OrderItem `json:"items,omitempty"`
}

type OrderItem struct {
	ProductID int     `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type TestResult struct {
	TestName     string
	Method       string
	URL          string
	StatusCode   int
	ExpectedCode int
	Success      bool
	Response     string
	Error        string
	Duration     time.Duration
}

// Initialize logger and HTTP client
func init() {
	// Create log file
	logFile, err := os.OpenFile(LOG_FILE, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0666)
	if err != nil {
		log.Fatalf("Failed to create log file: %v", err)
	}

	logger = log.New(logFile, "", log.LstdFlags)

	// Create HTTP client with timeout and TLS config
	client = &http.Client{
		Timeout: TIMEOUT,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	// Log test start
	logger.Println("=== BACKEND ENDPOINT TESTING STARTED ===")
	fmt.Println("🚀 Starting comprehensive backend endpoint testing...")
	fmt.Printf("📝 Results will be logged to: %s\n", LOG_FILE)
	fmt.Printf("⏱️  Sleep time between requests: %v\n", SLEEP_TIME)
	fmt.Println("")
}

// Main testing function
func RunEndpointTests() {
	defer func() {
		logger.Println("=== BACKEND ENDPOINT TESTING COMPLETED ===")
		fmt.Println("\n✅ Testing completed! Check", LOG_FILE, "for detailed results.")
	}()

	testResults := []TestResult{}

	// Test categories
	fmt.Println("🏷️  Testing Categories...")
	testResults = append(testResults, testPublicEndpoints()...)
	sleep()

	// Test authentication
	fmt.Println("🔐 Testing Authentication...")
	testResults = append(testResults, testAuthentication()...)
	sleep()

	// Test user endpoints (requires user token)
	if userToken != "" {
		fmt.Println("👤 Testing User Endpoints...")
		testResults = append(testResults, testUserEndpoints()...)
		sleep()
	}

	// Test admin endpoints (requires admin token)
	if adminToken != "" {
		fmt.Println("👨‍💼 Testing Admin Endpoints...")
		testResults = append(testResults, testAdminEndpoints()...)
		sleep()
	}

	// Test order workflows
	if userToken != "" {
		fmt.Println("🛒 Testing Order Workflows...")
		testResults = append(testResults, testOrderWorkflows()...)
		sleep()
	}

	// Test error handling
	fmt.Println("⚠️  Testing Error Handling...")
	testResults = append(testResults, testErrorHandling()...)

	// Generate summary report
	generateSummaryReport(testResults)
}

// Test public endpoints that don't require authentication
func testPublicEndpoints() []TestResult {
	results := []TestResult{}

	// Health check
	results = append(results, makeRequest(TestRequest{
		Name:         "Health Check",
		Method:       "GET",
		URL:          BASE_URL + "/health",
		ExpectedCode: 200,
	}))
	sleep()

	// Get categories
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Categories",
		Method:       "GET",
		URL:          API_URL + "/products/categories",
		ExpectedCode: 200,
	}))
	sleep()

	// Get products
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Products",
		Method:       "GET",
		URL:          API_URL + "/products",
		ExpectedCode: 200,
	}))
	sleep()

	// Get products with filtering
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Products with Filters",
		Method:       "GET",
		URL:          API_URL + "/products?category=chargers&page=1&limit=10",
		ExpectedCode: 200,
	}))
	sleep()

	return results
}

// Test authentication endpoints
func testAuthentication() []TestResult {
	results := []TestResult{}

	// Register new user
	registerPayload := map[string]interface{}{
		"email":      "testuser@example.com",
		"password":   "password123",
		"first_name": "Test",
		"last_name":  "User",
	}

	result := makeRequest(TestRequest{
		Name:         "Register User",
		Method:       "POST",
		URL:          API_URL + "/auth/register",
		Payload:      registerPayload,
		ExpectedCode: 201,
	})
	results = append(results, result)

	// Extract user token from registration response
	if result.Success && result.Response != "" {
		var authResp AuthResponse
		if err := json.Unmarshal([]byte(result.Response), &authResp); err == nil {
			userToken = authResp.Token
			testUserID = authResp.User.ID
			logger.Printf("✅ User token extracted: %s...", userToken[:min(20, len(userToken))])
			fmt.Printf("✅ User registered successfully (ID: %d)\n", testUserID)
		}
	}
	sleep()

	// Login admin user
	adminPayload := map[string]interface{}{
		"email":    "admin@example.com",
		"password": "admin123",
	}

	result = makeRequest(TestRequest{
		Name:         "Admin Login",
		Method:       "POST",
		URL:          API_URL + "/auth/login",
		Payload:      adminPayload,
		ExpectedCode: 200,
	})
	results = append(results, result)

	// Extract admin token
	if result.Success && result.Response != "" {
		var authResp AuthResponse
		if err := json.Unmarshal([]byte(result.Response), &authResp); err == nil {
			adminToken = authResp.Token
			logger.Printf("✅ Admin token extracted: %s...", adminToken[:min(20, len(adminToken))])
			fmt.Println("✅ Admin login successful")
		}
	}
	sleep()

	// Test login with user credentials
	userPayload := map[string]interface{}{
		"email":    "testuser@example.com",
		"password": "password123",
	}

	results = append(results, makeRequest(TestRequest{
		Name:         "User Login",
		Method:       "POST",
		URL:          API_URL + "/auth/login",
		Payload:      userPayload,
		ExpectedCode: 200,
	}))
	sleep()

	// Test forgot password
	forgotPayload := map[string]interface{}{
		"email": "testuser@example.com",
	}

	results = append(results, makeRequest(TestRequest{
		Name:         "Forgot Password",
		Method:       "POST",
		URL:          API_URL + "/auth/forgot-password",
		Payload:      forgotPayload,
		ExpectedCode: 200,
	}))
	sleep()

	return results
}

// Test user-specific endpoints (require user authentication)
func testUserEndpoints() []TestResult {
	results := []TestResult{}

	headers := map[string]string{
		"Authorization": "Bearer " + userToken,
	}

	// Get user profile
	results = append(results, makeRequest(TestRequest{
		Name:         "Get User Profile",
		Method:       "GET",
		URL:          API_URL + "/user/profile",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Update user profile
	updatePayload := map[string]interface{}{
		"first_name": "Updated",
		"last_name":  "Name",
		"phone":      "+46701234567",
	}

	results = append(results, makeRequest(TestRequest{
		Name:         "Update User Profile",
		Method:       "PUT",
		URL:          API_URL + "/user/profile",
		Headers:      headers,
		Payload:      updatePayload,
		ExpectedCode: 200,
	}))
	sleep()

	// Get user addresses
	results = append(results, makeRequest(TestRequest{
		Name:         "Get User Addresses",
		Method:       "GET",
		URL:          API_URL + "/user/addresses",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Create user address
	addressPayload := map[string]interface{}{
		"first_name":    "Test",
		"last_name":     "User",
		"address_line1": "Test Street 123",
		"city":          "Stockholm",
		"postal_code":   "12345",
		"country":       "Sweden",
		"is_default":    true,
	}

	results = append(results, makeRequest(TestRequest{
		Name:         "Create User Address",
		Method:       "POST",
		URL:          API_URL + "/user/addresses",
		Headers:      headers,
		Payload:      addressPayload,
		ExpectedCode: 201,
	}))
	sleep()

	// Change password
	passwordPayload := map[string]interface{}{
		"current_password": "password123",
		"new_password":     "newpassword456",
	}

	results = append(results, makeRequest(TestRequest{
		Name:         "Change User Password",
		Method:       "POST",
		URL:          API_URL + "/user/change-password",
		Headers:      headers,
		Payload:      passwordPayload,
		ExpectedCode: 200,
	}))
	sleep()

	return results
}

// Test admin-specific endpoints (require admin authentication)
func testAdminEndpoints() []TestResult {
	results := []TestResult{}

	headers := map[string]string{
		"Authorization": "Bearer " + adminToken,
	}

	// Get dashboard analytics
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Admin Dashboard",
		Method:       "GET",
		URL:          API_URL + "/admin/analytics/dashboard",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Create product
	productPayload := map[string]interface{}{
		"name":        "Test Product",
		"slug":        "test-product-" + strconv.FormatInt(time.Now().Unix(), 10),
		"description": "A test product for endpoint testing",
		"sku":         "TEST-" + strconv.FormatInt(time.Now().Unix(), 10),
		"price":       99.99,
		"category_id": 1,
		"inventory":   50,
		"is_active":   true,
	}

	result := makeRequest(TestRequest{
		Name:         "Create Product",
		Method:       "POST",
		URL:          API_URL + "/admin/products",
		Headers:      headers,
		Payload:      productPayload,
		ExpectedCode: 201,
	})
	results = append(results, result)

	// Extract product ID for future tests
	if result.Success && result.Response != "" {
		var product Product
		if err := json.Unmarshal([]byte(result.Response), &product); err == nil {
			testProductID = product.ID
			logger.Printf("✅ Test product created with ID: %d", testProductID)
			fmt.Printf("✅ Test product created (ID: %d)\n", testProductID)
		}
	}
	sleep()

	// Update product (if we have a product ID)
	if testProductID > 0 {
		updateProductPayload := map[string]interface{}{
			"name":        "Updated Test Product",
			"description": "Updated description for test product",
			"price":       129.99,
			"inventory":   75,
		}

		results = append(results, makeRequest(TestRequest{
			Name:         "Update Product",
			Method:       "PUT",
			URL:          API_URL + "/admin/products/" + strconv.Itoa(testProductID),
			Headers:      headers,
			Payload:      updateProductPayload,
			ExpectedCode: 200,
		}))
		sleep()

		// Get single product
		results = append(results, makeRequest(TestRequest{
			Name:         "Get Single Product",
			Method:       "GET",
			URL:          API_URL + "/products/" + strconv.Itoa(testProductID),
			ExpectedCode: 200,
		}))
		sleep()
	}

	// Get all orders (admin view)
	results = append(results, makeRequest(TestRequest{
		Name:         "Get All Orders (Admin)",
		Method:       "GET",
		URL:          API_URL + "/admin/orders",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Get sales analytics
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Sales Analytics",
		Method:       "GET",
		URL:          API_URL + "/admin/analytics/sales?days=30",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Get top products
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Top Products",
		Method:       "GET",
		URL:          API_URL + "/admin/analytics/products?days=30&limit=5",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Get customer analytics
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Customer Analytics",
		Method:       "GET",
		URL:          API_URL + "/admin/analytics/customers?days=30",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Get inventory alerts
	results = append(results, makeRequest(TestRequest{
		Name:         "Get Inventory Alerts",
		Method:       "GET",
		URL:          API_URL + "/admin/analytics/inventory",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Test user trying to access admin endpoint (should fail)
	if userToken != "" {
		userHeaders := map[string]string{
			"Authorization": "Bearer " + userToken,
		}

		results = append(results, makeRequest(TestRequest{
			Name:         "User Access Admin Endpoint (Should Fail)",
			Method:       "GET",
			URL:          API_URL + "/admin/analytics/dashboard",
			Headers:      userHeaders,
			ExpectedCode: 403,
		}))
		sleep()
	}

	return results
}

// Test order workflows
func testOrderWorkflows() []TestResult {
	results := []TestResult{}

	headers := map[string]string{
		"Authorization": "Bearer " + userToken,
	}

	// Create order
	orderPayload := map[string]interface{}{
		"items": []map[string]interface{}{
			{
				"product_id": 1, // Assuming product ID 1 exists
				"quantity":   2,
			},
			{
				"product_id": 2, // Assuming product ID 2 exists
				"quantity":   1,
			},
		},
		"shipping_address": map[string]interface{}{
			"first_name":    "Test",
			"last_name":     "User",
			"address_line1": "Test Street 123",
			"city":          "Stockholm",
			"postal_code":   "12345",
			"country":       "Sweden",
		},
		"payment_method": "card",
	}

	result := makeRequest(TestRequest{
		Name:         "Create Order",
		Method:       "POST",
		URL:          API_URL + "/orders",
		Headers:      headers,
		Payload:      orderPayload,
		ExpectedCode: 201,
	})
	results = append(results, result)

	// Extract order ID for future tests
	if result.Success && result.Response != "" {
		var order Order
		if err := json.Unmarshal([]byte(result.Response), &order); err == nil {
			testOrderID = order.ID
			logger.Printf("✅ Test order created with ID: %d", testOrderID)
			fmt.Printf("✅ Test order created (ID: %d)\n", testOrderID)
		}
	}
	sleep()

	// Get user orders
	results = append(results, makeRequest(TestRequest{
		Name:         "Get User Orders",
		Method:       "GET",
		URL:          API_URL + "/orders",
		Headers:      headers,
		ExpectedCode: 200,
	}))
	sleep()

	// Get specific order (if we have an order ID)
	if testOrderID > 0 {
		results = append(results, makeRequest(TestRequest{
			Name:         "Get Specific Order",
			Method:       "GET",
			URL:          API_URL + "/orders/" + strconv.Itoa(testOrderID),
			Headers:      headers,
			ExpectedCode: 200,
		}))
		sleep()

		// Update order status (admin action)
		if adminToken != "" {
			adminHeaders := map[string]string{
				"Authorization": "Bearer " + adminToken,
			}

			statusPayload := map[string]interface{}{
				"status": "processing",
			}

			results = append(results, makeRequest(TestRequest{
				Name:         "Update Order Status",
				Method:       "PATCH",
				URL:          API_URL + "/admin/orders/" + strconv.Itoa(testOrderID),
				Headers:      adminHeaders,
				Payload:      statusPayload,
				ExpectedCode: 200,
			}))
			sleep()
		}
	}

	return results
}

// Test error handling and edge cases
func testErrorHandling() []TestResult {
	results := []TestResult{}

	// Test malformed JSON
	results = append(results, makeRequest(TestRequest{
		Name:         "Malformed JSON",
		Method:       "POST",
		URL:          API_URL + "/auth/register",
		RawPayload:   `{"email": "test@example.com", "password":}`,
		ExpectedCode: 400,
	}))
	sleep()

	// Test missing required fields
	results = append(results, makeRequest(TestRequest{
		Name:         "Missing Required Fields",
		Method:       "POST",
		URL:          API_URL + "/auth/register",
		Payload:      map[string]interface{}{"email": "test@example.com"},
		ExpectedCode: 400,
	}))
	sleep()

	// Test invalid email format
	results = append(results, makeRequest(TestRequest{
		Name:   "Invalid Email Format",
		Method: "POST",
		URL:    API_URL + "/auth/register",
		Payload: map[string]interface{}{
			"email":      "invalid-email",
			"password":   "password123",
			"first_name": "Test",
			"last_name":  "User",
		},
		ExpectedCode: 400,
	}))
	sleep()

	// Test unauthorized access
	results = append(results, makeRequest(TestRequest{
		Name:         "Unauthorized Access",
		Method:       "GET",
		URL:          API_URL + "/user/profile",
		ExpectedCode: 401,
	}))
	sleep()

	// Test invalid token
	invalidHeaders := map[string]string{
		"Authorization": "Bearer invalid-token-here",
	}

	results = append(results, makeRequest(TestRequest{
		Name:         "Invalid Token",
		Method:       "GET",
		URL:          API_URL + "/user/profile",
		Headers:      invalidHeaders,
		ExpectedCode: 401,
	}))
	sleep()

	// Test nonexistent endpoint
	results = append(results, makeRequest(TestRequest{
		Name:         "Nonexistent Endpoint",
		Method:       "GET",
		URL:          API_URL + "/nonexistent",
		ExpectedCode: 404,
	}))
	sleep()

	// Test method not allowed
	results = append(results, makeRequest(TestRequest{
		Name:         "Method Not Allowed",
		Method:       "DELETE",
		URL:          API_URL + "/auth/login",
		ExpectedCode: 405,
	}))
	sleep()

	return results
}

// TestRequest structure for making HTTP requests
type TestRequest struct {
	Name         string
	Method       string
	URL          string
	Headers      map[string]string
	Payload      map[string]interface{}
	RawPayload   string
	ExpectedCode int
}

// Make HTTP request and return test result
func makeRequest(req TestRequest) TestResult {
	startTime := time.Now()

	result := TestResult{
		TestName:     req.Name,
		Method:       req.Method,
		URL:          req.URL,
		ExpectedCode: req.ExpectedCode,
	}

	var body io.Reader
	if req.RawPayload != "" {
		body = strings.NewReader(req.RawPayload)
	} else if req.Payload != nil {
		jsonData, err := json.Marshal(req.Payload)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to marshal JSON: %v", err)
			result.Duration = time.Since(startTime)
			logResult(result)
			return result
		}
		body = bytes.NewReader(jsonData)
	}

	httpReq, err := http.NewRequest(req.Method, req.URL, body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		result.Duration = time.Since(startTime)
		logResult(result)
		return result
	}

	// Set headers
	if req.Payload != nil || req.RawPayload != "" {
		httpReq.Header.Set("Content-Type", "application/json")
	}
	for key, value := range req.Headers {
		httpReq.Header.Set(key, value)
	}

	// Make the request
	resp, err := client.Do(httpReq)
	if err != nil {
		result.Error = fmt.Sprintf("Request failed: %v", err)
		result.Duration = time.Since(startTime)
		logResult(result)
		return result
	}
	defer resp.Body.Close()

	// Read response
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to read response: %v", err)
		result.Duration = time.Since(startTime)
		logResult(result)
		return result
	}

	result.StatusCode = resp.StatusCode
	result.Response = string(responseBody)
	result.Success = resp.StatusCode == req.ExpectedCode
	result.Duration = time.Since(startTime)

	if !result.Success {
		result.Error = fmt.Sprintf("Expected status %d, got %d", req.ExpectedCode, resp.StatusCode)
	}

	logResult(result)
	return result
}

// Log test result
func logResult(result TestResult) {
	status := "PASS"
	if !result.Success {
		status = "FAIL"
	}

	logMsg := fmt.Sprintf("[%s] %s - %s %s (Expected: %d, Got: %d, Duration: %v)",
		status, result.TestName, result.Method, result.URL,
		result.ExpectedCode, result.StatusCode, result.Duration)

	logger.Println(logMsg)

	if result.Error != "" {
		logger.Printf("    Error: %s", result.Error)
	}

	if result.Response != "" && len(result.Response) < 500 {
		logger.Printf("    Response: %s", result.Response)
	} else if len(result.Response) >= 500 {
		logger.Printf("    Response: %s... (truncated)", result.Response[:497])
	}

	// Console output
	emoji := "✅"
	if !result.Success {
		emoji = "❌"
	}

	fmt.Printf("  %s %s (%d) - %v\n", emoji, result.TestName, result.StatusCode, result.Duration)

	if !result.Success {
		fmt.Printf("    Error: %s\n", result.Error)
	}
}

// Generate summary report
func generateSummaryReport(results []TestResult) {
	totalTests := len(results)
	passedTests := 0
	failedTests := 0
	totalDuration := time.Duration(0)

	for _, result := range results {
		if result.Success {
			passedTests++
		} else {
			failedTests++
		}
		totalDuration += result.Duration
	}

	// Log summary
	logger.Println("\n=== TEST SUMMARY ===")
	logger.Printf("Total Tests: %d", totalTests)
	logger.Printf("Passed: %d", passedTests)
	logger.Printf("Failed: %d", failedTests)
	logger.Printf("Success Rate: %.2f%%", float64(passedTests)/float64(totalTests)*100)
	logger.Printf("Total Duration: %v", totalDuration)
	logger.Printf("Average Duration: %v", totalDuration/time.Duration(totalTests))

	// Console summary
	fmt.Println("\n🎯 TEST SUMMARY")
	fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
	fmt.Printf("📊 Total Tests:    %d\n", totalTests)
	fmt.Printf("✅ Passed:         %d\n", passedTests)
	fmt.Printf("❌ Failed:         %d\n", failedTests)
	fmt.Printf("📈 Success Rate:   %.2f%%\n", float64(passedTests)/float64(totalTests)*100)
	fmt.Printf("⏱️  Total Duration: %v\n", totalDuration)
	fmt.Printf("⚡ Avg Duration:   %v\n", totalDuration/time.Duration(totalTests))
	fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

	if failedTests > 0 {
		fmt.Println("\n❌ FAILED TESTS:")
		for _, result := range results {
			if !result.Success {
				fmt.Printf("  • %s - %s (Expected: %d, Got: %d)\n",
					result.TestName, result.Error, result.ExpectedCode, result.StatusCode)
			}
		}
	}

	fmt.Printf("\n📋 Detailed results logged to: %s\n", LOG_FILE)

	if passedTests == totalTests {
		fmt.Println("🎉 ALL TESTS PASSED! Your backend is working perfectly! 🎉")
	} else if float64(passedTests)/float64(totalTests) >= 0.8 {
		fmt.Println("👍 Most tests passed! Your backend is mostly functional.")
	} else {
		fmt.Println("⚠️  Several tests failed. Please review the backend implementation.")
	}
}

// Helper function to sleep between requests
func sleep() {
	fmt.Printf("    💤 Waiting %v before next request...\n", SLEEP_TIME)
	time.Sleep(SLEEP_TIME)
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
