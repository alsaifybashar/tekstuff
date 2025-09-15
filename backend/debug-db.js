import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/webshop');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webshop';
    
    // Updated options without deprecated parameters
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Removed deprecated options
    };

    console.log('⏳ Attempting connection...');
    const conn = await mongoose.connect(mongoURI, options);

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📍 Port: ${conn.connection.port}`);
    console.log(`📍 Database: ${conn.connection.name}`);
    console.log(`📍 Ready State: ${conn.connection.readyState}`);

    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`   - ${col.name}`));

    await mongoose.disconnect();
    console.log('✅ Test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.reason) {
      console.error('Error reason:', error.reason);
    }
    
    console.error('Full error:', error);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if MongoDB is running: sudo systemctl status mongod');
    console.log('2. Start MongoDB: sudo systemctl start mongod');
    console.log('3. Or use Docker: docker run -d -p 27017:27017 mongo');
    console.log('4. Check if port 27017 is available: netstat -tlnp | grep 27017');
    
    process.exit(1);
  }
};

testConnection();