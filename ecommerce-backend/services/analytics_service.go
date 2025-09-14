// services/analytics_service.go - Analytics and business intelligence
package services

import (
	"database/sql"
	"fmt"
	"time"

	"ecommerce-backend/models"
)

type AnalyticsService struct {
	db *sql.DB
}

func NewAnalyticsService(db *sql.DB) *AnalyticsService {
	return &AnalyticsService{db: db}
}

// GetDashboardStats returns key performance indicators for admin dashboard
func (s *AnalyticsService) GetDashboardStats(days int) (*DashboardStats, error) {
	if days <= 0 {
		days = 30
	}

	startDate := time.Now().AddDate(0, 0, -days)

	var stats DashboardStats

	// Total revenue
	err := s.db.QueryRow(`
		SELECT COALESCE(SUM(total_amount), 0)
		FROM orders 
		WHERE created_at >= $1 AND payment_status = 'paid'
	`, startDate).Scan(&stats.TotalRevenue)
	if err != nil {
		return nil, fmt.Errorf("failed to get total revenue: %w", err)
	}

	// Total orders
	err = s.db.QueryRow(`
		SELECT COUNT(*)
		FROM orders 
		WHERE created_at >= $1
	`, startDate).Scan(&stats.TotalOrders)
	if err != nil {
		return nil, fmt.Errorf("failed to get total orders: %w", err)
	}

	// New customers
	err = s.db.QueryRow(`
		SELECT COUNT(*)
		FROM users 
		WHERE created_at >= $1 AND role = 'customer'
	`, startDate).Scan(&stats.NewCustomers)
	if err != nil {
		return nil, fmt.Errorf("failed to get new customers: %w", err)
	}

	// Average order value
	err = s.db.QueryRow(`
		SELECT COALESCE(AVG(total_amount), 0)
		FROM orders 
		WHERE created_at >= $1 AND payment_status = 'paid'
	`, startDate).Scan(&stats.AverageOrderValue)
	if err != nil {
		return nil, fmt.Errorf("failed to get average order value: %w", err)
	}

	// Conversion rate (orders / unique visitors - simplified)
	err = s.db.QueryRow(`
		SELECT CASE 
			WHEN COUNT(DISTINCT customer_email) > 0 THEN
				ROUND((COUNT(*)::float / COUNT(DISTINCT customer_email)::float) * 100, 2)
			ELSE 0
		END
		FROM orders 
		WHERE created_at >= $1
	`, startDate).Scan(&stats.ConversionRate)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversion rate: %w", err)
	}

	// Total products
	err = s.db.QueryRow(`
		SELECT COUNT(*) FROM products WHERE is_active = true
	`).Scan(&stats.TotalProducts)
	if err != nil {
		return nil, fmt.Errorf("failed to get total products: %w", err)
	}

	// Low stock products
	err = s.db.QueryRow(`
		SELECT COUNT(*) 
		FROM products 
		WHERE is_active = true AND inventory <= min_inventory
	`).Scan(&stats.LowStockProducts)
	if err != nil {
		return nil, fmt.Errorf("failed to get low stock products: %w", err)
	}

	// Pending orders
	err = s.db.QueryRow(`
		SELECT COUNT(*) 
		FROM orders 
		WHERE status IN ('pending', 'confirmed', 'processing')
	`).Scan(&stats.PendingOrders)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending orders: %w", err)
	}

	return &stats, nil
}

// GetSalesData returns daily sales data for charts
func (s *AnalyticsService) GetSalesData(days int) ([]models.SalesData, error) {
	if days <= 0 {
		days = 30
	}

	query := `
		WITH date_series AS (
			SELECT generate_series(
				CURRENT_DATE - INTERVAL '%d days',
				CURRENT_DATE,
				'1 day'::interval
			)::date as date
		)
		SELECT 
			ds.date,
			COALESCE(SUM(o.total_amount), 0) as revenue,
			COALESCE(COUNT(o.id), 0) as orders,
			COALESCE(SUM(oi.quantity), 0) as products
		FROM date_series ds
		LEFT JOIN orders o ON DATE(o.created_at) = ds.date AND o.payment_status = 'paid'
		LEFT JOIN order_items oi ON o.id = oi.order_id
		GROUP BY ds.date
		ORDER BY ds.date
	`

	rows, err := s.db.Query(fmt.Sprintf(query, days))
	if err != nil {
		return nil, fmt.Errorf("failed to get sales data: %w", err)
	}
	defer rows.Close()

	var salesData []models.SalesData
	for rows.Next() {
		var data models.SalesData
		err := rows.Scan(&data.Date, &data.Revenue, &data.Orders, &data.Products)
		if err != nil {
			return nil, fmt.Errorf("failed to scan sales data: %w", err)
		}
		salesData = append(salesData, data)
	}

	return salesData, nil
}

