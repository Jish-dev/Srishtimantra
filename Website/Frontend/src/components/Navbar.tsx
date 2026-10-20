
import { useEffect, useState } from "react";
import { CART_KEY, WISHLIST_KEY, STORE_EVENT, readStore } from "./store";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

const links = [
  { name: "Home", href: "/" },
  {name: "Products",href:"/products"},
  { name: "New Arrivals", href: "/products?sort=featured&tag=new" },
  {
    name: "Jewellery",
    href: "/products?category=Jewelry",
    children: [
      { name: "All Jewellery", href: "/products?category=Jewelry" },
      { name: "Necklaces", href: "/products?category=Jewelry&subcategory=Necklaces" },
      { name: "Bangles", href: "/products?category=Jewelry&subcategory=Bangles" },
      { name: "Earrings", href: "/products?category=Jewelry&subcategory=Earrings" },
      { name: "Unique Collection", href: "/products?category=Jewelry&collection=Unique" },
    ],
  },
  {
    name: "Clothing",
    href: "/products?category=Clothing",
    children: [
      { name: "All Clothing", href: "/products?category=Clothing" },
      { name: "Sarees", href: "/products?category=Clothing&subcategory=Sarees" },
      { name: "Churidar", href: "/products?category=Clothing&subcategory=Churidar" },
      { name: "Traditional Wear", href: "/products?category=Clothing&subcategory=Traditional%20Wear" },
    ],
  },
  {
    name: "Handcrafted",
    href: "/products?category=Handicraft",
    children: [
      { name: "All Handcrafted", href: "/products?category=Handicraft" },
      { name: "Art & Drawings", href: "/products?category=Art%20Works" },
      { name: "Artisan Crafts", href: "/products?category=Handicraft&subcategory=Artisan%20Crafts" },
      { name: "Gift Collections", href: "/products?category=Handicraft&subcategory=Gift%20Collections" },
    ],
  },
];

