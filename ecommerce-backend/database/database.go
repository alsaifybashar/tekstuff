// database/database.go - Database initialization and migrations
package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/pressly/goose/v3"
)

// Initialize creates and configures the database connection
func Initialize(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(0)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established")
	return db, nil
}

// Migrate runs database migrations
func Migrate(db *sql.DB) error {
	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("failed to set database dialect: %w", err)
	}

	if err := createMigrations(db); err != nil {
		return fmt.Errorf("failed to create migrations: %w", err)
	}

	log.Println("Database migrations completed")
	return nil
}

// Fix 1: Update database migration to handle NULL values in categories
// In database/database.go, update the categories migration:

func createMigrations(db *sql.DB) error {
	migrations := []string{
		// Migration 1: Create users table (keep existing)
		`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			phone VARCHAR(20),
			role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
		CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
		`,

		// Migration 2: Create categories table (FIXED - handle NULL values)
		`
		CREATE TABLE IF NOT EXISTS categories (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			slug VARCHAR(100) UNIQUE NOT NULL,
			description TEXT DEFAULT '',
			image_url VARCHAR(500) DEFAULT '',
			parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
			sort_order INTEGER DEFAULT 0,
			is_active BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
		CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
		CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
		`,

		// Migration 3: Products table (keep existing)
		`
		CREATE TABLE IF NOT EXISTS products (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			slug VARCHAR(255) UNIQUE NOT NULL,
			description TEXT,
			short_description TEXT,
			sku VARCHAR(100) UNIQUE NOT NULL,
			price DECIMAL(10,2) NOT NULL CHECK (price > 0),
			compare_price DECIMAL(10,2) CHECK (compare_price > 0),
			cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
			category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
			brand VARCHAR(100),
			weight DECIMAL(8,2),
			dimensions JSONB,
			images JSONB DEFAULT '[]',
			inventory INTEGER DEFAULT 0 CHECK (inventory >= 0),
			min_inventory INTEGER DEFAULT 0 CHECK (min_inventory >= 0),
			is_active BOOLEAN DEFAULT true,
			is_featured BOOLEAN DEFAULT false,
			meta_title VARCHAR(200),
			meta_description VARCHAR(300),
			tags JSONB DEFAULT '[]',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
		CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
		CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
		CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
		CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
		CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
		CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(inventory);
		`,

		// Migration 4: Addresses table (keep existing)
		`
		CREATE TABLE IF NOT EXISTS addresses (
			id SERIAL PRIMARY KEY,
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			type VARCHAR(20) NOT NULL CHECK (type IN ('shipping', 'billing')),
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			company VARCHAR(100),
			address_line_1 VARCHAR(255) NOT NULL,
			address_line_2 VARCHAR(255),
			city VARCHAR(100) NOT NULL,
			postal_code VARCHAR(20) NOT NULL,
			country VARCHAR(2) NOT NULL,
			is_default BOOLEAN DEFAULT false
		);
		
		CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
		CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(type);
		`,

		// Migration 5: Orders table (keep existing)
		`
		CREATE TABLE IF NOT EXISTS orders (
			id SERIAL PRIMARY KEY,
			order_number VARCHAR(50) UNIQUE NOT NULL,
			user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
			payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
			payment_method VARCHAR(50),
			shipping_method VARCHAR(50),
			customer_email VARCHAR(255) NOT NULL,
			customer_phone VARCHAR(20),
			subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
			tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
			shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
			discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
			total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
			shipping_address JSONB NOT NULL,
			billing_address JSONB NOT NULL,
			notes TEXT,
			tracking_number VARCHAR(100),
			fulfillment_date TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
		CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
		CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
		CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
		CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
		CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
		`,

		// Migration 6: Order items table (keep existing)
		`
		CREATE TABLE IF NOT EXISTS order_items (
			id SERIAL PRIMARY KEY,
			order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
			product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
			sku VARCHAR(100) NOT NULL,
			name VARCHAR(255) NOT NULL,
			price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
			quantity INTEGER NOT NULL CHECK (quantity > 0),
			total DECIMAL(10,2) NOT NULL CHECK (total >= 0)
		);
		
		CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
		CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
		`,

		// Migration 7: Sessions table (keep existing)
		`
		CREATE TABLE IF NOT EXISTS sessions (
			id SERIAL PRIMARY KEY,
			session_id VARCHAR(255) UNIQUE NOT NULL,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			data JSONB DEFAULT '{}',
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
		CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
		CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
		`,

		// Migration 8: Audit logs table (keep existing)
		`
		CREATE TABLE IF NOT EXISTS audit_logs (
			id SERIAL PRIMARY KEY,
			table_name VARCHAR(50) NOT NULL,
			record_id INTEGER NOT NULL,
			action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
			old_values JSONB,
			new_values JSONB,
			user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
			ip_address INET,
			user_agent TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
		CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
		CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
		`,

		// Migration 9: Create triggers (keep existing)
		`
		CREATE OR REPLACE FUNCTION update_updated_at_column()
		RETURNS TRIGGER AS $$
		BEGIN
			NEW.updated_at = CURRENT_TIMESTAMP;
			RETURN NEW;
		END;
		$$ language 'plpgsql';

		DROP TRIGGER IF EXISTS update_users_updated_at ON users;
		CREATE TRIGGER update_users_updated_at 
			BEFORE UPDATE ON users 
			FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

		DROP TRIGGER IF EXISTS update_products_updated_at ON products;
		CREATE TRIGGER update_products_updated_at 
			BEFORE UPDATE ON products 
			FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

		DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
		CREATE TRIGGER update_orders_updated_at 
			BEFORE UPDATE ON orders 
			FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
		`,

		// Migration 10: Insert default data with proper NULL handling
		`
		-- Insert default admin user (password: admin123 - change this!)
		INSERT INTO users (email, password_hash, first_name, last_name, role) 
		VALUES ('admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiCobDMVTzM6', 'Admin', 'User', 'admin')
		ON CONFLICT (email) DO NOTHING;

		-- Insert default categories with proper defaults
		INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES 
		('Laddare', 'laddare', 'Laddare för alla typer av enheter', '', 1),
		('Kablar', 'kablar', 'USB-kablar, HDMI-kablar och mer', '', 2),
		('Tillbehör', 'tillbehor', 'Olika tekniska tillbehör', '', 3),
		('Mobiltillbehör', 'mobiltillbehor', 'Tillbehör för smartphones och tablets', '', 4)
		ON CONFLICT (slug) DO NOTHING;
		`,
	}

	for i, migration := range migrations {
		log.Printf("Running migration %d...", i+1)
		if _, err := db.Exec(migration); err != nil {
			return fmt.Errorf("migration %d failed: %w", i+1, err)
		}
	}

	return nil
}
