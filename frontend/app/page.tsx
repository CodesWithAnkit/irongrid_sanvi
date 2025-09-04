"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Users, Award, Truck } from "lucide-react";
import PublicLayout from "@/components/layout/public-layout";
import HeroSection from "@/components/ui/hero-section";
import SectionHeader from "@/components/ui/section-header";
import FeatureCard from "@/components/ui/feature-card";
import ProductCard from "@/components/ui/product-card";
import TestimonialCard from "@/components/ui/testimonial-card";
import CTASection from "@/components/ui/cta-section";
import StatsGrid from "@/components/ui/stats-grid";

export default function Home() {
  const features = [
    {
      icon: CheckCircle,
      title: "Premium Quality",
      description: "ISO certified machinery with international quality standards"
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "24/7 technical support and maintenance services"
    },
    {
      icon: Award,
      title: "30+ Years Experience",
      description: "Three decades of excellence in industrial machinery"
    },
    {
      icon: Truck,
      title: "Pan-India Delivery",
      description: "Fast and secure delivery across all major cities"
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      company: "ABC Manufacturing",
      rating: 5,
      text: "Sanvi Machinery has been our trusted partner for over 10 years. Their quality and service are unmatched."
    },
    {
      name: "Priya Sharma",
      company: "XYZ Industries",
      rating: 5,
      text: "The cutting machines we purchased have significantly improved our production efficiency. Highly recommended!"
    },
    {
      name: "Amit Patel",
      company: "PQR Engineering",
      rating: 5,
      text: "Excellent after-sales support and genuine spare parts availability. Great value for money."
    }
  ];

  const heroStats = [
    { value: "500+", label: "Happy Customers" },
    { value: "30+", label: "Years Experience" },
    { value: "50+", label: "Product Categories" },
    { value: "15+", label: "States Served" },
  ];

  const featuredProducts = [
    {
      name: "Heavy Duty Cutting Machine XZ-2000",
      price: 125000,
      category: "Cutting Machinery",
      description: "Professional grade cutting machine for industrial applications with precision controls and safety features."
    },
    {
      name: "Industrial Welding System WS-Pro",
      price: 89500,
      category: "Welding Equipment",
      description: "Advanced welding system with precision controls and automated features for consistent results."
    },
    {
      name: "Hydraulic Press HP-1000",
      price: 145000,
      category: "Press Machinery",
      description: "Heavy duty hydraulic press for manufacturing with high-pressure capabilities and safety systems."
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroSection
        title="Industrial Machinery"
        subtitle="That Powers Progress"
        description="Leading provider of premium industrial machinery with 30+ years of excellence. Trusted by 500+ manufacturers across India."
        actions={[
          {
            label: "Explore Products",
            href: "/products",
            icon: <ArrowRight className="w-6 h-6" />,
          },
          {
            label: "Get Free Quote",
            variant: "outline",
          },
        ]}
      >
        <StatsGrid stats={heroStats} columns={2} variant="hero" />
      </HeroSection>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Why Choose Sanvi Machinery?"
            description="Experience the difference with our premium industrial solutions"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Featured Products"
            description="Discover our most popular industrial machinery"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={index}
                name={product.name}
                price={product.price}
                category={product.category}
                description={product.description}
                onGetQuote={() => console.log(`Get quote for ${product.name}`)}
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold">
                View All Products
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="What Our Customers Say"
            description="Trusted by manufacturers across India"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                company={testimonial.company}
                rating={testimonial.rating}
                text={testimonial.text}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection
        title="Ready to Upgrade Your Manufacturing?"
        description="Get a free consultation and discover how our machinery can boost your productivity and transform your operations"
        actions={[
          {
            label: "Request Free Consultation",
          },
          {
            label: "Download Catalog",
            variant: "outline",
          },
        ]}
      />
      </PublicLayout>
  );
}

