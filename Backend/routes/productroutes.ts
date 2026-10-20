import { Router } from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controller/productcontroller.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);

// Development only: protect write routes before deployment.
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;