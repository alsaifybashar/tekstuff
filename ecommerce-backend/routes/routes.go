// routes/routes.go - API route definitions and handlers
package routes

import (
	"net/http"
	"strconv"

	"ecommerce-backend/middleware"
	"ecommerce-backend/models"
	"ecommerce-backend/services"

	"github.com/gin-gonic/gin"
)

// ===== Helpers =====

func getPageLimitOffset(c *gin.Context) (page, limit, offset int) {
	page = c.GetInt("Page")
	limit = c.GetInt("Limit")
	offset = c.GetInt("Offset")

	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = (page - 1) * limit
	}
	return
}

// ===== Route Setup =====

// SetupProductRoutes configures product-related routes
func SetupProductRoutes(router *gin.RouterGroup, productService *services.ProductService) {
	products := router.Group("/products")
	{
		products.GET("", middleware.Paginate(), getProducts(productService))

		// IMPORTANT: static route FIRST, param route AFTER to avoid /products/categories being captured by :slug
		products.GET("/categories", getCategories(productService))
		products.GET("/:slug", getProductBySlug(productService))
	}
}

// SetupAuthRoutes configures authentication routes
func SetupAuthRoutes(router *gin.RouterGroup, authService *services.AuthService, emailService *services.EmailService) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", register(authService, emailService))
		auth.POST("/login", login(authService))
		auth.POST("/forgot-password", forgotPassword(authService, emailService))
		auth.POST("/reset-password", resetPassword(authService))
	}
}

// SetupUserRoutes configures user profile routes (expected to be used behind auth middleware upstream)
func SetupUserRoutes(router *gin.RouterGroup, authService *services.AuthService) {
	users := router.Group("/user")
	{
		users.GET("/profile", getUserProfile(authService))
		users.PUT("/profile", updateUserProfile(authService))
		users.POST("/change-password", changePassword(authService))

		// Address management
		users.GET("/addresses", getUserAddresses(authService))
		users.POST("/addresses", createAddress(authService))
		users.PUT("/addresses/:id", updateAddress(authService))
		users.DELETE("/addresses/:id", deleteAddress(authService))
	}
}

// SetupOrderRoutes configures order management routes (expected to be used behind auth middleware upstream)
func SetupOrderRoutes(router *gin.RouterGroup, orderService *services.OrderService, emailService *services.EmailService) {
	orders := router.Group("/orders")
	{
		orders.POST("", middleware.ValidateJSON(), createOrder(orderService, emailService))
		orders.GET("", middleware.Paginate(), getUserOrders(orderService))
		orders.GET("/:id", getOrderByID(orderService))
	}
}

// SetupAdminRoutes configures admin-only routes (apply admin auth middleware at a higher router level)
func SetupAdminRoutes(router *gin.RouterGroup, productService *services.ProductService, orderService *services.OrderService, analyticsService *services.AnalyticsService) {
	// Product management
	router.POST("/products", middleware.ValidateJSON(), createProduct(productService))
	router.PUT("/products/:id", middleware.ValidateJSON(), updateProduct(productService))
	router.DELETE("/products/:id", deleteProduct(productService))
	router.PATCH("/products/:id/inventory", updateInventory(productService))

	// Order management
	router.GET("/orders", middleware.Paginate(), getAllOrders(orderService))
	router.PATCH("/orders/:id/status", updateOrderStatus(orderService))
	router.PATCH("/orders/:id/payment", updatePaymentStatus(orderService))
	router.POST("/orders/:id/tracking", addTrackingNumber(orderService))

	// Analytics
	router.GET("/analytics/dashboard", getDashboardStats(analyticsService))
	router.GET("/analytics/sales", getSalesData(analyticsService))
	router.GET("/analytics/products", getTopProducts(analyticsService))
	router.GET("/analytics/customers", getCustomerStats(analyticsService))
	router.GET("/analytics/inventory", getInventoryAlerts(analyticsService))
	router.GET("/analytics/categories", getRevenueByCategory(analyticsService))
}

// ===== Product handlers =====

