// services/auth_service.go - Authentication and user management
package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"ecommerce-backend/models"
)

type AuthService struct {
	db        *sql.DB
	jwtSecret string
}

func NewAuthService(db *sql.DB, jwtSecret string) *AuthService {
	return &AuthService{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

// Update Register method too
func (s *AuthService) Register(req *RegisterRequest) (*AuthResponse, error) {
	// Check if user already exists
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check user existence: %w", err)
	}

	if exists {
		return nil, fmt.Errorf("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user with COALESCE for phone
	query := `
		INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
		VALUES ($1, $2, $3, $4, COALESCE($5, ''), $6)
		RETURNING id, created_at, updated_at
	`

	var user models.User
	err = s.db.QueryRow(
		query, req.Email, string(hashedPassword), req.FirstName,
		req.LastName, req.Phone, "customer",
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Set user fields
	user.Email = req.Email
	user.FirstName = req.FirstName
	user.LastName = req.LastName
	user.Phone = req.Phone
	if user.Phone == "" {
		user.Phone = "" // Ensure it's empty string, not NULL
	}
	user.Role = "customer"
	user.IsActive = true

	// Generate JWT token
	token, err := s.generateJWT(&user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		Token: token,
		User:  &user,
	}, nil
}

// Update the Login method to handle NULL phone values properly
func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, 
		       COALESCE(phone, '') as phone, role, is_active
		FROM users 
		WHERE email = $1
	`

	var user models.User
	var passwordHash string
	err := s.db.QueryRow(query, req.Email).Scan(
		&user.ID, &user.Email, &passwordHash, &user.FirstName,
		&user.LastName, &user.Phone, &user.Role, &user.IsActive,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("invalid email or password")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if !user.IsActive {
		return nil, fmt.Errorf("account is deactivated")
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate JWT token
	token, err := s.generateJWT(&user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		Token: token,
		User:  &user,
	}, nil
}

// Also update GetUserProfile method
func (s *AuthService) GetUserProfile(userID int) (*models.User, error) {
	query := `
		SELECT id, email, first_name, last_name, 
		       COALESCE(phone, '') as phone, role, is_active, created_at, updated_at
		FROM users 
		WHERE id = $1
	`

	var user models.User
	err := s.db.QueryRow(query, userID).Scan(
		&user.ID, &user.Email, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// UpdateUserProfile updates user profile information
func (s *AuthService) UpdateUserProfile(userID int, req *UpdateProfileRequest) (*models.User, error) {
	query := `
		UPDATE users 
		SET first_name = $2, last_name = $3, phone = $4
		WHERE id = $1
		RETURNING id, email, first_name, last_name, phone, role, is_active, created_at, updated_at
	`

	var user models.User
	err := s.db.QueryRow(query, userID, req.FirstName, req.LastName, req.Phone).Scan(
		&user.ID, &user.Email, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return &user, nil
}

// ChangePassword changes user password
func (s *AuthService) ChangePassword(userID int, req *ChangePasswordRequest) error {
	// Get current password hash
	var currentHash string
	err := s.db.QueryRow("SELECT password_hash FROM users WHERE id = $1", userID).Scan(&currentHash)
	if err == sql.ErrNoRows {
		return fmt.Errorf("user not found")
	}
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword))
	if err != nil {
		return fmt.Errorf("current password is incorrect")
	}

	// Hash new password
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	// Update password
	query := `UPDATE users SET password_hash = $1 WHERE id = $2`
	result, err := s.db.Exec(query, string(newHash), userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// GetUserAddresses retrieves user's addresses
func (s *AuthService) GetUserAddresses(userID int) ([]models.Address, error) {
	query := `
		SELECT id, user_id, type, first_name, last_name, company,
		       address_line_1, address_line_2, city, postal_code, country, is_default
		FROM addresses 
		WHERE user_id = $1
		ORDER BY is_default DESC, id ASC
	`

	rows, err := s.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query addresses: %w", err)
	}
	defer rows.Close()

	var addresses []models.Address
	for rows.Next() {
		var addr models.Address
		err := rows.Scan(
			&addr.ID, &addr.UserID, &addr.Type, &addr.FirstName, &addr.LastName,
			&addr.Company, &addr.AddressLine1, &addr.AddressLine2, &addr.City,
			&addr.PostalCode, &addr.Country, &addr.IsDefault,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan address: %w", err)
		}
		addresses = append(addresses, addr)
	}

	return addresses, nil
}

// CreateAddress creates a new address for user
func (s *AuthService) CreateAddress(userID int, address *models.Address) (*models.Address, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// If this is default address, unset other defaults
	if address.IsDefault {
		_, err = tx.Exec("UPDATE addresses SET is_default = false WHERE user_id = $1 AND type = $2", userID, address.Type)
		if err != nil {
			return nil, fmt.Errorf("failed to unset default addresses: %w", err)
		}
	}

	// Create address
	query := `
		INSERT INTO addresses (
			user_id, type, first_name, last_name, company, address_line_1,
			address_line_2, city, postal_code, country, is_default
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`

	err = tx.QueryRow(
		query, userID, address.Type, address.FirstName, address.LastName,
		address.Company, address.AddressLine1, address.AddressLine2,
		address.City, address.PostalCode, address.Country, address.IsDefault,
	).Scan(&address.ID)

	if err != nil {
		return nil, fmt.Errorf("failed to create address: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	address.UserID = userID
	return address, nil
}

// UpdateAddress updates an existing address
func (s *AuthService) UpdateAddress(userID int, addressID int, updates *models.Address) (*models.Address, error) {
	tx, err := s.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// If this is default address, unset other defaults
	if updates.IsDefault {
		_, err = tx.Exec("UPDATE addresses SET is_default = false WHERE user_id = $1 AND type = $2 AND id != $3",
			userID, updates.Type, addressID)
		if err != nil {
			return nil, fmt.Errorf("failed to unset default addresses: %w", err)
		}
	}

	// Update address
	query := `
		UPDATE addresses SET
			type = $3, first_name = $4, last_name = $5, company = $6,
			address_line_1 = $7, address_line_2 = $8, city = $9,
			postal_code = $10, country = $11, is_default = $12
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, type, first_name, last_name, company,
		          address_line_1, address_line_2, city, postal_code, country, is_default
	`

	var address models.Address
	err = tx.QueryRow(
		query, addressID, userID, updates.Type, updates.FirstName, updates.LastName,
		updates.Company, updates.AddressLine1, updates.AddressLine2,
		updates.City, updates.PostalCode, updates.Country, updates.IsDefault,
	).Scan(
		&address.ID, &address.UserID, &address.Type, &address.FirstName,
		&address.LastName, &address.Company, &address.AddressLine1,
		&address.AddressLine2, &address.City, &address.PostalCode,
		&address.Country, &address.IsDefault,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("address not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update address: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return &address, nil
}

// DeleteAddress deletes a user address
func (s *AuthService) DeleteAddress(userID int, addressID int) error {
	query := `DELETE FROM addresses WHERE id = $1 AND user_id = $2`
	result, err := s.db.Exec(query, addressID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete address: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("address not found")
	}

	return nil
}

// ValidateToken validates a JWT token and returns user info
func (s *AuthService) ValidateToken(tokenString string) (*models.User, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	userID, ok := claims["user_id"].(float64)
	if !ok {
		return nil, fmt.Errorf("invalid user ID in token")
	}

	return s.GetUserProfile(int(userID))
}

// generateJWT creates a new JWT token for user
func (s *AuthService) generateJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    user.ID,
		"email":      user.Email,
		"role":       user.Role,
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"exp":        time.Now().Add(24 * time.Hour).Unix(), // 24 hours expiration
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// Request/Response types
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Phone     string `json:"phone,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type UpdateProfileRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Phone     string `json:"phone,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}
