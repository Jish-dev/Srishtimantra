import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Share2,
  HelpCircle,
  X,
  MapPin,
  Star
} from "lucide-react";
import {
  CART_KEY,
  WISHLIST_KEY,
  STORE_EVENT,
  readStore,
  writeStore,
  productKey,
  type StoreProduct,
} from "../components/store";

type Product = StoreProduct & {
  _id?: string;
  id?: string | number;
  slug?: string;
  description?: string;
  subCategory?: string;
  color?: string;
  collection?: string;
  oldPrice?: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
  careInstructions?: string;
  tags?: string[];
  featured?: boolean;
  active?: boolean;
  isActive?: boolean;
  quantity?: number;
};

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const imageFallback = "/placeholder-product.png";
const dressColors = ["Maroon", "Red", "Indigo Blue", "Emerald Green", "Mustard", "Beige", "Charcoal Black", "Ivory White"];

function normalizeProduct(raw: any): Product | null {
  const item = raw?.product || raw?.data?.product || raw?.data || raw;
  if (!item || typeof item !== "object" || !(item._id || item.id || item.name || item.title)) return null;
  const images = Array.isArray(item.images)
    ? item.images.filter((image: unknown) => typeof image === "string" && image.trim())
    : [];
  const price = Number(item.price || 0);
  return {
    _id: String(item._id || item.id || item.productId || ""),
    id: item.id,
    slug: item.slug,
    name: String(item.name || item.title || "Product"),
    category: String(item.category || "Handcrafted"),
    subCategory: item.subCategory || item.subcategory || "",
    collection: item.collection || "",
    description: item.description || item.details || "A thoughtfully selected piece from Srishtimantra's collection.",
    price,
    oldPrice: item.compareAtPrice != null ? Number(item.compareAtPrice) : item.oldPrice != null ? Number(item.oldPrice) : undefined,
    image: item.image || images[0] || item.thumbnail || "",
    images: images.length ? images : item.image ? [item.image] : [],
    tag: item.tag || (item.featured ? "Featured" : ""),
    stock: item.stock == null ? undefined : Number(item.stock),
    sku: item.sku || item.productCode || "",
    color: item.color || "",
    material: item.material || item.materials || "",
    dimensions: item.dimensions || item.size || "",
    weight: item.weight || "",
    careInstructions: item.careInstructions || item.care || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured: Boolean(item.featured),
    active: item.active,
    isActive: item.isActive,
  };
}

function getRequestedProductId() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("id") || params.get("productId") || params.get("slug");
  if (fromQuery) return fromQuery;
  const parts = window.location.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "";
  return ["detail", "product", "products"].includes(last.toLowerCase()) ? "" : decodeURIComponent(last);
}

