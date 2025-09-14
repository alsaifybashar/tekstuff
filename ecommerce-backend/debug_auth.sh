#!/bin/bash
echo "=== DEBUGGING AUTHENTICATION ==="

# Test admin login and show full response
echo "Testing admin login:"
admin_response=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

echo "Response: $admin_response"

# Check if admin user exists in database
echo -e "\nChecking admin user in database:"
sudo docker exec ecommerce_db_dev psql -U ecommerce_user -d ecommerce -c "SELECT email, role FROM users WHERE email = 'admin@example.com';"
