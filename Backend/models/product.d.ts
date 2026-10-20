import mongoose, { Schema, type InferSchemaType } from "mongoose";
declare const productSchema: Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
export type ProductType = InferSchemaType<typeof productSchema>;
declare const Product: mongoose.Model<any, {}, {}, {}, any, any, any> | mongoose.Model<{
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, {
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, {
    timestamps: true;
}> & Omit<{
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, Schema<any, mongoose.Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, {
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps, {
    id: string;
}, Omit<mongoose.DefaultSchemaOptions, "timestamps"> & {
    timestamps: true;
}> & Omit<{
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, unknown, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>, {
    createdAt: NativeDate;
    updatedAt: NativeDate;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    collection: string;
    stock: number;
    featured: boolean;
    active: boolean;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
} & Required<{
    _id: mongoose.Types.ObjectId;
}>>;
export default Product;
//# sourceMappingURL=product.d.ts.map