"use client";

import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/public-layout";
import PageHeader from "@/components/ui/page-header";
import ProductCard from "@/components/ui/product-card";
import CTASection from "@/components/ui/cta-section";
import { ArrowRight, Phone } from "lucide-react";

export default function PublicProductsPage() {
    const products = [
        {
            id: 1,
            name: 'Heavy Duty Cutting Machine XZ-2000',
            category: 'Cutting Machinery',
            price: 125000,
            image: '/placeholder-product.jpg',
            description: 'Professional grade cutting machine for industrial applications'
        },
        {
            id: 2,
            name: 'Industrial Welding System WS-Pro',
            category: 'Welding Equipment',
            price: 89500,
            image: '/placeholder-product.jpg',
            description: 'Advanced welding system with precision controls'
        },
        {
            id: 3,
            name: 'Precision Drilling Machine PD-500',
            category: 'Drilling Equipment',
            price: 67000,
            image: '/placeholder-product.jpg',
            description: 'High precision drilling for various materials'
        },
        {
            id: 4,
            name: 'Hydraulic Press HP-1000',
            category: 'Press Machinery',
            price: 145000,
            image: '/placeholder-product.jpg',
            description: 'Heavy duty hydraulic press for manufacturing'
        }
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <PublicLayout>
            {/* Page Header */}
            <PageHeader
                title="Industrial Machinery"
                description="Discover our range of high-quality industrial machinery for your business needs"
                actions={
                    <>
                        <Button 
                            size="lg" 
                            className="bg-white text-teal-600 hover:bg-slate-100 font-semibold"
                        >
                            Get Quote
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            className="border-white text-white hover:bg-white hover:text-teal-600 font-semibold"
                        >
                            <Phone className="mr-2 h-5 w-5" />
                            Contact Us
                        </Button>
                    </>
                }
            />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-16">

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
                    <div className="flex flex-wrap gap-4">
                        <select className="px-3 py-2 border border-gray-300 rounded-md">
                            <option>All Categories</option>
                            <option>Cutting Machinery</option>
                            <option>Welding Equipment</option>
                            <option>Drilling Equipment</option>
                            <option>Press Machinery</option>
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded-md">
                            <option>Price Range</option>
                            <option>Under ₹50,000</option>
                            <option>₹50,000 - ₹1,00,000</option>
                            <option>₹1,00,000 - ₹2,00,000</option>
                            <option>Above ₹2,00,000</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-[200px]"
                        />
                        <Button variant="outline">Search</Button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            name={product.name}
                            price={product.price}
                            category={product.category}
                            description={product.description}
                            onViewDetails={() => console.log(`View details for ${product.name}`)}
                            onGetQuote={() => console.log(`Get quote for ${product.name}`)}
                        />
                    ))}
                </div>

                {/* Call to Action */}
                <CTASection
                    title="Need Custom Machinery?"
                    description="Contact our experts for customized industrial solutions tailored to your specific requirements."
                    actions={[
                        {
                            label: "Request Consultation",
                        },
                        {
                            label: "Download Catalog",
                            variant: "outline",
                        },
                    ]}
                    className="mt-16"
                />
            </main>
        </PublicLayout>
    );
}