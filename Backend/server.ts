
import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import productRoutes from "./routes/productroutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// API root
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Srishtimantra API is running",
  });
});

// Product routes
app.use("/api/products", productRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Srishtimantra API is running",
  });
});

// Connect to MongoDB before starting the server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Srishtimantra server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
