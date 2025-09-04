import React, { useState, useEffect } from "react";
import {
  Wrench,
  Users,
  Package,
  Truck,
  ShieldCheck,
  Settings,
  LogOut,
  Edit,
  Trash2,
  Star,
  Plus,
  Download,
  AlertCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";

export default function SanviMachineryAdmin() {
  // ------------------------------------
  // State Management
  // ------------------------------------
  const [currentTab, setCurrentTab] = useState("dashboard");

  // Sample data - replace with API later
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "RO Water Plant - 1000 LPH",
      category: "Water Plant",
      price: 85000,
      image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop",
      description: "High-efficiency reverse osmosis water treatment plant",
      specifications: {
        Capacity: "1000 Liters/Hour",
        Power: "2 HP",
        Warranty: "2 Years",
        Material: "SS 304",
      },
      stock: 15,
      featured: true,
      status: "active",
      createdAt: "2025-01-15",
    },
    {
      id: 2,
      name: "Commercial Aata Chakki",
      category: "Aata Chakki",
      price: 45000,
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
      description: "Heavy-duty flour mill for commercial use",
      specifications: {
        Capacity: "50 kg/hour",
        Power: "5 HP",
        Warranty: "1 Year",
        Material: "Cast Iron",
      },
      stock: 8,
      featured: true,
      status: "active",
      createdAt: "2025-01-10",
    },
    {
      id: 3,
      name: "Oil Expeller Machine",
      category: "Oil Mill",
      price: 125000,
      image: "https://images.unsplash.com/photo-1628191081676-8cfebc4b8056?w=400&h=300&fit=crop",
      description: "Automatic oil extraction machine for various seeds",
      specifications: {
        Capacity: "10-12 kg/hour",
        Power: "7.5 HP",
        Warranty: "2 Years",
        Material: "Mild Steel",
      },
      stock: 5,
      featured: false,
      status: "active",
      createdAt: "2025-01-08",
    },
  ]);

  const [orders, setOrders] = useState([
    {
      id: "ORD001",
      customerName: "Rajesh Kumar",
      customerEmail: "rajesh@example.com",
      phone: "+91-9876543210",
      address: "Bihar Sharif, Bihar",
      items: [{ ...products[0], quantity: 1 }],
      total: 85000,
      status: "pending",
      date: "2025-08-15",
      paymentMethod: "cod",
      notes: "Urgent delivery required",
    },
    {
      id: "ORD002",
      customerName: "Priya Singh",
      customerEmail: "priya@example.com",
      phone: "+91-9876543211",
      address: "Patna, Bihar",
      items: [{ ...products[1], quantity: 2 }],
      total: 90000,
      status: "processing",
      date: "2025-08-14",
      paymentMethod: "online",
      notes: "",
    },
  ]);

  const [users, setUsers] = useState([
    { id: "U001", name: "Admin User", email: "admin@sanvimachinery.com", role: "owner", status: "active", lastLogin: "2025-08-19" },
    { id: "U002", name: "Manager", email: "manager@sanvimachinery.com", role: "manager", status: "active", lastLogin: "2025-08-18" },
    { id: "U003", name: "Staff Member", email: "staff@sanvimachinery.com", role: "staff", status: "active", lastLogin: "2025-08-17" },
  ]);

  const categories = ["Water Plant", "Aata Chakki", "Oil Mill", "Processing Equipment"];

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Forms
  const [productForm, setProductForm] = useState({
    name: "",
    category: categories[0],
    price: 0,
    image: "",
    description: "",
    stock: 0,
    featured: false,
    status: "active",
  });

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "staff",
    status: "active",
  });

  // Filters
  const [filters, setFilters] = useState({
    products: { category: "all", status: "all", search: "" },
    orders: { status: "all", search: "" },
    users: { role: "all", status: "all", search: "" },
  });

  // ------------------------------------
  // CRUD + Utility Functions
  // ------------------------------------
  const openProductModal = (product = null) => {
    if (product) {
      setEditingItem(product);
      setProductForm({ ...product });
    } else {
      setEditingItem(null);
      setProductForm({
        name: "",
        category: categories[0],
        price: 0,
        image: "",
        description: "",
        stock: 0,
        featured: false,
        status: "active",
      });
    }
    setShowProductModal(true);
  };

  const saveProduct = () => {
    if (!productForm.name) return alert("Name required");
    if (editingItem) {
      setProducts(products.map(p => p.id === editingItem.id ? { ...productForm, id: editingItem.id } : p));
    } else {
      const newId = Math.max(...products.map(p => p.id)) + 1;
      setProducts([...products, { ...productForm, id: newId, createdAt: new Date().toISOString().split("T")[0] }]);
    }
    setShowProductModal(false);
    setEditingItem(null);
  };

  const deleteProduct = (id) => setProducts(products.filter(p => p.id !== id));

  const openOrderModal = (order) => {
    setEditingItem(order);
    setShowOrderModal(true);
  };

  const updateOrderStatus = (orderId, newStatus) =>
    setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));

  const deleteOrder = (id) => setOrders(orders.filter(o => o.id !== id));

  const openUserModal = (user = null) => {
    if (user) {
      setEditingItem(user);
      setUserForm({ ...user });
    } else {
      setEditingItem(null);
      setUserForm({ name: "", email: "", role: "staff", status: "active" });
    }
    setShowUserModal(true);
  };

  const saveUser = () => {
    if (!userForm.name || !userForm.email) return alert("Name and email required");
    if (editingItem) {
      setUsers(users.map(u => u.id === editingItem.id ? { ...userForm, id: editingItem.id, lastLogin: editingItem.lastLogin } : u));
    } else {
      const newId = `U${String(users.length + 1).padStart(3, "0")}`;
      setUsers([...users, { ...userForm, id: newId, lastLogin: "Never" }]);
    }
    setShowUserModal(false);
    setEditingItem(null);
  };

  const deleteUser = (id) => setUsers(users.filter(u => u.id !== id));

  const updateStock = (productId, change) =>
    setProducts(products.map(p => p.id === productId ? { ...p, stock: Math.max(0, p.stock + change) } : p));

  // Filters
  const getFilteredProducts = () =>
    products.filter(product =>
      (filters.products.category === "all" || product.category === filters.products.category) &&
      (filters.products.status === "all" || product.status === filters.products.status) &&
      product.name.toLowerCase().includes(filters.products.search.toLowerCase())
    );

  const getFilteredOrders = () =>
    orders.filter(order =>
      (filters.orders.status === "all" || order.status === filters.orders.status) &&
      (order.customerName.toLowerCase().includes(filters.orders.search.toLowerCase()) || order.id.toLowerCase().includes(filters.orders.search.toLowerCase()))
    );

  const getFilteredUsers = () =>
    users.filter(user =>
      (filters.users.role === "all" || user.role === filters.users.role) &&
      (filters.users.status === "all" || user.status === filters.users.status) &&
      (user.name.toLowerCase().includes(filters.users.search.toLowerCase()) || user.email.toLowerCase().includes(filters.users.search.toLowerCase()))
    );

  // ------------------------------------
  // Dashboard Tab
  // ------------------------------------
  const DashboardTab = () => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const lowStockProducts = products.filter(p => p.stock < 10).length;
    const activeProducts = products.filter(p => p.status === "active").length;

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard title="Revenue" value={`₹${totalRevenue}`} icon={<DollarSign />} trendUp />
          <StatsCard title="Pending Orders" value={pendingOrders} icon={<AlertCircle />} />
          <StatsCard title="Active Products" value={activeProducts} icon={<Package />} trendUp />
          <StatsCard title="Low Stock" value={lowStockProducts} icon={<ShieldCheck />} />
        </div>
      </div>
    );
  };

  const StatsCard = ({ title, value, icon, trendUp }) => (
    <div className="bg-white p-4 shadow rounded-lg flex justify-between">
      <div>
        <p className="text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${trendUp ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>
        {icon}
      </div>
    </div>
  );

  // ------------------------------------
  // Products Tab
  // ------------------------------------
  const ProductsTab = () => {
    const filteredProducts = getFilteredProducts();
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Products</h2>
          <button onClick={() => openProductModal()} className="bg-blue-600 text-white px-4 py-2 rounded">Add Product</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white shadow rounded p-4">
              <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded mb-2" />
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm">{product.category}</p>
              <p className="text-xl font-bold text-blue-600">₹{product.price}</p>
              <p className="text-sm">Stock: {product.stock}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => openProductModal(product)} className="text-blue-600">Edit</button>
                <button onClick={() => deleteProduct(product.id)} className="text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-[400px]">
              <h3 className="text-xl font-bold mb-4">{editingItem ? "Edit Product" : "Add Product"}</h3>
              <input type="text" placeholder="Name" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="border w-full px-2 py-1 mb-2" />
              <input type="number" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: +e.target.value})} className="border w-full px-2 py-1 mb-2" />
              <input type="number" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: +e.target.value})} className="border w-full px-2 py-1 mb-2" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowProductModal(false)} className="px-3 py-2 border rounded">Cancel</button>
                <button onClick={saveProduct} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ------------------------------------
  // Orders Tab
  // ------------------------------------
  const OrdersTab = () => {
    const filteredOrders = getFilteredOrders();
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Orders</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2">{order.id}</td>
                  <td className="px-4 py-2">{order.customerName}</td>
                  <td className="px-4 py-2">₹{order.total}</td>
                  <td className="px-4 py-2">
                    <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="border rounded px-2 py-1">
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => openOrderModal(order)} className="text-blue-600">View</button>
                    <button onClick={() => deleteOrder(order.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showOrderModal && editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-[600px]">
              <h3 className="text-xl font-bold mb-4">Order Details ({editingItem.id})</h3>
              <p><strong>Customer:</strong> {editingItem.customerName}</p>
              <p><strong>Email:</strong> {editingItem.customerEmail}</p>
              <p><strong>Phone:</strong> {editingItem.phone}</p>
              <p><strong>Address:</strong> {editingItem.address}</p>
              <p><strong>Payment:</strong> {editingItem.paymentMethod.toUpperCase()}</p>
              <p><strong>Notes:</strong> {editingItem.notes || "N/A"}</p>
              <div className="mt-4">
                <h4 className="font-semibold">Items</h4>
                {editingItem.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between border-b py-1">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="text-right font-bold mt-4">Total: ₹{editingItem.total}</div>
              <button onClick={() => setShowOrderModal(false)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Close</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ------------------------------------
  // Users Tab
  // ------------------------------------
  const UsersTab = () => {
    const filteredUsers = getFilteredUsers();
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Users</h2>
          <button onClick={() => openUserModal()} className="bg-blue-600 text-white px-4 py-2 rounded">Add User</button>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Last Login</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2">{user.status}</td>
                  <td className="px-4 py-2">{user.lastLogin}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => openUserModal(user)} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteUser(user.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-[400px]">
              <h3 className="text-xl font-bold mb-4">{editingItem ? "Edit User" : "Add User"}</h3>
              <input type="text" placeholder="Name" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} className="border w-full px-2 py-1 mb-2" />
              <input type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="border w-full px-2 py-1 mb-2" />
              <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} className="border w-full px-2 py-1 mb-2">
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              <select value={userForm.status} onChange={(e) => setUserForm({...userForm, status: e.target.value})} className="border w-full px-2 py-1 mb-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowUserModal(false)} className="px-3 py-2 border rounded">Cancel</button>
                <button onClick={saveUser} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ------------------------------------
  // Inventory Tab
  // ------------------------------------
  const InventoryTab = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Inventory</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white shadow rounded p-4">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm">{product.category}</p>
            <p className={product.stock < 5 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>Stock: {product.stock}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => updateStock(product.id, 1)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded">+1</button>
              <button onClick={() => updateStock(product.id, -1)} className="px-3 py-1 bg-red-100 text-red-700 rounded">-1</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ------------------------------------
  // Main Render
  // ------------------------------------
  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r min-h-screen">
        <div className="p-4 font-bold text-xl flex items-center gap-2">
          <Wrench className="text-blue-600" /> Sanvi Admin
        </div>
        <nav className="p-4 space-y-2">
          <button onClick={() => setCurrentTab("dashboard")} className={`block w-full text-left px-4 py-2 rounded ${currentTab==="dashboard"?"bg-blue-100":""}`}>Dashboard</button>
          <button onClick={() => setCurrentTab("products")} className={`block w-full text-left px-4 py-2 rounded ${currentTab==="products"?"bg-blue-100":""}`}>Products</button>
          <button onClick={() => setCurrentTab("orders")} className={`block w-full text-left px-4 py-2 rounded ${currentTab==="orders"?"bg-blue-100":""}`}>Orders</button>
          <button onClick={() => setCurrentTab("inventory")} className={`block w-full text-left px-4 py-2 rounded ${currentTab==="inventory"?"bg-blue-100":""}`}>Inventory</button>
          <button onClick={() => setCurrentTab("users")} className={`block w-full text-left px-4 py-2 rounded ${currentTab==="users"?"bg-blue-100":""}`}>Users</button>
          <button onClick={() => setCurrentTab("settings")} className={`block w-full text-left px-4 py-2 rounded ${currentTab==="settings"?"bg-blue-100":""}`}>Settings</button>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        {currentTab === "dashboard" && <DashboardTab />}
        {currentTab === "products" && <ProductsTab />}
        {currentTab === "orders" && <OrdersTab />}
        {currentTab === "inventory" && <InventoryTab />}
        {currentTab === "users" && <UsersTab />}
        {currentTab === "settings" && <h2 className="text-3xl font-bold">Settings (Coming Soon)</h2>}
      </main>
    </div>
  );
}
