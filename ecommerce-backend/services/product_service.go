// services/product_service.go - Product business logic
package services

import (
	"database/sql"
	"fmt"
	"strings"

	"ecommerce-backend/models"
)

type ProductService struct {
	db *sql.DB
}

func NewProductService(db *sql.DB) *ProductService {
	return &ProductService{db: db}
}

// Fix 3: Update GetProducts method to handle category data properly
func (s *ProductService) GetProducts(filters ProductFilters) (*ProductResult, error) {
	query := `
		SELECT 
			p.id, p.name, p.slug, p.description, p.short_description,
			p.sku, p.price, p.compare_price, p.cost_price,
			p.category_id, p.brand, p.weight, p.dimensions,
			p.images, p.inventory, p.min_inventory,
			p.is_active, p.is_featured, p.meta_title, p.meta_description,
			p.tags, p.created_at, p.updated_at,
			COALESCE(c.name, '') as category_name, 
			COALESCE(c.slug, '') as category_slug
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE 1=1
	`

	var args []interface{}
	argCount := 0

	// Apply filters (keep existing filter logic)
	if filters.CategoryID != 0 {
		argCount++
		query += fmt.Sprintf(" AND p.category_id = $%d", argCount)
		args = append(args, filters.CategoryID)
	}

	if filters.MinPrice > 0 {
		argCount++
		query += fmt.Sprintf(" AND p.price >= $%d", argCount)
		args = append(args, filters.MinPrice)
	}

	if filters.MaxPrice > 0 {
		argCount++
		query += fmt.Sprintf(" AND p.price <= $%d", argCount)
		args = append(args, filters.MaxPrice)
	}

	if filters.Brand != "" {
		argCount++
		query += fmt.Sprintf(" AND LOWER(p.brand) = LOWER($%d)", argCount)
		args = append(args, filters.Brand)
	}

	if filters.Search != "" {
		argCount++
		query += fmt.Sprintf(" AND (p.name ILIKE $%d OR p.description ILIKE $%d OR p.sku ILIKE $%d)", argCount, argCount, argCount)
		args = append(args, "%"+filters.Search+"%")
	}

	if !filters.IncludeInactive {
		query += " AND p.is_active = true"
	}

	if filters.Featured {
		query += " AND p.is_featured = true"
	}

	if filters.InStock {
		query += " AND p.inventory > 0"
	}

	// Add sorting
	switch filters.Sort {
	case "price_asc":
		query += " ORDER BY p.price ASC"
	case "price_desc":
		query += " ORDER BY p.price DESC"
	case "name":
		query += " ORDER BY p.name ASC"
	case "newest":
		query += " ORDER BY p.created_at DESC"
	default:
		query += " ORDER BY p.id DESC"
	}

	// Count total records
	countQuery := strings.Replace(query, `SELECT 
			p.id, p.name, p.slug, p.description, p.short_description,
			p.sku, p.price, p.compare_price, p.cost_price,
			p.category_id, p.brand, p.weight, p.dimensions,
			p.images, p.inventory, p.min_inventory,
			p.is_active, p.is_featured, p.meta_title, p.meta_description,
			p.tags, p.created_at, p.updated_at,
			COALESCE(c.name, '') as category_name, 
			COALESCE(c.slug, '') as category_slug
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id`, "SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id", 1)

	countQuery = strings.Split(countQuery, "ORDER BY")[0]

	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count products: %w", err)
	}

	// Add pagination
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
		return nil, fmt.Errorf("failed to query products: %w", err)
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var p models.Product
		var categoryName, categorySlug string

		err := rows.Scan(
			&p.ID, &p.Name, &p.Slug, &p.Description, &p.ShortDesc,
			&p.SKU, &p.Price, &p.ComparePrice, &p.CostPrice,
			&p.CategoryID, &p.Brand, &p.Weight, &p.Dimensions,
			&p.Images, &p.Inventory, &p.MinInventory,
			&p.IsActive, &p.IsFeatured, &p.MetaTitle, &p.MetaDesc,
			&p.Tags, &p.CreatedAt, &p.UpdatedAt,
			&categoryName, &categorySlug,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}

		// Set computed fields
		p.InStock = p.Inventory > 0
		if p.ComparePrice != nil && *p.ComparePrice > p.Price {
			p.IsOnSale = true
			p.SalePrice = &p.Price
		}

		// Set category if available (now using COALESCE, so always have values)
		if categoryName != "" && categorySlug != "" {
			p.Category = &models.Category{
				ID:   p.CategoryID,
				Name: categoryName,
				Slug: categorySlug,
			}
		}

		products = append(products, p)
	}

	return &ProductResult{
		Products: products,
		Total:    total,
		Page:     filters.Page,
		Limit:    filters.Limit,
	}, nil
}

