import React, { useState } from 'react';
import { 
  TrendingUp,
  DollarSign,
  Settings,
  Brain,
  Zap,
  Warehouse,
  BarChart3,
  Users2,
  Calculator,
  Bell,
  Menu,
  X,
  Grid,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  Truck,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  Sliders,
  PieChart,
  LineChart,
  Activity,
  Globe,
  Shield,
  Layers,
  Database,
  Cloud,
  Smartphone
} from 'lucide-react';

const Phase2Dashboard = () => {
  const [activeTab, setActiveTab] = useState('pricing');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPricingRule, setSelectedPricingRule] = useState(null);
  const [inventoryLocation, setInventoryLocation] = useState('all');

  // Mock data for Phase 2 features
  const pricingRules = [
    {
      id: 1,
      name: 'Volume Discount - Tier 1',
      type: 'volume',
      conditions: 'Quantity >= 10 units',
      discount: '15%',
      priority: 1,
      isActive: true,
      appliedOrders: 45,
      revenue: 1250000
    },
    {
      id: 2,
      name: 'Wholesale Customer Premium',
      type: 'customer_type',
      conditions: 'Customer Type = Wholesale',
      discount: '12%',
      priority: 2,
      isActive: true,
      appliedOrders: 32,
      revenue: 890000
    },
    {
      id: 3,
      name: 'Seasonal Monsoon Offer',
      type: 'seasonal',
      conditions: 'June - September',
      discount: '8%',
      priority: 3,
      isActive: false,
      appliedOrders: 0,
      revenue: 0
    }
  ];

  const inventoryData = [
    {
      location: 'Mumbai Warehouse',
      products: 245,
      totalValue: 15600000,
      lowStock: 12,
      reorderPending: 5,
      transfersIn: 3,
      transfersOut: 7
    },
    {
      location: 'Delhi Distribution Center',
      products: 189,
      totalValue: 12300000,
      lowStock: 8,
      reorderPending: 2,
      transfersIn: 5,
      transfersOut: 4
    },
    {
      location: 'Chennai Regional Hub',
      products: 156,
      totalValue: 9800000,
      lowStock: 6,
      reorderPending: 3,
      transfersIn: 2,
      transfersOut: 6
    }
  ];

  const orderProcessingStats = [
    { stage: 'Order Received', count: 45, avgTime: '2 hours', efficiency: 98 },
    { stage: 'Credit Verification', count: 42, avgTime: '4 hours', efficiency: 95 },
    { stage: 'Inventory Allocation', count: 38, avgTime: '1 hour', efficiency: 92 },
    { stage: 'Payment Processing', count: 35, avgTime: '6 hours', efficiency: 89 },
    { stage: 'Fulfillment Ready', count: 32, avgTime: '12 hours', efficiency: 87 }
  ];

  const communicationStats = [
    { channel: 'WhatsApp Business', messages: 1250, responses: 1180, responseRate: 94.4, avgResponse: '12 min' },
    { channel: 'Email Automation', messages: 850, responses: 720, responseRate: 84.7, avgResponse: '2.5 hours' },
    { channel: 'SMS Notifications', messages: 450, responses: 380, responseRate: 84.4, avgResponse: '45 min' },
    { channel: 'Voice Calls', messages: 125, responses: 118, responseRate: 94.4, avgResponse: '1.2 hours' }
  ];

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
          <span className="text-xl font-bold text-white">IronGrid Phase 2</span>
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
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Advanced Features</h3>
        </div>
        
        {[
          { id: 'pricing', icon: Calculator, label: 'Dynamic Pricing Engine', badge: 'AI' },
          { id: 'inventory', icon: Warehouse, label: 'Multi-Location Inventory' },
          { id: 'orders', icon: Zap, label: 'Enhanced Order Processing' },
          { id: 'communication', icon: Bell, label: 'Communication Systems' },
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
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics & Reports</h3>
        </div>
        
        {[
          { id: 'analytics', icon: BarChart3, label: 'Advanced Analytics' },
          { id: 'mobile', icon: Smartphone, label: 'Mobile App Preview' },
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
            {activeTab === 'pricing' && 'Dynamic Pricing Engine'}
            {activeTab === 'inventory' && 'Multi-Location Inventory Management'}
            {activeTab === 'orders' && 'Enhanced Order Processing'}
            {activeTab === 'communication' && 'Communication Systems'}
            {activeTab === 'analytics' && 'Advanced Analytics & Reporting'}
            {activeTab === 'mobile' && 'Mobile Application Preview'}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Phase 2 Active
          </div>
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sanvi-secondary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">P2</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Phase 2 Admin</p>
              <p className="text-xs text-gray-500">advanced@ironGrid.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  const DynamicPricingContent = () => (
    <div className="p-6">
      {/* Pricing Engine Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Pricing Rules</p>
              <p className="text-3xl font-bold text-sanvi-primary-700">12</p>
            </div>
            <div className="p-3 bg-sanvi-primary-100 rounded-lg">
              <Sliders className="w-6 h-6 text-sanvi-primary-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+3 rules this month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(3140000)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+18% from optimized pricing</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applied Discounts</p>
              <p className="text-3xl font-bold text-sanvi-secondary-500">77</p>
            </div>
            <div className="p-3 bg-sanvi-secondary-100 rounded-lg">
              <Target className="w-6 h-6 text-sanvi-secondary-500" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Across all customer tiers</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-3xl font-bold text-gray-900">32.4%</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Award className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+4.2% improvement</span>
          </div>
        </div>
      </div>

      {/* Pricing Rules Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Business Intelligence Reports</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Sales Performance</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-medium text-gray-900">{formatCurrency(2850000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">YoY Growth</span>
                    <span className="font-medium text-green-600">+23.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Deal Size</span>
                    <span className="font-medium text-gray-900">{formatCurrency(125000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate</span>
                    <span className="font-medium text-sanvi-primary-700">31.2%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Product Performance</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Category</span>
                    <span className="font-medium text-gray-900">Cutting Machines</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Units Sold</span>
                    <span className="font-medium text-gray-900">245</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inventory Turnover</span>
                    <span className="font-medium text-sanvi-secondary-500">4.2x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Margin Improvement</span>
                    <span className="font-medium text-green-600">+8.3%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Customer Insights</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Customers</span>
                    <span className="font-medium text-gray-900">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Acquisitions</span>
                    <span className="font-medium text-green-600">+23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retention Rate</span>
                    <span className="font-medium text-green-600">94.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upsell Success</span>
                    <span className="font-medium text-sanvi-primary-700">18.7%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  const MobileAppContent = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mobile Application Preview</h2>
          <p className="text-gray-600">React Native app for sales team and customers</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            Beta Ready
          </div>
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900">
            Download APK
          </button>
        </div>
      </div>

      {/* Mobile App Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sales Team App Features</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-sanvi-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-sanvi-primary-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Mobile Quotation Builder</p>
                  <p className="text-sm text-gray-600">Create quotes on-site with customers</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Users2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Customer Management</p>
                  <p className="text-sm text-gray-600">Access customer data offline</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Product Catalog</p>
                  <p className="text-sm text-gray-600">Browse and search products with specs</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sales Dashboard</p>
                  <p className="text-sm text-gray-600">Track performance and targets</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Bell className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Real-time alerts and updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Customer Portal Features</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-sanvi-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <Eye className="w-4 h-4 text-sanvi-primary-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Quotation Viewer</p>
                  <p className="text-sm text-gray-600">View and approve quotations</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Tracking</p>
                  <p className="text-sm text-gray-600">Real-time order status updates</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment Gateway</p>
                  <p className="text-sm text-gray-600">Secure mobile payments</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Purchase History</p>
                  <p className="text-sm text-gray-600">Complete transaction history</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Globe className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Support Chat</p>
                  <p className="text-sm text-gray-600">Direct communication with sales team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Screenshots Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Mobile App Screenshots</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mobile Screen 1 */}
            <div className="bg-gray-900 rounded-2xl p-4 max-w-xs mx-auto">
              <div className="bg-white rounded-xl p-4 h-96">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Grid className="w-6 h-6 text-sanvi-primary-700" />
                    <span className="font-bold text-gray-900">IronGrid</span>
                  </div>
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
                <div className="space-y-3">
                  <div className="bg-sanvi-primary-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Quotations</span>
                      <span className="text-lg font-bold text-sanvi-primary-700">23</span>
                    </div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Monthly Target</span>
                      <span className="text-lg font-bold text-green-600">78%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">QUO-2025-001</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Sent</span>
                      </div>
                      <div className="font-medium text-sm mt-1">ABC Manufacturing</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">QUO-2025-002</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Approved</span>
                      </div>
                      <div className="font-medium text-sm mt-1">XYZ Industries</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Screen 2 */}
            <div className="bg-gray-900 rounded-2xl p-4 max-w-xs mx-auto">
              <div className="bg-white rounded-xl p-4 h-96">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-900">Create Quotation</span>
                  <X className="w-5 h-5 text-gray-600" />
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600">Customer</label>
                    <div className="bg-gray-50 rounded p-2 mt-1">
                      <span className="text-sm">Select Customer</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Products</label>
                    <div className="space-y-2 mt-1">
                      <div className="bg-sanvi-primary-50 border border-sanvi-primary-200 rounded p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Heavy Duty Cutter</span>
                          <span className="text-xs">₹1,25,000</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Qty: 2 units</div>
                      </div>
                      <button className="w-full border-2 border-dashed border-gray-300 rounded p-2 text-sm text-gray-600">
                        + Add Product
                      </button>
                    </div>
                  </div>
                  <div className="bg-sanvi-secondary-100 rounded-lg p-3 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sanvi-secondary-900">Total Amount</span>
                      <span className="text-lg font-bold text-sanvi-secondary-700">₹2,50,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Screen 3 */}
            <div className="bg-gray-900 rounded-2xl p-4 max-w-xs mx-auto">
              <div className="bg-white rounded-xl p-4 h-96">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-900">Customer Portal</span>
                  <div className="w-8 h-8 bg-sanvi-primary-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">AB</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">New Quotation</div>
                        <div className="text-xs text-blue-700">QUO-2025-003</div>
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                        View
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Recent Orders</span>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Payment History</span>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Support</span>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'pricing':
        return <DynamicPricingContent />;
      case 'inventory':
        return <InventoryContent />;
      case 'orders':
        return <OrderProcessingContent />;
      case 'communication':
        return <CommunicationContent />;
      case 'analytics':
        return <AdvancedAnalyticsContent />;
      case 'mobile':
        return <MobileAppContent />;
      default:
        return <DynamicPricingContent />;
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

      {/* Phase 2 Development Status */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Phase 2 Status</h4>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Week 16/18
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Dynamic Pricing Engine</span>
            </div>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Multi-Location Inventory</span>
            </div>
            <div className="flex items-center text-sanvi-primary-700">
              <Activity className="w-4 h-4 mr-2" />
              <span>Communication Systems (95%)</span>
            </div>
            <div className="flex items-center text-sanvi-secondary-500">
              <Clock className="w-4 h-4 mr-2" />
              <span>Mobile App Testing</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Next: Phase 3 Automation</span>
              <span>2 weeks remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phase2Dashboard;  <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Active Pricing Rules</h3>
              <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors text-sm">
                Create Rule
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pricingRules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="bg-sanvi-primary-100 text-sanvi-primary-700 px-2 py-1 text-xs rounded-full">
                        Priority {rule.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mt-1">+0.3x improvement from last quarter</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Stock Accuracy</span>
                  <span className="text-sm font-semibold text-green-600">97.8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '97.8%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Real-time tracking system active</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Demand Forecast Accuracy</span>
                  <span className="text-sm font-semibold text-blue-600">89.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '89.5%'}}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">AI-powered demand prediction</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Optimization Suggestions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Increase Mumbai safety stock for Cutting Machines</li>
                  <li>• Transfer excess Welding Equipment from Chennai to Delhi</li>
                  <li>• Schedule quarterly inventory audit for March</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const OrderProcessingContent = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Enhanced Order Processing</h2>
          <p className="text-gray-600">Automated workflows and bulk operations</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            Process All
          </button>
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900">
            Bulk Actions
          </button>
        </div>
      </div>

      {/* Processing Pipeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Order Processing Pipeline</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {orderProcessingStats.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-purple-500' : 
                    index === 2 ? 'bg-indigo-500' : 
                    index === 3 ? 'bg-green-500' : 
                    'bg-sanvi-secondary-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{stage.stage}</p>
                    <p className="text-sm text-gray-600">Avg Processing Time: {stage.avgTime}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stage.count}</p>
                      <p className="text-sm text-gray-600">Orders</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${stage.efficiency >= 95 ? 'text-green-600' : stage.efficiency >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {stage.efficiency}%
                      </p>
                      <p className="text-sm text-gray-600">Efficiency</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Integration & Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payment Gateway Integration</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Razorpay</p>
                    <p className="text-sm text-gray-600">Primary Gateway</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹45.2L</p>
                  <p className="text-sm text-green-600">98.5% Success</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Stripe</p>
                    <p className="text-sm text-gray-600">International</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹12.8L</p>
                  <p className="text-sm text-green-600">97.2% Success</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bank Transfer</p>
                    <p className="text-sm text-gray-600">Direct</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹89.1L</p>
                  <p className="text-sm text-green-600">100% Success</p>
                </div>
              </div>

              <div className="bg-sanvi-primary-50 border border-sanvi-primary-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Activity className="w-5 h-5 text-sanvi-primary-700 mr-2" />
                  <h4 className="font-medium text-sanvi-primary-900">Payment Analytics</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-sanvi-primary-700">Average Settlement</p>
                    <p className="font-medium text-sanvi-primary-900">2.3 days</p>
                  </div>
                  <div>
                    <p className="text-sanvi-primary-700">Failed Payments</p>
                    <p className="font-medium text-sanvi-primary-900">2.8%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Order Tracking</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium relative z-10">
                      ✓
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Order Confirmed</p>
                      <p className="text-sm text-gray-600">ORD-2025-045 • Jan 20, 2:30 PM</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium relative z-10">
                      ✓
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Payment Verified</p>
                      <p className="text-sm text-gray-600">₹1,25,000 via Bank Transfer • Jan 20, 4:45 PM</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium relative z-10 animate-pulse">
                      3
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">Inventory Allocated</p>
                      <p className="text-sm text-gray-600">Processing at Mumbai Warehouse • In Progress</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium relative z-10">
                      4
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-500">Packaging & Dispatch</p>
                      <p className="text-sm text-gray-400">Estimated: Jan 21, 10:00 AM</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium relative z-10">
                      5
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-500">Delivered</p>
                      <p className="text-sm text-gray-400">Estimated: Jan 24, 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Truck className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-900">Logistics Integration</h4>
                </div>
                <div className="text-sm text-blue-700">
                  <p>• Real-time tracking with Delhivery & Blue Dart</p>
                  <p>• Automated dispatch notifications</p>
                  <p>• Delivery confirmation with digital signatures</p>
                  <p>• Exception handling & automatic rerouting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CommunicationContent = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Communication Systems</h2>
          <p className="text-gray-600">Multi-channel customer engagement platform</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            Campaign Manager
          </button>
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900">
            Send Broadcast
          </button>
        </div>
      </div>

      {/* Communication Channels Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {communicationStats.map((channel, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  index === 0 ? 'bg-green-100' :
                  index === 1 ? 'bg-blue-100' :
                  index === 2 ? 'bg-yellow-100' :
                  'bg-purple-100'
                }`}>
                  {index === 0 && <Globe className="w-5 h-5 text-green-600" />}
                  {index === 1 && <Bell className="w-5 h-5 text-blue-600" />}
                  {index === 2 && <Smartphone className="w-5 h-5 text-yellow-600" />}
                  {index === 3 && <Activity className="w-5 h-5 text-purple-600" />}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                channel.responseRate >= 90 ? 'bg-green-100 text-green-800' :
                channel.responseRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {channel.responseRate}%
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2">{channel.channel}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Messages Sent</span>
                <span className="font-medium">{channel.messages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Responses</span>
                <span className="font-medium">{channel.responses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response</span>
                <span className="font-medium">{channel.avgResponse}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Communication Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Business Integration</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">WhatsApp Business API</p>
                    <p className="text-sm text-green-700">Verified Business Account</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Template Messages</p>
                    <p className="font-medium text-green-900">15 Approved</p>
                  </div>
                  <div>
                    <p className="text-green-700">Monthly Quota</p>
                    <p className="font-medium text-green-900">10,000 messages</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Automated Messages</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Quotation Sent Notification</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Order Confirmation</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Payment Reminder</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Shipment Tracking</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Message Templates</h4>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">Hi {{customer_name}}, your quotation {{quote_id}} for ₹{{amount}} is ready. View: {{link}}</p>
                  <div className="flex items-center justify-between">
                    <span>Delivery Rate: 98.2%</span>
                    <button className="text-blue-600 hover:text-blue-800">Edit Template</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Email Automation & SMS</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">SendGrid Integration</p>
                    <p className="text-sm text-blue-700">Professional Email Service</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Emails Sent</p>
                    <p className="font-medium text-blue-900">8,450/month</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Delivery Rate</p>
                    <p className="font-medium text-blue-900">97.8%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Email Campaigns</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div>
                      <p className="font-medium">Monthly Newsletter</p>
                      <p className="text-gray-600">Product updates & industry news</p>
                    </div>
                    <span className="text-green-600 text-xs">23.5% Open Rate</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded">
                    <div>
                      <p className="font-medium">Follow-up Sequence</p>
                      <p className="text-gray-600">Quotation reminder series</p>
                    </div>
                    <span className="text-green-600 text-xs">18.2% Click Rate</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-900">SMS Gateway</p>
                    <p className="text-sm text-yellow-700">Twilio Integration</p>
                  </div>
                </div>
                <div className="text-sm text-yellow-700">
                  <div className="flex justify-between mb-2">
                    <span>SMS Credits</span>
                    <span className="font-medium">2,450 remaining</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Rate</span>
                    <span className="font-medium">99.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AdvancedAnalyticsContent = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advanced Analytics & Reporting</h2>
          <p className="text-gray-600">Business intelligence and predictive insights</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Sales Forecast</p>
              <p className="text-3xl font-bold">{formatCurrency(4250000)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
          <div className="mt-4 text-blue-100 text-sm">
            Next 30 days prediction
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Customer LTV</p>
              <p className="text-3xl font-bold">{formatCurrency(185000)}</p>
            </div>
            <Users2 className="w-8 h-8 text-green-200" />
          </div>
          <div className="mt-4 text-green-100 text-sm">
            Average lifetime value
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Churn Risk</p>
              <p className="text-3xl font-bold">12</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-purple-200" />
          </div>
          <div className="mt-4 text-purple-100 text-sm">
            Customers at risk
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-sm text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Profit Margin</p>
              <p className="text-3xl font-bold">34.8%</p>
            </div>
            <Target className="w-8 h-8 text-orange-200" />
          </div>
          <div className="mt-4 text-orange-100 text-sm">
            Optimized pricing impact
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sales Pipeline Analysis</h3>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gradient-to-br from-sanvi-primary-50 to-sanvi-primary-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-sanvi-primary-300 mx-auto mb-4" />
                <p className="text-sanvi-primary-700 font-medium">Interactive Sales Funnel</p>
                <p className="text-sm text-sanvi-primary-600">Lead → Quotation → Order conversion analysis</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Customer Segmentation</h3>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-green-700 font-medium">Customer Distribution</p>
                <p className="text-sm text-green-600">Retail • Wholesale • Distributor breakdown</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          gray-600">Conditions</p>
                      <p className="font-medium text-gray-900">{rule.conditions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Discount</p>
                      <p className="font-medium text-sanvi-secondary-500">{rule.discount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Applied Orders</p>
                      <p className="font-medium text-gray-900">{rule.appliedOrders}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Revenue Impact</p>
                      <p className="font-medium text-green-600">{formatCurrency(rule.revenue)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex space-x-2">
                    <button className="text-sanvi-primary-700 hover:text-sanvi-primary-900 text-sm">Edit</button>
                    <button className="text-gray-600 hover:text-gray-800 text-sm">Analytics</button>
                    <button className="text-red-600 hover:text-red-800 text-sm">Disable</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Recommendations</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Brain className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-900">Volume Discount Optimization</h4>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  AI suggests increasing volume discount threshold from 10 to 15 units for Cutting Machines to boost average order value.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600">Potential Revenue: +₹2.4L/month</span>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
                    Apply
                  </button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-900">Seasonal Pricing Alert</h4>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Construction season approaching. Consider activating 5% premium pricing for heavy machinery in March-May.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600">Historical Impact: +₹1.8L/quarter</span>
                  <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                    Schedule
                  </button>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  <h4 className="font-medium text-orange-900">Competitor Price Alert</h4>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  Competitor reduced prices on Welding Equipment by 8%. Review pricing strategy to maintain competitiveness.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-600">3 products affected</span>
                  <button className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700">
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Analytics Charts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pricing Performance Analytics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Discount Distribution Chart</p>
                <p className="text-sm text-gray-500">Interactive visualization coming soon</p>
              </div>
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Revenue Impact Timeline</p>
                <p className="text-sm text-gray-500">Interactive visualization coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const InventoryContent = () => (
    <div className="p-6">
      {/* Multi-Location Overview */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Multi-Location Inventory Management</h2>
          <p className="text-gray-600">Real-time inventory tracking across all warehouses</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={inventoryLocation}
            onChange={(e) => setInventoryLocation(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Locations</option>
            <option value="mumbai">Mumbai Warehouse</option>
            <option value="delhi">Delhi Distribution Center</option>
            <option value="chennai">Chennai Regional Hub</option>
          </select>
          <button className="bg-sanvi-primary-700 text-white px-4 py-2 rounded-lg hover:bg-sanvi-primary-900 transition-colors">
            Stock Transfer
          </button>
        </div>
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {inventoryData.map((location, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-sanvi-primary-700 mr-2" />
                  <h3 className="font-semibold text-gray-900">{location.location}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {location.lowStock > 0 && (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                  <span className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{location.products}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-sanvi-primary-700">{formatCurrency(location.totalValue)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Stock Items</span>
                  <span className={`text-sm font-medium ${location.lowStock > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {location.lowStock}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reorders Pending</span>
                  <span className="text-sm font-medium text-gray-900">{location.reorderPending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Transfers (In/Out)</span>
                  <span className="text-sm font-medium text-gray-900">
                    {location.transfersIn}/{location.transfersOut}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="flex-1 bg-sanvi-primary-700 text-white px-3 py-2 rounded text-sm hover:bg-sanvi-primary-900">
                    View Details
                  </button>
                  <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts & Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                  <div>
                    <p className="font-medium text-red-900">Critical Stock Level</p>
                    <p className="text-sm text-red-700">Heavy Duty Cutter - Mumbai (2 units left)</p>
                  </div>
                </div>
                <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
                  Reorder
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-yellow-900">Transfer Pending</p>
                    <p className="text-sm text-yellow-700">Welding System - Delhi to Chennai (5 units)</p>
                  </div>
                </div>
                <button className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700">
                  Track
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">Reorder Completed</p>
                    <p className="text-sm text-green-700">Drilling Machine - Mumbai (20 units received)</p>
                  </div>
                </div>
                <button className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700">
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Smart Inventory Insights</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Inventory Turnover Rate</span>
                  <span className="text-sm font-semibold text-sanvi-primary-700">4.2x</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-sanvi-primary-700 h-2 rounded-full" style={{width: '84%'}}></div>
                </div>
                <p className="text-