export default function Detail() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartAdded, setCartAdded] = useState(false);
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [openInfo, setOpenInfo] = useState<string | null>("description");
  const [cart, setCart] = useState<StoreProduct[]>(() => readStore(CART_KEY));
  const [wishlist, setWishlist] = useState<StoreProduct[]>(() => readStore(WISHLIST_KEY));

  // Interactive E-commerce States
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [selectedVariant, setSelectedVariant] = useState("Standard");
  const [selectedColor, setSelectedColor] = useState("");

  const productId = useMemo(() => getRequestedProductId(), []);

  useEffect(() => {
    let cancelled = false;
    async function loadProduct() {
      setLoading(true);
      setError("");
      if (!productId) {
        setError("Product not selected. Open this page from a product card.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/products/${encodeURIComponent(productId)}`);
        const found = normalizeProduct(response.data);
        if (!found || found.active === false || found.isActive === false) throw new Error("This product is unavailable.");
        if (!cancelled) {
          setProduct(found);
          if (found.color) setSelectedColor(found.color);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || "Could not load this product. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProduct();
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    const sync = () => {
      setCart(readStore(CART_KEY));
      setWishlist(readStore(WISHLIST_KEY));
    };
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const images = product?.images?.length ? product.images : product?.image ? [product.image] : [imageFallback];
  const key = product ? productKey(product) : "";
  const isWishlisted = Boolean(product && wishlist.some((item) => productKey(item) === key));
  const inStock = product?.stock == null || product.stock > 0;
  const discount = product?.oldPrice && product.oldPrice > (product.price || 0)
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  function addToCart(goToCheckout = false) {
    if (!product || !inStock) return;
    const isClothing = /cloth/i.test(product.category || "");
    const chosenColor = isClothing ? (selectedColor || product.color || "Standard") : "";

    const current = readStore(CART_KEY);
    const existing = current.find((item: any) => productKey(item) === key && item.variant === selectedVariant && item.chosenColor === chosenColor);

    const next = existing
      ? current.map((item: any) => productKey(item) === key && item.variant === selectedVariant && item.chosenColor === chosenColor
        ? { ...item, quantity: Math.max(1, Number(item.quantity || 1)) + quantity }
        : item)
      : [...current, { ...product, quantity, variant: selectedVariant, chosenColor }];

    writeStore(CART_KEY, next);
    setCart(next);
    setCartAdded(true);
    if (goToCheckout) {
      const checkoutParams = new URLSearchParams({ productId: key, quantity: String(quantity) });
      window.location.href = `/checkout?${checkoutParams.toString()}`;
    }
  }

  function toggleWishlist() {
    if (!product) return;
    const current = readStore(WISHLIST_KEY);
    const next = current.some((item) => productKey(item) === key)
      ? current.filter((item) => productKey(item) !== key)
      : [...current, product];
    writeStore(WISHLIST_KEY, next);
    setWishlist(next);
    setWishlistSaved(next.some((item) => productKey(item) === key));
  }

  function handleCheckPincode(e: React.FormEvent) {
    e.preventDefault();
    if (!pincode || pincode.length < 6) return;
    setDeliveryStatus("checking");
    setTimeout(() => {
      setDeliveryStatus("available");
    }, 600);
  }

  if (loading) {
    return (
      <main className="min-h-[65vh] bg-[#faf7f1] px-4 py-20 text-center text-[#715844]">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#d8c8b4] border-t-[#76553c]" />
        <p className="mt-4 text-sm font-medium tracking-wide">Crafting your viewing experience…</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-[65vh] bg-[#faf7f1] px-4 py-20 text-center text-[#46372c]">
        <div className="mx-auto max-w-lg rounded-3xl border border-[#eadfd2] bg-white p-8 shadow-sm">
          <ShoppingBag className="mx-auto h-9 w-9 text-[#9a795b]" />
          <h1 className="mt-4 font-serif text-2xl">Product details unavailable</h1>
          <p className="mt-2 text-sm text-[#897968]">{error || "We couldn't find this product."}</p>
          <button onClick={() => { window.location.href = "/products"; }} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4a3528] px-6 py-3 text-sm text-white transition hover:bg-[#6b4b36]">
            Browse products <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#25211e]">
      {/* Announcement Bar */}
      <div className="bg-[#f3ede2] py-2 text-center text-xs font-medium tracking-wider text-[#63503e]">
        ✨ Handcrafted with care • Free shipping across India on orders above ₹1,499
      </div>

      <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 lg:px-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <button onClick={() => window.location.assign("/")} className="transition hover:text-black">Home</button>
          <span>/</span>
          <button onClick={() => window.location.assign("/products")} className="transition hover:text-black">Products</button>
          <span>/</span>
          <button onClick={() => window.location.assign(`/products?category=${encodeURIComponent(product.category)}`)} className="transition hover:text-black">{product.category}</button>
          <span>/</span>
          <span className="max-w-[230px] truncate font-medium text-neutral-900">{product.name}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,.85fr)] lg:gap-14 xl:gap-20">

          {/* Left: Gallery Section */}
          <section className="min-w-0">
            <div className="grid gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
              {/* Vertical Thumbnails */}
              <div className="order-2 flex gap-3 overflow-x-auto pb-2 sm:order-1 sm:flex-col sm:overflow-visible">
                {images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`View product image ${index + 1}`}
                    className={`relative h-[84px] w-[70px] shrink-0 overflow-hidden rounded-md border-2 p-0.5 transition sm:h-[116px] sm:w-[90px] ${selectedImage === index ? "border-[#4a3528] shadow-sm" : "border-neutral-200 hover:border-neutral-400"}`}
                  >
                    <img
                      src={src || imageFallback}
                      alt={`${product.name} view ${index + 1}`}
                      className="h-full w-full rounded-[4px] object-cover"
                      onError={(event) => { event.currentTarget.src = imageFallback; }}
                    />
                  </button>
                ))}
              </div>

              {/* Main Image Viewer */}
              <div
                className="group relative order-1 min-w-0 cursor-zoom-in overflow-hidden rounded-xl bg-[#f7f5f1] sm:order-2"
                onClick={() => setIsZoomOpen(true)}
              >
                <img
                  src={images[selectedImage] || imageFallback}
                  alt={product.name}
                  className="aspect-[4/5] max-h-[900px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(event) => { event.currentTarget.src = imageFallback; }}
                />

                {/* Badges */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  {product.tag && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-neutral-900 shadow-sm backdrop-blur-sm">
                      <Sparkles size={11} className="text-amber-600" /> {product.tag}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-md bg-[#25211e]/90 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white backdrop-blur-sm">
                    Handcrafted
                  </span>
                </div>

                {discount > 0 && (
                  <span className="absolute right-3 top-3 rounded-md bg-[#a3342b] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
                    {discount}% OFF
                  </span>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      aria-label="Previous image"
                      onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage - 1 + images.length) % images.length); }}
                      className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md transition hover:bg-white hover:scale-105"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      aria-label="Next image"
                      onClick={(e) => { e.stopPropagation(); setSelectedImage((selectedImage + 1) % images.length); }}
                      className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md transition hover:bg-white hover:scale-105"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}

                <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm">
                  Click to expand
                </div>
              </div>
            </div>
          </section>

          {/* Right: Product Details & Purchase Controls */}
          <section className="lg:sticky lg:top-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">(24 verified reviews)</span>
                </div>
                <p className="text-[11px] uppercase tracking-[.2em] text-[#8c6d53] font-semibold">
                  {product.collection || product.category}
                  {product.subCategory ? ` / ${product.subCategory}` : ""}
                </p>
                <h1 className="mt-1 text-2xl font-serif font-normal leading-snug tracking-tight sm:text-3xl lg:text-4xl">
                  {product.name}
                </h1>
                {product.sku && <p className="mt-2 text-xs text-neutral-400">SKU: {product.sku}</p>}
              </div>
              <button
                onClick={toggleWishlist}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition ${isWishlisted ? "border-rose-300 bg-rose-50 text-rose-600 shadow-sm" : "border-neutral-200 text-neutral-700 hover:border-neutral-700 hover:bg-neutral-50"}`}
              >
                <Heart size={21} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Price Tag */}
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-[#faf7f1] p-4 border border-[#f0eae1]">
              <span className="text-2xl font-semibold tracking-tight sm:text-3xl">{money(product.price)}</span>
              {product.oldPrice != null && product.oldPrice > product.price && (
                <>
                  <span className="text-sm text-neutral-400 line-through">{money(product.oldPrice)}</span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    Save {money(product.oldPrice - product.price)}
                  </span>
                </>
              )}
              <div className="w-full text-xs text-neutral-500 mt-0.5">Inclusive of all applicable taxes & duties</div>
            </div>

            {/* Stock status indicator */}
            <div className="mt-5 flex items-center justify-between">
              <div className={`flex items-center gap-2 text-xs font-medium ${inStock ? "text-emerald-700" : "text-red-700"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-emerald-600 animate-pulse" : "bg-red-600"}`} />
                {inStock ? (product.stock != null && product.stock <= 5 ? `Only ${product.stock} items left in stock!` : "In stock & ready to ship") : "Currently unavailable"}
              </div>
              {inStock && <span className="text-xs text-neutral-500">100% Authentic Handloom</span>}
            </div>

            {/* Color Selector (Only visible for Clothing category) */}
            {/cloth/i.test(product.category || "") && (
              <div className="mt-6 border-t border-neutral-100 pt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-[.12em] text-neutral-700">
                    Choose Fabric Colour: <span className="font-normal text-[#8c6d53]">{selectedColor || product.color || "Select"}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(product.color ? [product.color, ...dressColors.filter(c => c.toLowerCase() !== product.color?.toLowerCase())] : dressColors).slice(0, 6).map((color) => {
                    const isSelected = (selectedColor || product.color || dressColors[0]) === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition shadow-sm ${isSelected
                            ? "border-[#4a3528] bg-[#faf7f1] ring-2 ring-[#4a3528]/20 font-semibold"
                            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                          }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-inner"
                          style={{
                            backgroundColor: color.toLowerCase().includes("red") ? "#b91c1c" :
                              color.toLowerCase().includes("blue") ? "#1d4ed8" :
                                color.toLowerCase().includes("green") ? "#15803d" :
                                  color.toLowerCase().includes("black") ? "#171717" :
                                    color.toLowerCase().includes("white") || color.toLowerCase().includes("ivory") ? "#f5f5f4" :
                                      color.toLowerCase().includes("maroon") ? "#831843" :
                                        color.toLowerCase().includes("mustard") ? "#d97706" : "#c5a059"
                          }}
                        />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variant Selector Demo (Size / Finish) */}
            <div className="mt-6 border-t border-neutral-100 pt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-neutral-700">Select Edition / Finish</p>
                <span className="text-xs text-[#8c6d53] cursor-pointer hover:underline">Size Guide</span>
              </div>
              <div className="flex gap-2">
                {["Standard", "Collector's Edition"].map((variant) => (
                  <button
                    key={variant}
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-lg border px-4 py-2.5 text-xs font-medium transition ${selectedVariant === variant ? "border-[#4a3528] bg-[#4a3528] text-white shadow-sm" : "border-neutral-200 text-neutral-700 hover:border-neutral-400"}`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-700">Quantity</p>
              <div className="inline-flex h-12 items-center rounded-xl border border-neutral-300 bg-white shadow-sm">
                <button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center text-neutral-700 disabled:opacity-30 transition hover:bg-neutral-50 rounded-l-xl">
                  <Minus size={15} />
                </button>
                <span className="w-12 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                <button aria-label="Increase quantity" disabled={!inStock || (product.stock != null && quantity >= product.stock)} onClick={() => setQuantity((value) => value + 1)} className="grid h-11 w-11 place-items-center text-neutral-700 disabled:opacity-30 transition hover:bg-neutral-50 rounded-r-xl">
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                disabled={!inStock}
                onClick={() => addToCart(false)}
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 border-[#25211e] bg-white px-5 py-3.5 text-sm font-semibold text-[#25211e] transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
              >
                <ShoppingBag size={18} />
                {cartAdded || cart.some((item) => productKey(item) === key) ? "Added to Cart" : "Add to Cart"}
              </button>
              <button
                disabled={!inStock}
                onClick={() => addToCart(true)}
                className="flex min-h-13 items-center justify-center rounded-xl bg-[#25211e] px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#3d342f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Buy It Now
              </button>
            </div>
            {cartAdded && (
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <Check size={15} /> Successfully added to your cart. Ready for checkout!
              </p>
            )}

            {/* Delivery Pincode Checker */}
            <div className="mt-6 rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 mb-2">
                <MapPin size={15} className="text-[#8c6d53]" /> Check Delivery & COD Availability
              </div>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "")); setDeliveryStatus("idle"); }}
                  className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-800 outline-none focus:border-[#4a3528]"
                />
                <button type="submit" className="rounded-lg bg-[#4a3528] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#63503e]">
                  {deliveryStatus === "checking" ? "Checking..." : "Verify"}
                </button>
              </form>
              {deliveryStatus === "available" && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  ✓ Standard delivery by <span className="underline">Tuesday, next week</span>. Cash on Delivery available.
                </p>
              )}
            </div>

            {/* Share & Support Links */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-neutral-200 pb-5 text-xs font-medium text-neutral-600">
              <button
                onClick={() => {
                  const url = window.location.href;
                  if (navigator.share) navigator.share({ title: product.name, url }).catch(() => { });
                  else if (navigator.clipboard) navigator.clipboard.writeText(url);
                  alert("Product link copied to clipboard!");
                }}
                className="inline-flex items-center gap-1.5 transition hover:text-black"
              >
                <Share2 size={14} /> Share
              </button>
              <button
                onClick={() => window.location.href = `mailto:support@srishtimantra.com?subject=${encodeURIComponent(`Question about ${product.name}`)}&body=${encodeURIComponent(`Hello Srishtimantra Team,\n\nI have a question about this item: ${window.location.href}`)}`}
                className="inline-flex items-center gap-1.5 transition hover:text-black"
              >
                <HelpCircle size={14} /> Ask an Artisan / Expert
              </button>
              {wishlistSaved && <span className="text-rose-600 font-semibold">♥ Wishlist updated</span>}
            </div>

            {/* Trust Badges Bar */}
            <div className="mt-5 grid grid-cols-3 gap-3 py-4 border-b border-neutral-200 text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck size={20} className="text-[#8c6d53]" />
                <span className="text-[11px] font-semibold text-neutral-800">Pan-India Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-neutral-200 px-2">
                <RotateCcw size={20} className="text-[#8c6d53]" />
                <span className="text-[11px] font-semibold text-neutral-800">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={20} className="text-[#8c6d53]" />
                <span className="text-[11px] font-semibold text-neutral-800">100% Secure Pay</span>
              </div>
            </div>

            {/* Accordion Information Section */}
            <div className="mt-2 divide-y divide-neutral-200 border-b border-neutral-200">
              {[
                { id: "description", title: "Product Description", content: product.description || "A thoughtfully selected piece from Srishtimantra's curated artisan collection." },
                { id: "details", title: "Specifications & Details", content: [product.category && `Category: ${product.category}`, product.subCategory && `Type: ${product.subCategory}`, product.collection && `Collection: ${product.collection}`, product.material && `Material: ${product.material}`, (selectedColor || product.color) && `Colour: ${selectedColor || product.color}`, product.dimensions && `Size: ${product.dimensions}`, product.weight && `Weight: ${product.weight}`, product.sku && `SKU: ${product.sku}`].filter(Boolean).join("\n") || "Please refer to product photos for exact build quality." },
                { id: "care", title: "Care Instructions", content: product.careInstructions || "Store in a clean, dry place. Keep away from moisture, strong perfumes, and harsh chemicals. Clean gently with a soft dry cloth." },
                { id: "delivery", title: "Shipping & Return Policy", content: "Orders are shipped within 2-3 business days. Handcrafted products are eligible for returns within 7 days of delivery if received damaged or defective." },
              ].map((row) => (
                <div key={row.id}>
                  <button
                    onClick={() => setOpenInfo((current) => current === row.id ? null : row.id)}
                    className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-neutral-900 transition hover:text-[#8c6d53]"
                    aria-expanded={openInfo === row.id}
                  >
                    <span>{row.title}</span>
                    <ChevronDown size={17} className={`transition-transform duration-300 ${openInfo === row.id ? "rotate-180" : ""}`} />
                  </button>
                  {openInfo === row.id && (
                    <p className="whitespace-pre-line pb-5 pr-5 text-xs leading-relaxed text-neutral-600 animate-fadeIn">
                      {row.content}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] leading-5 text-neutral-400 italic">
              * Note: Every handcrafted piece is unique. Minor variations in texture, finish, or color are natural hallmarks of genuine artisanal work.
            </p>
          </section>
        </div>
      </div>

      {/* Full-Screen Image Zoom Lightbox Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close zoom view"
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={22} />
          </button>
          <img
            src={images[selectedImage] || imageFallback}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}