func getProducts(service *services.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, limit, offset := getPageLimitOffset(c)

		filters := services.ProductFilters{
			Page:            page,
			Limit:           limit,
			Offset:          offset,
			IncludeInactive: c.Query("include_inactive") == "true",
			Featured:        c.Query("featured") == "true",
			InStock:         c.Query("in_stock") == "true",
			Search:          c.Query("search"),
			Brand:           c.Query("brand"),
			Sort:            c.DefaultQuery("sort", "newest"),
		}

		if categoryID := c.Query("category_id"); categoryID != "" {
			if id, err := strconv.Atoi(categoryID); err == nil {
				filters.CategoryID = id
			}
		}

		if minPrice := c.Query("min_price"); minPrice != "" {
			if price, err := strconv.ParseFloat(minPrice, 64); err == nil {
				filters.MinPrice = price
			}
		}

		if maxPrice := c.Query("max_price"); maxPrice != "" {
			if price, err := strconv.ParseFloat(maxPrice, 64); err == nil {
				filters.MaxPrice = price
			}
		}

		result, err := service.GetProducts(filters)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Calculate pages safely
		if result.Limit > 0 {
			result.Pages = (result.Total + result.Limit - 1) / result.Limit
		}

		c.JSON(http.StatusOK, result)
	}
}

func getProductBySlug(service *services.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := c.Param("slug")

		product, err := service.GetProductBySlug(slug)
		if err != nil {
			if err.Error() == "product not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, product)
	}
}

func getCategories(service *services.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		categories, err := service.GetCategories()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"categories": categories})
	}
}

func createProduct(service *services.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var product models.Product
		if err := c.ShouldBindJSON(&product); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := service.CreateProduct(&product); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, product)
	}
}

func updateProduct(service *services.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
			return
		}

		var updates models.Product
		if err := c.ShouldBindJSON(&updates); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := service.UpdateProduct(id, &updates); err != nil {
			if err.Error() == "product not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Product updated successfully"})
	}
}

func deleteProduct(service *services.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
			return
		}

		if err := service.DeleteProduct(id); err != nil {
			if err.Error() == "product not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
	}
}

func updateInventory(service *services.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
			return
		}

		var request struct {
			Quantity int `json:"quantity" binding:"required"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := service.UpdateInventory(id, request.Quantity); err != nil {
			if err.Error() == "product not found or inactive" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Inventory updated successfully"})
	}
}

// ===== Authentication handlers =====

// Fix 4: Update routes/routes.go - Fix the authentication handlers

// The register function was incorrectly implemented
func register(authService *services.AuthService, emailService *services.EmailService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req services.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		response, err := authService.Register(&req)
		if err != nil {
			if err.Error() == "user with this email already exists" {
				c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Send welcome email
		go emailService.SendWelcomeEmail(response.User)

		c.JSON(http.StatusCreated, response)
	}
}

// The login function needs to be more robust
func login(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req services.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		response, err := authService.Login(&req)
		if err != nil {
			if err.Error() == "invalid email or password" || err.Error() == "account is deactivated" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, response)
	}
}

func forgotPassword(authService *services.AuthService, emailService *services.EmailService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Email string `json:"email" binding:"required,email"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate reset token (stub; replace with secure implementation)
		resetToken := "reset-token-" + req.Email

		// Send reset email (async)
		go emailService.SendPasswordResetEmail(req.Email, resetToken)

		c.JSON(http.StatusOK, gin.H{"message": "Password reset email sent"})
	}
}

