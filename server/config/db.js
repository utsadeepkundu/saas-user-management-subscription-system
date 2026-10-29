import mongoose from 'mongoose';

// Reuse the connection across warm Vercel serverless invocations.
const cached = globalThis.mongooseConnectionCache || (globalThis.mongooseConnectionCache = { conn: null, promise: null });

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. Configure a MongoDB Atlas URI for Vercel.');
  }

  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 0,
    }).then((instance) => {
      console.log(`MongoDB connected: ${instance.connection.host}`);
      return instance;
    }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;
