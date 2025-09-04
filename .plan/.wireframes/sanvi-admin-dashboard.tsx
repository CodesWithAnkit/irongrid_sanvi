import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Settings,
  Bell,
  Menu,
  X,
  Grid,
  List,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  Truck,
  FileCheck,
  DollarSign,
  Target,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quotationView, setQuotationView] = useState('grid');

  // Mock data for development
  const dashboardStats = {
    totalQuotations: 156,
    pendingQuotations: 23,
    convertedQuotations: 45,
    totalRevenue: 2850000,
    monthlyGrowth: 12.5,
    conversionRate: 28.8
  };

  const recentQuotations = [
    {
      id: 'QUO-2025-001',
      customer: 'ABC Manufacturing Ltd.',
      amount: 125000,
      status: 'sent',
      date: '2025-01-20',
      items: 3,
      validity: '2025-02-20'
    },
    {
      id: 'QUO-2025-002',
      customer: 'XYZ Industries',
      amount: 89500,
      status: 'approved',
      date: '2025-01-19',
      items: 2,
      validity: '2025-02-19'
    },
    {
      id: 'QUO-2025-003',
      customer: 'Tech Solutions Pvt Ltd',
      amount: 234000,
      status: 'pending',
      date: '2025-01-18',
      items: 5,
      validity: '2025-02-18'
    }
  ];

  const customers = [
    {
      id: 1,
      name: 'ABC Manufacturing Ltd.',
      type: 'wholesale',
      email: 'contact@abcmfg.com',
      phone: '+91 98765 43210',
      location: 'Mumbai, Maharashtra',
      totalOrders: 12,
      creditLimit: 500000,
      outstandingAmount: 125000
    },
    {
      id: 2,
      name: 'XYZ Industries',
      type: 'distributor',
      email: 'sales@xyzind.com',
      phone: '+91 87654 32109',
      location: 'Delhi, NCR',
      totalOrders: 8,
      creditLimit: 300000,
      outstandingAmount: 45000
    }
  ];

  const products = [
    {
      id: 1,
      name: 'Heavy Duty Cutting Machine XZ-2000',
      sku: 'HDC-XZ-2000',
      category: 'Cutting Machinery',
      price: 125000,
      stock: 15,
      status: 'active'
    },
    {
      id: 2,
      name: 'Industrial Welding System WS-Pro',
      sku: 'IWS-PRO-001',
      category: 'Welding Equipment',
      price: 89500,
      stock: 8,
      status: 'active'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 bg-sanvi-primary-900">
        <div className="flex items-center space-x-2">
          <Grid className="w-8 h-8 text-white" />
          <span className="text-xl font-bold text-white">IronGrid</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-white hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="mt-6">
        <div className="px-6 py-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</h3>
        </div>
        
        {[
          { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
          { id: 'quotations', icon: FileText, label: 'Quotations', badge: '23' },
          { id: 'customers', icon: Users, label: 'Customers' },
          { id: 'products', icon: Package, label: 'Products' },
          { id: 'orders', icon: ShoppingCart, label: 'Orders' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-6 py-3 text-left hover:bg-sanvi-primary-100 transition-colors ${
              activeTab === item.id ? 'bg-sanvi-primary-100 border-r-4 border-sanvi-primary-700 text-sanvi-primary-700' : 'text-gray-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-sanvi-secondary-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="px-6 py-2 mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System</h3>
        </div>
        
        {[
          { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
          { id: 'settings', icon: Settings, label: 'Settings' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-sanvi-primary-100 transition-colors ${
              activeTab === item.id ? 'bg-sanvi-primary-100 border-r-4 border-sanvi-primary-700 text-sanvi-primary-700' : 'text-gray-600'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );

  const Header = () => (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'quotations' && 'Quotation Management'}
            {activeTab === 'customers' && 'Customer Management'}
            {activeTab === 'products' && 'Product Catalog'}
            {activeTab === 'orders' && 'Order Management'}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sanvi-primary-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">SA</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Sales Admin</p>
              <p className="text-xs text-gray-500">admin@ironGrid.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  const DashboardContent = () => (
    <div className="p-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quotations</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalQuotations}</p>
            </div>
            <div className="p-3 bg-sanvi-primary-100 rounded-lg">
              <FileText className="w-6 h-6 text-sanvi-primary-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+12% from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-sanvi-secondary-500">{dashboardStats.pendingQuotations}</p>
            </div>
            <div className="p-3 bg-sanvi-secondary-100 rounded-lg">
              <Clock className="w-6 h-6 text-sanvi-secondary-500" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Requires immediate attention</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-green-600">{dashboardStats.conversionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+5.2% improvement</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(dashboardStats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-sanvi-primary-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-sanvi-primary-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+{dashboardStats.monthlyGrowth}% growth</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Quotations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentQuotations.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{quote.id}</p>
                    <p className="text-sm text-gray-600">{quote.customer}</p>
                    <p className="text-xs text-gray-500">{quote.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(quote.amount)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Phase 1 Progress</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Backend Foundation</span>
                <span className="text-sm font-semibold text-green-600">100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Quotation System</span>
                <span className="text-sm font-semibold text-sanvi-primary-700">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-sanvi-primary-700 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Customer Management</span>
                <span className="text-sm font-semibold text-sanvi-secondary-500">70%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-sanvi-secondary-500 h-2 rounded-full" style={{width: '70%'}}></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Integration & Testing</span>
                <span className="text-sm font-semibold text-yellow-600">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{width: '45%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const QuotationsContent = () => (
    <div className="p-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sanvi-primary-700 focus:border-transparent"
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuotationView('grid')}
              className={`p-2 ${quotationView === 'grid' ? 'bg-sanvi-primary-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setQuotationView('list')}
              className={`p-2 ${quotationView === 'list' ? 'bg-sanvi-primary-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quotations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {recentQuotations.map((quote) => (
          <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{quote.id}</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                  {quote.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{quote.customer}</span>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(quote.amount)}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Valid until {quote.validity}</span>
                </div>
                
                <div className="flex items-center">
                  <Package className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{quote.items} items</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-sanvi-primary-700 text-white px-3 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors flex items-center justify-center">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button className="flex-1 bg-sanvi-secondary-500 text-white px-3 py-2 rounded-lg hover:bg-sanvi-secondary-600 transition-colors flex items-center justify-center">
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CustomersContent = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
        <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.type === 'wholesale' ? 'bg-blue-100 text-blue-800' : 
                      customer.type === 'distributor' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {customer.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900">Limit: {formatCurrency(customer.creditLimit)}</div>
                      <div className="text-gray-500">Outstanding: {formatCurrency(customer.outstandingAmount)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-sanvi-primary-700 hover:text-sanvi-primary-900">View</button>
                      <button className="text-sanvi-secondary-500 hover:text-sanvi-secondary-600">Edit</button>
                      <button className="text-green-600 hover:text-green-800">Quote</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const ProductsContent = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Product Catalog</h2>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Import Products
          </button>
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock} units
                      </span>
                      {product.stock < 10 && (
                        <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-sanvi-primary-700 hover:text-sanvi-primary-900">View</button>
                      <button className="text-sanvi-secondary-500 hover:text-sanvi-secondary-600">Edit</button>
                      <button className="text-green-600 hover:text-green-800">Quote</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const OrdersContent = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Export Orders
          </button>
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </button>
        </div>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Shipped</p>
              <p className="text-xl font-bold text-gray-900">15</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-4">Orders will appear here once quotations are converted to orders.</p>
            <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors">
              View All Quotations
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'quotations':
        return <QuotationsContent />;
      case 'customers':
        return <CustomersContent />;
      case 'products':
        return <ProductsContent />;
      case 'orders':
        return <OrdersContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-sanvi-neutral-50">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar />
      
      <div className={`transition-all duration-200 ease-in-out ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <Header />
        <main className="min-h-screen">
          {renderContent()}
        </main>
      </div>

      {/* Development Progress Modal - Phase 1 Focus */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Phase 1 Development</h4>
            <span className="text-xs bg-sanvi-primary-100 text-sanvi-primary-700 px-2 py-1 rounded-full">
              Week 8/10
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Backend Foundation Complete</span>
            </div>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Database Models Ready</span>
            </div>
            <div className="flex items-center text-sanvi-primary-700">
              <Activity className="w-4 h-4 mr-2" />
              <span>Quotation System (85%)</span>
            </div>
            <div className="flex items-center text-sanvi-secondary-500">
              <Clock className="w-4 h-4 mr-2" />
              <span>CRM Integration (70%)</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Next: Integration & Testing</span>
              <span>2 weeks remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;