func resetPassword(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Token       string `json:"token" binding:"required"`
			NewPassword string `json:"new_password" binding:"required,min=8"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// TODO: Validate token and reset password using authService
		c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
	}
}

// ===== User profile & addresses =====

func getUserProfile(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")

		user, err := authService.GetUserProfile(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}

func updateUserProfile(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")

		var req services.UpdateProfileRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := authService.UpdateUserProfile(userID, &req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}

func changePassword(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")

		var req services.ChangePasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := authService.ChangePassword(userID, &req); err != nil {
			if err.Error() == "current password is incorrect" {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
	}
}

func getUserAddresses(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")

		addresses, err := authService.GetUserAddresses(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"addresses": addresses})
	}
}

func createAddress(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")

		var address models.Address
		if err := c.ShouldBindJSON(&address); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		createdAddress, err := authService.CreateAddress(userID, &address)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, createdAddress)
	}
}

func updateAddress(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")
		addressID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid address ID"})
			return
		}

		var updates models.Address
		if err := c.ShouldBindJSON(&updates); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		updatedAddress, err := authService.UpdateAddress(userID, addressID, &updates)
		if err != nil {
			if err.Error() == "address not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, updatedAddress)
	}
}

func deleteAddress(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")
		addressID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid address ID"})
			return
		}

		if err := authService.DeleteAddress(userID, addressID); err != nil {
			if err.Error() == "address not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Address deleted successfully"})
	}
}

// ===== Orders (user) =====

func createOrder(orderService *services.OrderService, emailService *services.EmailService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req services.CreateOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Set user ID if authenticated
		if uid := c.GetInt("UserID"); uid > 0 {
			req.UserID = &uid
		}

		order, err := orderService.CreateOrder(&req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Send order confirmation email (async)
		go emailService.SendOrderConfirmation(order)

		c.JSON(http.StatusCreated, order)
	}
}

func getUserOrders(orderService *services.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetInt("UserID")
		page, limit, _ := getPageLimitOffset(c)

		result, err := orderService.GetUserOrders(userID, page, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

func getOrderByID(orderService *services.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		order, err := orderService.GetOrderByID(orderID)
		if err != nil {
			if err.Error() == "order not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Authorization: admin can see all; others only own orders
		userRole := c.GetString("UserRole")
		if userRole != "admin" {
			if _, exists := c.Get("UserID"); !exists {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
				return
			}
			if order.UserID == nil || *order.UserID != c.GetInt("UserID") {
				c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
				return
			}
		}

		c.JSON(http.StatusOK, order)
	}
}

// ===== Admin order handlers =====

func getAllOrders(orderService *services.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, _, offset := getPageLimitOffset(c)
		filters := services.OrderFilters{
			Page:          c.GetInt("Page"),
			Limit:         c.GetInt("Limit"),
			Offset:        offset,
			Status:        c.Query("status"),
			PaymentStatus: c.Query("payment_status"),
			CustomerEmail: c.Query("customer_email"),
		}

		result, err := orderService.GetAllOrders(filters)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

func updateOrderStatus(orderService *services.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var req struct {
			Status string `json:"status" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := orderService.UpdateOrderStatus(orderID, req.Status); err != nil {
			if err.Error() == "order not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
	}
}

func updatePaymentStatus(orderService *services.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var req struct {
			PaymentStatus string `json:"payment_status" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := orderService.UpdatePaymentStatus(orderID, req.PaymentStatus); err != nil {
			if err.Error() == "order not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Payment status updated successfully"})
	}
}

func addTrackingNumber(orderService *services.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
			return
		}

		var req struct {
			TrackingNumber string `json:"tracking_number" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := orderService.AddTrackingNumber(orderID, req.TrackingNumber); err != nil {
			if err.Error() == "order not found" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Tracking number added successfully"})
	}
}

// ===== Analytics handlers =====

func getDashboardStats(analyticsService *services.AnalyticsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		days := 30
		if d := c.Query("days"); d != "" {
			if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
				days = parsed
			}
		}

		stats, err := analyticsService.GetDashboardStats(days)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, stats)
	}
}

func getSalesData(analyticsService *services.AnalyticsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		days := 30
		if d := c.Query("days"); d != "" {
			if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
				days = parsed
			}
		}

		salesData, err := analyticsService.GetSalesData(days)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"sales_data": salesData})
	}
}

func getTopProducts(analyticsService *services.AnalyticsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		days := 30
		limit := 10

		if d := c.Query("days"); d != "" {
			if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
				days = parsed
			}
		}

		if l := c.Query("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
				limit = parsed
			}
		}

		products, err := analyticsService.GetTopProducts(days, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"top_products": products})
	}
}

func getCustomerStats(analyticsService *services.AnalyticsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		days := 30
		if d := c.Query("days"); d != "" {
			if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
				days = parsed
			}
		}

		stats, err := analyticsService.GetCustomerStats(days)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, stats)
	}
}

func getInventoryAlerts(analyticsService *services.AnalyticsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		alerts, err := analyticsService.GetInventoryAlerts()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, alerts)
	}
}

func getRevenueByCategory(analyticsService *services.AnalyticsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		days := 30
		if d := c.Query("days"); d != "" {
			if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
				days = parsed
			}
		}

		categories, err := analyticsService.GetRevenueByCategory(days)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"category_revenue": categories})
	}
}
