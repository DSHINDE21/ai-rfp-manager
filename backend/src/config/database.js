import mongoose from "mongoose";
import { DB_CONFIG } from "./constants.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB_CONFIG.MONGODB_URI, {
      // Mongoose 6+ no longer needs these options, but keeping for compatibility
    });

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("Database connection error:", error.message);
    console.warn("⚠️  Server will continue without database connection. Some features may not work.");
    // Don't exit in development - allow server to run for testing other features
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    return null;
  }
};

export default connectDB;
