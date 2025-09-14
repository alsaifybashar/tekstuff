// models/models.go - Database models for the e-commerce platform
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// User represents a customer or admin user
type User struct {
	ID        int       `json:"id" db:"id"`
	Email     string    `json:"email" db:"email" binding:"required,email"`
	Password  string    `json:"-" db:"password_hash"` // Never include in JSON responses
	FirstName string    `json:"first_name" db:"first_name" binding:"required"`
	LastName  string    `json:"last_name" db:"last_name" binding:"required"`
	Phone     string    `json:"phone,omitempty" db:"phone"`
	Role      string    `json:"role" db:"role"` // "customer", "admin"
	IsActive  bool      `json:"is_active" db:"is_active"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Address represents shipping/billing addresses
type Address struct {
	ID           int    `json:"id" db:"id"`
	UserID       int    `json:"user_id" db:"user_id"`
	Type         string `json:"type" db:"type"` // "shipping", "billing"
	FirstName    string `json:"first_name" db:"first_name" binding:"required"`
	LastName     string `json:"last_name" db:"last_name" binding:"required"`
	Company      string `json:"company,omitempty" db:"company"`
	AddressLine1 string `json:"address_line_1" db:"address_line_1" binding:"required"`
	AddressLine2 string `json:"address_line_2,omitempty" db:"address_line_2"`
	City         string `json:"city" db:"city" binding:"required"`
	PostalCode   string `json:"postal_code" db:"postal_code" binding:"required"`
	Country      string `json:"country" db:"country" binding:"required"`
	IsDefault    bool   `json:"is_default" db:"is_default"`
}

// Category represents product categories
type Category struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name" binding:"required"`
	Slug        string    `json:"slug" db:"slug" binding:"required"`
	Description string    `json:"description,omitempty" db:"description"`
	ImageURL    string    `json:"image_url,omitempty" db:"image_url"`
	ParentID    *int      `json:"parent_id,omitempty" db:"parent_id"`
	SortOrder   int       `json:"sort_order" db:"sort_order"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Product represents items for sale
type Product struct {
	ID           int         `json:"id" db:"id"`
	Name         string      `json:"name" db:"name" binding:"required"`
	Slug         string      `json:"slug" db:"slug" binding:"required"`
	Description  string      `json:"description" db:"description"`
	ShortDesc    string      `json:"short_description,omitempty" db:"short_description"`
	SKU          string      `json:"sku" db:"sku" binding:"required"`
	Price        float64     `json:"price" db:"price" binding:"required,gt=0"`
	ComparePrice *float64    `json:"compare_price,omitempty" db:"compare_price"`
	CostPrice    *float64    `json:"cost_price,omitempty" db:"cost_price"`
	CategoryID   int         `json:"category_id" db:"category_id"`
	Brand        string      `json:"brand,omitempty" db:"brand"`
	Weight       *float64    `json:"weight,omitempty" db:"weight"`
	Dimensions   *Dimensions `json:"dimensions,omitempty" db:"dimensions"`
	Images       ImageList   `json:"images" db:"images"`
	Inventory    int         `json:"inventory" db:"inventory"`
	MinInventory int         `json:"min_inventory" db:"min_inventory"`
	IsActive     bool        `json:"is_active" db:"is_active"`
	IsFeatured   bool        `json:"is_featured" db:"is_featured"`
	MetaTitle    string      `json:"meta_title,omitempty" db:"meta_title"`
	MetaDesc     string      `json:"meta_description,omitempty" db:"meta_description"`
	Tags         TagList     `json:"tags,omitempty" db:"tags"`
	CreatedAt    time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at" db:"updated_at"`

	// Computed fields (not stored in DB)
	Category  *Category `json:"category,omitempty" db:"-"`
	IsOnSale  bool      `json:"is_on_sale" db:"-"`
	SalePrice *float64  `json:"sale_price,omitempty" db:"-"`
	InStock   bool      `json:"in_stock" db:"-"`
}

// Dimensions for product specifications
type Dimensions struct {
	Length float64 `json:"length"`
	Width  float64 `json:"width"`
	Height float64 `json:"height"`
	Unit   string  `json:"unit"` // "cm", "in"
}

// Custom types for JSON arrays in database
type ImageList []string
type TagList []string

