import mongoose, { Schema } from "mongoose";
const productSchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null },
    images: { type: [String], default: [] },
    category: { type: String, default: "" },
    collection: { type: String, default: "" },
    stock: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
}, { timestamps: true });
const Product = mongoose.models.Product ??
    mongoose.model("Product", productSchema);
export default Product;
//# sourceMappingURL=product.js.map