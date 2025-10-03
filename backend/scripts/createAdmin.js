const bcrypt = require('bcryptjs');
const { query, connectDB } = require('../config/database');

async function createAdmin() {
  try {
    await connectDB();
    
    const email = 'admin@yourstore.com';
    const password = 'admin123'; // Change this!
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if admin exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      console.log('❌ Admin already exists');
      return;
    }

    // Create admin
    const result = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, role
    `, [email, hashedPassword, 'Admin', 'User', 'admin', true]);

    console.log('✅ Admin created:', result.rows[0]);
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
