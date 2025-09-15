import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const resetDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/webshop');
    console.log('🔄 Resetting database...');
    
    // Drop the entire database
    await mongoose.connection.db.dropDatabase();
    console.log('✅ Database reset complete');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

resetDatabase();
