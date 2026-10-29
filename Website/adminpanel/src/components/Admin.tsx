import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode, type ChangeEvent } from "react";
import axios from "axios";
import {
    LayoutDashboard, Package, Layers3, Inbox, Images, Settings, Plus, Search,
    Pencil, Trash2, ExternalLink, Sparkles, Menu, X,
    Download, Upload, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon, LogOut, Eye, EyeOff,
} from "lucide-react";
type Product = {
    _id: string;
    subCategory?: string;
    color?: string;
    name: string;
    productCode?: string;
    slug?: string;
    description?: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    productCollection?: string;
    stock: number;
    featured: boolean;
    active: boolean;
    createdAt?: string;
};
type Collection = { id: string; name: string; description: string; image?: string };
type Submission = { id: string; name: string; category: string; collection: string; price: number; status: "Pending" | "Approved" | "Rejected"; description?: string };
type MediaItem = { id: string; name: string; src: string; source: string };
type Page = "dashboard" | "products" | "collections" | "submissions" | "media" | "settings";
type ProductForm = { name: string; productCode: string; category: string; subCategory: string; color: string; productCollection: string; price: string; compareAtPrice: string; stock: string; description: string; images: string; featured: boolean; active: boolean };
// Local development: frontend/.env.local
// Vercel production: VITE_API_URL=https://srishtimantra-1.onrender.com/api

const API = (
    import.meta.env.VITE_API_URL ||
    "https://srishtimantra-1.onrender.com/api"
).replace(/\/+$/, "");

const api = axios.create({
    baseURL: API,
    timeout: 20000,
    headers: {
        "Content-Type": "application/json",
    },
});

async function apiRequest<T = unknown>(
    path: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    data?: unknown,
): Promise<T> {
    try {
        const response = await api.request<T>({ url: path, method, data });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
            if (error.response) {
                const message =
                    error.response.data?.message ||
                    error.response.data?.error ||
                    `Request failed with status ${error.response.status}`;
                throw new Error(message);
            }

            if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
                throw new Error("The backend request timed out. Please try again.");
            }

            if (error.code === "ERR_NETWORK") {
                throw new Error(
                    `Cannot connect to ${API}. Check the backend URL, CORS configuration, and Render service status.`,
                );
            }

            throw new Error(error.message || "Network request failed.");
        }

        throw new Error(
            error instanceof Error ? error.message : "An unexpected error occurred.",
        );
    }
}

async function uploadProductImage(file: File): Promise<string> {
    const signatureResponse = await api.post("/products/upload-signature");
    const { timestamp, signature, folder, cloudName, apiKey } = signatureResponse.data || {};

    if (!timestamp || !signature || !folder || !cloudName || !apiKey) {
        throw new Error("Cloudinary upload configuration is incomplete.");
    }

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", String(apiKey));
    uploadData.append("timestamp", String(timestamp));
    uploadData.append("folder", String(folder));
    uploadData.append("signature", String(signature));

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: uploadData }
    );
    const result = await response.json();

    if (!response.ok || typeof result.secure_url !== "string") {
        throw new Error(result.error?.message || `Cloudinary upload failed for ${file.name}.`);
    }

    return result.secure_url;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
    const parts = dataUrl.split(",");
    if (parts.length < 2) throw new Error("An existing product image has an invalid data URL.");

    const mimeMatch = parts[0].match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] || "image/jpeg";
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], filename, { type: mimeType });
}

