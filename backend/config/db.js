const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error('MONGODB_URL is not configured');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = connectDB;
