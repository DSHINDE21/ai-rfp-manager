import express from "express";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";

// Import routes
import rfpRoutes from "./routes/rfp.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import proposalRoutes from "./routes/proposal.routes.js";
import comparisonRoutes from "./routes/comparison.routes.js";
import emailRoutes from "./routes/email.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "RFP Management System API is running" });
});

// API Routes
app.use("/api/rfps", rfpRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/comparisons", comparisonRoutes);
app.use("/api/email", emailRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