function normalizeProduct(value: any): Product | null {
    // Accept common Express response shapes and both Mongo _id / API id fields.
    const raw = value?.product ?? value?.data?.product ?? value?.data ?? value;
    if (!raw || typeof raw !== "object") return null;
    const id = raw._id ?? raw.id ?? raw.productId;
    if (!id) return null;
    return {
        ...raw,
        _id: String(id),
        name: String(raw.name ?? ""),
        category: String(raw.category ?? ""),
        price: Number(raw.price ?? 0),
        compareAtPrice: raw.compareAtPrice == null ? null : Number(raw.compareAtPrice),
        images: Array.isArray(raw.images) ? raw.images : [],
        // Prefer the renamed field while supporting legacy MongoDB documents.
        productCollection: String(raw.productCollection ?? raw.collection ?? raw.collectionName ?? raw.collection?.name ?? ""),
        stock: Number(raw.stock ?? 0),
        featured: Boolean(raw.featured),
        active: raw.active !== false,
    } as Product;
}
function unwrapProducts(payload: any): Product[] {
    const candidates = [
        payload,
        payload?.products,
        payload?.data,
        payload?.data?.products,
        payload?.result,
        payload?.result?.products,
    ];
    const list = candidates.find(Array.isArray);
    if (!list) return [];
    return list.map(normalizeProduct).filter((p: Product | null): p is Product => p !== null);
}
function unwrapProduct(payload: any): Product | null {
    return normalizeProduct(payload?.product ?? payload?.data?.product ?? payload?.data ?? payload);
}
const defaultCollections: Collection[] = [
    { id: "vajra", name: "Vajra", description: "Statement pieces and timeless designs." },
    { id: "suvarna", name: "Suvarna", description: "Traditional elegance and warm tones." },
    { id: "sila", name: "Sila", description: "Stone jewellery shaped by craftsmanship." },
    { id: "seela", name: "Seela", description: "Handmade cloth and textile jewellery." },
    { id: "apurva", name: "Apurva", description: "Unique creations with a story." },
    { id: "daruh", name: "Daruh", description: "Artisan creations inspired by heritage." },
    { id: "narikela", name: "Narikela", description: "Natural textures and thoughtful craft." },
];
const categories = ["Jewellery", "Clothing", "Handicrafts", "Artwork", "Accessories", "Other"];
const initialForm: ProductForm = { name: "", productCode: "", category: "", subCategory: "", color: "", productCollection: "", price: "", compareAtPrice: "", stock: "0", description: "", images: "", featured: false, active: true };
const clothingSubCategories = ["Sarees", "Kurti", "Kurta Sets", "Dresses", "Tops", "Blouses", "Lehengas", "Kids Wear", "Men’s Wear", "Dupattas", "Other"];
const dressColors = ["Black", "White", "Red", "Maroon", "Pink", "Blue", "Navy Blue", "Green", "Olive", "Yellow", "Orange", "Purple", "Brown", "Beige", "Cream", "Grey", "Multicolor"];
function readLocal<T,>(key: string, fallback: T): T {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) as T : fallback;
    } catch { return fallback; }
}
function money(value: number | undefined) {
    return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function productCollection(p: Product) { return p.productCollection || ""; }
function productStatus(p: Product) { return !p.active ? "Draft" : Number(p.stock) <= 0 ? "Out of Stock" : "Available"; }
function statusClass(status: string) {
    if (status === "Draft" || status === "Pending") return "bg-amber-50 text-amber-800";
    if (status === "Out of Stock" || status === "Rejected") return "bg-rose-50 text-rose-700";
    return "bg-emerald-50 text-emerald-800";
}
// Frontend-only demo login. This is NOT secure authentication; credentials are visible in the browser bundle.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "sm@123";
const ADMIN_SESSION_KEY = "srishtimantra_admin_demo_session";

export default function Admin() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        try { return sessionStorage.getItem(ADMIN_SESSION_KEY) === "authenticated"; }
        catch { return false; }
    });
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [page, setPage] = useState<Page>("dashboard");
    const [mobileNav, setMobileNav] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [collections, setCollections] = useState<Collection[]>(() => readLocal("sm_collections_v1", defaultCollections));
    const [submissions, setSubmissions] = useState<Submission[]>(() => readLocal("sm_submissions_v1", []));
    const [media, setMedia] = useState<MediaItem[]>(() => readLocal("sm_media_v1", []));
    const [settings, setSettings] = useState<Record<string, string>>(() => readLocal("sm_settings_v1", {}));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [submissionSearch, setSubmissionSearch] = useState("");
    const [submissionFilter, setSubmissionFilter] = useState("");
    const [productModal, setProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<ProductForm>(initialForm);
    const [collectionModal, setCollectionModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [collectionForm, setCollectionForm] = useState({ name: "", description: "", image: "" });
    const notify = useCallback((message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(""), 2800);
    }, []);
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await apiRequest<any>("/products?limit=100", "GET");
            setProducts(unwrapProducts(data));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not load products");
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { void fetchProducts(); }, [fetchProducts]);
    useEffect(() => { localStorage.setItem("sm_collections_v1", JSON.stringify(collections)); }, [collections]);
    useEffect(() => { localStorage.setItem("sm_submissions_v1", JSON.stringify(submissions)); }, [submissions]);
    useEffect(() => { localStorage.setItem("sm_media_v1", JSON.stringify(media)); }, [media]);
    useEffect(() => { localStorage.setItem("sm_settings_v1", JSON.stringify(settings)); }, [settings]);
    const filteredProducts = useMemo(() => products.filter((p) => {
        const query = search.toLowerCase();
        const matchesSearch = `${p.name} ${p.category} ${productCollection(p)}`.toLowerCase().includes(query);
        return matchesSearch && (!categoryFilter || p.category === categoryFilter) && (!statusFilter || productStatus(p) === statusFilter);
    }), [products, search, categoryFilter, statusFilter]);
    const filteredSubmissions = useMemo(() => submissions.filter((s) =>
        `${s.name} ${s.category} ${s.collection}`.toLowerCase().includes(submissionSearch.toLowerCase()) &&
        (!submissionFilter || s.status === submissionFilter)
    ), [submissions, submissionSearch, submissionFilter]);
    const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "products", label: "Products", icon: Package },
        { id: "collections", label: "Collections", icon: Layers3 },
        { id: "submissions", label: "Client Submissions", icon: Inbox },
        { id: "media", label: "Media Library", icon: Images },
        { id: "settings", label: "Settings", icon: Settings },
    ];
    const title = navItems.find((item) => item.id === page)?.label || "Dashboard";
    function openAddProduct() {
        setEditingProduct(null);
        setForm(initialForm);
        setProductModal(true);
    }
    function openEditProduct(product: Product) {
        setEditingProduct(product);
        setForm({
            name: product.name || "",
            productCode: product.productCode || "",
            category: product.category || "",
            subCategory: product.subCategory || "",
            color: product.color || "",
            productCollection: productCollection(product),
            price: product.compareAtPrice == null ? "" : String(product.price ?? ""),
            compareAtPrice: String(product.compareAtPrice ?? product.price ?? ""),
            stock: String(product.stock ?? 0),
            description: product.description || "",
            images: (product.images || []).join("\n"),
            featured: Boolean(product.featured),
            active: Boolean(product.active),
        });
        setProductModal(true);
    }
    async function saveProduct(event: FormEvent) {
        event.preventDefault();
        const mrp = Number(form.compareAtPrice);
        const hasOfferPrice = form.price.trim() !== "";
        const offerPrice = hasOfferPrice ? Number(form.price) : mrp;
        const price = offerPrice;
        const compareAtPrice = hasOfferPrice && offerPrice < mrp ? mrp : null;
        const stock = Number(form.stock || 0);
        if (!form.name.trim() || !form.category || form.compareAtPrice.trim() === "" || !Number.isFinite(mrp) || mrp < 0 || (hasOfferPrice && (!Number.isFinite(offerPrice) || offerPrice < 0 || offerPrice > mrp)) || !Number.isInteger(stock) || stock < 0) {
            notify("Check the product name, category, MRP, optional offer price and stock.");
            return;
        }
        setSaving(true);
        try {
            // Convert legacy Base64 images to Cloudinary URLs before saving.
            const selectedImages = form.images.split("\n").map((image) => image.trim()).filter(Boolean);
            const imageUrls = await Promise.all(
                selectedImages.map(async (image, index) => {
                    if (!image.startsWith("data:image/")) return image;
                    const file = dataUrlToFile(image, `product-image-${Date.now()}-${index}.jpg`);
                    return uploadProductImage(file);
                })
            );

            const body = {
                name: form.name.trim(), productCode: form.productCode.trim(), category: form.category, subCategory: form.category === "Clothing" ? form.subCategory : "",
                color: form.category === "Clothing" ? form.color : "", productCollection: form.category === "Jewellery" ? form.productCollection : "",
                price, compareAtPrice, stock, description: form.description.trim(),
                images: imageUrls,
                featured: form.featured, active: form.active,
            };

            if (editingProduct && !editingProduct._id) {
                throw new Error("This product has no MongoDB ID. Reload the products and try again.");
            }
            const id = editingProduct ? encodeURIComponent(editingProduct._id) : "";
            const path = editingProduct ? `/products/${id}` : "/products";
            let saved: any;
            if (editingProduct) {
                // Some existing Express APIs expose PATCH instead of PUT.
                try {
                    saved = await apiRequest(path, "PUT", body);
                } catch (error) {
                    const message = error instanceof Error ? error.message : "";
                    if (!/\b(404|405|not found|method not allowed)\b/i.test(message)) throw error;
                    saved = await apiRequest(path, "PATCH", body);
                }
            } else {
                saved = await apiRequest(path, "POST", body);
            }
            const returnedProduct = unwrapProduct(saved);
            if (editingProduct) {
                setProducts((current) => current.map((p) =>
                    p._id === editingProduct._id
                        ? { ...p, ...body, ...(returnedProduct ?? {}), _id: p._id }
                        : p
                ));
            } else if (returnedProduct) {
                setProducts((current) => [returnedProduct, ...current.filter((p) => p._id !== returnedProduct._id)]);
            }
            setProductModal(false);
            setEditingProduct(null);
            notify(editingProduct ? "Product updated successfully" : "Product added successfully");
            await fetchProducts();
        } catch (e) {
            notify(e instanceof Error ? e.message : "Could not save product");
        } finally { setSaving(false); }
    }
    async function toggleHomepageProduct(product: Product) {
        if (!product._id) {
            notify("This product has no MongoDB ID. Refresh the product list and try again.");
            return;
        }
        const nextFeatured = !product.featured;
        try {
            const id = encodeURIComponent(product._id);
            let saved: any;
            try {
                saved = await apiRequest(`/products/${id}`, "PATCH", { featured: nextFeatured });
            } catch (error) {
                const message = error instanceof Error ? error.message : "";
                if (!/\\b(404|405|not found|method not allowed)\\b/i.test(message)) throw error;
                saved = await apiRequest(`/products/${id}`, "PUT", { ...product, featured: nextFeatured });
            }
            const returned = unwrapProduct(saved);
            setProducts((current) => current.map((item) =>
                item._id === product._id ? { ...item, featured: returned?.featured ?? nextFeatured } : item
            ));
            notify(nextFeatured ? "Product selected for homepage" : "Product removed from homepage");
        } catch (e) {
            notify(e instanceof Error ? e.message : "Could not update homepage selection");
        }
    }

    async function deleteProduct(product: Product) {
        if (!product._id) {
            notify("This product has no MongoDB ID. Refresh the product list and try again.");
            return;
        }
        if (!window.confirm(`Permanently delete "${product.name}"?`)) return;
        try {
            const id = encodeURIComponent(product._id);
            try {
                await apiRequest(`/products/${id}`, "DELETE");
            } catch (error) {
                const message = error instanceof Error ? error.message : "";
                // Support APIs that implement deletion as a soft-delete (hide from storefront).
                if (!/\b(404|405|not found|method not allowed)\b/i.test(message)) throw error;
                await apiRequest(`/products/${id}`, "PATCH", { active: false });
            }
            // Remove it from the current admin list immediately so stale list responses
            // cannot make the deleted item look like the operation failed.
            setProducts((current) => current.filter((p) => p._id !== product._id));
            notify("Product deleted");
            await fetchProducts();
            // If the backend returns soft-deleted records in its admin list, keep this
            // deleted item out of the current screen. For permanent deletion, implement
            // findByIdAndDelete in the backend DELETE controller.
            setProducts((current) => current.filter((p) => p._id !== product._id));
        } catch (e) {
            notify(e instanceof Error ? e.message : "Could not delete product");
        }
    }
    function saveCollection(event: FormEvent) {
        event.preventDefault();
        const name = collectionForm.name.trim();
        if (!name) return;
        if (collections.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCollection?.id)) {
            notify("Collection name already exists.");
            return;
        }
        const item: Collection = { id: editingCollection?.id || crypto.randomUUID(), ...collectionForm, name };
        setCollections((current) => editingCollection ? current.map((c) => c.id === item.id ? item : c) : [...current, item]);
        setCollectionModal(false);
        notify(editingCollection ? "Collection updated" : "Collection added");
    }
    function editCollection(collection: Collection) {
        setEditingCollection(collection);
        setCollectionForm({ name: collection.name, description: collection.description, image: collection.image || "" });
        setCollectionModal(true);
    }
    function deleteCollection(collection: Collection) {
        if (!window.confirm(`Delete collection "${collection.name}"? Products assigned to it will become unassigned in the admin view.`)) return;
        setCollections((current) => current.filter((c) => c.id !== collection.id));
        notify("Collection deleted");
    }
    function addSampleSubmission() {
        const name = window.prompt("Sample product name:", "Handcrafted stone pendant");
        if (!name?.trim()) return;
        setSubmissions((current) => [...current, {
            id: crypto.randomUUID(), name: name.trim(), category: "Jewellery", collection: collections[0]?.name || "",
            price: 1250, status: "Pending", description: "Sample client-provided product details.",
        }]);
        notify("Sample submission added");
    }
    function reviewSubmission(submission: Submission, status: "Approved" | "Rejected") {
        setSubmissions((current) => current.map((s) => s.id === submission.id ? { ...s, status } : s));
        notify(status === "Approved" ? "Submission approved (demo only)" : "Submission rejected");
    }
    function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files || []);
        const valid = files.filter((file) => file.size <= 5 * 1024 * 1024);
        if (valid.length !== files.length) notify("Some images were skipped because they exceed 5 MB.");
        valid.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => setMedia((current) => [...current, { id: crypto.randomUUID(), name: file.name, src: String(reader.result), source: "Uploaded media" }]);
            reader.readAsDataURL(file);
        });
        event.target.value = "";
    }
    function exportBackup() {
        const backup = { exportedAt: new Date().toISOString(), products, collections, submissions, media, settings };
        const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url; link.download = "srishtimantra-backup.json"; link.click();
        URL.revokeObjectURL(url);
        notify("Backup exported");
    }
    function clearLocalData() {
        if (!window.confirm("Clear local collections, submissions, media and settings? Products in MongoDB will not be deleted.")) return;
        ["sm_collections_v1", "sm_submissions_v1", "sm_media_v1", "sm_settings_v1"].forEach((key) => localStorage.removeItem(key));
        setCollections(defaultCollections); setSubmissions([]); setMedia([]); setSettings({});
        notify("Local prototype data cleared");
    }
    function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loginUsername.trim() === ADMIN_USERNAME && loginPassword === ADMIN_PASSWORD) {
            try { sessionStorage.setItem(ADMIN_SESSION_KEY, "authenticated"); } catch { /* session storage may be disabled */ }
            setIsAuthenticated(true);
            setLoginError("");
            setLoginPassword("");
        } else {
            setLoginError("Incorrect username or password. Please try again.");
        }
    }

    function handleLogout() {
        try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* ignore */ }
        setIsAuthenticated(false);
        setLoginUsername("");
        setLoginPassword("");
        setPage("dashboard");
    }

    if (!isAuthenticated) {
        return (
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4eee5] px-4 py-10 text-[#33251f]">
                <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#e4d2ba]/50 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#d6c0a5]/40 blur-3xl" />
                <div className="relative w-full max-w-md rounded-3xl border border-[#e6d8c7] bg-[#fffdf9] p-7 shadow-[0_24px_80px_rgba(65,45,30,0.12)] sm:p-9">
                    <div className="mb-8 text-center">
                        <div className="px-25"><img src="/s-logo.png" alt="" width="200px" /></div>

                        <p className="mt-2 text-[10px] font-semibold tracking-[.24em] text-[#9a7859]">ADMINISTRATION PORTAL</p>
                    </div>
                    <div className="mb-6">
                        <h2 className="font-serif text-2xl font-semibold">Welcome back</h2>
                        <p className="mt-2 text-sm text-[#8a786d]">Sign in to manage your store catalogue.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="admin-username" className="mb-2 block text-sm font-medium text-[#493729]">Username</label>
                            <input id="admin-username" autoComplete="username" className="w-full rounded-xl border border-[#e2d4c3] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b3a397] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Enter your username" required />
                        </div>
                        <div>
                            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-[#493729]">Password</label>
                            <div className="relative">
                                <input id="admin-password" autoComplete="current-password" type={showLoginPassword ? "text" : "password"} className="w-full rounded-xl border border-[#e2d4c3] bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-[#b3a397] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" required />
                                <button type="button" onClick={() => setShowLoginPassword((show) => !show)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#8a786d] hover:text-[#34251f]" aria-label={showLoginPassword ? "Hide password" : "Show password"}>{showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>
                        {loginError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loginError}</p>}
                        <button type="submit" className="flex w-full items-center justify-center rounded-xl bg-[#34251f] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#34251f]/15 transition hover:bg-[#51392c] focus:outline-none focus:ring-4 focus:ring-[#9a7047]/20">Sign in to Admin</button>
                    </form>
                    <p className="mt-6 text-center text-xs text-[#a18d7d]">Authorized store management only</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f3ed] text-[#33251f] md:grid md:grid-cols-[245px_minmax(0,1fr)]">
            <aside className={`${mobileNav ? "block" : "hidden"} md:flex fixed md:sticky inset-x-0 top-0 z-30 h-screen w-full md:w-auto flex-col gap-7 overflow-y-auto bg-[#34251f] px-4 py-6 text-[#f7eee3] md:inset-x-auto`}>
                <div className="flex items-center gap-3 px-2">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#c6a77c] font-serif text-2xl text-[#dfc39c]">S</div>
                    <div><h2 className="font-serif text-lg font-semibold">Srishtimantra</h2><p className="mt-1 text-[10px] tracking-[.22em] text-[#c6b2a1]">ADMIN STUDIO</p></div>
                    <button onClick={() => setMobileNav(false)} className="ml-auto rounded-lg p-2 text-[#d9c9bc] md:hidden" aria-label="Close navigation"><X size={20} /></button>
                </div>
                <div>
                    <p className="mb-2 px-3 text-[10px] uppercase tracking-[.2em] text-[#a99281]">Workspace</p>
                    <nav className="space-y-1">
                        {navItems.slice(0, 5).map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => { setPage(id); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${page === id ? "bg-[#4c372c] text-white shadow-[inset_3px_0_#c5a16e]" : "text-[#d9c9bc] hover:bg-[#49372d]"}`}>
                                <Icon size={18} /> <span className="flex-1">{label}</span>
                                {id === "products" && products.length > 0 && <span className="rounded-full bg-[#6d5140] px-2 py-0.5 text-xs">{products.length}</span>}
                            </button>
                        ))}
                    </nav>
                </div>
                <div>
                    <p className="mb-2 px-3 text-[10px] uppercase tracking-[.2em] text-[#a99281]">Preferences</p>
                    <button onClick={() => { setPage("settings"); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${page === "settings" ? "bg-[#4c372c] text-white shadow-[inset_3px_0_#c5a16e]" : "text-[#d9c9bc] hover:bg-[#49372d]"}`}><Settings size={18} /> Settings</button>
                </div>
                <div className="mt-auto rounded-xl bg-[#49372d] p-4 text-xs leading-6 text-[#d9c9bc]">
                    <span className="text-emerald-300">● API-connected prototype</span>
                    <strong className="my-2 block font-serif text-base text-[#fff6eb]">Made for your craft.</strong>
                    Products are loaded from your backend. Collections, submissions, media and settings are stored in this browser until their APIs are connected.
                </div>
            </aside>
            <main className="min-w-0">
                <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e8ddd0] bg-[#fffdf9]/95 px-4 backdrop-blur sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        <button className="rounded-lg border border-[#e8ddd0] p-2 md:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={18} /></button>
                        <p className="truncate text-xs text-[#8a786d]">Srishtimantra <span className="mx-1">/</span> <strong className="text-[#33251f]">{title}</strong></p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e6d6c2] font-bold text-[#694733]">A</div>
                        <div className="hidden sm:block"><strong className="block text-xs">Administrator</strong><small className="text-[#8a786d]">Store manager</small></div>
                        <button onClick={handleLogout} className="ml-2 inline-flex items-center gap-2 rounded-lg border border-[#e2d4c3] bg-white px-3 py-2 text-xs font-semibold text-[#604a3a] transition hover:border-[#b58b55] hover:bg-[#fbf3e7]" title="Sign out"><LogOut size={15} /><span className="hidden sm:inline">Logout</span></button>
                    </div>
                </header>
                <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-7">
                    {error && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} /><div className="min-w-0 flex-1"><strong>Could not load products from API.</strong><p className="mt-1 break-words">{error}. Check that your backend is running and VITE_API_URL is correct.</p></div><button onClick={() => void fetchProducts()} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2"><RefreshCw size={15} /> Retry</button></div>}
                    {page === "dashboard" && <Dashboard products={products} collections={collections} pending={submissions.filter((s) => s.status === "Pending").length} loading={loading} onAdd={openAddProduct} onPage={setPage} onEdit={openEditProduct} />}
                    {page === "products" && <section>
                        <PageHeading eyebrow="CATALOGUE MANAGEMENT" title="Products" description="Add, edit, search and manage your product catalogue." action={<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" onClick={openAddProduct}><Plus size={16} /> Add product</button>} />
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                            <label className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-3 text-[#8a786d]" /><input className="control w-full pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
                            <select className="control sm:w-48" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
                            <select className="control sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All statuses</option><option>Available</option><option>Draft</option><option>Out of Stock</option></select>
                            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d4c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#604a3a] transition duration-200 hover:border-[#b58b55] hover:bg-[#fbf3e7] active:scale-[.98]" onClick={() => void fetchProducts()} title="Refresh"><RefreshCw size={16} /></button>
                        </div>
                        <div className="panel overflow-hidden">
                            <div className="overflow-x-auto"><table className="w-full min-w-[790px] text-left"><thead><tr><Th>Product</Th><Th>Collection</Th><Th>Price</Th><Th>Stock</Th><Th>Status</Th><Th>Homepage</Th><Th>Actions</Th></tr></thead><tbody>
                                {filteredProducts.map((p) => <tr key={p._id} className="border-t border-[#e8ddd0]"><td className="px-4 py-3"><ProductIdentity product={p} /></td><td className="px-4 py-3 text-xs">{productCollection(p) || "—"}</td><td className="px-4 py-3 text-xs font-semibold">{p.compareAtPrice != null && <small className="block text-[#8a786d] line-through">{money(p.compareAtPrice)} MRP</small>}<span className="block font-semibold text-[#34251f]">{money(p.price)} price</span>{p.compareAtPrice != null && p.compareAtPrice > p.price && <small className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}% OFF</small>}</td><td className="px-4 py-3 text-xs">{p.stock ?? 0}</td><td className="px-4 py-3"><Status status={productStatus(p)} /></td><td className="px-4 py-3"><button type="button" onClick={() => void toggleHomepageProduct(p)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${p.featured ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-[#f1e7d9] text-[#765137] hover:bg-[#e7d5bd]"}`} title={p.featured ? "Remove from homepage" : "Show on homepage"}>{p.featured ? "✓ On homepage" : "+ Add to homepage"}</button></td><td className="px-4 py-3"><div className="flex gap-2"><button className="btn-light !px-2.5 !py-2" onClick={() => openEditProduct(p)} title="Edit"><Pencil size={14} /></button><button className="btn-danger !px-2.5 !py-2" onClick={() => void deleteProduct(p)} title="Delete"><Trash2 size={14} /></button></div></td></tr>)}
                            </tbody></table></div>
                            {loading ? <Empty icon={<RefreshCw className="animate-spin" />} title="Loading products" detail="Fetching your catalogue from the backend." /> : filteredProducts.length === 0 ? <Empty icon={<Package />} title="No products found" detail="Add a product or change your search." action={<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" onClick={openAddProduct}><Plus size={16} /> Add product</button>} /> : <div className="border-t border-[#e8ddd0] px-4 py-3 text-xs text-[#8a786d]">Showing {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}</div>}
                        </div>
                    </section>}
                    {page === "collections" && <section>
                        <PageHeading eyebrow="CURATED CATALOGUE" title="Collections" description="Manage the signature collections of Srishtimantra." action={<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" onClick={() => { setEditingCollection(null); setCollectionForm({ name: "", description: "", image: "" }); setCollectionModal(true); }}><Plus size={16} /> Add collection</button>} />
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{collections.map((c) => <div className="collection-card" key={c.id}><div className="mb-4 grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#f1e7d9] font-serif text-lg text-[#694733]">{c.image ? <img src={c.image} className="h-full w-full object-cover" /> : c.name[0]}</div><h3 className="font-serif text-xl font-semibold">{c.name}</h3><p className="mt-2 flex-1 text-xs leading-6 text-[#8a786d]">{c.description || "No description added."}<br />{products.filter((p) => productCollection(p) === c.name).length} products</p><div className="mt-4 flex gap-2"><button className="btn-light flex-1" onClick={() => editCollection(c)}><Pencil size={14} /> Edit</button><button className="btn-danger flex-1" onClick={() => deleteCollection(c)}><Trash2 size={14} /> Delete</button></div></div>)}</div>
                    </section>}
                    {page === "submissions" && <section>
                        <PageHeading eyebrow="CLIENT WORKSPACE" title="Client submissions" description="Review product details submitted by your client." action={<button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d4c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#604a3a] transition duration-200 hover:border-[#b58b55] hover:bg-[#fbf3e7] active:scale-[.98]" onClick={addSampleSubmission}><Plus size={16} /> Add sample</button>} />
                        <Notice>Prototype note: submissions are currently saved in this browser only. Connect a submissions API to share them across devices.</Notice>
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row"><input className="control flex-1" placeholder="Search submissions..." value={submissionSearch} onChange={(e) => setSubmissionSearch(e.target.value)} /><select className="control sm:w-48" value={submissionFilter} onChange={(e) => setSubmissionFilter(e.target.value)}><option value="">All submissions</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
                        <div className="panel p-4 sm:p-5">{filteredSubmissions.map((s) => <div key={s.id} className="mb-3 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e8ddd0] p-4"><div><h3 className="text-sm font-semibold">{s.name}</h3><p className="mt-1 text-xs text-[#8a786d]">{s.category || "Uncategorised"} · {s.collection || "No collection"} · {money(s.price)}</p><div className="mt-2"><Status status={s.status} /></div></div><div className="flex flex-wrap gap-2">{s.status === "Pending" && <><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" onClick={() => reviewSubmission(s, "Approved")}><CheckCircle2 size={14} /> Approve</button><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition duration-200 hover:border-rose-300 hover:bg-rose-100 active:scale-[.98]" onClick={() => reviewSubmission(s, "Rejected")}><X size={14} /> Reject</button></>}</div></div>)}{filteredSubmissions.length === 0 && <Empty icon={<Inbox />} title="No client submissions yet" detail="Sample or connected client submissions will appear here." />}</div>
                    </section>}
                    {page === "media" && <section>
                        <PageHeading eyebrow="VISUAL ASSETS" title="Media library" description="Browse product and collection images." action={<label className="btn-primary cursor-pointer"><Upload size={16} /> Upload image<input type="file" accept="image/*" multiple className="hidden" onChange={uploadMedia} /></label>} />
                        <Notice>Uploaded images are saved in this browser for the prototype. Keep files under 5 MB. For production, use image storage such as Cloudinary.</Notice>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{media.map((m) => <div className="overflow-hidden rounded-xl border border-[#e8ddd0] bg-white" key={m.id}><div className="grid h-32 place-items-center bg-[#f1e7d9]">{m.src ? <img src={m.src} alt={m.name} className="h-full w-full object-cover" /> : <ImageIcon />}</div><div className="p-3"><strong className="block break-words text-xs">{m.name}</strong><small className="text-[#8a786d]">{m.source}</small></div></div>)}</div>
                        {media.length === 0 && <div className="panel mt-3"><Empty icon={<Images />} title="Your media library is empty" detail="Upload an image to get started." /></div>}
                    </section>}
                    {page === "settings" && <section>
                        <PageHeading eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Manage your basic store information." />
                        <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
                            <div className="panel overflow-hidden"><PanelHead title="Store information" subtitle="Brand details for your workspace" /><form className="p-5" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setSettings({ name: String(f.get("name") || ""), tagline: String(f.get("tagline") || ""), email: String(f.get("email") || ""), phone: String(f.get("phone") || ""), about: String(f.get("about") || "") }); notify("Settings saved"); }}><div className="grid gap-4 sm:grid-cols-2"><Field label="Store name"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" name="name" defaultValue={settings.name || "Srishtimantra"} required /></Field><Field label="Tagline"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" name="tagline" defaultValue={settings.tagline || "Tradition meets Creativity"} /></Field><Field label="Contact email"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" name="email" type="email" defaultValue={settings.email || ""} placeholder="hello@example.com" /></Field><Field label="Contact phone"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" name="phone" defaultValue={settings.phone || ""} placeholder="+91..." /></Field><Field label="Brand story" full><textarea className="control min-h-28 w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" name="about" defaultValue={settings.about || ""} placeholder="Tell your brand story..." /></Field></div><div className="mt-5 flex justify-end border-t border-[#e8ddd0] pt-4"><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">Save settings</button></div></form></div>
                            <div className="panel overflow-hidden"><PanelHead title="Data management" subtitle="Backup your workspace data" /><div className="p-5"><p className="mb-4 text-xs leading-6 text-[#8a786d]">Export a JSON backup of products, collections, submissions, media and settings. Clearing local data does not delete products from MongoDB.</p><button className="btn-light w-full" onClick={exportBackup}><Download size={16} /> Export JSON backup</button><button className="btn-danger mt-3 w-full" onClick={clearLocalData}><Trash2 size={16} /> Clear local prototype data</button><p className="mt-6 text-[11px] leading-5 text-[#8a786d]">Admin Studio · React + Tailwind CSS<br />Product data is stored in your backend.</p></div></div>
                        </div>
                    </section>}
                </div>
            </main>
            {productModal && <Modal title={editingProduct ? "Edit product" : "Add product"} onClose={() => setProductModal(false)}>
                <form onSubmit={saveProduct} className="space-y-6">
                    <div className="rounded-2xl border border-[#eadcc9] bg-gradient-to-br from-[#fbf6ee] to-white p-4 sm:p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#a77c4e]">Product details</p>
                        <h3 className="mt-1 font-serif text-lg font-semibold text-[#34251f]">Create your catalogue item</h3>
                        <p className="mt-1 text-xs leading-5 text-[#8a786d]">Add the essentials, set availability, and upload clear product photos.</p>
                    </div>
                    <div className="grid gap-x-5 gap-y-4 rounded-2xl border border-[#eee3d6] bg-white p-4 sm:grid-cols-2 sm:p-5">
                        <Field label="Product name *"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Handcrafted necklace" /></Field>
                        <Field label="Product code"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} placeholder="e.g. SM-JWL-001" /></Field>
                        <Field label="Category *"><select className="control rounded-xl border-[#d9c8b2] bg-[#fffdf9] px-3 py-3 focus:border-[#9a7047] focus:ring-2 focus:ring-[#9a7047]/15" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: "", productCollection: "", color: "" })} required><option value="">Select category</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></Field>
                        {form.category === "Jewellery" && <Field label="Jewellery collection"><select className="control rounded-xl border-[#d9c8b2] bg-[#fffdf9] px-3 py-3" value={form.productCollection} onChange={(e) => setForm({ ...form, productCollection: e.target.value })}><option value="">Choose a collection</option>{collections.slice(0, 7).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></Field>}
                        {form.category === "Clothing" && <Field label="Clothing sub-category *"><select className="control rounded-xl border-[#d9c8b2] bg-[#fffdf9] px-3 py-3" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} required><option value="">Choose clothing type</option>{clothingSubCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>}
                        {form.category === "Clothing" && <Field label="Dress colour"><select className="control rounded-xl border-[#d9c8b2] bg-[#fffdf9] px-3 py-3" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}><option value="">Choose colour</option>{dressColors.map((color) => <option key={color} value={color}>{color}</option>)}</select></Field>}
                        <Field label="MRP / Regular price (₹) *">
                            <input
                                className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.compareAtPrice}
                                onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                                required
                                placeholder="Enter maximum retail price"
                            />
                        </Field>
                        <Field label="Offer price (₹) (optional)">
                            <input
                                className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10"
                                type="number"
                                min="0"
                                max={form.compareAtPrice || undefined}
                                step="0.01"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="Leave blank to use regular price"
                            />
                            {form.compareAtPrice !== "" && form.price !== "" &&
                                Number(form.compareAtPrice) > 0 &&
                                Number(form.price) >= 0 &&
                                Number(form.price) < Number(form.compareAtPrice) && (
                                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                                        <Sparkles size={15} />
                                        <span>
                                            <strong>{Math.round(((Number(form.compareAtPrice) - Number(form.price)) / Number(form.compareAtPrice)) * 100)}% OFF</strong>
                                            <span className="ml-2 text-xs">You save {money(Number(form.compareAtPrice) - Number(form.price))}</span>
                                        </span>
                                    </div>
                                )}
                            {form.compareAtPrice !== "" && form.price !== "" &&
                                Number(form.price) > Number(form.compareAtPrice) && (
                                    <p className="mt-2 text-xs text-rose-700">Offer price should not be higher than MRP.</p>
                                )}
                        </Field>
                        <Field label="Stock quantity"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
                        <Field label="Status"><select className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={form.active ? "active" : "draft"} onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}><option value="active">Available</option><option value="draft">Draft / hidden</option></select></Field>
                        <Field label="Show on homepage?"><select className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={form.featured ? "yes" : "no"} onChange={(e) => setForm({ ...form, featured: e.target.value === "yes" })}><option value="no">No</option><option value="yes">Yes</option></select><p className="mt-1 text-xs text-[#8a786d]">Choose Yes to include this product in homepage featured products.</p></Field>
                        <Field label="Product photos" full>
                            <div className="rounded-2xl border-2 border-dashed border-[#d6c2a5] bg-[#fbf6ee] p-4 sm:p-6">
                                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-[#e4d5c1] bg-white px-4 py-6 text-center transition hover:border-[#9a7047] hover:bg-[#fffaf2]">
                                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f0e4d3] text-[#765137]"><Upload size={21} /></span>
                                    <span className="text-sm font-semibold text-[#493729]">{imageUploading ? "Uploading to Cloudinary..." : form.images.split("\n").filter(Boolean).length ? "Add more images" : "Choose product images"}</span>
                                    <span className="text-xs text-[#8a786d]">{imageUploading ? "Please wait while images upload..." : "Select multiple files · JPG, PNG, WEBP · up to 5 MB each"}</span>
                                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" disabled={imageUploading || saving} onChange={async (event) => {
                                        const input = event.currentTarget;
                                        const files = Array.from(input.files || []);
                                        input.value = "";

                                        const tooLarge = files.filter((file) => file.size > 5 * 1024 * 1024);
                                        if (tooLarge.length) notify("Some images were skipped because each file must be 5 MB or smaller.");

                                        const valid = files.filter((file) =>
                                            file.size <= 5 * 1024 * 1024 && file.type.startsWith("image/")
                                        );
                                        if (!valid.length) return;

                                        setImageUploading(true);
                                        try {
                                            const uploadedUrls = await Promise.all(valid.map(uploadProductImage));
                                            setForm((current) => ({
                                                ...current,
                                                images: [
                                                    ...current.images.split("\n").map((value) => value.trim()).filter(Boolean),
                                                    ...uploadedUrls,
                                                ].join("\n"),
                                            }));
                                            notify(`${uploadedUrls.length} image(s) uploaded to Cloudinary.`);
                                        } catch (uploadError) {
                                            notify(uploadError instanceof Error ? uploadError.message : "Cloudinary image upload failed.");
                                        } finally {
                                            setImageUploading(false);
                                        }
                                    }} />
                                </label>
                                {form.images.trim() && <p className="mt-4 text-xs font-semibold text-[#694733]">{form.images.split("\n").filter(Boolean).length} image(s) selected — choose “Add more images” to append more photos.</p>}
                                {form.images.trim() && <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">{form.images.split("\n").filter(Boolean).map((image, index) => <div key={`${index}-${image.slice(0, 20)}`} className="group relative overflow-hidden rounded-xl border border-[#e4d5c1] bg-white"><img src={image} alt={`Product preview ${index + 1}`} className="h-24 w-full object-cover" onError={(event) => { event.currentTarget.style.opacity = "0.25"; }} /><button type="button" onClick={() => setForm((current) => ({ ...current, images: current.images.split("\n").filter((_, i) => i !== index).join("\n") }))} className="absolute right-1 top-1 rounded-full bg-[#34251f] px-2 py-1 text-xs text-white shadow hover:bg-rose-700" aria-label={`Remove image ${index + 1}`}>×</button></div>)}</div>}
                                <p className="mt-3 text-[11px] leading-5 text-[#8a786d]">Images upload to Cloudinary. Only image URLs are saved with the product, keeping API requests small.</p>
                            </div>
                        </Field>
                        <Field label="Description" full><textarea className="control min-h-24 w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product story, craftsmanship and details..." /></Field>
                    </div>
                    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#e8ddd0] pt-4"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d4c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#604a3a] transition duration-200 hover:border-[#b58b55] hover:bg-[#fbf3e7] active:scale-[.98]" onClick={() => setProductModal(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" disabled={saving || imageUploading}>{imageUploading ? "Uploading images..." : saving ? "Saving..." : "Save product"}</button></div>
                </form>
            </Modal>}
            {collectionModal && <Modal title={editingCollection ? "Edit collection" : "Add collection"} onClose={() => setCollectionModal(false)}>
                <form onSubmit={saveCollection} className="space-y-4"><Field label="Collection name *"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={collectionForm.name} onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })} required placeholder="e.g. Vajra" /></Field><Field label="Description"><textarea className="control min-h-24 w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={collectionForm.description} onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })} /></Field><Field label="Image URL"><input className="control w-full rounded-xl border border-[#e2d4c3] bg-white px-3.5 py-3 text-sm font-normal text-[#33251f] shadow-sm outline-none transition placeholder:text-[#b3a397] hover:border-[#c8ad8e] focus:border-[#9a7047] focus:ring-4 focus:ring-[#9a7047]/10" value={collectionForm.image} onChange={(e) => setCollectionForm({ ...collectionForm, image: e.target.value })} placeholder="https\\://..." /></Field><div className="flex justify-end gap-2 border-t border-[#e8ddd0] pt-4"><button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d4c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#604a3a] transition duration-200 hover:border-[#b58b55] hover:bg-[#fbf3e7] active:scale-[.98]" onClick={() => setCollectionModal(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">Save collection</button></div></form>
            </Modal>}
            {toast && <div role="status" className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] rounded-xl bg-[#34251f] px-4 py-3 text-sm text-white shadow-xl">{toast}</div>}
        </div>
    );
}
function Dashboard({ products, collections, pending, loading, onAdd, onPage, onEdit }: { products: Product[]; collections: Collection[]; pending: number; loading: boolean; onAdd: () => void; onPage: (page: Page) => void; onEdit: (product: Product) => void }) {
    const featured = products.filter((p) => p.featured).length;
    const recent = [...products].reverse().slice(0, 5);
    return <section>
        <PageHeading eyebrow="ADMINISTRATOR WORKSPACE" title="Welcome back, Admin." description="Manage your Srishtimantra catalogue and creative collections." action={<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" onClick={onAdd}><Plus size={16} /> Add new product</button>} />
        <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Total products" value={loading ? "—" : products.length} note="Products in your catalogue" icon={<Package size={18} />} />
            <Stat label="Collections" value={collections.length} note="Curated craft categories" icon={<Layers3 size={18} />} />
            <Stat label="Pending submissions" value={pending} note="Waiting for review" icon={<Inbox size={18} />} />
            <Stat label="Featured products" value={featured} note="Highlighted products" icon={<Sparkles size={18} />} />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <div className="panel overflow-hidden"><PanelHead title="Recent products" subtitle="Latest catalogue updates" action={<button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d4c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#604a3a] transition duration-200 hover:border-[#b58b55] hover:bg-[#fbf3e7] active:scale-[.98]" onClick={() => onPage("products")}>View all <ExternalLink size={13} /></button>} />
                {recent.length ? <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left"><thead><tr><Th>Product</Th><Th>Price</Th><Th>Status</Th></tr></thead><tbody>{recent.map((p) => <tr key={p._id} className="border-t border-[#e8ddd0]"><td className="px-4 py-3"><button onClick={() => onEdit(p)} className="text-left"><ProductIdentity product={p} /></button></td><td className="px-4 py-3 text-xs">{p.compareAtPrice != null && <small className="block text-[#8a786d] line-through">{money(p.compareAtPrice)}</small>}<span className="font-semibold">{money(p.price)}</span>{p.compareAtPrice != null && p.compareAtPrice > p.price && <small className="ml-1 text-emerald-700">{Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}% off</small>}</td><td className="px-4 py-3"><Status status={productStatus(p)} /></td></tr>)}</tbody></table></div> : <Empty icon={<Package />} title="Your catalogue starts here" detail="Add your first product to see it here." action={<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34251f] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#34251f]/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#51392c] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" onClick={onAdd}><Plus size={16} /> Add first product</button>} />}
            </div>
            <div className="panel overflow-hidden"><PanelHead title="Quick actions" subtitle="Store essentials" /><div className="grid grid-cols-2 gap-3 p-4"><Quick icon={<Plus />} title="Add a product" detail="Create a catalogue item" onClick={onAdd} /><Quick icon={<Layers3 />} title="Collections" detail="Organise products" onClick={() => onPage("collections")} /><Quick icon={<Inbox />} title="Submissions" detail="Review client data" onClick={() => onPage("submissions")} /><Quick icon={<Images />} title="Media library" detail="Browse images" onClick={() => onPage("media")} /></div></div>
        </div>
        <div className="panel mt-5 overflow-hidden"><PanelHead title="Signature collections" subtitle="Your core collections" action={<button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d4c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#604a3a] transition duration-200 hover:border-[#b58b55] hover:bg-[#fbf3e7] active:scale-[.98]" onClick={() => onPage("collections")}>Manage <ExternalLink size={13} /></button>} /><div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">{collections.slice(0, 7).map((c) => <div className="rounded-xl border border-[#e8ddd0] p-4" key={c.id}><div className="mb-3 grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#f1e7d9] font-serif text-lg text-[#694733]">{c.image ? <img src={c.image} className="h-full w-full object-cover" /> : c.name[0]}</div><h3 className="font-serif text-lg font-semibold">{c.name}</h3><p className="mt-1 text-xs text-[#8a786d]">{products.filter((p) => productCollection(p) === c.name).length} products</p></div>)}</div></div>
    </section>;
}
function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
    return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#b58b55]">{eyebrow}</p><h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-[34px]">{title}</h1><p className="mt-2 text-sm leading-6 text-[#8a786d]">{description}</p></div>{action}</div>;
}
function Stat({ label, value, note, icon }: { label: string; value: ReactNode; note: string; icon: ReactNode }) {
    return <div className="rounded-xl border border-[#e8ddd0] bg-[#fffdf9] p-4 transition hover:border-[#b58b55] sm:p-5"><div className="flex items-center justify-between gap-2 text-xs text-[#8a786d]">{label}<span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1e7d9] text-[#694733]">{icon}</span></div><div className="my-3 font-serif text-3xl font-semibold">{value}</div><p className="text-[11px] text-[#8a786d]">{note}</p></div>;
}
function PanelHead({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
    return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ddd0] px-5 py-4"><div><h2 className="font-serif text-lg font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-xs text-[#8a786d]">{subtitle}</p>}</div>{action}</div>;
}
function Th({ children }: { children: ReactNode }) { return <th className="bg-[#fcf8f2] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#8a786d]">{children}</th>; }
function ProductIdentity({ product }: { product: Product }) {
    return <div className="flex min-w-[155px] items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#eee2d3] text-[#694733]">{product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" /> : <Sparkles size={17} />}</div><div className="min-w-0"><strong className="block max-w-[220px] truncate text-xs">{product.name} {product.featured ? "✧" : ""}</strong><small className="mt-1 block text-[#8a786d]">{product.category}</small></div></div>;
}
function Status({ status }: { status: string }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(status)}`}>{status}</span>; }
function Empty({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) {
    return <div className="flex flex-col items-center px-4 py-10 text-center"><div className="mb-3 text-[#b58b55]">{icon}</div><strong className="text-sm">{title}</strong><p className="mt-1 max-w-sm text-xs leading-6 text-[#8a786d]">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
function Quick({ icon, title, detail, onClick }: { icon: ReactNode; title: string; detail: string; onClick: () => void }) {
    return <button onClick={onClick} className="rounded-xl border border-[#e8ddd0] bg-[#fffdf9] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#b58b55]"><span className="text-xl text-[#694733]">{icon}</span><strong className="mt-3 block text-xs">{title}</strong><small className="mt-1 block text-[11px] leading-5 text-[#8a786d]">{detail}</small></button>;
}
function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
    return <label className={`flex min-w-0 flex-col gap-2 text-[11px] font-bold text-[#6e5848] ${full ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
function Notice({ children }: { children: ReactNode }) { return <div className="mb-4 rounded-lg border border-[#e8d8c5] bg-[#f5ecdf] p-3 text-xs leading-6 text-[#75563e]">{children}</div>; }
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    return <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#24170e99] p-3 sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="my-auto w-full max-w-[780px] overflow-hidden rounded-3xl border border-[#eadcc9] bg-[#fffdf9] shadow-[0_25px_80px_-25px_rgba(52,37,31,.45)]"><div className="sticky top-0 flex items-center justify-between border-b border-[#e8ddd0] bg-[#fffdf9] px-5 py-4"><h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2><button className="rounded-lg p-1 text-[#8a786d] hover:bg-[#f1e7d9]" onClick={onClose} aria-label="Close"><X size={22} /></button></div><div className="max-h-[calc(100dvh-110px)] overflow-y-auto p-5">{children}</div></div></div>;
}

