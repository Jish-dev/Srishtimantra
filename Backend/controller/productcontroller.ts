
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Product from "../models/product.js";

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateProduct(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A product object is required";
  }

  const data = body as Record<string, unknown>;

  if (typeof data.name !== "string" || !data.name.trim()) {
    return "Product name is required";
  }

  if (
    data.price === undefined ||
    data.price === null ||
    data.price === "" ||
    !Number.isFinite(Number(data.price)) ||
    Number(data.price) < 0
  ) {
    return "A valid non-negative price is required";
  }

  if (
    data.stock !== undefined &&
    (!Number.isInteger(Number(data.stock)) ||
      Number(data.stock) < 0)
  ) {
    return "Stock must be a non-negative whole number";
  }

  if (
    data.images !== undefined &&
    (!Array.isArray(data.images) ||
      !data.images.every(
        (image) =>
          typeof image === "string" && image.trim().length > 0
      ))
  ) {
    return "Images must be an array of non-empty strings";
  }

  if (
    data.compareAtPrice !== undefined &&
    data.compareAtPrice !== null &&
    data.compareAtPrice !== "" &&
    (!Number.isFinite(Number(data.compareAtPrice)) ||
      Number(data.compareAtPrice) < 0)
  ) {
    return "Compare-at price must be a valid non-negative number";
  }

  return null;
}

function productData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {
    name: String(body.name).trim(),
    slug: slugify(String(body.name)),
    description:
      typeof body.description === "string" ? body.description : "",
    price: Number(body.price),
    category:
      typeof body.category === "string" && body.category.trim()
        ? body.category.trim()
        : "Uncategorized",
    collection:
      typeof body.collection === "string"
        ? body.collection.trim()
        : "",
    stock: body.stock === undefined ? 0 : Number(body.stock),
    featured: body.featured === true,
    active: body.active !== false,
  };

  if (Array.isArray(body.images)) {
    data.images = body.images.map((image) =>
      (image as string).trim()
    );
  }

  if (
    body.compareAtPrice === undefined ||
    body.compareAtPrice === null ||
    body.compareAtPrice === ""
  ) {
    data.compareAtPrice = undefined;
  } else {
    data.compareAtPrice = Number(body.compareAtPrice);
  }

  return data;
}

// GET /api/products
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 20)
    );

    const filter: Record<string, unknown> = { active: true };

    if (typeof req.query.category === "string") {
      filter.category = req.query.category;
    }

    if (typeof req.query.collection === "string") {
      filter.collection = req.query.collection;
    }

    if (req.query.featured === "true") {
      filter.featured = true;
    }

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.$text = { $search: req.query.search.trim() };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/products/:id
export async function getProductById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const product = mongoose.isValidObjectId(id)
      ? await Product.findOne({ _id: id, active: true }).lean()
      : await Product.findOne({ slug: id, active: true }).lean();

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

// POST /api/products
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const errorMessage = validateProduct(req.body);

    if (errorMessage) {
      res.status(400).json({ message: errorMessage });
      return;
    }

    const product = await Product.create(
      productData(req.body as Record<string, unknown>)
    );

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/products/:id
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const errorMessage = validateProduct(req.body);

    if (errorMessage) {
      res.status(400).json({ message: errorMessage });
      return;
    }

    const existingProduct = await Product.findById(req.params.id);

    if (!existingProduct) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const updates = productData(
      req.body as Record<string, unknown>
    );

    // Preserve existing images when the request omits "images".
    if (!Array.isArray(req.body.images)) {
      delete updates.images;
    }

    // Preserve existing compare-at price when that field is omitted.
    if (!Object.prototype.hasOwnProperty.call(req.body, "compareAtPrice")) {
      delete updates.compareAtPrice;
    }

    existingProduct.set(updates);

    await existingProduct.save();

    res.json({
      message: "Product updated successfully",
      product: existingProduct,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/products/:id
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product permanently deleted from MongoDB",
      productId: deletedProduct._id,
    });
  } catch (error) {
    next(error);
  }
}
