// Company Information
export const COMPANY_INFO = {
    name: 'Sanvi Machinery',
    tagline: 'Industrial Machinery That Powers Progress',
    description: 'Leading provider of premium industrial machinery with 30+ years of excellence. Trusted by 500+ manufacturers across India.',
    email: 'info@sanvimachinery.com',
    phone: '+91 98765 43210',
    address: {
        street: '123 Industrial Estate, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        country: 'India',
    },
    social: {
        linkedin: '#',
        twitter: '#',
        facebook: '#',
        instagram: '#',
    },
} as const;

// Navigation Items
export const NAVIGATION_ITEMS = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
] as const;

// Product Categories
export const PRODUCT_CATEGORIES = [
    { id: 'cutting', name: 'Cutting Machinery', description: 'Precision cutting machines for various materials' },
    { id: 'welding', name: 'Welding Equipment', description: 'Professional welding systems and accessories' },
    { id: 'drilling', name: 'Drilling Equipment', description: 'High-precision drilling machines' },
    { id: 'press', name: 'Press Machinery', description: 'Heavy-duty hydraulic and mechanical presses' },
    { id: 'grinding', name: 'Grinding Machines', description: 'Surface and cylindrical grinding equipment' },
    { id: 'lathe', name: 'Lathe Machines', description: 'CNC and conventional lathe machines' },
] as const;

// Company Statistics
export const COMPANY_STATS = [
    { value: '30+', label: 'Years Experience', description: 'Decades of industry expertise' },
    { value: '500+', label: 'Happy Customers', description: 'Satisfied clients across India' },
    { value: '50+', label: 'Product Categories', description: 'Comprehensive machinery range' },
    { value: '15+', label: 'States Served', description: 'Pan-India presence' },
] as const;

// Service Areas
export const SERVICE_AREAS = [
    'Equipment Maintenance & Repair',
    'Custom Manufacturing Solutions',
    'Equipment Installation & Setup',
    'Training & Consultation',
    'Quality Assurance & Testing',
    'Technical Support',
] as const;

// Business Hours
export const BUSINESS_HOURS = {
    weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM',
    saturday: 'Saturday: 9:00 AM - 2:00 PM',
    sunday: 'Sunday: Closed',
} as const;