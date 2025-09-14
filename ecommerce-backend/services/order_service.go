// services/order_service.go - Order management business logic
package services

import (
	"database/sql"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"ecommerce-backend/models"
)

type OrderService struct {
	db *sql.DB
}

func NewOrderService(db *sql.DB) *OrderService {
	return &OrderService{db: db}
}

// CreateOrder creates a new order from cart items
func (s *OrderService) CreateOrder(req *CreateOrderRequest) (*models.Order, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Generate order number
	orderNumber := s.generateOrderNumber()

	// Calculate order totals
	subtotal, err := s.calculateSubtotal(req.Items)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate subtotal: %w", err)
	}

	taxAmount := subtotal * 0.25 // 25% Swedish VAT
	shippingAmount := s.calculateShipping(req.ShippingMethod, subtotal)
	totalAmount := subtotal + taxAmount + shippingAmount - req.DiscountAmount

	// Create order record
	query := `
		INSERT INTO orders (
			order_number, user_id, status, payment_status, payment_method, shipping_method,
			customer_email, customer_phone, subtotal, tax_amount, shipping_amount, 
			discount_amount, total_amount, shipping_address, billing_address, notes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		) RETURNING id, created_at, updated_at
	`

	var order models.Order
	err = tx.QueryRow(
		query,
		orderNumber, req.UserID, "pending", "pending", req.PaymentMethod, req.ShippingMethod,
		req.CustomerEmail, req.CustomerPhone, subtotal, taxAmount, shippingAmount,
		req.DiscountAmount, totalAmount, req.ShippingAddress, req.BillingAddress, req.Notes,
	).Scan(&order.ID, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// Set order fields
	order.OrderNumber = orderNumber
	order.UserID = req.UserID
	order.Status = "pending"
	order.PaymentStatus = "pending"
	order.PaymentMethod = req.PaymentMethod
	order.ShippingMethod = req.ShippingMethod
	order.CustomerEmail = req.CustomerEmail
	order.CustomerPhone = req.CustomerPhone
	order.Subtotal = subtotal
	order.TaxAmount = taxAmount
	order.ShippingAmount = shippingAmount
	order.DiscountAmount = req.DiscountAmount
	order.TotalAmount = totalAmount
	order.Notes = req.Notes

	// Create order items and update inventory
	for _, item := range req.Items {
		// Get product details and check inventory
		product, err := s.getProductForOrder(item.ProductID)
		if err != nil {
			return nil, fmt.Errorf("failed to get product %d: %w", item.ProductID, err)
		}

		if product.Inventory < item.Quantity {
			return nil, fmt.Errorf("insufficient inventory for product %s", product.Name)
		}

		// Create order item
		itemQuery := `
			INSERT INTO order_items (order_id, product_id, sku, name, price, quantity, total)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`

		itemTotal := product.Price * float64(item.Quantity)
		_, err = tx.Exec(itemQuery, order.ID, item.ProductID, product.SKU, product.Name, product.Price, item.Quantity, itemTotal)
		if err != nil {
			return nil, fmt.Errorf("failed to create order item: %w", err)
		}

		// Update product inventory
		inventoryQuery := `UPDATE products SET inventory = inventory - $1 WHERE id = $2`
		_, err = tx.Exec(inventoryQuery, item.Quantity, item.ProductID)
		if err != nil {
			return nil, fmt.Errorf("failed to update inventory: %w", err)
		}
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load complete order with items
	return s.GetOrderByID(order.ID)
}

// GetOrderByID retrieves a complete order by ID
func (s *OrderService) GetOrderByID(orderID int) (*models.Order, error) {
	// Get order details
	orderQuery := `
		SELECT 
			id, order_number, user_id, status, payment_status, payment_method, shipping_method,
			customer_email, customer_phone, subtotal, tax_amount, shipping_amount,
			discount_amount, total_amount, shipping_address, billing_address, notes,
			tracking_number, fulfillment_date, created_at, updated_at
		FROM orders 
		WHERE id = $1
	`

	var order models.Order
	err := s.db.QueryRow(orderQuery, orderID).Scan(
		&order.ID, &order.OrderNumber, &order.UserID, &order.Status, &order.PaymentStatus,
		&order.PaymentMethod, &order.ShippingMethod, &order.CustomerEmail, &order.CustomerPhone,
		&order.Subtotal, &order.TaxAmount, &order.ShippingAmount, &order.DiscountAmount,
		&order.TotalAmount, &order.ShippingJSON, &order.BillingJSON, &order.Notes,
		&order.TrackingNumber, &order.FulfillmentDate, &order.CreatedAt, &order.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("order not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}

	// Convert JSON addresses to Address structs
	if order.ShippingJSON != nil {
		order.ShippingAddress = &models.Address{
			FirstName:    order.ShippingJSON.FirstName,
			LastName:     order.ShippingJSON.LastName,
			Company:      order.ShippingJSON.Company,
			AddressLine1: order.ShippingJSON.AddressLine1,
			AddressLine2: order.ShippingJSON.AddressLine2,
			City:         order.ShippingJSON.City,
			PostalCode:   order.ShippingJSON.PostalCode,
			Country:      order.ShippingJSON.Country,
		}
	}

	if order.BillingJSON != nil {
		order.BillingAddress = &models.Address{
			FirstName:    order.BillingJSON.FirstName,
			LastName:     order.BillingJSON.LastName,
			Company:      order.BillingJSON.Company,
			AddressLine1: order.BillingJSON.AddressLine1,
			AddressLine2: order.BillingJSON.AddressLine2,
			City:         order.BillingJSON.City,
			PostalCode:   order.BillingJSON.PostalCode,
			Country:      order.BillingJSON.Country,
		}
	}

	// Get order items
	itemsQuery := `
		SELECT 
			oi.id, oi.product_id, oi.sku, oi.name, oi.price, oi.quantity, oi.total,
			p.slug, p.images
		FROM order_items oi
		LEFT JOIN products p ON oi.product_id = p.id
		WHERE oi.order_id = $1
		ORDER BY oi.id
	`

	rows, err := s.db.Query(itemsQuery, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		var productSlug sql.NullString
		var productImages models.ImageList

		err := rows.Scan(
			&item.ID, &item.ProductID, &item.SKU, &item.Name, &item.Price,
			&item.Quantity, &item.Total, &productSlug, &productImages,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order item: %w", err)
		}

		item.OrderID = orderID

		// Add basic product info if available
		if productSlug.Valid {
			item.Product = &models.Product{
				ID:     item.ProductID,
				Slug:   productSlug.String,
				Images: productImages,
			}
		}

		items = append(items, item)
	}

	order.Items = items
	return &order, nil
}

// GetUserOrders retrieves orders for a specific user
func (s *OrderService) GetUserOrders(userID int, page, limit int) (*OrderResult, error) {
	offset := (page - 1) * limit

	// Count total orders
	countQuery := `SELECT COUNT(*) FROM orders WHERE user_id = $1`
	var total int
	err := s.db.QueryRow(countQuery, userID).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count orders: %w", err)
	}

	// Get orders
	ordersQuery := `
		SELECT 
			id, order_number, status, payment_status, total_amount, created_at
		FROM orders 
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(ordersQuery, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query orders: %w", err)
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		err := rows.Scan(
			&order.ID, &order.OrderNumber, &order.Status,
			&order.PaymentStatus, &order.TotalAmount, &order.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		orders = append(orders, order)
	}

	pages := (total + limit - 1) / limit

	return &OrderResult{
		Orders: orders,
		Total:  total,
		Page:   page,
		Limit:  limit,
		Pages:  pages,
	}, nil
}

// UpdateOrderStatus updates the status of an order (admin only)
func (s *OrderService) UpdateOrderStatus(orderID int, status string) error {
	validStatuses := []string{"pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"}
	if !contains(validStatuses, status) {
		return fmt.Errorf("invalid status: %s", status)
	}

	query := `UPDATE orders SET status = $1 WHERE id = $2`
	result, err := s.db.Exec(query, status, orderID)
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// UpdatePaymentStatus updates the payment status of an order
func (s *OrderService) UpdatePaymentStatus(orderID int, status string) error {
	validStatuses := []string{"pending", "paid", "failed", "refunded", "partially_refunded"}
	if !contains(validStatuses, status) {
		return fmt.Errorf("invalid payment status: %s", status)
	}

	query := `UPDATE orders SET payment_status = $1 WHERE id = $2`
	result, err := s.db.Exec(query, status, orderID)
	if err != nil {
		return fmt.Errorf("failed to update payment status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// AddTrackingNumber adds tracking information to an order
func (s *OrderService) AddTrackingNumber(orderID int, trackingNumber string) error {
	query := `
		UPDATE orders 
		SET tracking_number = $1, status = CASE WHEN status = 'processing' THEN 'shipped' ELSE status END
		WHERE id = $2
	`

	result, err := s.db.Exec(query, trackingNumber, orderID)
	if err != nil {
		return fmt.Errorf("failed to add tracking number: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("order not found")
	}

	return nil
}

// GetAllOrders retrieves all orders (admin only)
func (s *OrderService) GetAllOrders(filters OrderFilters) (*OrderResult, error) {
	query := `
		SELECT 
			o.id, o.order_number, o.user_id, o.status, o.payment_status,
			o.customer_email, o.total_amount, o.created_at,
			u.first_name, u.last_name
		FROM orders o
		LEFT JOIN users u ON o.user_id = u.id
		WHERE 1=1
	`

	var args []interface{}
	argCount := 0

	// Apply filters
	if filters.Status != "" {
		argCount++
		query += fmt.Sprintf(" AND o.status = $%d", argCount)
		args = append(args, filters.Status)
	}

	if filters.PaymentStatus != "" {
		argCount++
		query += fmt.Sprintf(" AND o.payment_status = $%d", argCount)
		args = append(args, filters.PaymentStatus)
	}

	if filters.CustomerEmail != "" {
		argCount++
		query += fmt.Sprintf(" AND o.customer_email ILIKE $%d", argCount)
		args = append(args, "%"+filters.CustomerEmail+"%")
	}

	if !filters.DateFrom.IsZero() {
		argCount++
		query += fmt.Sprintf(" AND o.created_at >= $%d", argCount)
		args = append(args, filters.DateFrom)
	}

	if !filters.DateTo.IsZero() {
		argCount++
		query += fmt.Sprintf(" AND o.created_at <= $%d", argCount)
		args = append(args, filters.DateTo)
	}

	// Count total
	countQuery := strings.Replace(query, `SELECT 
			o.id, o.order_number, o.user_id, o.status, o.payment_status,
			o.customer_email, o.total_amount, o.created_at,
			u.first_name, u.last_name
		FROM orders o
		LEFT JOIN users u ON o.user_id = u.id`, "SELECT COUNT(*) FROM orders o LEFT JOIN users u ON o.user_id = u.id", 1)

	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count orders: %w", err)
	}

	// Add sorting and pagination
	query += " ORDER BY o.created_at DESC"

	if filters.Limit > 0 {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, filters.Limit)

		if filters.Offset > 0 {
			argCount++
			query += fmt.Sprintf(" OFFSET $%d", argCount)
			args = append(args, filters.Offset)
		}
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query orders: %w", err)
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		var firstName, lastName sql.NullString

		err := rows.Scan(
			&order.ID, &order.OrderNumber, &order.UserID, &order.Status,
			&order.PaymentStatus, &order.CustomerEmail, &order.TotalAmount,
			&order.CreatedAt, &firstName, &lastName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}

		orders = append(orders, order)
	}

	pages := (total + filters.Limit - 1) / filters.Limit

	return &OrderResult{
		Orders: orders,
		Total:  total,
		Page:   filters.Page,
		Limit:  filters.Limit,
		Pages:  pages,
	}, nil
}

// Helper methods
func (s *OrderService) generateOrderNumber() string {
	timestamp := time.Now().Format("20060102")
	random := rand.Intn(9999)
	return fmt.Sprintf("ORD-%s-%04d", timestamp, random)
}

func (s *OrderService) calculateSubtotal(items []models.CartItem) (float64, error) {
	if len(items) == 0 {
		return 0, fmt.Errorf("no items in order")
	}

	var total float64
	for _, item := range items {
		product, err := s.getProductForOrder(item.ProductID)
		if err != nil {
			return 0, err
		}
		total += product.Price * float64(item.Quantity)
	}

	return total, nil
}

func (s *OrderService) calculateShipping(method string, subtotal float64) float64 {
	// Free shipping over 500 SEK
	if subtotal >= 500 {
		return 0
	}

	switch method {
	case "standard":
		return 49
	case "express":
		return 99
	default:
		return 49
	}
}

func (s *OrderService) getProductForOrder(productID int) (*models.Product, error) {
	query := `
		SELECT id, name, slug, sku, price, inventory, is_active
		FROM products 
		WHERE id = $1 AND is_active = true
	`

	var product models.Product
	err := s.db.QueryRow(query, productID).Scan(
		&product.ID, &product.Name, &product.Slug, &product.SKU,
		&product.Price, &product.Inventory, &product.IsActive,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("product not found or inactive")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	return &product, nil
}

// Helper types
type CreateOrderRequest struct {
	UserID          *int                `json:"user_id,omitempty"`
	Items           []models.CartItem   `json:"items" binding:"required"`
	CustomerEmail   string              `json:"customer_email" binding:"required,email"`
	CustomerPhone   string              `json:"customer_phone,omitempty"`
	PaymentMethod   string              `json:"payment_method" binding:"required"`
	ShippingMethod  string              `json:"shipping_method" binding:"required"`
	ShippingAddress *models.AddressJSON `json:"shipping_address" binding:"required"`
	BillingAddress  *models.AddressJSON `json:"billing_address" binding:"required"`
	DiscountAmount  float64             `json:"discount_amount,omitempty"`
	Notes           string              `json:"notes,omitempty"`
}

type OrderResult struct {
	Orders []models.Order `json:"orders"`
	Total  int            `json:"total"`
	Page   int            `json:"page"`
	Limit  int            `json:"limit"`
	Pages  int            `json:"pages"`
}

type OrderFilters struct {
	Status        string    `json:"status"`
	PaymentStatus string    `json:"payment_status"`
	CustomerEmail string    `json:"customer_email"`
	DateFrom      time.Time `json:"date_from"`
	DateTo        time.Time `json:"date_to"`
	Page          int       `json:"page"`
	Limit         int       `json:"limit"`
	Offset        int       `json:"offset"`
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
