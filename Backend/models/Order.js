import mongoose, { Schema } from "mongoose";
const OrderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
    sku: { type: String, default: "" },
}, { _id: false });
const OrderSchema = new Schema({
    orderId: { type: String, required: true, unique: true, index: true },
    customer: {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        shippingAddress: {
            address: { type: String, required: true, trim: true },
            landmark: { type: String, default: "", trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            pincode: { type: String, required: true, trim: true },
            country: { type: String, default: "India" },
        },
    },
    items: { type: [OrderItemSchema], required: true, validate: [(v) => v.length > 0, "Order must contain at least one item"] },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cod"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    orderStatus: { type: String, enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
}, { timestamps: true });
export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
//# sourceMappingURL=Order.js.map