## E-Commerce Backend API


### Feature
- **Secure Authentication** - JWT tokens with refresh rotation, account lockout protection

- **User Management** - Registration, login, profile management, role-based access control

- **Product Management** - CRUD operations, image upload, inventory tracking, analytics

- **Order Processing** - Order creation, status tracking, order history.


- **Category Management** - Hierarchical categories with full CRUD operations

- **Enterprise Security** - Rate limiting, input validation, XSS protection, SQL injection prevention


- **Email Integration** - Account verification, password reset, order confirmations


- **Audit Logging** - Comprehensive activity tracking for security and compliance


- **Image Processing** - Secure file upload with image optimization using Sharp

- **Advanced Filtering** - Product search, pagination, sorting capabilities

---

<br>
<br>

## Structure

```
ecommerce-backend/
├── server.js                 # Main application entry point
├── config/
│   └── database.js           # Database connection and schema
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── productController.js  # Product management
│   ├── orderController.js    # Order processing
│   ├── userController.js     # User management
│   └── categoryController.js # Category management
├── middleware/
│   ├── authMiddleware.js     # Authentication & authorization
│   └── errorMiddleware.js    # Error handling
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   ├── productRoutes.js      # Product endpoints
│   ├── orderRoutes.js        # Order endpoints
│   ├── userRoutes.js         # User management endpoints
│   └── categoryRoutes.js     # Category endpoints
├── utils/
│   ├── security.js           # Security utilities
│   ├── tokenUtils.js         # JWT utilities
│   ├── auditLogger.js        # Audit logging
│   ├── emailService.js       # Email service
│   └── imageUpload.js        # Image processing
├── templates/                # Email templates
├── uploads/                  # File storage
└── logs/                     # Application logs
```

---

<br>
<br>
<br>

### 1. Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install additional tools
sudo apt install git curl -y
```

<br>

### 2. PostgreSQL Setup
```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

#### PostgreSQL shell:
```PostgreSQL
-- Create database
CREATE DATABASE ecommerce_db;

-- Create user
CREATE USER ecommerce_user WITH PASSWORD 'ecommerce_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;
ALTER USER ecommerce_user WITH SUPERUSER;

-- Connect to database and grant schema permissions
\c ecommerce_db
GRANT ALL ON SCHEMA public TO ecommerce_user;
\q
```

<br>

#### Configuration authentication
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ensure these lines exist:
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```


<br>


#### Test connection
```bash
psql -h localhost -U ecommerce_user -d ecommerce_db
# Password: ecommerce_password_123
```


<br>
<br>


### 3. Project setup

```bash
# Clone or create project directory
mkdir ecommerce-backend && cd ecommerce-backend

# Create directory structure
mkdir -p config controllers middleware routes utils templates uploads/{products,categories,temp} logs

# Initialize npm project
npm init -y
```

<br>
<br>


### 4. Install dep

```bash
npm install express pg bcryptjs jsonwebtoken cors helmet express-rate-limit compression morgan cookie-parser dotenv validator joi multer sharp nodemailer handlebars stripe express-session connect-pg-simple express-validator slugify uuid


npm install --save-dev nodemon
```


<br>
<br>


### 5. Env config

```bash
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
```

<br>


#### Create `.env`file
```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://ecommerce_user:ecommerce_password_123@localhost:5432/ecommerce_db

# JWT Configuration (use generated secrets above)
JWT_SECRET=your_generated_jwt_secret
JWT_REFRESH_SECRET=your_generated_refresh_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_SERVICE=smtp
FROM_EMAIL=noreply@yourstore.com
FROM_NAME=Your Store Name
SUPPORT_EMAIL=support@yourstore.com

# Security
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Development
DEBUG=true

```

<br>
<br>

### 6. Create Email Templates
```bash
# Verification email
cat > templates/verification.html << 'EOF'
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Verify Your Email</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome {{firstName}}!</h2>
    <p>Thank you for registering with {{fromName}}. Please verify your email address:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{verificationUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    </div>
    <p>If the button doesn't work, copy and paste this link: {{verificationUrl}}</p>
    <p>This link expires in 24 hours.</p>
</body>
</html>
EOF

# Password reset email
cat > templates/password-reset.html << 'EOF'
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Password Reset</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Password Reset Request</h2>
    <p>Hi {{firstName}}, we received a request to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{resetUrl}}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    </div>
    <p>If the button doesn't work, copy and paste this link: {{resetUrl}}</p>
    <p>This link expires in {{expirationTime}}.</p>
</body>
</html>
EOF

# Welcome email
cat > templates/welcome.html << 'EOF'
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Welcome!</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Welcome to {{fromName}}!</h2>
    <p>Hi {{firstName}}, your account has been successfully created!</p>
    <p>You can now browse products, add items to cart, and place orders.</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{loginUrl}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Shopping</a>
    </div>
</body>
</html>
EOF
```


----
<br>
<br>
<br>

## Running the backend
### Dev mode

```bash
npm run dev
```


### Dev prod

```bash
npm start
```

---

<br>
<br>
<br>

### URL list
```bash
http://localhost:5000/api
```

<br>

`Register User`
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

<br>
<br>

`Login User`
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
}
```