// GetTopProducts returns best-selling products
func (s *AnalyticsService) GetTopProducts(days int, limit int) ([]models.ProductPerformance, error) {
	if days <= 0 {
		days = 30
	}
	if limit <= 0 {
		limit = 10
	}

	startDate := time.Now().AddDate(0, 0, -days)

	query := `
		SELECT 
			p.id,
			p.name,
			p.sku,
			COALESCE(SUM(oi.total), 0) as revenue,
			COALESCE(COUNT(DISTINCT o.id), 0) as orders,
			COALESCE(SUM(oi.quantity), 0) as quantity
		FROM products p
		LEFT JOIN order_items oi ON p.id = oi.product_id
		LEFT JOIN orders o ON oi.order_id = o.id 
			AND o.created_at >= $1 
			AND o.payment_status = 'paid'
		WHERE p.is_active = true
		GROUP BY p.id, p.name, p.sku
		ORDER BY revenue DESC, quantity DESC
		LIMIT $2
	`

	rows, err := s.db.Query(query, startDate, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get top products: %w", err)
	}
	defer rows.Close()

	var products []models.ProductPerformance
	for rows.Next() {
		var product models.ProductPerformance
		err := rows.Scan(
			&product.ProductID, &product.ProductName, &product.SKU,
			&product.Revenue, &product.Orders, &product.Quantity,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product performance: %w", err)
		}
		products = append(products, product)
	}

	return products, nil
}

// GetOrderStatusDistribution returns order status breakdown
func (s *AnalyticsService) GetOrderStatusDistribution(days int) (*OrderStatusDistribution, error) {
	if days <= 0 {
		days = 30
	}

	startDate := time.Now().AddDate(0, 0, -days)

	query := `
		SELECT 
			status,
			COUNT(*) as count,
			SUM(total_amount) as total_value
		FROM orders 
		WHERE created_at >= $1
		GROUP BY status
		ORDER BY count DESC
	`

	rows, err := s.db.Query(query, startDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get order status distribution: %w", err)
	}
	defer rows.Close()

	distribution := &OrderStatusDistribution{
		StatusCounts: make(map[string]int),
		StatusValues: make(map[string]float64),
	}

	for rows.Next() {
		var status string
		var count int
		var totalValue float64

		err := rows.Scan(&status, &count, &totalValue)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order status: %w", err)
		}

		distribution.StatusCounts[status] = count
		distribution.StatusValues[status] = totalValue
	}

	return distribution, nil
}

// GetCustomerStats returns customer analytics
func (s *AnalyticsService) GetCustomerStats(days int) (*CustomerStats, error) {
	if days <= 0 {
		days = 30
	}

	startDate := time.Now().AddDate(0, 0, -days)

	var stats CustomerStats

	// Total customers
	err := s.db.QueryRow(`
		SELECT COUNT(*) FROM users WHERE role = 'customer'
	`).Scan(&stats.TotalCustomers)
	if err != nil {
		return nil, fmt.Errorf("failed to get total customers: %w", err)
	}

	// Active customers (made an order in the period)
	err = s.db.QueryRow(`
		SELECT COUNT(DISTINCT user_id)
		FROM orders 
		WHERE created_at >= $1 AND user_id IS NOT NULL
	`, startDate).Scan(&stats.ActiveCustomers)
	if err != nil {
		return nil, fmt.Errorf("failed to get active customers: %w", err)
	}

	// Customer lifetime value
	err = s.db.QueryRow(`
		SELECT COALESCE(AVG(customer_total), 0)
		FROM (
			SELECT user_id, SUM(total_amount) as customer_total
			FROM orders 
			WHERE payment_status = 'paid' AND user_id IS NOT NULL
			GROUP BY user_id
		) customer_totals
	`).Scan(&stats.AverageLifetimeValue)
	if err != nil {
		return nil, fmt.Errorf("failed to get customer lifetime value: %w", err)
	}

	// Repeat customer rate
	err = s.db.QueryRow(`
		SELECT 
			CASE 
				WHEN COUNT(DISTINCT user_id) > 0 THEN
					ROUND(
						(COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END)::float / 
						 COUNT(DISTINCT user_id)::float) * 100, 
						2
					)
				ELSE 0
			END
		FROM (
			SELECT user_id, COUNT(*) as order_count
			FROM orders 
			WHERE user_id IS NOT NULL
			GROUP BY user_id
		) customer_orders
	`).Scan(&stats.RepeatCustomerRate)
	if err != nil {
		return nil, fmt.Errorf("failed to get repeat customer rate: %w", err)
	}

	return &stats, nil
}