// GetProductBySlug retrieves a single product by slug
func (s *ProductService) GetProductBySlug(slug string) (*models.Product, error) {
	query := `
		SELECT 
			p.id, p.name, p.slug, p.description, p.short_description,
			p.sku, p.price, p.compare_price, p.cost_price,
			p.category_id, p.brand, p.weight, p.dimensions,
			p.images, p.inventory, p.min_inventory,
			p.is_active, p.is_featured, p.meta_title, p.meta_description,
			p.tags, p.created_at, p.updated_at,
			c.name as category_name, c.slug as category_slug
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.slug = $1 AND p.is_active = true
	`

	var p models.Product
	var categoryName, categorySlug sql.NullString

	err := s.db.QueryRow(query, slug).Scan(
		&p.ID, &p.Name, &p.Slug, &p.Description, &p.ShortDesc,
		&p.SKU, &p.Price, &p.ComparePrice, &p.CostPrice,
		&p.CategoryID, &p.Brand, &p.Weight, &p.Dimensions,
		&p.Images, &p.Inventory, &p.MinInventory,
		&p.IsActive, &p.IsFeatured, &p.MetaTitle, &p.MetaDesc,
		&p.Tags, &p.CreatedAt, &p.UpdatedAt,
		&categoryName, &categorySlug,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("product not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	// Set computed fields
	p.InStock = p.Inventory > 0
	if p.ComparePrice != nil && *p.ComparePrice > p.Price {
		p.IsOnSale = true
		p.SalePrice = &p.Price
	}

	// Set category if available
	if categoryName.Valid && categorySlug.Valid {
		p.Category = &models.Category{
			ID:   p.CategoryID,
			Name: categoryName.String,
			Slug: categorySlug.String,
		}
	}

	return &p, nil
}

// CreateProduct creates a new product (admin only)
func (s *ProductService) CreateProduct(product *models.Product) error {
	query := `
		INSERT INTO products (
			name, slug, description, short_description, sku, price, compare_price,
			cost_price, category_id, brand, weight, dimensions, images, inventory,
			min_inventory, is_active, is_featured, meta_title, meta_description, tags
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
		) RETURNING id, created_at, updated_at
	`

	err := s.db.QueryRow(
		query,
		product.Name, product.Slug, product.Description, product.ShortDesc,
		product.SKU, product.Price, product.ComparePrice, product.CostPrice,
		product.CategoryID, product.Brand, product.Weight, product.Dimensions,
		product.Images, product.Inventory, product.MinInventory,
		product.IsActive, product.IsFeatured, product.MetaTitle,
		product.MetaDesc, product.Tags,
	).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}

	return nil
}

// UpdateProduct updates an existing product (admin only)
func (s *ProductService) UpdateProduct(id int, updates *models.Product) error {
	query := `
		UPDATE products SET
			name = $2, slug = $3, description = $4, short_description = $5,
			sku = $6, price = $7, compare_price = $8, cost_price = $9,
			category_id = $10, brand = $11, weight = $12, dimensions = $13,
			images = $14, inventory = $15, min_inventory = $16,
			is_active = $17, is_featured = $18, meta_title = $19,
			meta_description = $20, tags = $21
		WHERE id = $1
	`

	result, err := s.db.Exec(
		query, id,
		updates.Name, updates.Slug, updates.Description, updates.ShortDesc,
		updates.SKU, updates.Price, updates.ComparePrice, updates.CostPrice,
		updates.CategoryID, updates.Brand, updates.Weight, updates.Dimensions,
		updates.Images, updates.Inventory, updates.MinInventory,
		updates.IsActive, updates.IsFeatured, updates.MetaTitle,
		updates.MetaDesc, updates.Tags,
	)

	if err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

// DeleteProduct soft deletes a product (admin only)
func (s *ProductService) DeleteProduct(id int) error {
	query := `UPDATE products SET is_active = false WHERE id = $1`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found")
	}

	return nil
}

// GetCategories retrieves all active categories with proper NULL handling
func (s *ProductService) GetCategories() ([]models.Category, error) {
	query := `
		SELECT 
			id, name, slug, 
			COALESCE(description, '') as description, 
			COALESCE(image_url, '') as image_url, 
			parent_id, 
			sort_order, 
			is_active, 
			created_at
		FROM categories 
		WHERE is_active = true 
		ORDER BY sort_order, name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query categories: %w", err)
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var c models.Category
		var description, imageURL string

		err := rows.Scan(
			&c.ID, &c.Name, &c.Slug,
			&description, &imageURL,
			&c.ParentID, &c.SortOrder, &c.IsActive, &c.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}

		// Set the values (they're already handled by COALESCE)
		c.Description = description
		c.ImageURL = imageURL

		categories = append(categories, c)
	}

	return categories, nil
}

// UpdateInventory updates product inventory levels
func (s *ProductService) UpdateInventory(productID int, quantity int) error {
	query := `
		UPDATE products 
		SET inventory = inventory + $2
		WHERE id = $1 AND is_active = true
	`

	result, err := s.db.Exec(query, productID, quantity)
	if err != nil {
		return fmt.Errorf("failed to update inventory: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("product not found or inactive")
	}

	return nil
}

// Helper types
type ProductFilters struct {
	CategoryID      int
	MinPrice        float64
	MaxPrice        float64
	Brand           string
	Search          string
	Sort            string
	Featured        bool
	InStock         bool
	IncludeInactive bool
	Page            int
	Limit           int
	Offset          int
}

type ProductResult struct {
	Products []models.Product `json:"products"`
	Total    int              `json:"total"`
	Page     int              `json:"page"`
	Limit    int              `json:"limit"`
	Pages    int              `json:"pages"`
}
