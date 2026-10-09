const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  await mongoose.connect(uri);
  isConnected = true;
  console.log('[DB] Connected to MongoDB Atlas');

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[DB] Disconnected from MongoDB');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[DB] Connection error:', err.message);
  });
}

module.exports = { connectDB };