<br>
<br>

`Get User Profile`
```bash
GET /api/auth/me
Authorization: Bearer <access_token>
```

<br>
<br>

`Refresh Token`
```bash
POST /api/auth/refresh
```

<br>
<br>

`Logout`
```bash
POST /api/auth/logout
```

<br>
<br>

`Password Reset Request`

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

<br>
<br>

`Reset Password`

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "NewSecurePassword123!"
}
```


<br>
<br>


### Production endpoins
**Get All Products**
```bash

GET /api/products?page=1&limit=20&search=phone&category=1&minPrice=100&maxPrice=500
```



**Get Single Product**
```bash

GET /api/products/:id
```


**Create Product (Admin)**
```bash

POST /api/products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

{
  "name": "iPhone 15",
  "description": "Latest iPhone model",
  "price": 999.99,
  "stockQuantity": 100,
  "categoryId": 1,
  "images": [file1, file2]
}
```

**Delete Product (Admin)**
```bash
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

**Get All Categories**
```bash
GET /api/categories
```

**Create Category (Admin)**
```bash
POST /api/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```


**Get All Users**
```bash
GET /api/users
Authorization: Bearer <admin_token>
```

**Update User Role**
```bash
PATCH /api/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Get User Orders**
```bash
GET /api/orders
Authorization: Bearer <access_token>
```


**Create Order**
```bash
POST /api/orders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "USA"
  }
}
```

----

<br>
<br>

## Testing Request
```bash
curl http://localhost:5000/health



curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'



curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'


curl http://localhost:5000/api/products
```


----
<br>
<br>

### Security Feature
`Authentication & Authorization

- JWT Tokens - Short-lived access tokens (15 minutes) with long-lived refresh tokens (7 days)

- Password Security - bcrypt hashing with 12 salt rounds

- Account Lockout - 5 failed attempts locks account for 30 minutes

- Email Verification - Required before account activation
Role-Based Access - Admin and customer roles with different permissions

`Input Validation & Sanitization`

- Express Validator - Comprehensive input validation

- XSS Protection - Input sanitization to prevent cross-site scripting

- SQL Injection Prevention - Parameterized queries

- File Upload Security - Type, size, and content validation

`Rate Limiting & DDoS Protection`

- Global Rate Limiting - 100 requests per 15 minutes

- Authentication Rate Limiting - 5 login attempts per 15 minutes

- Sensitive Operations - 3 attempts per 15 minutes for password resets

- Request Timeout - 30-second timeout for all requests

`Data Protection`

- HTTPS Enforcement - Secure transport in production

- Secure Cookies - HttpOnly, Secure, SameSite attributes

- Data Encryption - Utilities for encrypting sensitive data

- Audit Logging - Comprehensive activity tracking

`HTTP Security Headers`

- Helmet.js - Security headers middleware

- CORS Configuration - Cross-origin resource sharing setup

- Content Security Policy - XSS and injection attack prevention

- HSTS - HTTP Strict Transport Security

----

<br>
<br>

### Database Schema
`Users Table`
```PostgreSQL
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- phone (VARCHAR)
- role (VARCHAR) -- 'admin' or 'customer'
- is_verified (BOOLEAN)
- verification_token (VARCHAR)
- reset_password_token (VARCHAR)
- failed_login_attempts (INTEGER)
- account_locked_until (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```
<br>
`Products Table`

```PostgreSQL
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- slug (VARCHAR UNIQUE)
- description (TEXT)
- sku (VARCHAR UNIQUE)
- price (DECIMAL)
- compare_price (DECIMAL)
- stock_quantity (INTEGER)
- category_id (INTEGER REFERENCES categories)
- images (JSONB)
- is_active (BOOLEAN)
- is_featured (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

<br>

`Orders Table`

```PostgreSQL
- id (SERIAL PRIMARY KEY)
- order_number (VARCHAR UNIQUE)
- user_id (INTEGER REFERENCES users)
- status (VARCHAR) -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
- subtotal (DECIMAL)
- tax_amount (DECIMAL)
- shipping_amount (DECIMAL)
- total_amount (DECIMAL)
- shipping_address (JSONB)
- billing_address (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

----
<br>
<br>


### `env`for production

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
FRONTEND_URL=https://your-frontend-domain.com

# Email service (choose one)
# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Payment processing
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_public
```


---

<br>

### Docker Deployment

`Docker Deployment`

```Docker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p uploads/products uploads/categories
EXPOSE 5000
CMD ["npm", "start"]
```

----
<br>

### Render Deployment
Create `render.yaml

```yaml
services:
  - type: web
    name: ecommerce-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: ecommerce-db
          property: connectionString

databases:
  - name: ecommerce-db
    plan: starter
```

----
<br>

### Troubleshooting
`Database connection Failed`

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U ecommerce_user -d ecommerce_db

# Reset password if needed
sudo -u postgres psql
ALTER USER ecommerce_user WITH PASSWORD 'ecommerce_password_123';
```

----
<br>


### Debug Mode

```bash
# Enable debug logging
DEBUG=true npm run dev

# Check logs
tail -f logs/app.log
```