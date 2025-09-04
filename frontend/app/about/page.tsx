"use client";

import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/public-layout";
import PageHeader from "@/components/ui/page-header";
import SectionHeader from "@/components/ui/section-header";
import FeatureCard from "@/components/ui/feature-card";
import StatsGrid from "@/components/ui/stats-grid";
import { CheckCircle, Eye, Zap } from "lucide-react";

export default function AboutPage() {
  const companyStats = [
    { value: "30+", label: "Years of Experience" },
    { value: "500+", label: "Satisfied Customers" },
    { value: "50+", label: "Product Categories" },
    { value: "15+", label: "States Served" },
  ];

  return (
    <PublicLayout>
      {/* Page Header */}
      <PageHeader
        title="About Sanvi Machinery"
        description="Leading the industrial machinery revolution with innovative solutions, exceptional quality, and unmatched customer service since 1995."
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">

        {/* Company Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Founded in 1995, Sanvi Machinery began as a small workshop with a big vision: 
                to provide Indian manufacturers with world-class industrial machinery that could 
                compete on a global scale.
              </p>
              <p>
                Over the past three decades, we have grown from a local supplier to a trusted 
                partner for businesses across India and beyond. Our commitment to innovation, 
                quality, and customer satisfaction has made us a leader in the industrial 
                machinery sector.
              </p>
              <p>
                Today, we serve over 500+ satisfied customers across various industries, 
                from small workshops to large manufacturing facilities, providing them with 
                the tools they need to succeed in an increasingly competitive market.
              </p>
            </div>
          </div>
          <div className="bg-gray-200 rounded-lg flex items-center justify-center h-96">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500">Company image placeholder</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Our Mission</h3>
            </div>
            <p className="text-slate-600 text-center leading-relaxed">
              To empower Indian manufacturers with cutting-edge industrial machinery 
              that enhances productivity, ensures quality, and drives sustainable growth 
              in the global marketplace.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Our Vision</h3>
            </div>
            <p className="text-slate-600 text-center leading-relaxed">
              To be the most trusted and innovative industrial machinery provider in India, 
              setting new standards for quality, service, and technological advancement 
              in the manufacturing sector.
            </p>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-xl p-12 mb-16">
          <SectionHeader
            title="Our Impact"
            className="text-white mb-8"
          />
          <StatsGrid stats={companyStats} columns={4} variant="hero" />
        </div>

        {/* Values */}
        <div className="mb-16">
          <SectionHeader
            title="Our Values"
            description="The principles that guide everything we do"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={CheckCircle}
              title="Quality First"
              description="We never compromise on quality. Every machine we sell meets the highest international standards and comes with comprehensive warranties."
              iconColor="text-green-600"
            />
            <FeatureCard
              icon={CheckCircle}
              title="Customer Focus"
              description="Our customers are at the heart of everything we do. We provide personalized solutions and ongoing support to ensure their success."
              iconColor="text-blue-600"
            />
            <FeatureCard
              icon={Zap}
              title="Innovation"
              description="We continuously invest in research and development to bring the latest technological advancements to our customers."
              iconColor="text-purple-600"
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Ready to Partner with Us?</h2>
          <p className="text-slate-600 mb-8 text-lg max-w-2xl mx-auto">
            Join hundreds of satisfied customers who trust Sanvi Machinery for their industrial needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-teal-600 hover:bg-teal-700 text-lg px-8 py-3">
              Get Started
            </Button>
            <Button variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50 text-lg px-8 py-3">
              Contact Our Team
            </Button>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}