const searchItems = links.flatMap((link) => [
  { name: link.name, href: link.href },
  ...(link.children ?? []),
]);

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] =
    useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(() => readStore(CART_KEY).length);
  const [wishlistCount, setWishlistCount] = useState(() => readStore(WISHLIST_KEY).length);

  useEffect(() => {
    const syncCounts = () => {
      setCartCount(readStore(CART_KEY).length);
      setWishlistCount(readStore(WISHLIST_KEY).length);
    };
    window.addEventListener(STORE_EVENT, syncCounts);
    window.addEventListener("storage", syncCounts);
    syncCounts();
    return () => {
      window.removeEventListener(STORE_EVENT, syncCounts);
      window.removeEventListener("storage", syncCounts);
    };
  }, []);

  const openStoreView = (view: "cart" | "wishlist") => {
    window.location.href = `/products?view=${view}`;
  };

  const isHomePage =
    typeof window !== "undefined" &&
    window.location.pathname === "/";

  const filteredResults = searchQuery.trim()
    ? searchItems
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
      .filter(
        (item, index, array) =>
          array.findIndex((result) => result.href === item.href) === index
      )
      .slice(0, 7)
    : [];

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    if (filteredResults.length > 0) {
      window.location.href = filteredResults[0].href;
    } else {
      window.location.href = `/products?search=${encodeURIComponent(query)}`;
    }
  };

  return (
    <>
      {isHomePage && (
        <div className="flex h-8 items-center justify-center border-b border-[#b99a63]/30 bg-[#24160f] px-2 text-center text-[8px] tracking-[0.12em] text-[#d9bd8b] sm:text-[10px] sm:tracking-[0.25em]">
          <span>
            <span className="mr-2 text-[#b99a63]">✦</span>
            CRAFTED WITH SOUL · ROOTED IN TRADITION
            <span className="ml-2 text-[#b99a63]">✦</span>
          </span>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full text-[#f4e9d5] shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div className="relative border-b border-[#a88755]/30 bg-[#302017]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#24170f_0%,#493020_24%,#38251a_52%,#4a3020_78%,#26170f_100%)]" />

          <div className="relative mx-auto flex h-[76px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:h-[74px] sm:px-8 lg:h-[82px] lg:px-12">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(!menuOpen);
                setActiveDropdown(null);
              }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-10 w-8 items-center justify-center text-[#e1c89a] transition hover:text-white lg:hidden"
            >
              {menuOpen ? (
                <X size={23} strokeWidth={1.4} />
              ) : (
                <Menu size={23} strokeWidth={1.4} />
              )}
            </button>

            <a href="/" className="shrink-0 text-center">
              <h1 className="font-serif text-[21px] font-medium tracking-wide text-[#e7cf9d] transition hover:text-[#fff1d1] sm:text-3xl lg:text-[34px]">
                Srishtimantra
              </h1>

              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="h-px w-4 bg-[#a88755]" />
                <p className="whitespace-nowrap text-[6px] tracking-[0.18em] text-[#d2b68b] sm:text-[8px] sm:tracking-[0.3em]">
                  TRADITION MEETS CREATIVITY
                </p>
                <span className="h-px w-4 bg-[#a88755]" />
              </div>
            </a>

            <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
              {links.map((link) => (
                <div
                  key={link.name}
                  className="group relative"
                  onMouseEnter={() =>
                    link.children && setActiveDropdown(link.name)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={link.href}
                    onFocus={() =>
                      link.children && setActiveDropdown(link.name)
                    }
                    className="relative flex items-center gap-1 py-5 text-[11px] font-medium tracking-wide text-[#e5d4bc] transition hover:text-[#e2bd7c] xl:text-[15px]"
                  >
                    {link.name}

                    {link.children && (
                      <ChevronDown
                        size={12}
                        className={`transition-transform ${activeDropdown === link.name ? "rotate-180" : ""
                          }`}
                      />
                    )}

                    <span className="absolute bottom-3 left-0 h-px w-0 bg-[#c5a36b] transition-all duration-300 group-hover:w-full" />
                  </a>

                  {link.children && (
                    <div
                      className={`absolute left-0 top-full w-60 border border-[#a88755]/30 bg-[#2b1c13] py-3 shadow-xl transition-all duration-200 ${activeDropdown === link.name
                        ? "visible translate-y-0 opacity-100"
                        : "invisible translate-y-2 opacity-0"
                        }`}
                    >
                      <p className="px-5 pb-3 text-[9px] tracking-[0.2em] text-[#b99a63]">
                        EXPLORE {link.name.toUpperCase()}
                      </p>

                      {link.children.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="flex items-center justify-between px-5 py-3 text-xs text-[#e5d4bc] transition hover:bg-[#493020] hover:pl-7 hover:text-[#e2bd7c]"
                        >
                          {item.name}
                          <ArrowRight
                            size={13}
                            className="text-[#a88755]"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4 lg:gap-5">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  setSearchQuery("");
                  setMenuOpen(false);
                }}
                className="text-[#e5d4bc] transition hover:text-[#e2bd7c]"
              >
                {searchOpen ? (
                  <X size={19} strokeWidth={1.3} />
                ) : (
                  <Search size={19} strokeWidth={1.3} />
                )}
              </button>

              <button
                type="button"
                aria-label="Account"
                className="hidden text-[#e5d4bc] transition hover:text-[#e2bd7c] sm:block"
              >
                <UserRound size={19} strokeWidth={1.3} />
              </button>

              <button
                type="button"
                aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} saved` : ""}`}
                onClick={() => openStoreView("wishlist")}
                className="relative hidden text-[#e5d4bc] transition hover:text-[#e2bd7c] sm:block"
              >
                <Heart size={19} strokeWidth={1.3} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a36b] px-1 text-[9px] font-semibold text-[#24160f]">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                aria-label={`Shopping bag${cartCount ? `, ${cartCount} items` : ""}`}
                onClick={() => openStoreView("cart")}
                className="relative text-[#e5d4bc] transition hover:text-[#e2bd7c]"
              >
                <ShoppingBag size={20} strokeWidth={1.3} />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c5a36b] px-1 text-[9px] font-semibold text-[#24160f]">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="absolute left-0 top-full z-50 w-full border-t border-[#a88755]/30 bg-[#2b1c13] px-4 py-5 shadow-2xl sm:px-8 lg:px-12">
              <form
                onSubmit={handleSearch}
                className="mx-auto flex max-w-3xl items-center gap-3 border-b border-[#a88755]/60 pb-3"
              >
                <Search
                  size={20}
                  className="shrink-0 text-[#c5a36b]"
                />
                <input
                  type="search"
                  autoFocus
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search jewellery, sarees, collections..."
                  aria-label="Search categories"
                  className="w-full bg-transparent py-2 text-sm text-[#f4e9d5] outline-none placeholder:text-[#b9a58d]"
                />
                <button
                  type="submit"
                  className="text-xs tracking-widest text-[#e2bd7c] transition hover:text-white"
                >
                  SEARCH
                </button>
              </form>

              {searchQuery.trim() && (
                <div className="mx-auto mt-4 max-w-3xl">
                  <p className="mb-2 text-[9px] tracking-[0.2em] text-[#b99a63]">
                    {filteredResults.length > 0
                      ? "SUGGESTED RESULTS"
                      : "NO CATEGORY FOUND"}
                  </p>

                  {filteredResults.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-between border-b border-[#a88755]/15 px-2 py-3 text-sm text-[#e5d4bc] transition hover:bg-[#493020] hover:text-[#e2bd7c]"
                    >
                      {item.name}
                      <ArrowRight
                        size={15}
                        className="text-[#a88755]"
                      />
                    </a>
                  ))}

                  {filteredResults.length === 0 && (
                    <p className="py-3 text-sm text-[#b9a58d]">
                      Press Search to continue with this query.
                    </p>
                  )}
                </div>
              )}

              {!searchQuery.trim() && (
                <p className="mx-auto mt-4 max-w-3xl text-[10px] tracking-wide text-[#b9a58d]">
                  POPULAR: Jewellery · Sarees · Sila · Sheela
                </p>
              )}
            </div>
          )}
        </div>

        {menuOpen && (
          <nav className="border-b border-[#a88755]/30 bg-[#2b1c13] px-5 py-3 shadow-xl lg:hidden">
            {links.map((link, index) => (
              <div
                key={link.name}
                className="border-b border-[#a88755]/15 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 py-3.5 text-xs tracking-wider text-[#e5d4bc] transition hover:text-[#e2bd7c]"
                  >
                    <span className="mr-3 text-[10px] text-[#a88755]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {link.name}
                  </a>

                  {link.children && (
                    <button
                      type="button"
                      aria-label={`Toggle ${link.name} submenu`}
                      aria-expanded={activeDropdown === link.name}
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === link.name ? null : link.name
                        )
                      }
                      className="p-3 text-[#c5a36b]"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${activeDropdown === link.name ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                  )}
                </div>

                {link.children && activeDropdown === link.name && (
                  <div className="mb-3 ml-5 border-l border-[#a88755]/30 pl-4">
                    {link.children.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        onClick={() => {
                          setMenuOpen(false);
                          setActiveDropdown(null);
                        }}
                        className="block py-2.5 text-xs text-[#b9a58d] transition hover:text-[#e2bd7c]"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
