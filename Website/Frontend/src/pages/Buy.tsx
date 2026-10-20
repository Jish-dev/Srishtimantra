import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, CheckCircle2, LockKeyhole, MapPin, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { CART_KEY, STORE_EVENT, readStore, writeStore, productKey, type StoreProduct } from "../components/store";

type CartItem = StoreProduct & {
  quantity?: number;
  oldPrice?: number;
  compareAtPrice?: number;
  sku?: string;
  stock?: number;
  color?: string;
  subCategory?: string;
};

type AddressForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

type OrderResponse = {
  message?: string;
  order?: { _id?: string; orderId?: string };
  data?: { _id?: string; orderId?: string };
  orderId?: string;
};

const API_URL = String(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const initialAddress: AddressForm = {
  fullName: "", email: "", phone: "", address: "", landmark: "", city: "", state: "Kerala", pincode: "",
};

function getImage(item: CartItem) {
  return item.image || item.images?.[0] || "/placeholder-product.png";
}

export default function Buy() {
  const [cart, setCart] = useState<CartItem[]>(() => readStore(CART_KEY) as CartItem[]);
  const [address, setAddress] = useState<AddressForm>(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrderId, setConfirmedOrderId] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    const syncCart = () => setCart(readStore(CART_KEY) as CartItem[]);
    window.addEventListener(STORE_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(STORE_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const requestedProductId = params.get("productId");
  const requestedQuantity = Math.max(1, Number(params.get("quantity") || 1));
  const checkoutItems = useMemo(() => {
    if (!requestedProductId) return cart;
    const matching = cart.find((item) => productKey(item) === requestedProductId);
    if (!matching) return cart;
    return cart.map((item) => productKey(item) === requestedProductId
      ? { ...item, quantity: Math.max(Number(item.quantity || 1), requestedQuantity) }
      : item);
  }, [cart, requestedProductId, requestedQuantity]);

  const subtotal = checkoutItems.reduce((total, item) => total + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0);
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  const total = subtotal + shipping;

  function updateAddress(field: keyof AddressForm, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (checkoutItems.length === 0) {
      setError("Your bag is empty. Add a product before placing an order.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    const orderPayload = {
      customer: {
        name: address.fullName.trim(),
        email: address.email.trim(),
        phone: address.phone.trim(),
        shippingAddress: {
          address: address.address.trim(),
          landmark: address.landmark.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pincode: address.pincode.trim(),
          country: "India",
        },
      },
      items: checkoutItems.map((item) => ({
        productId: item._id || item.id,
        name: item.name,
        price: Number(item.price || 0),
        quantity: Math.max(1, Number(item.quantity || 1)),
        image: getImage(item),
        sku: item.sku || "",
      })),
      subtotal,
      shipping,
      total,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
    };

    setSubmitting(true);
    try {
      // This requires a POST /api/orders endpoint on the backend.
      const response = await axios.post<OrderResponse>(`${API_URL}/orders`, orderPayload, { timeout: 15000 });
      const orderId = response.data?.order?.orderId || response.data?.order?._id || response.data?.data?.orderId || response.data?.data?._id || response.data?.orderId || "";
      setConfirmedOrderId(orderId);
      setOrderPlaced(true);
      writeStore(CART_KEY, []);
      setCart([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || (err.response?.status === 404
          ? "The order API is not set up yet. Add POST /api/orders to your backend before taking real orders. Your bag has been kept."
          : err.code === "ECONNABORTED"
            ? "The backend took too long to respond. Check that your server and MongoDB are running, then try again."
            : `Could not place your order. Check your backend connection at ${API_URL} and try again.`)
        : "Something went wrong. Your bag has been kept; please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (orderPlaced) {
    return (
      <main className="min-h-screen bg-[#faf7f1] px-4 py-16 text-[#493729] sm:px-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#e7dbce] bg-white p-8 text-center shadow-sm sm:p-12">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#65835a]" />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.24em] text-[#a88652]">Srishtimantra</p>
          <h1 className="mt-3 font-serif text-3xl">Thank you for your order</h1>
          <p className="mt-3 text-sm leading-6 text-[#81705f]">Your order request has been received. We’ll use the contact details you provided for order updates.</p>
          {confirmedOrderId && <p className="mt-5 rounded-xl bg-[#f7f1e8] px-4 py-3 text-sm">Order reference: <strong>{confirmedOrderId}</strong></p>}
          <button onClick={() => { window.location.href = "/products"; }} className="mt-7 rounded-full bg-[#493729] px-7 py-3 text-sm text-white transition hover:bg-[#72543b]">Continue shopping</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f1] text-[#493729]">
      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        <button type="button" onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/products?view=cart")} className="mb-6 inline-flex items-center gap-2 text-xs text-[#8b7866] transition hover:text-[#493729]"><ArrowLeft size={15} /> Back to bag</button>
        <div className="mb-9 border-b border-[#e5d9cb] pb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#a88652]">A few details and you’re done</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Checkout<span className="text-[#a88652]">.</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#857360]">Share your delivery details and review your order before placing it.</p>
        </div>

        {checkoutItems.length === 0 ? (
          <div className="rounded-3xl border border-[#e7dbce] bg-white px-5 py-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-[#a88652]" />
            <h2 className="mt-4 font-serif text-2xl">Your bag is empty</h2>
            <p className="mt-2 text-sm text-[#857360]">Add something you love before checking out.</p>
            <button onClick={() => { window.location.href = "/products"; }} className="mt-6 rounded-full bg-[#493729] px-6 py-3 text-sm text-white">Explore products</button>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-12">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#e8ded2] bg-white p-5 sm:p-7">
                <div className="mb-6 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f5eee5]"><MapPin size={18} /></span><div><h2 className="text-lg font-medium">Delivery information</h2><p className="mt-1 text-xs text-[#9b8876]">Where should we send your order?</p></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" value={address.fullName} onChange={(value) => updateAddress("fullName", value)} required autoComplete="name" placeholder="Your full name" />
                  <Field label="Mobile number" value={address.phone} onChange={(value) => updateAddress("phone", value)} required inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="10-digit mobile number" />
                  <div className="sm:col-span-2"><Field label="Email address" type="email" value={address.email} onChange={(value) => updateAddress("email", value)} required autoComplete="email" placeholder="you@example.com" /></div>
                  <div className="sm:col-span-2"><Field label="House / street / address" value={address.address} onChange={(value) => updateAddress("address", value)} required autoComplete="street-address" placeholder="House name, street, area" /></div>
                  <div className="sm:col-span-2"><Field label="Landmark (optional)" value={address.landmark} onChange={(value) => updateAddress("landmark", value)} placeholder="Nearby landmark" /></div>
                  <Field label="City / town" value={address.city} onChange={(value) => updateAddress("city", value)} required autoComplete="address-level2" placeholder="City or town" />
                  <Field label="State" value={address.state} onChange={(value) => updateAddress("state", value)} required autoComplete="address-level1" placeholder="State" />
                  <Field label="PIN code" value={address.pincode} onChange={(value) => updateAddress("pincode", value)} required inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="6-digit PIN code" />
                </div>
              </section>

              <section className="rounded-2xl border border-[#e8ded2] bg-white p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f5eee5]"><LockKeyhole size={18} /></span><div><h2 className="text-lg font-medium">Payment method</h2><p className="mt-1 text-xs text-[#9b8876]">Choose how you’d like to pay.</p></div></div>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${paymentMethod === "cod" ? "border-[#8b6a3e] bg-[#fbf7f0]" : "border-[#e8ded2] hover:border-[#c7b39a]"}`}>
                  <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="mt-1 accent-[#493729]" />
                  <span><span className="block text-sm font-medium">Cash on Delivery</span><span className="mt-1 block text-xs leading-5 text-[#92806e]">Pay when your order arrives. Availability may depend on your delivery PIN code.</span></span>
                </label>
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-dashed border-[#e1d5c7] p-4 opacity-70"><LockKeyhole size={17} className="mt-0.5 shrink-0 text-[#a88652]" /><div><p className="text-sm font-medium">Online payment</p><p className="mt-1 text-xs leading-5 text-[#92806e]">Card, UPI and online payment need a payment gateway integration. This checkout currently offers Cash on Delivery only.</p></div></div>
              </section>
              {error && <div role="alert" className="rounded-xl border border-[#e7c8bd] bg-[#fff3ef] px-4 py-3 text-sm leading-6 text-[#934b3e]">{error}</div>}
            </div>

            <aside className="rounded-2xl border border-[#e8ded2] bg-white p-5 sm:p-7 lg:sticky lg:top-6">
              <h2 className="text-lg font-medium">Order summary</h2>
              <p className="mt-1 text-xs text-[#9b8876]">{checkoutItems.length} {checkoutItems.length === 1 ? "product" : "products"} in your order</p>
              <div className="mt-6 max-h-[360px] space-y-4 overflow-y-auto pr-1">
                {checkoutItems.map((item) => {
                  const quantity = Math.max(1, Number(item.quantity || 1));
                  return <div key={productKey(item)} className="flex gap-3"><div className="relative h-20 w-[68px] shrink-0 overflow-hidden rounded-lg bg-[#f1e8dc]"><img src={getImage(item)} alt={item.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = "/placeholder-product.png"; }} /><span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#493729] px-1 text-[10px] text-white">{quantity}</span></div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{item.name}</p><p className="mt-1 text-[11px] text-[#9b8876]">{item.category}{item.color ? ` · ${item.color}` : ""}</p><p className="mt-2 text-sm">{money(Number(item.price || 0) * quantity)}</p></div></div>;
                })}
              </div>
              <div className="my-6 border-t border-[#eee5db]" />
              <div className="space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-[#8b7866]">Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between gap-4"><span className="text-[#8b7866]">Delivery</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>{subtotal > 0 && subtotal < 1999 && <p className="text-[11px] leading-5 text-[#9b8876]">Free delivery on orders of ₹1,999 or more.</p>}</div>
              <div className="my-5 border-t border-[#eee5db]" />
              <div className="flex items-center justify-between gap-4"><span className="font-medium">Total</span><span className="text-2xl font-semibold tracking-tight">{money(total)}</span></div>
              <button type="submit" disabled={submitting || checkoutItems.length === 0} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#493729] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#72543b] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Placing order…" : <>Place order <PackageCheck size={17} /></>}</button>
              <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-[#9b8876]"><Truck size={14} className="mt-0.5 shrink-0" /> Shipping charges and delivery timelines may vary by PIN code.</p>
              <p className="mt-3 text-[10px] leading-5 text-[#aa9a8b]">By placing your order, you confirm that your delivery details are correct. Your order is only confirmed after the server successfully accepts it.</p>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search" | "none" | "decimal";
  maxLength?: number;
};

function Field({ label, value, onChange, required = false, type = "text", placeholder, autoComplete, inputMode, maxLength }: FieldProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-xs font-medium text-[#6f5a46]">{label}{required && <span className="ml-1 text-[#a15d4e">*</span>}</span>
      <input id={id} name={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} maxLength={maxLength} className="w-full rounded-xl border border-[#e3d7ca] bg-[#fffdf9] px-4 py-3 text-sm outline-none transition placeholder:text-[#b5a493] focus:border-[#8b6a3e] focus:ring-2 focus:ring-[#8b6a3e]/10" />
    </label>
  );
}
