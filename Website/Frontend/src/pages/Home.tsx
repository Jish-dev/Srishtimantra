import { useEffect, useState } from "react";

import api from "../api";

import { ArrowUpRight, Check, Heart, ShoppingBag, Eye, Sparkles, Gem, Shirt, Palette, Tag, Flame } from "lucide-react";

import {
  CART_KEY,
  WISHLIST_KEY,
  STORE_EVENT,
  readStore,
  writeStore,
  productKey,
  type StoreProduct,
} from "../components/store";

const heroImages = ["/hero.jpeg", "/hero2.jpeg", "/hero3.jpeg"];

type Product = {
  _id?: string;
  id?: string | number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image?: string;
  images?: string[];
  tag?: string;
  featured?: boolean;
  subCategory?: string;
  color?: string;
  collection?: string;
  description?: string;
  quantity?: number;
};

const collections = [
  { name: "Vajra", subtitle: "Traditional Jewellery", image: "/vajra.jpeg" },
  { name: "Suvarna", subtitle: "Timeless Elegance", image: "/suvarna.jpeg" },
  { name: "Shila", subtitle: "Stone Jewellery", image: "" },
  { name: "Seela", subtitle: "Handcrafted Jewellery", image: "" },
  { name: "Apurva", subtitle: "Sarees & Clothing", image: "" },
  { name: "Daruh", subtitle: "Artisan Crafts", image: "" },
  { name: "Narikela", subtitle: "Art & Keepsakes", image: "" },
];



const mobileQuickNav = [
  { label: "All", icon: Sparkles },
  { label: "Jewelry", icon: Gem },
  { label: "Cloth", icon: Shirt },
  { label: "Art Works", icon: Palette },
  { label: "Handicraft", icon: Tag },
  { label: "Featured", icon: Flame },
];



const testimonials = [

  {
    name: "Name1",
    location: "Kerala",
    quote: "The detailing feels so special. It has the warmth and beauty of something passed down through generations.",
  },

  {
    name: "Name2",
    location: "Kerala",
    quote: "Beautiful craftsmanship and thoughtful presentation. Every little detail felt personal.",

  },

  {

    name: "Name3",
    location: "Kerala",
    quote: "I love finding pieces that feel different from everything else. Srishtimantra has that special charm.",

  },

];



const categories = ["All", "Featured", "Cloth", "Jewelry", "Handicraft", "Art Works"];

const formatPrice = (price: number) =>
  `₹${Number(price || 0).toLocaleString("en-IN")}`;

const sectionHeading =
  "font-serif text-2xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#493729]";
const eyebrow =
  "text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.3em] text-[#997541]";

const outlineButton =
  "w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-[#8b6a3e] bg-transparent px-7 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#493729] transition-all active:scale-95 hover:bg-[#493729] hover:text-[#f8f1e5]";



