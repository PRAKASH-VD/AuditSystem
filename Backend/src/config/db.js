const mongoose = require('mongoose');
const { env } = require('./env');

async function connectDb() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(env.MONGODB_URI);
  console.log('MongoDB connected');
}

module.exports = { connectDb };
