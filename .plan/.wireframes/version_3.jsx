import React, { useMemo, useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  Award,
  Wrench,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Truck,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";

/**
 * Single-file demo app that implements the public site + cart/checkout
 * and an admin panel (products, orders, inventory, users, settings).
 * TailwindCSS required. All data is kept in component state for demo.
 */

export default function SanviMachineryApp() {
  // ------------------------------------
  // App State
  // ------------------------------------
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [cart, setCart] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("sm_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    email: "",
    password: "",
  });

  // Seed products
  const [products, setProducts] = useState<any[]>([
    {
      id: 1,
      name: "RO Water Plant - 1000 LPH",
      category: "Water Plant",
      price: 85000,
      image:
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&h=800&fit=crop",
      description: "High-efficiency reverse osmosis water treatment plant",
      specifications: {
        Capacity: "1000 Liters/Hour",
        Power: "2 HP",
        Warranty: "2 Years",
        Material: "SS 304",
      },
      stock: 15,
      featured: true,
    },
    {
      id: 2,
      name: "Commercial Aata Chakki",
      category: "Aata Chakki",
      price: 45000,
      image:
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1200&h=800&fit=crop",
      description: "Heavy-duty flour mill for commercial use",
      specifications: {
        Capacity: "50 kg/hour",
        Power: "5 HP",
        Warranty: "1 Year",
        Material: "Cast Iron",
      },
      stock: 8,
      featured: true,
    },
    {
      id: 3,
      name: "Oil Expeller Machine",
      category: "Oil Mill",
      price: 125000,
      image:
        "https://images.unsplash.com/photo-1628191081676-8cfebc4b8056?w=1200&h=800&fit=crop",
      description: "Automatic oil extraction machine for various seeds",
      specifications: {
        Capacity: "10-12 kg/hour",
        Power: "7.5 HP",
        Warranty: "2 Years",
        Material: "Mild Steel",
      },
      stock: 5,
      featured: false,
    },
    {
      id: 4,
      name: "Industrial Mixer",
      category: "Processing Equipment",
      price: 65000,
      image:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&h=800&fit=crop",
      description: "Heavy-duty industrial mixing equipment",
      specifications: {
        Capacity: "100 Liters",
        Power: "3 HP",
        Warranty: "1 Year",
        Material: "SS 316",
      },
      stock: 12,
      featured: true,
    },
  ]);

  const categories = useMemo(
    () => ["Water Plant", "Aata Chakki", "Oil Mill", "Processing Equipment"],
    []
  );

  // Orders + Users (demo state)
  const [orders, setOrders] = useState<any[]>([
    {
      id: "ORD001",
      customerName: "Rajesh Kumar",
      phone: "+91-9XXXXXXXXX",
      address: "Bihar Sharif, Bihar",
      items: [{ ...products[0], quantity: 1 }],
      total: 85000,
      status: "pending",
      date: "2025-08-15",
    },
  ]);

  const [users, setUsers] = useState<any[]>([
    { id: "U001", name: "Admin", email: "admin@sanvimachinery.com", role: "owner" },
  ]);

  // ------------------------------------
  // Effects
  // ------------------------------------
  useEffect(() => {
    localStorage.setItem("sm_cart", JSON.stringify(cart));
  }, [cart]);

  // ------------------------------------
  // Helpers
  // ------------------------------------
  const addToCart = (product: any) => {
    setCart((prev) => {
      const found = prev.find((p: any) => p.id === product.id);
      if (found) {
        return prev.map((p: any) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: number, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((p: any) => p.id !== id) : prev.map((p: any) => (p.id === id ? { ...p, quantity: qty } : p))
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.quantity * i.price, 0);

  const goto = (p: string) => setCurrentPage(p);

  // ------------------------------------
  // UI Building Blocks
  // ------------------------------------
  const Header = () => (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <button className="text-2xl font-bold text-blue-900 flex items-center gap-2" onClick={() => goto("home")}>
            <Wrench className="w-7 h-7" /> Sanvi Machinery
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => goto("home")} className="hover:text-blue-700">Home</button>
            <button onClick={() => goto("products")} className="hover:text-blue-700">Products</button>
            <button onClick={() => goto("about")} className="hover:text-blue-700">About</button>
            <button onClick={() => goto("contact")} className="hover:text-blue-700">Contact</button>
            <button onClick={() => goto(isAdmin ? "admin" : "admin-login")} className="hover:text-blue-700">Admin</button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button onClick={() => goto("cart")} className="relative p-2 rounded hover:bg-gray-100">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 grid place-content-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const Footer = () => (
    <footer className="bg-blue-950 text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-semibold text-lg mb-2">Sanvi Machinery</h3>
          <p className="text-blue-100">Quality machinery for businesses across India.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Contact</h4>
          <p className="flex items-center gap-2 text-blue-100"><Phone className="w-4 h-4"/> +91-XXXXXXXXXX</p>
          <p className="flex items-center gap-2 text-blue-100"><Mail className="w-4 h-4"/> support@sanvimachinery.com</p>
          <p className="flex items-center gap-2 text-blue-100"><MapPin className="w-4 h-4"/> Bihar Sharif, Bihar</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Trust</h4>
          <div className="flex items-center gap-4 text-blue-100">
            <ShieldCheck className="w-5 h-5"/><span>Warranty</span>
            <Truck className="w-5 h-5"/><span>Fast Shipping</span>
            <Package className="w-5 h-5"/><span>Secure Packing</span>
          </div>
        </div>
      </div>
      <div className="text-center text-blue-200 border-t border-blue-900 py-4 text-sm">© {new Date().getFullYear()} Sanvi Machinery</div>
    </footer>
  );

  // ------------------------------------
  // Public Pages
  // ------------------------------------
  const Home = () => (
    <main>
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Premium Industrial Machinery</h1>
          <p className="text-xl md:text-2xl mb-8">Water Plants, Flour Mills, Oil Extractors & More</p>
          <button onClick={() => goto("products")} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold">Browse Products</button>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Product Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((c) => (
              <div key={c} className="bg-white rounded-lg shadow p-6 text-center hover:shadow-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full grid place-content-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="font-semibold text-lg">{c}</h3>
                <p className="text-gray-600">High-quality {c.toLowerCase()} equipment</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.filter((p) => p.featured).map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl">
                <img src={p.image} alt={p.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-700">₹{p.price.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button onClick={() => goto(`product-${p.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Details</button>
                      <button onClick={() => addToCart(p)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Add</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Sanvi Machinery</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Award className="w-12 h-12 text-blue-700 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">Quality Products</h3>
              <p className="text-gray-600">Premium industrial machinery built to last</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-blue-700 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">Expert Support</h3>
              <p className="text-gray-600">Dedicated technical support and service</p>
            </div>
            <div className="text-center">
              <Star className="w-12 h-12 text-blue-700 mx-auto mb-3" />
              <h3 className="font-semibold text-lg">Customer Satisfaction</h3>
              <p className="text-gray-600">Trusted by industries across India</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );

  const ProductsPage = () => {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("name");

    const filtered = products
      .filter((p) => selectedCategory === "All" || p.category === selectedCategory)
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (sortBy === "price" ? a.price - b.price : a.name.localeCompare(b.name)));

    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8">Our Products</h1>

        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option>All</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl">
              <img src={p.image} alt={p.name} className="w-full h-48 object-cover" />
              <div className="p-6">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">{p.category}</span>
                <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-700">₹{p.price.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => goto(`product-${p.id}`)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">View</button>
                    <button onClick={() => addToCart(p)} className="px-3 py-2 bg-orange-500 text-white rounded-lg">Add</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  };

  const ProductDetail = ({ id }: { id: number }) => {
    const p = products.find((x) => x.id === id);
    if (!p) return <main className="max-w-5xl mx-auto p-8">Product not found.</main>;
    const related = products.filter((x) => x.category === p.category && x.id !== p.id);
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <img src={p.image} alt={p.name} className="w-full rounded-lg shadow" />
          <div>
            <h1 className="text-3xl font-bold mb-3">{p.name}</h1>
            <p className="text-gray-600 mb-6">{p.description}</p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Specifications</h3>
              <table className="w-full border border-gray-200 rounded overflow-hidden">
                <tbody>
                  {Object.entries(p.specifications).map(([k, v]) => (
                    <tr key={k} className="odd:bg-gray-50">
                      <td className="px-4 py-2 font-medium bg-gray-100 w-40">{k}</td>
                      <td className="px-4 py-2">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mb-6">
              <span className="text-3xl font-bold text-blue-700">₹{p.price.toLocaleString()}</span>
              <span className="text-green-600">Stock: {p.stock} units</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => addToCart(p)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold">Add to Cart</button>
              <button onClick={() => alert("Quote requested! Our team will contact you.")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">Request Quote</button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-xl">
                  <img src={r.image} alt={r.name} className="w-full h-44 object-cover" />
                  <div className="p-6">
                    <h3 className="font-semibold mb-1">{r.name}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{r.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700">₹{r.price.toLocaleString()}</span>
                      <button onClick={() => goto(`product-${r.id}`)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    );
  };

  const CartPage = () => (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">Your cart is empty</p>
          <button onClick={() => goto("products")} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Continue Shopping</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Price</th>
                  <th className="px-6 py-3 text-left">Qty</th>
                  <th className="px-6 py-3 text-left">Total</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={item.image} className="w-16 h-16 rounded object-cover"/>
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-gray-500">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">₹{item.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="px-2 py-1 bg-gray-200 rounded"><Minus className="w-4 h-4"/></button>
                        <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="px-2 py-1 bg-gray-200 rounded"><Plus className="w-4 h-4"/></button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">₹{(item.price * item.quantity).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => updateQty(item.id, 0)} className="text-red-500 hover:text-red-700"><X className="w-5 h-5"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div className="text-xl font-semibold">Total: ₹{cartTotal.toLocaleString()}</div>
            <div className="flex gap-3">
              <button onClick={() => goto("products")} className="px-5 py-3 bg-gray-600 text-white rounded-lg">Continue Shopping</button>
              <button onClick={() => goto("checkout")} className="px-5 py-3 bg-orange-500 text-white rounded-lg">Proceed to Checkout</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  const AboutPage = () => (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">About Sanvi Machinery</h1>
        <p className="text-gray-600 text-lg">Your trusted partner in industrial machinery solutions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        <img
          src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&h=800&fit=crop"
          className="w-full rounded-lg shadow"
        />
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-3">
            Sanvi Machinery has been serving the industrial sector with premium quality machinery and equipment.
            Under the leadership of Suruchi Sinha, we have established ourselves as a reliable supplier of water treatment plants,
            flour mills, oil extractors, and various processing equipment.
          </p>
          <p className="text-gray-700">
            Based in Bihar Sharif, we serve clients across India with our commitment to quality, reliability, and excellent customer service.
            Our team ensures that every machine meets the highest standards of performance and durability.
          </p>
        </div>
      </div>

      <section className="bg-gray-50 rounded-lg p-8">
        <h3 className="text-2xl font-semibold text-center mb-8">Our Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Award className="w-10 h-10 text-blue-700 mx-auto mb-3" />
            <div className="font-semibold">Quality First</div>
            <p className="text-gray-600">We never compromise on quality and ensure every product meets industry standards.</p>
          </div>
          <div className="text-center">
            <Users className="w-10 h-10 text-blue-700 mx-auto mb-3" />
            <div className="font-semibold">Customer Focus</div>
            <p className="text-gray-600">Our customers are at the heart of everything we do.</p>
          </div>
          <div className="text-center">
            <Wrench className="w-10 h-10 text-blue-700 mx-auto mb-3" />
            <div className="font-semibold">Innovation</div>
            <p className="text-gray-600">We continuously innovate to provide the latest technology solutions.</p>
          </div>
        </div>
      </section>
    </main>
  );

  const ContactPage = () => {
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Thank you! We will contact you shortly.");
      setForm({ name: "", email: "", phone: "", message: "" });
    };
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
          <p className="text-gray-600">We’d love to hear from you</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-4">
            <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Name" className="w-full border rounded-lg px-4 py-2" required />
            <input value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="Email" type="email" className="w-full border rounded-lg px-4 py-2" required />
            <input value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} placeholder="Phone" className="w-full border rounded-lg px-4 py-2" />
            <textarea value={form.message} onChange={(e)=>setForm({...form,message:e.target.value})} placeholder="Message" rows={4} className="w-full border rounded-lg px-4 py-2" />
            <button className="bg-blue-600 text-white px-5 py-3 rounded-lg">Send Message</button>
          </form>

          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-3"><Phone className="w-5 h-5"/> +91-XXXXXXXXXX</div>
            <div className="flex items-center gap-3"><Mail className="w-5 h-5"/> support@sanvimachinery.com</div>
            <div className="flex items-center gap-3"><MapPin className="w-5 h-5"/> Bihar Sharif, Bihar</div>
            <iframe title="map" className="w-full h-64 rounded-lg" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Bihar%20Sharif&t=&z=12&ie=UTF8&iwloc=&output=embed"></iframe>
          </div>
        </div>
      </main>
    );
  };

  // ------------------------------------
  // Checkout Flow
  // ------------------------------------
  const CheckoutPage = () => {
    const [info, setInfo] = useState({ name: "", email: "", phone: "", address: "", pincode: "" });
    const placeOrder = () => {
      if (cart.length === 0) return alert("Cart is empty");
      const id = `ORD${String(100 + orders.length + 1).padStart(3, "0")}`;
      const newOrder = {
        id,
        customerName: info.name || "Guest",
        phone: info.phone,
        address: `${info.address} (${info.pincode})`,
        items: cart,
        total: cartTotal,
        status: "pending",
        date: new Date().toISOString().slice(0, 10),
      };
      setOrders((o) => [newOrder, ...o]);
      setCart([]);
      goto(`order-confirmation-${id}`);
    };

    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Customer Information</h2>
            <input className="w-full border rounded-lg px-4 py-2" placeholder="Name" value={info.name} onChange={(e)=>setInfo({...info,name:e.target.value})}/>
            <input className="w-full border rounded-lg px-4 py-2" placeholder="Email" type="email" value={info.email} onChange={(e)=>setInfo({...info,email:e.target.value})}/>
            <input className="w-full border rounded-lg px-4 py-2" placeholder="Phone" value={info.phone} onChange={(e)=>setInfo({...info,phone:e.target.value})}/>
            <textarea className="w-full border rounded-lg px-4 py-2" placeholder="Address" rows={3} value={info.address} onChange={(e)=>setInfo({...info,address:e.target.value})}></textarea>
            <input className="w-full border rounded-lg px-4 py-2" placeholder="PIN Code" value={info.pincode} onChange={(e)=>setInfo({...info,pincode:e.target.value})}/>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <ul className="divide-y mb-4">
              {cart.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between">
                  <span>{c.name} × {c.quantity}</span>
                  <span className="font-semibold">₹{(c.price*c.quantity).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="mt-6 grid gap-3">
              <button onClick={placeOrder} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-lg">Place Order (COD / Pay Later)</button>
              <button onClick={()=>alert("Payment gateway will be integrated in Phase 2 (Razorpay/Stripe)")} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg">Pay Online (Coming Soon)</button>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const OrderConfirmation = ({ id }: { id: string }) => (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h1 className="text-3xl font-bold mb-2">Thank you! Your order is placed.</h1>
      <p className="text-gray-600 mb-8">Order ID <span className="font-mono font-semibold">{id}</span>. Our team will contact you for confirmation.</p>
      <button onClick={()=>goto("home")} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Back to Home</button>
    </main>
  );

  // ------------------------------------
  // Admin Area
  // ------------------------------------
  const AdminLogin = () => {
    const login = () => {
      if (
        adminCredentials.email === "admin@sanvimachinery.com" &&
        adminCredentials.password === "admin123"
      ) {
        setIsAdmin(true);
        goto("admin");
      } else {
        alert("Invalid credentials");
      }
    };
    return (
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <input value={adminCredentials.email} onChange={(e)=>setAdminCredentials({...adminCredentials,email:e.target.value})} placeholder="Email" className="w-full border rounded-lg px-4 py-2"/>
          <input value={adminCredentials.password} onChange={(e)=>setAdminCredentials({...adminCredentials,password:e.target.value})} placeholder="Password" type="password" className="w-full border rounded-lg px-4 py-2"/>
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg">Sign In</button>
        </div>
      </main>
    );
  };

  type Tab = "dashboard" | "products" | "orders" | "inventory" | "users" | "settings";
  const [tab, setTab] = useState<Tab>("dashboard");

  const Admin = () => {
    const [newProduct, setNewProduct] = useState({
      name: "",
      category: categories[0],
      price: 0,
      image: "",
      description: "",
      stock: 0,
      featured: false,
    });

    const addProduct = () => {
      if (!newProduct.name) return alert("Enter product name");
      const id = Math.max(...products.map((p) => p.id)) + 1;
      setProducts((p) => [
        ...p,
        {
          id,
          ...newProduct,
          specifications: { Warranty: "1 Year" },
        },
      ]);
      setNewProduct({ name: "", category: categories[0], price: 0, image: "", description: "", stock: 0, featured: false });
      alert("Product added");
    };

    const updateOrderStatus = (id: string, status: string) => {
      setOrders((o) => o.map((ord) => (ord.id === id ? { ...ord, status } : ord)));
    };

    const addUser = (name: string, email: string, role: string) => {
      const id = `U${String(users.length + 1).padStart(3, "0")}`;
      setUsers((u) => [...u, { id, name, email, role }]);
    };

    const signOut = () => {
      setIsAdmin(false);
      setAdminCredentials({ email: "", password: "" });
      goto("home");
    };

    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg"><LogOut className="w-4 h-4"/> Sign out</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(["dashboard","products","orders","inventory","users","settings"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg border ${tab===t?"bg-blue-600 text-white border-blue-600":"bg-white"}`}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {tab === "dashboard" && (
          <section className="grid md:grid-cols-4 gap-4">
            <StatCard title="Products" value={products.length} icon={<Package className="w-5 h-5"/>} />
            <StatCard title="Orders" value={orders.length} icon={<Truck className="w-5 h-5"/>} />
            <StatCard title="Inventory" value={products.reduce((s,p)=>s+p.stock,0)} icon={<ShieldCheck className="w-5 h-5"/>} />
            <StatCard title="Users" value={users.length} icon={<Users className="w-5 h-5"/>} />
          </section>
        )}

        {tab === "products" && (
          <section className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Stock</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2">{p.name}</td>
                      <td className="px-4 py-2">{p.category}</td>
                      <td className="px-4 py-2">₹{p.price.toLocaleString()}</td>
                      <td className="px-4 py-2">{p.stock}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={()=>setProducts(ps=>ps.filter(x=>x.id!==p.id))} className="text-red-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <h3 className="font-semibold">Add Product</h3>
              <input className="w-full border rounded px-3 py-2" placeholder="Name" value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct,name:e.target.value})}/>
              <select className="w-full border rounded px-3 py-2" value={newProduct.category} onChange={(e)=>setNewProduct({...newProduct,category:e.target.value})}>
                {categories.map(c=> <option key={c}>{c}</option>)}
              </select>
              <input className="w-full border rounded px-3 py-2" placeholder="Image URL" value={newProduct.image} onChange={(e)=>setNewProduct({...newProduct,image:e.target.value})}/>
              <textarea className="w-full border rounded px-3 py-2" placeholder="Description" value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct,description:e.target.value})}/>
              <input className="w-full border rounded px-3 py-2" placeholder="Price" type="number" value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct,price:parseInt(e.target.value)||0})}/>
              <input className="w-full border rounded px-3 py-2" placeholder="Stock" type="number" value={newProduct.stock} onChange={(e)=>setNewProduct({...newProduct,stock:parseInt(e.target.value)||0})}/>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newProduct.featured} onChange={(e)=>setNewProduct({...newProduct, featured:e.target.checked})}/> Featured</label>
              <button onClick={addProduct} className="w-full bg-blue-600 text-white py-2 rounded">Add</button>
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Order ID</th>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Total</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2 font-mono">{o.id}</td>
                    <td className="px-4 py-2">{o.customerName}</td>
                    <td className="px-4 py-2">₹{o.total.toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{o.status}</td>
                    <td className="px-4 py-2">{o.date}</td>
                    <td className="px-4 py-2 text-right">
                      <select value={o.status} onChange={(e)=>updateOrderStatus(o.id, e.target.value)} className="border rounded px-2 py-1">
                        <option>pending</option>
                        <option>processing</option>
                        <option>shipped</option>
                        <option>delivered</option>
                        <option>cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "inventory" && (
          <section className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                  <th className="px-4 py-2 text-left">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{p.stock}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setProducts(ps=>ps.map((x,i)=> i===idx?{...x,stock:Math.max(0,x.stock-1)}:x))}>-</button>
                        <button className="px-2 py-1 bg-gray-200 rounded" onClick={()=>setProducts(ps=>ps.map((x,i)=> i===idx?{...x,stock:x.stock+1}:x))}>+</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "users" && (
          <section className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2">{u.id}</td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2 capitalize">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AddUserCard onAdd={(n,e,r)=>addUser(n,e,r)} />
          </section>
        )}

        {tab === "settings" && (
          <section className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Settings className="w-5 h-5"/> Company Settings</h3>
            <p className="text-gray-600 text-sm">(Demo) Configure company info, logos, and payment keys here in a real app. Payment gateway integration will come in Phase 2.</p>
            <div className="grid md:grid-cols-2 gap-3">
              <input className="border rounded px-3 py-2" placeholder="Company Name" defaultValue="Sanvi Machinery"/>
              <input className="border rounded px-3 py-2" placeholder="Support Email" defaultValue="support@sanvimachinery.com"/>
              <input className="border rounded px-3 py-2" placeholder="Phone" defaultValue="+91-XXXXXXXXXX"/>
              <input className="border rounded px-3 py-2" placeholder="Address" defaultValue="Bihar Sharif, Bihar"/>
            </div>
            <button className="px-5 py-2 bg-blue-600 text-white rounded">Save Changes</button>
          </section>
        )}
      </main>
    );
  };

  const StatCard = ({ title, value, icon }: any) => (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-500 text-sm">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className="text-blue-700">{icon}</div>
      </div>
    </div>
  );

  const AddUserCard = ({ onAdd }: { onAdd: (n: string, e: string, r: string)=>void }) => {
    const [n,setN]=useState("");
    const [e,setE]=useState("");
    const [r,setR]=useState("staff");
    return (
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <h3 className="font-semibold">Add User</h3>
        <input className="w-full border rounded px-3 py-2" placeholder="Name" value={n} onChange={(ev)=>setN(ev.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={e} onChange={(ev)=>setE(ev.target.value)} />
        <select className="w-full border rounded px-3 py-2" value={r} onChange={(ev)=>setR(ev.target.value)}>
          <option value="owner">owner</option>
          <option value="manager">manager</option>
          <option value="staff">staff</option>
        </select>
        <button onClick={()=>{ if(!n||!e) return alert("Name & Email required"); onAdd(n,e,r); setN(""); setE(""); setR("staff"); }} className="w-full bg-blue-600 text-white py-2 rounded">Add</button>
      </div>
    );
  };

  // ------------------------------------
  // Router-ish rendering (string-based state)
  // ------------------------------------
  const renderPage = () => {
    if (currentPage.startsWith("product-")) {
      const id = parseInt(currentPage.split("-")[1]);
      return <ProductDetail id={id} />;
    }
    if (currentPage.startsWith("order-confirmation-")) {
      const id = currentPage.replace("order-confirmation-", "");
      return <OrderConfirmation id={id} />;
    }

    switch (currentPage) {
      case "home":
        return <Home />;
      case "products":
        return <ProductsPage />;
      case "cart":
        return <CartPage />;
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "checkout":
        return <CheckoutPage />;
      case "admin-login":
        return <AdminLogin />;
      case "admin":
        return isAdmin ? <Admin /> : <AdminLogin />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-1">{renderPage()}</div>
      <Footer />
    </div>
  );
}
