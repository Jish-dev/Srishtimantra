export type StoreProduct = {
  _id?: string;
  id?: string | number;
  name: string;
  category: string;
  price: number;
  image?: string;
  images?: string[];
  tag?: string;
  quantity?: number;
  oldPrice?: number;
  subCategory?: string;
  color?: string;
  collection?: string;
  description?: string;
  sku?: string;
  stock?: number;
};

export const CART_KEY = "srishtimantra_cart";
export const WISHLIST_KEY = "srishtimantra_wishlist";
export const STORE_EVENT = "srishtimantra-store-update";

export function readStore(key: string): StoreProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeStore(key: string, value: StoreProduct[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}

export function productKey(product: StoreProduct) {
  return String(product._id ?? product.id ?? product.name);
}