// GetInventoryAlerts returns products that need attention
func (s *AnalyticsService) GetInventoryAlerts() (*InventoryAlerts, error) {
	var alerts InventoryAlerts

	// Low stock products
	lowStockQuery := `
		SELECT id, name, sku, inventory, min_inventory
		FROM products 
		WHERE is_active = true AND inventory <= min_inventory
		ORDER BY (inventory::float / NULLIF(min_inventory, 0)) ASC
		LIMIT 20
	`

	rows, err := s.db.Query(lowStockQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get low stock products: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item InventoryAlert
		err := rows.Scan(&item.ProductID, &item.ProductName, &item.SKU, &item.CurrentStock, &item.MinStock)
		if err != nil {
			return nil, fmt.Errorf("failed to scan low stock product: %w", err)
		}
		item.AlertType = "low_stock"
		alerts.LowStock = append(alerts.LowStock, item)
	}

	// Out of stock products
	outOfStockQuery := `
		SELECT id, name, sku, inventory, min_inventory
		FROM products 
		WHERE is_active = true AND inventory = 0
		ORDER BY name
		LIMIT 20
	`

	rows, err = s.db.Query(outOfStockQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to get out of stock products: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item InventoryAlert
		err := rows.Scan(&item.ProductID, &item.ProductName, &item.SKU, &item.CurrentStock, &item.MinStock)
		if err != nil {
			return nil, fmt.Errorf("failed to scan out of stock product: %w", err)
		}
		item.AlertType = "out_of_stock"
		alerts.OutOfStock = append(alerts.OutOfStock, item)
	}

	return &alerts, nil
}

// GetRevenueByCategory returns revenue breakdown by product categories
func (s *AnalyticsService) GetRevenueByCategory(days int) ([]CategoryRevenue, error) {
	if days <= 0 {
		days = 30
	}

	startDate := time.Now().AddDate(0, 0, -days)

	query := `
		SELECT 
			c.id,
			c.name,
			COALESCE(SUM(oi.total), 0) as revenue,
			COALESCE(COUNT(DISTINCT o.id), 0) as orders,
			COALESCE(SUM(oi.quantity), 0) as items_sold
		FROM categories c
		LEFT JOIN products p ON c.id = p.category_id
		LEFT JOIN order_items oi ON p.id = oi.product_id
		LEFT JOIN orders o ON oi.order_id = o.id 
			AND o.created_at >= $1 
			AND o.payment_status = 'paid'
		WHERE c.is_active = true
		GROUP BY c.id, c.name
		ORDER BY revenue DESC
	`

	rows, err := s.db.Query(query, startDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get revenue by category: %w", err)
	}
	defer rows.Close()

	var categories []CategoryRevenue
	for rows.Next() {
		var category CategoryRevenue
		err := rows.Scan(
			&category.CategoryID, &category.CategoryName,
			&category.Revenue, &category.Orders, &category.ItemsSold,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category revenue: %w", err)
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// Response types
type DashboardStats struct {
	TotalRevenue      float64 `json:"total_revenue"`
	TotalOrders       int     `json:"total_orders"`
	NewCustomers      int     `json:"new_customers"`
	AverageOrderValue float64 `json:"average_order_value"`
	ConversionRate    float64 `json:"conversion_rate"`
	TotalProducts     int     `json:"total_products"`
	LowStockProducts  int     `json:"low_stock_products"`
	PendingOrders     int     `json:"pending_orders"`
}

type OrderStatusDistribution struct {
	StatusCounts map[string]int     `json:"status_counts"`
	StatusValues map[string]float64 `json:"status_values"`
}

type CustomerStats struct {
	TotalCustomers       int     `json:"total_customers"`
	ActiveCustomers      int     `json:"active_customers"`
	AverageLifetimeValue float64 `json:"average_lifetime_value"`
	RepeatCustomerRate   float64 `json:"repeat_customer_rate"`
}

type InventoryAlert struct {
	ProductID    int    `json:"product_id"`
	ProductName  string `json:"product_name"`
	SKU          string `json:"sku"`
	CurrentStock int    `json:"current_stock"`
	MinStock     int    `json:"min_stock"`
	AlertType    string `json:"alert_type"`
}

type InventoryAlerts struct {
	LowStock   []InventoryAlert `json:"low_stock"`
	OutOfStock []InventoryAlert `json:"out_of_stock"`
}

type CategoryRevenue struct {
	CategoryID   int     `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Revenue      float64 `json:"revenue"`
	Orders       int     `json:"orders"`
	ItemsSold    int     `json:"items_sold"`
}