export default function Home() {
  const [activeHero, setActiveHero] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);





  useEffect(() => {

    const controller = new AbortController();



    async function loadProducts() {

      setProductsLoading(true);

      setProductsError("");

      try {

        const response = await api.get("/products?limit=100", {

          signal: controller.signal,

        });

        const payload = response.data;

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



        const normalized: Product[] = rows

          .filter((item: any) => item && item.active !== false && item.isActive !== false)

          .map((item: any) => {

            const images = Array.isArray(item.images)

              ? item.images.filter((image: unknown) => typeof image === "string" && image.trim())

              : [];

            const category = String(item.category || "Other");

            return {

              _id: String(item._id || item.id || item.productId || ""),

              id: item.id,

              name: String(item.name || item.title || "Untitled product"),

              category,

              price: Number(item.price || 0),

              oldPrice: item.compareAtPrice != null

                ? Number(item.compareAtPrice)

                : item.oldPrice != null ? Number(item.oldPrice) : undefined,

              image: item.image || images[0] || item.thumbnail || "",

              images,

              tag: item.tag || (item.featured ? "Featured" : ""),

              featured: Boolean(item.featured),

              subCategory: String(item.subCategory || ""),

              color: String(item.color || ""),

              collection: String(item.productCollection || item.collection || ""),

              description: String(item.description || ""),

            };

          });

        setProducts(normalized);

      } catch (error) {

        if (!controller.signal.aborted) {

          setProductsError(

            error instanceof Error
              ? `Could not load products: ${error.message}`
              : "Could not load products from the backend. Please try again."


          );

        }

      } finally {

        if (!controller.signal.aborted) setProductsLoading(false);

      }

    }



    void loadProducts();

    return () => controller.abort();

  }, []);



  const [wishlist, setWishlist] = useState<StoreProduct[]>(() => readStore(WISHLIST_KEY));

  const [cart, setCart] = useState<StoreProduct[]>(() => readStore(CART_KEY));

  const [addedProductKey, setAddedProductKey] = useState("");



  useEffect(() => {

    const syncStore = () => {

      setCart(readStore(CART_KEY));

      setWishlist(readStore(WISHLIST_KEY));

    };

    window.addEventListener(STORE_EVENT, syncStore);

    window.addEventListener("storage", syncStore);

    return () => {

      window.removeEventListener(STORE_EVENT, syncStore);

      window.removeEventListener("storage", syncStore);

    };

  }, []);



  const openProductDetail = (product: Product) => {

    const id = product._id || product.id;

    if (!id) return;

    window.location.href = `/product/${encodeURIComponent(String(id))}`;

  };



  const toggleWishlist = (product: Product) => {

    const key = productKey(product);

    const current = readStore(WISHLIST_KEY);

    const next = current.some((item) => productKey(item) === key)

      ? current.filter((item) => productKey(item) !== key)

      : [...current, product];

    writeStore(WISHLIST_KEY, next);

    setWishlist(next);

  };



  const addToCart = (product: Product) => {

    const key = productKey(product);

    const current = readStore(CART_KEY);

    const existing = current.find((item) => productKey(item) === key);

    const next = existing

      ? current.map((item) => productKey(item) === key

        ? { ...item, quantity: Math.max(1, Number(item.quantity || 1)) + 1 }

        : item)

      : [...current, { ...product, quantity: 1 }];

    writeStore(CART_KEY, next);

    setCart(next);

    setAddedProductKey(key);

    window.setTimeout(() => setAddedProductKey((currentKey) => currentKey === key ? "" : currentKey), 1400);

  };



  useEffect(() => {

    const interval = window.setInterval(() => {

      setActiveHero((current) => (current + 1) % heroImages.length);

    }, 5000);

    return () => window.clearInterval(interval);

  }, []);



  // Filter products by category, then prioritize featured/dashboard-selected items and limit to 8

  const filteredProducts = (() => {

    const matched = activeCategory === "All"

      ? products

      : activeCategory === "Featured"

        ? products.filter((p) => p.featured || p.tag)

        : products.filter((product) => {

            const category = product.category.toLowerCase().replace(/[^a-z]/g, "");

            const selected = activeCategory.toLowerCase().replace(/[^a-z]/g, "");

            if (selected === "jewelry") return category === "jewelry" || category === "jewellery";

            if (selected === "cloth") return category === "cloth" || category === "clothing" || category === "saree";

            if (selected === "artworks") return category === "artworks" || category === "art";

            return category === selected;

          });



    // Sort to prioritize admin-selected / featured items first, then slice to top 8 items

    return [...matched]

      .sort((a, b) => Number(Boolean(b.featured || b.tag)) - Number(Boolean(a.featured || a.tag)))

      .slice(0, 8);

  })();



  const getProductId = (product: Product) => product._id ?? product.id ?? product.name;



  return (

    <main className="min-h-screen overflow-x-hidden bg-[#f7f1e6] font-sans text-[#493729] pb-24 sm:pb-0">

      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        .font-sans { font-family: 'Outfit', sans-serif; }

        .font-serif { font-family: 'Playfair Display', serif; }

        .no-scrollbar::-webkit-scrollbar { display: none; }

        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      `}</style>



      {/* Mobile Top App Quick-Navigation Category Icon Bar */}

      <div className="sticky top-0 z-40 bg-[#f7f1e6]/90 backdrop-blur-md border-b border-[#e2d4c1] px-3 py-3 sm:hidden">

        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">

          {mobileQuickNav.map((nav) => {

            const IconComponent = nav.icon;

            const isActive = activeCategory === nav.label;

            return (

              <button

                key={nav.label}

                onClick={() => setActiveCategory(nav.label)}

                className={`flex flex-col items-center gap-1 shrink-0 transition-all ${isActive ? "text-[#493729] scale-105 font-bold" : "text-[#8c7355]"

                  }`}

              >

                <div className={`grid h-11 w-11 place-items-center rounded-full border transition-all shadow-xs ${isActive ? "border-[#493729] bg-[#493729] text-[#f7f1e6]" : "border-[#d8c6ac] bg-[#fffaf2]"

                  }`}>

                  <IconComponent size={18} strokeWidth={1.8} />

                </div>

                <span className="text-[10px] tracking-wide">{nav.label}</span>

              </button>

            );

          })}

        </div>

      </div>



      {/* Immersive Mobile-First Hero Banner */}

      <section id="home" className="px-3 pt-3 sm:px-6 sm:pt-2">

        <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-2xl border border-[#bda477] bg-[#eee4d3] shadow-md">

          <div className="relative h-[420px] sm:h-[500px] lg:h-[480px] overflow-hidden">

            {heroImages.map((image, index) => (

              <img

                key={image}

                src={image}

                alt="Srishtimantra Traditional Inspiration"

                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${activeHero === index ? "opacity-100 scale-100" : "opacity-0 scale-105"

                  } transition-transform duration-[6000ms]`}

              />

            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-[#362414]/80 via-[#362414]/30 to-transparent" />



            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white/80 text-xs sm:bottom-8 sm:right-10">

              <span>0{activeHero + 1}</span>

              <span className="h-px w-6 bg-white/60" />

              <span>0{heroImages.length}</span>

            </div>

          </div>

        </div>

      </section>



      {/* Featured Discovery Cards */}

      <section className="px-3 py-6 sm:px-6 sm:py-2">

        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4">

          {[

            { title: "New Arrivals", subtitle: "Fresh finds", number: "01", symbol: "✳" },

            { title: "Special Offers", subtitle: "Special awaits", number: "02", symbol: "✦" },

            { title: "Collections", subtitle: "Extraordinary", number: "03", symbol: "❖" },

            { title: "Bestsellers", subtitle: "Loved pieces", number: "04", symbol: "✧" },

          ].map((card) => (

            <a

              key={card.title}

              href="#products"

              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#cdb995] bg-[#eee4d3] p-4 sm:px-6 sm:py-2 transition-all active:scale-[0.98] hover:bg-[#493729]"

            >

              <span className="pointer-events-none absolute -right-2 -top-3 text-5xl text-[#cdb995]/25 sm:text-8xl group-hover:text-[#d3b78b]/20">

                {card.symbol}

              </span>

              <div className="relative z-10">

                <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-[#997541] group-hover:text-[#d3b78b]">

                  {card.number}

                </p>

                <h3 className="mt-1 font-serif text-sm sm:text-lg font-semibold text-[#493729] group-hover:text-[#f7f1e6]">

                  {card.title}

                </h3>

                <p className="mt-0.5 text-[10px] sm:text-xs text-[#806b52] group-hover:text-[#e6dac8]">

                  {card.subtitle}

                </p>

              </div>

              <div className="mt-3 flex items-center gap-1 text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider text-[#997541] group-hover:text-[#e8c995]">

                <span>Explore</span> <span>→</span>

              </div>

            </a>

          ))}

        </div>

      </section>



      {/* Collections Carousel */}

      <section id="collections" className="px-3 py-10 sm:px-8 sm:py-20 lg:px-8">

        <div className="mx-auto max-w-[1600px]">

          <div className="mb-6 text-center sm:mb-16">

            <p className={eyebrow}>Curated with love</p>

            <h2 className={`${sectionHeading} mt-1.5`}>

              A World of <span className="italic text-[#a88652]">Tradition</span>

            </h2>

            <div className="mt-3 flex items-center justify-center gap-3 text-[#a88652]">

              <span className="h-px w-6 bg-[#bca47e]" />

              <span>✳</span>

              <span className="h-px w-6 bg-[#bca47e]" />

            </div>

          </div>



          <div className="flex sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x pb-4">

            {collections.map((collection) => (

              <a

                href="#products"

                key={collection.name}

                className="group block min-w-[130px] sm:min-w-0 snap-start flex-shrink-0"

              >

                <div className="relative overflow-hidden rounded-xl border border-[#cdb995] bg-[#e9decc] p-1 shadow-sm">

                  <img

                    src={collection.image || "/placeholder-product.png"}

                    alt={collection.name}

                    loading="lazy"

                    onError={(event) => {

                      event.currentTarget.onerror = null;

                      event.currentTarget.src = "/placeholder-product.png";

                    }}

                    className="h-[190px] sm:h-[280px] w-full object-cover rounded-lg transition duration-500 group-hover:scale-105"

                  />

                </div>

                <div className="mt-2 text-center">

                  <h3 className="font-serif text-sm sm:text-lg font-medium text-[#493729] group-hover:text-[#a88652]">

                    {collection.name}

                  </h3>

                  <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#806b52] mt-0.5">

                    {collection.subtitle}

                  </p>

                </div>

              </a>

            ))}

          </div>

        </div>

      </section>



      {/* Brand Story */}

      <section id="story" className="border-y border-[#cdb995] bg-[#eee4d3] px-4 py-14 sm:px-8 sm:py-24">

        <div className="mx-auto grid max-w-[1300px] items-center gap-8 sm:gap-16 md:grid-cols-2">

          <div className="relative mx-auto w-full max-w-md p-1.5">

            <div className="absolute inset-0 rounded-2xl border border-[#bca47e]" />

            <img

              src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1100&q=90"

              alt="Crafted Jewellery"

              loading="lazy"

              className="relative aspect-[4/5] w-full rounded-xl object-cover shadow-lg"

            />

          </div>

          <div className="text-left">

            <p className={`${eyebrow} mb-2`}>The Srishtimantra story</p>

            <h2 className={sectionHeading}>

              Not just things.

              <br />

              <span className="italic text-[#a88652]">Things with a soul.</span>

            </h2>

            <div className="my-4 flex items-center gap-3 text-[#a88652]">

              <span className="h-px w-8 bg-[#bca47e]" />

              <span>✳</span>

            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-[#705c46]">

              We believe the most beautiful things carry a story of skilled hands, cherished traditions, and thoughtful details that turn ordinary objects into keepsakes.

            </p>

            <div className="mt-6">

              <a href="#contact" className={outlineButton}>

                Get to know us <span>→</span>

              </a>

            </div>

          </div>

        </div>

      </section>



      {/* Homepage Featured Products — managed from Admin */}
      {!productsLoading && !productsError && products.some((product) => product.featured) && (
        <section id="homepage-featured" className="px-3 py-12 sm:px-8 sm:py-20 lg:px-14">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-7 flex flex-col items-center text-center">
              <p className={eyebrow}>Chosen by Srishtimantra</p>
              <h2 className={`${sectionHeading} mt-1.5`}>Featured treasures</h2>
              <p className="mt-3 max-w-xl text-xs leading-6 text-[#786650] sm:text-sm">
                A thoughtful selection of pieces, handpicked for you.
              </p>
              <div className="mt-3 flex items-center justify-center gap-3 text-[#a88652]">
                <span className="h-px w-8 bg-[#bca47e]" />
                <span>✳</span>
                <span className="h-px w-8 bg-[#bca47e]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {products.filter((product) => product.featured).slice(0, 8).map((product) => {
                const productId = getProductId(product);
                const image = product.image || product.images?.[0] || "/placeholder-product.png";
                const oldPrice = product.oldPrice;
                const discount = oldPrice && oldPrice > product.price
                  ? Math.round(((oldPrice - product.price) / oldPrice) * 100)
                  : 0;
                const key = productKey(product);
                const isWishlisted = wishlist.some((item) => productKey(item) === key);
                const isInCart = cart.some((item) => productKey(item) === key);

                return (
                  <article key={`featured-${String(productId)}`} className="group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-[#e8ddce] bg-[#fffdf9] shadow-sm">
                    <div className="relative isolate overflow-hidden bg-[#f0e8dc]">
                      <button
                        type="button"
                        onClick={() => openProductDetail(product)}
                        aria-label={`View ${product.name}`}
                        className="block aspect-[4/5] w-full cursor-pointer overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = "/placeholder-product.png";
                          }}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </button>
                      <span className="absolute left-2.5 top-2.5 rounded-full border border-white/50 bg-[#fffaf2]/95 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#6c4f32] shadow-sm sm:text-[9px]">
                        Featured
                      </span>
                      {discount > 0 && (
                        <span className="absolute left-2.5 top-9 rounded-full bg-[#7d352b] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider text-white sm:text-[9px]">
                          {discount}% off
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border shadow-sm backdrop-blur-md transition-all ${
                          isWishlisted ? "border-[#493729] bg-[#493729] text-white" : "border-white/70 bg-[#fffaf2]/90 text-[#493729]"
                        }`}
                      >
                        <Heart size={15} strokeWidth={1.8} fill={isWishlisted ? "currentColor" : "none"} />
                      </button>
                      <div className="absolute inset-x-2.5 bottom-2.5 flex gap-2 sm:inset-x-3 sm:bottom-3 sm:translate-y-3 sm:opacity-0 sm:transition-all sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#493729]/95 py-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white shadow-md active:bg-[#6b503c] sm:text-xs"
                        >
                          {addedProductKey === key ? <Check size={14} /> : <ShoppingBag size={14} />}
                          {addedProductKey === key ? "Added" : isInCart ? "Add More" : "Add to Bag"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openProductDetail(product)}
                          aria-label={`View ${product.name}`}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fffaf2]/95 text-[#493729] shadow-sm hover:bg-white sm:h-10 sm:w-10"
                        >
                          <Eye size={16} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openProductDetail(product)}
                      className="flex flex-1 flex-col justify-between p-3.5 text-left sm:p-4"
                    >
                      <div>
                        <p className="mb-1 truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a18153] sm:text-[10px]">
                          {product.category}
                        </p>
                        <h3 className="line-clamp-2 font-serif text-sm font-medium leading-snug text-[#493729] sm:text-base">
                          {product.name}
                        </h3>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-[#eee5da] pt-2.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-[#493729] sm:text-base">{formatPrice(product.price)}</span>
                          {oldPrice != null && oldPrice > product.price && (
                            <span className="text-xs text-[#aa9a8b] line-through">{formatPrice(oldPrice)}</span>
                          )}
                        </div>
                        <span className="grid h-6 w-6 place-items-center rounded-full border border-[#e2d4c1] text-[#80613d]">
                          <ArrowUpRight size={12} />
                        </span>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="mt-8 text-center">
              <a href="/products" className={outlineButton}>Explore all products <span>→</span></a>
            </div>
          </div>
        </section>
      )}

{/* Products Catalog (Displaying top 8 selected items) */}

      <section id="products" className="px-3 py-14 sm:px-8 sm:py-28 lg:px-14">

        <div className="mx-auto max-w-[1500px]">

          <div className="mx-auto max-w-2xl text-center">

            <p className={`${eyebrow} mb-2`}>Selected with care</p>

            <h2 className={sectionHeading}>The treasured edit</h2>

            <div className="my-3 flex items-center justify-center gap-3 text-[#a88652]">

              <span className="h-px w-8 bg-[#bca47e]" />

              <span>✳</span>

              <span className="h-px w-8 bg-[#bca47e]" />

            </div>

          </div>



          {/* Categories Filter Pills */}

          <div className="my-6 flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap sm:justify-center pb-2">

            {categories.map((category) => (

              <button

                key={category}

                onClick={() => setActiveCategory(category)}

                className={`flex-shrink-0 rounded-full px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition-all ${activeCategory === category

                    ? "bg-[#493729] text-[#f7f1e6] shadow-sm"

                    : "border border-[#d2bea0] bg-[#fffaf2]/60 text-[#6c563e]"

                  }`}

              >

                {category}

              </button>

            ))}

          </div>



          {/* Loading */}

          {productsLoading && (

            <div className="py-14 text-center">

              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#d2bea0] border-t-[#493729]" />

              <p className="mt-3 text-xs text-[#786650]">Discovering treasures...</p>

            </div>

          )}



          {/* Error */}

          {!productsLoading && productsError && (

            <div className="mx-auto max-w-md rounded-2xl border border-[#d2bea0] bg-[#fffdf9] p-6 text-center shadow-sm">

              <p className="font-serif text-base">Unable to load products</p>

              <p className="mt-2 text-xs text-[#786650]">{productsError}</p>

              <button onClick={() => window.location.reload()} className={`${outlineButton} mt-4`}>

                Try again <span>↻</span>

              </button>

            </div>

          )}



          {/* Product Grid (Limited to 8 items) */}

          {!productsLoading && !productsError && (

            <>

              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">

                {filteredProducts.map((product) => {

                  const productId = getProductId(product);

                  const key = productKey(product);

                  const isWishlisted = wishlist.some((item) => productKey(item) === key);

                  const isInCart = cart.some((item) => productKey(item) === key);

                  const image = product.image || product.images?.[0] || "/placeholder-product.png";

                  const discount = product.oldPrice && product.oldPrice > product.price

                    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)

                    : 0;



                  return (

                    <article

                      key={String(productId)}

                      className="group flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-[#e8ddce] bg-[#fffdf9] shadow-sm"

                    >

                      <div className="relative isolate overflow-hidden bg-[#f0e8dc]">

                        <button

                          type="button"

                          onClick={() => openProductDetail(product)}

                          aria-label={`View ${product.name}`}

                          className="block aspect-[4/5] w-full cursor-pointer overflow-hidden"

                        >

                          <img

                            src={image}

                            alt={product.name}

                            loading="lazy"

                            onError={(event) => {

                              event.currentTarget.onerror = null;

                              event.currentTarget.src = "/placeholder-product.png";

                            }}

                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"

                          />

                        </button>



                        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">

                          {product.tag && (

                            <span className="rounded-full border border-white/50 bg-[#fffaf2]/95 px-2.5 py-1 text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider text-[#6c4f32] shadow-xs">

                              {product.tag}

                            </span>

                          )}

                          {discount > 0 && (

                            <span className="rounded-full bg-[#7d352b] px-2.5 py-1 text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider text-white">

                              {discount}% off

                            </span>

                          )}

                        </div>



                        {/* Wishlist Button */}

                        <button

                          type="button"

                          onClick={() => toggleWishlist(product)}

                          aria-label="Wishlist"

                          className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border shadow-sm backdrop-blur-md transition-all ${isWishlisted

                              ? "border-[#493729] bg-[#493729] text-white"

                              : "border-white/70 bg-[#fffaf2]/90 text-[#493729]"

                            }`}

                        >

                          <Heart size={15} strokeWidth={1.8} fill={isWishlisted ? "currentColor" : "none"} />

                        </button>



                        {/* Action Buttons */}

                        <div className="absolute inset-x-2.5 bottom-2.5 flex gap-2 sm:inset-x-3 sm:bottom-3 sm:translate-y-3 sm:opacity-0 sm:transition-all sm:group-hover:translate-y-0 sm:group-hover:opacity-100">

                          <button

                            type="button"

                            onClick={() => addToCart(product)}

                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#493729]/95 py-2.5 px-3 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-md active:bg-[#6b503c]"

                          >

                            {addedProductKey === key ? <Check size={14} /> : <ShoppingBag size={14} />}

                            {addedProductKey === key ? "Added" : isInCart ? "Add More" : "Add to Bag"}

                          </button>

                          <button

                            type="button"

                            onClick={() => openProductDetail(product)}

                            aria-label="View"

                            className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-[#fffaf2]/95 text-[#493729] shadow-sm hover:bg-white"

                          >

                            <Eye size={16} strokeWidth={1.8} />

                          </button>

                        </div>

                      </div>



                      {/* Metadata */}

                      <button

                        type="button"

                        onClick={() => openProductDetail(product)}

                        className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 text-left"

                      >

                        <div>

                          <p className="mb-1 truncate text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a18153]">

                            {product.category}

                          </p>

                          <h3 className="line-clamp-2 font-serif text-sm sm:text-base font-medium leading-snug text-[#493729]">

                            {product.name}

                          </h3>

                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#eee5da] flex items-center justify-between">

                          <div className="flex items-baseline gap-2">

                            <span className="text-sm sm:text-base font-semibold text-[#493729]">

                              {formatPrice(product.price)}

                            </span>

                            {product.oldPrice != null && product.oldPrice > product.price && (

                              <span className="text-xs text-[#aa9a8b] line-through">

                                {formatPrice(product.oldPrice)}

                              </span>

                            )}

                          </div>

                          <span className="grid h-6 w-6 place-items-center rounded-full border border-[#e2d4c1] text-[#80613d]">

                            <ArrowUpRight size={12} />

                          </span>

                        </div>

                      </button>

                    </article>

                  );

                })}

              </div>



              {filteredProducts.length === 0 && (

                <p className="py-12 text-center text-xs text-[#786650]">No products found in this category.</p>

              )}



              {/* Explore All Products CTA Button */}

              <div className="mt-14 text-center">

                <a href="/products" className={outlineButton}>

                  Explore all products <span>→</span>

                </a>

              </div>

            </>

          )}

        </div>

      </section>



      {/* Brand Values */}

      <section id="craft" className="border-y border-[#cdb995] bg-[#eee4d3] px-4 py-14 sm:px-8 sm:py-24">

        <div className="mx-auto max-w-[1400px]">

          <div className="mb-8 text-center">

            <p className={`${eyebrow} mb-2`}>What makes us different</p>

            <h2 className={sectionHeading}>Beauty in every detail</h2>

          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {[

              { num: "I", title: "Rooted in tradition", desc: "Inspired by Indian artistry, culture and things made with true meaning." },

              { num: "II", title: "Made with intention", desc: "Celebrating thoughtful details, expression, and handmade character." },

              { num: "III", title: "Cherished keepsakes", desc: "Distinctive finds to gift, collect, wear, and make part of your own story." },

            ].map((v) => (

              <div key={v.num} className="rounded-xl border border-[#d3c1a5] bg-[#fffdf9] p-6 text-center shadow-xs">

                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#b89a6c] font-serif text-sm italic text-[#8b6a3e]">

                  {v.num}

                </span>

                <h3 className="mt-3 font-serif text-base font-medium text-[#493729]">{v.title}</h3>

                <p className="mt-1.5 text-xs leading-relaxed text-[#786650]">{v.desc}</p>

              </div>

            ))}

          </div>

        </div>

      </section>



      {/* Testimonials */}

      <section className="border-y border-[#cdb995] bg-[#eee4d3] px-4 py-14 sm:px-8 sm:py-24">

        <div className="mx-auto max-w-[1300px]">

          <div className="text-center">

            <p className={`${eyebrow} mb-2`}>Notes from patrons</p>

            <h2 className={sectionHeading}>Words we treasure</h2>

          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">

            {testimonials.map((t) => (

              <article key={t.name} className="flex flex-col justify-between rounded-xl border border-[#d1bea0] bg-[#fffdf9] p-6 shadow-xs">

                <div>

                  <div className="font-serif text-3xl leading-none text-[#a88652]">“</div>

                  <p className="mt-2 text-xs leading-relaxed text-[#705c46]">{t.quote}</p>

                </div>

                <div className="mt-5 pt-3 border-t border-[#eee5da]">

                  <h3 className="font-serif text-sm font-medium text-[#493729]">{t.name}</h3>

                  <p className="text-[8px] uppercase tracking-wider text-[#8a7458] mt-0.5">{t.location}</p>

                  <p className="mt-1 text-xs text-[#997541]">{"★".repeat(5)}</p>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>



      {/* Footer */}

      <footer className="border-t-4 border-[#bca47e] bg-[#493729] text-[#f7f1e6]">

        <div className="border-b border-[#80664a] px-4 py-8 sm:px-10">

          <div className="mx-auto max-w-[1500px] text-center sm:text-left">

            <div className="font-serif text-2xl tracking-wide">SRISHTIMANTRA</div>

            <p className="text-[8px] uppercase tracking-[0.25em] text-[#d3b78b] mt-1">Tradition · Creativity · Craft</p>

            <p className="mt-3 text-xs text-[#d9cbb6] max-w-sm mx-auto sm:mx-0">

              A curated world of fine jewellery, clothing, art, and handcrafted treasures inspired by Indian heritage.

            </p>

          </div>

        </div>

        <div className="px-4 py-4 text-center text-[8px] uppercase tracking-widest text-[#d0bda3]">

          <p>© {new Date().getFullYear()} Srishtimantra. All rights reserved.</p>

        </div>

      </footer>



      {/* Mobile Floating Action Dock (WhatsApp & Bag) */}

      <div className="fixed bottom-4 inset-x-4 z-50 flex items-center justify-between gap-3 sm:hidden">

        <a

          href="https://wa.me/919876543210"

          target="_blank"

          rel="noreferrer"

          aria-label="WhatsApp Chat"

          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl active:scale-95"

        >

          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">

            <path d="M20 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.1-3.4A8.4 8.4 0 1 1 20 11.5Z" />

          </svg>

        </a>



        {cart.length > 0 && (

          <a

            href="/products?view=cart"

            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#493729] py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-[#f7f1e6] shadow-2xl active:scale-95"

          >

            <ShoppingBag size={15} />

            <span>View Bag ({cart.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0)})</span>

          </a>

        )}

      </div>

    </main>

  );

}
