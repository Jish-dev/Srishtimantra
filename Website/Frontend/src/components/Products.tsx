import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search,
  Heart,
  ShoppingBag,
  X,
  RotateCcw,
  Check,
  Sparkles,
  Eye,
  Filter,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import {
  CART_KEY,
  WISHLIST_KEY,
  STORE_EVENT,
  readStore,
  writeStore,
  productKey,
} from "./store";

type Product = {
  _id?: string;
  id?: string | number;
  name: string;
  category: string;
  subCategory?: string;
  color?: string;
  collection?: string;
  price: number;
  oldPrice?: number;
  image?: string;
  images?: string[];
  tag?: string;
  featured?: boolean;
  active?: boolean;
  isActive?: boolean;
  description?: string;
};

const categories = ["All", "Jewelry", "Clothing", "Handicraft", "Art Works"];

const categoryDetails = [
  { name: "All", subtitle: "Explore everything", defaultImg: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&q=80&w=800" },
  { name: "Jewelry", subtitle: "Vajra & Suvarna craft", defaultImg: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800" },
  { name: "Clothing", subtitle: "Handwoven sarees & kurtis", defaultImg: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800" },
  { name: "Handicraft", subtitle: "Stone & artisanal decor", defaultImg: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800" },
  { name: "Art Works", subtitle: "Heritage paintings & prints", defaultImg: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=800" },
];

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const formatPrice = (price: number) => `₹${Number(price || 0).toLocaleString("en-IN")}`;
const getProductId = (product: Product) => product._id ?? product.id ?? product.name;
const getImageUrl = (product: Product) =>
  product.image || product.images?.[0] || "/placeholder-product.png";

const ITEMS_PER_PAGE = 16;

function normalizeProducts(payload: any): Product[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.products)
      ? payload.products
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.products)
          ? payload.data.products
          : Array.isArray(payload?.result)
            ? payload.result
            : [];

  return rows
    .filter((item: any) => item && item.active !== false && item.isActive !== false)
    .map((item: any) => {
      const images = Array.isArray(item.images)
        ? item.images.filter((image: unknown) => typeof image === "string" && image.trim())
        : [];
      return {
        _id: String(item._id || item.id || item.productId || ""),
        id: item.id,
        name: String(item.name || item.title || "Untitled product"),
        category: String(item.category || "Other"),
        subCategory: item.subCategory || "",
        color: item.color || "",
        collection: item.collection || "",
        price: Number(item.price || 0),
        oldPrice:
          item.compareAtPrice != null
            ? Number(item.compareAtPrice)
            : item.oldPrice != null
              ? Number(item.oldPrice)
              : undefined,
        image: item.image || images[0] || item.thumbnail || "",
        images,
        tag: item.tag || (item.featured ? "Featured" : ""),
        featured: Boolean(item.featured),
        description: item.description || "",
      };
    });
}

export default function Products() {
  const openProductDetail = (product: Product) => {
    const id = product._id || product.id;
    if (!id) return;
    window.location.href = `/product/${encodeURIComponent(String(id))}`;
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window === "undefined") return "All";
    return new URLSearchParams(window.location.search).get("category") || "All";
  });
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("search") || "";
  });
  const [sortBy, setSortBy] = useState(() => {
    if (typeof window === "undefined") return "featured";
    return new URLSearchParams(window.location.search).get("sort") || "featured";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlist, setWishlist] = useState<Product[]>(() => readStore(WISHLIST_KEY) as Product[]);
  const [cart, setCart] = useState<Product[]>(() => readStore(CART_KEY) as Product[]);
  const [view, setView] = useState<"all" | "cart" | "wishlist">(() => {
    if (typeof window === "undefined") return "all";
    const requested = new URLSearchParams(window.location.search).get("view");
    return requested === "cart" || requested === "wishlist" ? requested : "all";
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedSubcategory, setSelectedSubcategory] = useState(() => {
    if (typeof window === "undefined") return "All";
    return new URLSearchParams(window.location.search).get("subcategory") || "All";
  });
  const [selectedColor, setSelectedColor] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("tag") === "new";
  });
  const [selectedCollection, setSelectedCollection] = useState(() => {
    if (typeof window === "undefined") return "All";
    const value = new URLSearchParams(window.location.search).get("collection") || "All";
    return value.toLowerCase() === "all" ? "All" : value;
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const sync = () => {
      setCart(readStore(CART_KEY) as Product[]);
      setWishlist(readStore(WISHLIST_KEY) as Product[]);
    };
    window.addEventListener(STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const applyLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("view");
      setView(requested === "cart" || requested === "wishlist" ? requested : "all");
      setActiveCategory(params.get("category") || "All");
      setSearch(params.get("search") || "");
      setSortBy(params.get("sort") || "featured");
      setSelectedSubcategory(params.get("subcategory") || "All");
      setSelectedCollection((params.get("collection") || "All").toLowerCase() === "all" ? "All" : params.get("collection") || "All");
      setFeaturedOnly(params.get("tag") === "new");
      setCurrentPage(1);
    };
    const onPopState = () => applyLocation();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_URL}/products`, { signal: controller.signal });
        const rows = normalizeProducts(response.data);
        setProducts(rows);
        const highest = rows.reduce((value, item) => Math.max(value, item.price), 0);
        setMaxPrice(Math.max(1000, Math.ceil(highest / 1000) * 1000));
      } catch (err) {
        if (axios.isCancel(err) || (err instanceof Error && err.name === "CanceledError")) return;
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message ||
            `Could not load products from ${API_URL}. Check that the backend is running and GET /api/products works.`
            : "An unexpected error occurred while loading products."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, search, sortBy, maxPrice, selectedSubcategory, selectedColor, featuredOnly, selectedCollection, view]);

  const availableSubcategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter((product) => activeCategory === "All" || product.category.toLowerCase().includes(activeCategory.toLowerCase().replace("jewelry", "jewel")))
            .map((product) => product.subCategory)
            .filter((value): value is string => Boolean(value?.trim()))
        )
      ).sort(),
    [products, activeCategory]
  );

  const availableColors = useMemo(
    () => Array.from(new Set(products.map((product) => product.color).filter((value): value is string => Boolean(value?.trim())))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const source = view === "cart" ? cart : view === "wishlist" ? wishlist : products;

    const result = source.filter((product) => {
      const category = product.category.toLowerCase().replace(/[^a-z]/g, "");
      const selected = activeCategory.toLowerCase().replace(/[^a-z]/g, "");
      let categoryMatches = activeCategory === "All";

      if (selected === "jewelry") categoryMatches = category === "jewelry" || category === "jewellery";
      else if (selected === "clothing") categoryMatches = ["cloth", "clothing", "saree", "sarees"].includes(category);
      else if (selected === "artworks") categoryMatches = category === "artworks" || category === "art";
      else if (selected === "handicraft") categoryMatches = category === "handicraft" || category === "handicrafts" || category === "craft";
      else if (activeCategory !== "All") categoryMatches = category === selected;

      const searchMatches =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch) ||
        (product.subCategory || "").toLowerCase().includes(normalizedSearch) ||
        (product.tag || "").toLowerCase().includes(normalizedSearch) ||
        (product.color || "").toLowerCase().includes(normalizedSearch);

      const subcategoryMatches = selectedSubcategory === "All" || product.subCategory === selectedSubcategory;
      const colorMatches = selectedColor === "All" || product.color === selectedColor;
      const priceMatches = product.price <= maxPrice;
      const featuredMatches = !featuredOnly || product.featured || /new/i.test(product.tag || "");
      const collectionMatches =
        selectedCollection === "All" ||
        selectedCollection.toLowerCase() === "all" ||
        (product.collection || "").toLowerCase() === selectedCollection.toLowerCase() ||
        (selectedCollection === "Unique" && /unique/i.test(product.collection || product.tag || ""));

      return categoryMatches && searchMatches && subcategoryMatches && colorMatches && priceMatches && featuredMatches && collectionMatches;
    });

    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "featured") result.sort((a, b) => Number(b.featured) - Number(a.featured));
    return result;
  }, [products, cart, wishlist, view, activeCategory, search, sortBy, maxPrice, selectedSubcategory, selectedColor, featuredOnly, selectedCollection]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const toggleWishlist = (product: Product) => {
    const key = productKey(product);
    const next = wishlist.some((item) => productKey(item) === key)
      ? wishlist.filter((item) => productKey(item) !== key)
      : [...wishlist, product];
    setWishlist(next);
    writeStore(WISHLIST_KEY, next);
  };

  const addToCart = (product: Product) => {
    const key = productKey(product);
    const next = cart.some((item) => productKey(item) === key) ? cart : [...cart, product];
    setCart(next);
    writeStore(CART_KEY, next);
  };

  const removeFromCart = (product: Product) => {
    const next = cart.filter((item) => productKey(item) !== productKey(product));
    setCart(next);
    writeStore(CART_KEY, next);
  };

  const openView = (nextView: "all" | "cart" | "wishlist") => {
    setView(nextView);
    const url = new URL(window.location.href);
    if (nextView === "all") url.searchParams.delete("view");
    else url.searchParams.set("view", nextView);
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setActiveCategory("All");
    setSearch("");
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setActiveCategory("All");
    setSearch("");
    setSortBy("featured");
    setSelectedSubcategory("All");
    setSelectedColor("All");
    setSelectedCollection("All");
    setFeaturedOnly(false);
    const highest = products.reduce((value, item) => Math.max(value, item.price), 0);
    setMaxPrice(Math.max(1000, Math.ceil(highest / 1000) * 1000));
    setCurrentPage(1);
  };

  const activeFilterCount =
    Number(activeCategory !== "All") +
    Number(selectedSubcategory !== "All") +
    Number(selectedColor !== "All") +
    Number(selectedCollection !== "All") +
    Number(featuredOnly) +
    Number(maxPrice < Math.max(1000, ...products.map((product) => product.price)));

  return (
    <main className="min-h-screen bg-white font-['Outfit'] text-[#25211e]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        .product-image { transition: transform 0.6s cubic-bezier(0.2, 0.65, 0.3, 1); }
        .product-card:hover .product-image { transform: scale(1.05); }
      `}</style>

      {/* Announcement Bar */}
      <div className="bg-[#f3ede2] py-2 text-center text-xs font-medium tracking-wider text-[#63503e]">
        ✨ Handcrafted with care • Free shipping across India on orders above ₹1,499
      </div>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-neutral-100 bg-[#faf7f1] px-5 py-12 sm:px-8 sm:py-16">
        <div className="relative mx-auto max-w-[1500px]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-[#8c6d53]">
            {view === "cart" ? "Your Shopping Bag" : view === "wishlist" ? "Saved Treasures" : "Curated Artisanal Collections"}
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="max-w-3xl text-3xl font-serif font-normal leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                {view === "cart" ? <>Your selected <span className="italic font-serif">bag.</span></> : view === "wishlist" ? <>Things you <span className="italic font-serif">love.</span></> : <>Find your next <span className="italic font-serif">treasure.</span></>}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-600">
                {view === "cart"
                  ? `${cart.length} ${cart.length === 1 ? "piece" : "pieces"} ready for checkout.`
                  : view === "wishlist"
                    ? `${wishlist.length} ${wishlist.length === 1 ? "treasure" : "treasures"} saved for later review.`
                    : "Jewellery, clothing, and handcrafted decor chosen for their character, rare craftsmanship, and timeless beauty."}
              </p>
            </div>
            <div className="flex gap-3 self-start md:self-auto">
              <button type="button" onClick={() => openView("wishlist")} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition shadow-sm ${view === "wishlist" ? "border-rose-300 bg-rose-50 text-rose-600" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"}`}>
                <Heart size={15} fill={view === "wishlist" ? "currentColor" : "none"} /> Wishlist <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold">{wishlist.length}</span>
              </button>
              <button type="button" onClick={() => openView("cart")} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition shadow-sm ${view === "cart" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"}`}>
                <ShoppingBag size={15} /> Bag <span className="rounded-full bg-neutral-100/20 px-2 py-0.5 text-[10px] font-semibold">{cart.length}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Image Carousel Category Section */}
      {view === "all" && (
        <section className="mx-auto max-w-[1600px] px-4 pt-10 sm:px-7 lg:px-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8c6d53] mb-1">Visual Discovery</p>
              <h2 className="text-xl font-serif text-neutral-900 sm:text-2xl">Browse by category</h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("img-cat-carousel");
                  if (el) el.scrollBy({ left: -340, behavior: "smooth" });
                }}
                className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:border-neutral-900 transition shadow-sm"
                aria-label="Scroll left"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("img-cat-carousel");
                  if (el) el.scrollBy({ left: 340, behavior: "smooth" });
                }}
                className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:border-neutral-900 transition shadow-sm"
                aria-label="Scroll right"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div
            id="img-cat-carousel"
            className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categoryDetails.map((cat) => {
              const isSelected = activeCategory === cat.name;
              // Find first matching product image or use fallback default imagery
              const matchingProduct = products.find(p =>
                cat.name === "All" || p.category.toLowerCase().includes(cat.name.toLowerCase().replace("works", "").trim())
              );
              const cardImage = matchingProduct ? getImageUrl(matchingProduct) : cat.defaultImg;
              const count = cat.name === "All"
                ? products.length
                : products.filter(p => p.category.toLowerCase().includes(cat.name.toLowerCase().replace("works", "").trim())).length;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setSelectedSubcategory("All");
                    setCurrentPage(1);
                  }}
                  className={`snap-start shrink-0 group relative flex flex-col justify-end overflow-hidden rounded-3xl p-6 text-left transition-all w-[240px] h-[320px] sm:w-[280px] sm:h-[360px] shadow-md cursor-pointer ${isSelected ? "ring-4 ring-[#4a3528]" : "hover:shadow-xl"
                    }`}
                >
                  {/* Background Image with Gradient Overlay */}
                  <img
                    src={cardImage}
                    alt={cat.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity group-hover:from-black/90" />

                  {/* Active Indicator Badge */}
                  {isSelected && (
                    <span className="absolute top-4 right-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-900 shadow-md">
                      Active
                    </span>
                  )}

                  {/* Text Details */}
                  <div className="relative z-10 text-white">
                    <span className="inline-block rounded-md bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md mb-2">
                      {count} {count === 1 ? "Item" : "Items"}
                    </span>
                    <h3 className="font-serif text-xl font-normal sm:text-2xl">{cat.name}</h3>
                    <p className="mt-1 text-xs text-neutral-200 line-clamp-1">{cat.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Catalog View */}
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-7 sm:py-12 lg:px-10">
        {view !== "all" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => openView("all")} className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 transition hover:text-black">
              ← Continue shopping catalog
            </button>
            {view === "cart" && cart.length > 0 && (
              <button type="button" onClick={() => { setCart([]); writeStore(CART_KEY, []); }} className="text-xs font-medium text-rose-600 hover:underline">
                Clear shopping bag
              </button>
            )}
          </div>
        )}

        {/* Toolbar & Filter Bar */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {loading ? "Loading collection..." : `${filteredProducts.length} ${filteredProducts.length === 1 ? "Product Found" : "Products Found"}`}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">Hand-inspected artisanal goods</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search collection..."
                aria-label="Search products"
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 py-2.5 pl-10 pr-4 text-xs outline-none transition placeholder:text-neutral-400 focus:border-[#4a3528] focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-900 shadow-sm"
            >
              <Sparkles size={15} className="text-amber-600" /> Switch Category
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-900 shadow-sm"
            >
              <Filter size={15} /> Filters
              {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4a3528] px-1 text-[10px] text-white">{activeFilterCount}</span>}
            </button>
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-medium text-neutral-700 outline-none focus:border-[#4a3528] shadow-sm cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Switch Category Popup Modal with Image Previews */}
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-neutral-200">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-600" />
                  <h3 className="font-serif text-lg text-neutral-900">Explore Other Collections</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 transition"
                  aria-label="Close category modal"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-neutral-500 mb-5">
                Switch instantly to discover handwoven clothing, stone handicrafts, or heritage art works.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categoryDetails.map((cat) => {
                  const matchingProduct = products.find(p =>
                    cat.name === "All" || p.category.toLowerCase().includes(cat.name.toLowerCase().replace("works", "").trim())
                  );
                  const cardImg = matchingProduct ? getImageUrl(matchingProduct) : cat.defaultImg;
                  const count = cat.name === "All"
                    ? products.length
                    : products.filter(p => p.category.toLowerCase().includes(cat.name.toLowerCase().replace("works", "").trim())).length;

                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.name);
                        setSelectedSubcategory("All");
                        setCurrentPage(1);
                        setCategoryModalOpen(false);
                      }}
                      className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl p-3 text-left transition h-36 shadow-sm border ${activeCategory === cat.name ? "border-[#4a3528] ring-2 ring-[#4a3528]/20" : "border-neutral-200"
                        }`}
                    >
                      <img src={cardImg} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="relative z-10 text-white">
                        <h4 className="font-serif text-sm font-semibold">{cat.name}</h4>
                        <span className="text-[10px] text-neutral-300">{count} {count === 1 ? "Item" : "Items"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Slide-Over Filter Drawer */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5 bg-[#faf7f1]">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-[#8c6d53]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Filters & Refine</h2>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-[#4a3528] px-2 py-0.5 text-[10px] font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="rounded-full p-2 text-neutral-500 transition hover:bg-neutral-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Category</h3>
                    <span className="text-xs font-medium text-[#8c6d53]">{activeCategory}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          setActiveCategory(category);
                          setSelectedSubcategory("All");
                        }}
                        className={`rounded-xl border px-4 py-2 text-xs font-medium transition ${activeCategory === category
                          ? "border-[#4a3528] bg-[#4a3528] text-white shadow-sm"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                          }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {availableSubcategories.length > 0 && (
                  <div>
                    <label htmlFor="subcategory-filter" className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-800">Style / Subcategory</label>
                    <select
                      id="subcategory-filter"
                      value={selectedSubcategory}
                      onChange={(event) => setSelectedSubcategory(event.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-xs outline-none focus:border-[#4a3528]"
                    >
                      <option value="All">All styles</option>
                      {availableSubcategories.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div>
                    <label htmlFor="color-filter" className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-800">Colour</label>
                    <select
                      id="color-filter"
                      value={selectedColor}
                      onChange={(event) => setSelectedColor(event.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-xs outline-none focus:border-[#4a3528]"
                    >
                      <option value="All">All colours</option>
                      {availableColors.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="collection-filter" className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-800">Collection</label>
                  <select
                    id="collection-filter"
                    value={selectedCollection}
                    onChange={(event) => setSelectedCollection(event.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-3 text-xs outline-none focus:border-[#4a3528]"
                  >
                    <option value="All">All collections</option>
                    {["Vajra", "Suvarna", "Shila", "Seela", "Apurva", "Daruh", "Narikela", "Unique"].map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="price-filter" className="text-xs font-bold uppercase tracking-wider text-neutral-800">Maximum Price</label>
                    <span className="text-xs font-bold text-[#8c6d53]">{formatPrice(maxPrice)}</span>
                  </div>
                  <input
                    id="price-filter"
                    type="range"
                    min={0}
                    max={Math.max(1000, ...products.map((product) => product.price))}
                    step={500}
                    value={Math.min(maxPrice, Math.max(1000, ...products.map((product) => product.price)))}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    className="w-full accent-[#4a3528]"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(event) => setFeaturedOnly(event.target.checked)}
                    className="h-4 w-4 rounded accent-[#4a3528]"
                  />
                  Featured products only
                </label>
              </div>

              <div className="border-t border-neutral-200 px-6 py-4 bg-neutral-50 flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 shadow-sm"
                >
                  <RotateCcw size={13} /> Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 rounded-xl bg-[#4a3528] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#63503e] shadow-md"
                >
                  View Results ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Category Text Chips */}
        {view === "all" && (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-xl border px-5 py-2.5 text-xs font-medium transition shadow-sm ${activeCategory === category
                  ? "border-[#4a3528] bg-[#4a3528] text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-24 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-[#4a3528]" />
            <p className="mt-4 text-xs font-medium text-neutral-600">Discovering and loading treasures…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-16 text-center">
            <h2 className="font-serif text-xl">Unable to load products</h2>
            <p className="mx-auto mt-2 max-w-lg break-words text-xs text-neutral-500 leading-relaxed">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-[#4a3528] px-6 py-3 text-xs font-medium text-white transition hover:bg-[#63503e]">Try Again</button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4">
              {paginatedProducts.map((product) => {
                const key = productKey(product);
                const isWishlisted = wishlist.some((item) => productKey(item) === key);
                const isInCart = cart.some((item) => productKey(item) === key);
                const image = getImageUrl(product);
                const discount = product.oldPrice && product.oldPrice > product.price
                  ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
                  : 0;

                return (
                  <article key={String(getProductId(product))} className="product-card group relative flex flex-col">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#f7f5f1] border border-neutral-100 shadow-sm">
                      <button
                        type="button"
                        onClick={() => openProductDetail(product)}
                        aria-label={`View details for ${product.name}`}
                        className="block h-full w-full overflow-hidden cursor-pointer"
                      >
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = "/placeholder-product.png";
                          }}
                          className="product-image h-full w-full object-cover"
                        />
                      </button>

                      <div className="absolute inset-x-3 top-3 flex items-start justify-between pointer-events-none">
                        <div className="flex flex-col gap-1 pointer-events-auto">
                          {product.tag && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-neutral-900 shadow-sm backdrop-blur-sm">
                              <Sparkles size={10} className="text-amber-600" /> {product.tag}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="rounded-md bg-[#a3342b] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                              {discount}% OFF
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleWishlist(product)}
                          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          aria-pressed={isWishlisted}
                          className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-md transition ${isWishlisted ? "bg-rose-500 text-white" : "bg-white/90 text-neutral-800 hover:bg-white hover:scale-105"
                            }`}
                        >
                          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1.8} />
                        </button>
                      </div>

                      <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 translate-y-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        <button
                          type="button"
                          onClick={() => openProductDetail(product)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/95 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-900 shadow-md backdrop-blur-sm transition hover:bg-white"
                        >
                          <Eye size={13} /> Quick View
                        </button>
                        <button
                          type="button"
                          onClick={() => view === "cart" ? removeFromCart(product) : addToCart(product)}
                          aria-label={view === "cart" ? "Remove from bag" : "Add to bag"}
                          className={`flex items-center justify-center rounded-xl px-3 py-2.5 shadow-md backdrop-blur-sm transition ${view === "cart"
                            ? "bg-rose-600 text-white hover:bg-rose-700"
                            : isInCart
                              ? "bg-emerald-600 text-white"
                              : "bg-[#25211e] text-white hover:bg-black"
                            }`}
                        >
                          {view === "cart" ? <X size={15} /> : isInCart ? <Check size={15} /> : <ShoppingBag size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-col flex-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                        <span className="uppercase tracking-widest font-semibold text-[#8c6d53] truncate">
                          {product.subCategory || product.category}
                        </span>
                        {product.featured && <span className="text-amber-600 font-medium">✦ Featured</span>}
                      </div>

                      <h2 className="text-xs font-medium leading-relaxed text-neutral-900 group-hover:text-[#8c6d53] transition line-clamp-2 sm:text-sm">
                        <button
                          type="button"
                          onClick={() => openProductDetail(product)}
                          className="text-left outline-none"
                        >
                          {product.name}
                        </button>
                      </h2>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-sm font-semibold tracking-tight sm:text-base">{formatPrice(product.price)}</span>
                        {product.oldPrice != null && product.oldPrice > product.price && (
                          <span className="text-xs text-neutral-400 line-through">{formatPrice(product.oldPrice)}</span>
                        )}
                      </div>

                      {product.color && (
                        <p className="mt-1 text-[11px] text-neutral-500">Colour: {product.color}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination Navigation" className="mt-16 flex items-center justify-center gap-2 border-t border-neutral-200 pt-8">
                <button
                  type="button"
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 250, behavior: "smooth" }); }}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <ArrowLeft size={14} /> Previous
                </button>

                <div className="flex items-center gap-1.5 px-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => { setCurrentPage(num); window.scrollTo({ top: 250, behavior: "smooth" }); }}
                      className={`h-9 w-9 rounded-xl text-xs font-semibold transition ${currentPage === num
                        ? "bg-[#4a3528] text-white shadow-sm"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 250, behavior: "smooth" }); }}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  Next <ArrowRight size={14} />
                </button>
              </nav>
            )}

            {filteredProducts.length === 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-[#faf7f1] px-6 py-20 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border border-neutral-200 text-[#8c6d53] shadow-sm">
                  {view === "wishlist" ? <Heart size={22} /> : view === "cart" ? <ShoppingBag size={22} /> : <Search size={22} />}
                </div>
                <p className="mt-5 text-xl font-serif font-normal text-neutral-900">
                  {view === "cart" ? "Your shopping bag is empty" : view === "wishlist" ? "No saved treasures yet" : "No matching treasures found"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs text-neutral-500 leading-relaxed">
                  {view === "cart"
                    ? "Explore our collections and add pieces you love to your bag."
                    : view === "wishlist"
                      ? "Tap the heart icon on any product card to save items for later."
                      : products.length === 0
                        ? "Catalog items will appear here once added by administrators."
                        : "Try adjusting your search keywords or resetting active filters."}
                </p>
                {view !== "all" ? (
                  <button type="button" onClick={() => openView("all")} className="mt-6 rounded-xl bg-[#4a3528] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#63503e]">Continue Shopping</button>
                ) : (
                  <button type="button" onClick={resetFilters} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 shadow-sm"><RotateCcw size={13} /> Reset All Filters</button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}