
import { Router } from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getUploadSignature,
} from "../controller/productcontroller.js";

const router = Router();

// Product read routes
router.get("/", getProducts);

// Cloudinary image upload signature
// Keep this before /:id to avoid route conflicts.
router.post("/upload-signature", getUploadSignature);

// Individual product
router.get("/:id", getProductById);

// Product management routes
// Protect write routes with admin authentication before production.
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