// Order represents customer orders
type Order struct {
	ID             int    `json:"id" db:"id"`
	OrderNumber    string `json:"order_number" db:"order_number"`
	UserID         *int   `json:"user_id,omitempty" db:"user_id"`
	Status         string `json:"status" db:"status"`
	PaymentStatus  string `json:"payment_status" db:"payment_status"`
	PaymentMethod  string `json:"payment_method,omitempty" db:"payment_method"`
	ShippingMethod string `json:"shipping_method,omitempty" db:"shipping_method"`

	// Customer Info
	CustomerEmail string `json:"customer_email" db:"customer_email"`
	CustomerPhone string `json:"customer_phone,omitempty" db:"customer_phone"`

	// Pricing
	Subtotal       float64 `json:"subtotal" db:"subtotal"`
	TaxAmount      float64 `json:"tax_amount" db:"tax_amount"`
	ShippingAmount float64 `json:"shipping_amount" db:"shipping_amount"`
	DiscountAmount float64 `json:"discount_amount" db:"discount_amount"`
	TotalAmount    float64 `json:"total_amount" db:"total_amount"`

	// Addresses
	ShippingAddress *Address     `json:"shipping_address,omitempty" db:"-"`
	BillingAddress  *Address     `json:"billing_address,omitempty" db:"-"`
	ShippingJSON    *AddressJSON `json:"-" db:"shipping_address"`
	BillingJSON     *AddressJSON `json:"-" db:"billing_address"`

	// Items
	Items []OrderItem `json:"items,omitempty" db:"-"`

	// Metadata
	Notes           string     `json:"notes,omitempty" db:"notes"`
	TrackingNumber  string     `json:"tracking_number,omitempty" db:"tracking_number"`
	FulfillmentDate *time.Time `json:"fulfillment_date,omitempty" db:"fulfillment_date"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
}

// OrderItem represents items within an order
type OrderItem struct {
	ID        int     `json:"id" db:"id"`
	OrderID   int     `json:"order_id" db:"order_id"`
	ProductID int     `json:"product_id" db:"product_id"`
	SKU       string  `json:"sku" db:"sku"`
	Name      string  `json:"name" db:"name"`
	Price     float64 `json:"price" db:"price"`
	Quantity  int     `json:"quantity" db:"quantity"`
	Total     float64 `json:"total" db:"total"`

	// Optional product reference
	Product *Product `json:"product,omitempty" db:"-"`
}

// AddressJSON for database storage
type AddressJSON struct {
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Company      string `json:"company,omitempty"`
	AddressLine1 string `json:"address_line_1"`
	AddressLine2 string `json:"address_line_2,omitempty"`
	City         string `json:"city"`
	PostalCode   string `json:"postal_code"`
	Country      string `json:"country"`
}

// CartItem represents items in shopping cart
type CartItem struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
}

// Cart represents a shopping cart
type Cart struct {
	Items []CartItem `json:"items"`
}

// Analytics models
type SalesData struct {
	Date     time.Time `json:"date" db:"date"`
	Revenue  float64   `json:"revenue" db:"revenue"`
	Orders   int       `json:"orders" db:"orders"`
	Products int       `json:"products" db:"products"`
}

type ProductPerformance struct {
	ProductID   int     `json:"product_id" db:"product_id"`
	ProductName string  `json:"product_name" db:"product_name"`
	SKU         string  `json:"sku" db:"sku"`
	Revenue     float64 `json:"revenue" db:"revenue"`
	Orders      int     `json:"orders" db:"orders"`
	Quantity    int     `json:"quantity" db:"quantity"`
}

// Implement SQL driver interfaces for custom types

// ImageList implementation
func (il ImageList) Value() (driver.Value, error) {
	if il == nil {
		return nil, nil
	}
	return json.Marshal(il)
}

func (il *ImageList) Scan(value interface{}) error {
	if value == nil {
		*il = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("cannot scan into ImageList")
	}

	return json.Unmarshal(bytes, il)
}

// TagList implementation
func (tl TagList) Value() (driver.Value, error) {
	if tl == nil {
		return nil, nil
	}
	return json.Marshal(tl)
}

func (tl *TagList) Scan(value interface{}) error {
	if value == nil {
		*tl = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("cannot scan into TagList")
	}

	return json.Unmarshal(bytes, tl)
}

// Dimensions implementation
func (d Dimensions) Value() (driver.Value, error) {
	return json.Marshal(d)
}

func (d *Dimensions) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("cannot scan into Dimensions")
	}

	return json.Unmarshal(bytes, d)
}

// AddressJSON implementation
func (aj AddressJSON) Value() (driver.Value, error) {
	return json.Marshal(aj)
}

func (aj *AddressJSON) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("cannot scan into AddressJSON")
	}

	return json.Unmarshal(bytes, aj)
}
