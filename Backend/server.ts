
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB from "./dist/config/db.js";

import productRoutes from "./dist/routes/productroutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

// API routes
app.use("/api/products", productRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Srishtimantra API is running"
  });
});

// Production frontend
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.resolve(__dirname, "../frontend/dist");

  app.use(express.static(frontendPath));

  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send("Srishtimantra API is running in development mode.");
  });
}

// Connect to MongoDB before starting the server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Srishtimantra server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
