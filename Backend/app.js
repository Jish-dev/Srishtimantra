import express from "express";
import cors from "cors";
import productRoutes from "./routes/productroutes.js";
import { errorHandler } from "./middleware/errorhandler.js";
import orderRoutes from "./routes/orderRoutes.js";
const app = express();
const allowedOrigins = (process.env.CLIENT_URLS ||
    "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Origin not allowed by CORS"));
        }
    },
}));
app.use(express.json({ limit: "15mb" }));
app.use("/api/orders", orderRoutes);
app.get("/api/health", (_req, res) => {
    res.json({
        success: true,
        message: "Srishtimantra API is running",
    });
});
app.use("/api/products", productRoutes);
app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map