import mongoose, { Schema, type InferSchemaType } from "mongoose";
declare const OrderSchema: Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type OrderDocument = InferSchemaType<typeof OrderSchema>;
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<{
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    orderId: string;
    customer?: {
        name: string;
        email: string;
        phone: string;
        shippingAddress?: {
            address: string;
            landmark: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
        } | null;
    } | null;
    items: mongoose.Types.DocumentArray<{
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, mongoose.Types.Subdocument<mongoose.mongo.ObjectId, unknown, {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }, {}, {}> & {
        productId: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image: string;
        sku: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: "cod";
    paymentStatus: "failed" | "paid" | "pending" | "refunded";
    orderStatus: "cancelled" | "confirmed" | "delivered" | "pending" | "processing" | "shipped";
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
} & Required<{
    _id: mongoose.Types.ObjectId;
}>>;
export default _default;
//# sourceMappingURL=Order.d.ts.map