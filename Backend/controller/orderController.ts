import type { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/product.js";

const isNonEmpty = (value: unknown) => typeof value === "string" && value.trim().length > 0;

/** POST /api/orders — creates a Cash on Delivery order. Prices are read from MongoDB, not trusted from the browser. */
export async function createOrder(req: Request, res: Response) {
  try {
    const body = req.body ?? {};
    const customer = body.customer ?? {};
    const address = customer.shippingAddress ?? {};
    const incomingItems = Array.isArray(body.items) ? body.items : [];

    if (!isNonEmpty(customer.name) || !isNonEmpty(customer.email) || !isNonEmpty(customer.phone)) {
      return res.status(400).json({ message: "Customer name, email and phone are required." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (!/^[6-9]\d{9}$/.test(String(customer.phone).trim())) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });
    }
    if (![address.address, address.city, address.state, address.pincode].every(isNonEmpty) || !/^\d{6}$/.test(String(address.pincode).trim())) {
      return res.status(400).json({ message: "A valid delivery address, city, state and 6-digit PIN code are required." });
    }
    if (!incomingItems.length || incomingItems.length > 50) {
      return res.status(400).json({ message: "Your order must contain between 1 and 50 items." });
    }
    if ((body.paymentMethod || "cod") !== "cod") {
      return res.status(400).json({ message: "Only Cash on Delivery is currently available." });
    }

    const requested = incomingItems.map((item: any) => {
      const id = String(item.productId || "");
      const quantity = Number(item.quantity);
      if (!mongoose.isValidObjectId(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error("One or more order items are invalid. Please return to your bag and try again.");
      }
      return { id, quantity };
    });

    const uniqueIds = [...new Set(requested.map((item: { id: string }) => item.id))];
    const products = await Product.find({ _id: { $in: uniqueIds } }).lean();
    const productMap = new Map(products.map((product: any) => [String(product._id), product]));

    const items = requested.map(({ id, quantity }: { id: string; quantity: number }) => {
      const product: any = productMap.get(id);
      if (!product || product.active === false || product.isActive === false) {
        throw new Error("A product in your bag is no longer available. Refresh your bag and try again.");
      }
      const price = Number(product.price);
      if (!Number.isFinite(price) || price < 0) throw new Error("A product price is invalid. Please contact support.");
      const image = product.image || (Array.isArray(product.images) ? product.images[0] : "") || product.thumbnail || "";
      return {
        productId: product._id,
        name: String(product.name || product.title || "Product"),
        price,
        quantity,
        image: String(image),
        sku: String(product.sku || ""),
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
    const total = subtotal + shipping;
    const orderId = `SM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const order = await Order.create({
      orderId,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: String(customer.phone).trim(),
        shippingAddress: {
          address: address.address.trim(), landmark: String(address.landmark || "").trim(),
          city: address.city.trim(), state: address.state.trim(), pincode: String(address.pincode).trim(), country: "India",
        },
      },
      items, subtotal, shipping, total, paymentMethod: "cod", paymentStatus: "pending", orderStatus: "pending",
    });

    return res.status(201).json({ message: "Order placed successfully.", order: { _id: order._id, orderId: order.orderId, total: order.total, orderStatus: order.orderStatus } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place order.";
    const status = /invalid|required|available|bag|price|email|mobile|PIN|Cash on Delivery|items/i.test(message) ? 400 : 500;
    console.error("Create order failed:", error);
    return res.status(status).json({ message: status === 500 ? "Could not place your order right now. Please try again." : message });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const order = await Order.findOne({ $or: [{ orderId: req.params.orderId }, ...(mongoose.isValidObjectId(req.params.orderId) ? [{ _id: req.params.orderId }] : [])] }).lean();
    if (!order) return res.status(404).json({ message: "Order not found." });
    return res.json({ order });
  } catch (error) {
    console.error("Get order failed:", error);
    return res.status(500).json({ message: "Could not retrieve order." });
  }
}
