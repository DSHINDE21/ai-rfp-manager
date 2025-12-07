import app from "./app.js";
import connectDB from "./config/database.js";
import { SERVER_CONFIG } from "./config/constants.js";
import { initializeJobs } from "./jobs/index.js";
import mongoose from "mongoose";

const startServer = async () => {
  try {
    await connectDB();

    const PORT = SERVER_CONFIG.PORT;
    app.listen(PORT, () => {
      if (mongoose.connection.readyState) {
        initializeJobs();
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
