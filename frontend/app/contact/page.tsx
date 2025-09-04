"use client";

import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Send, ArrowRight } from "lucide-react";
import PublicLayout from "@/components/layout/public-layout";
import PageHeader from "@/components/ui/page-header";
import CTASection from "@/components/ui/cta-section";

export default function ContactPage() {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Our Showroom",
      details: [
        "123 Industrial Estate, Andheri East",
        "Mumbai, Maharashtra 400069",
        "India"
      ]
    },
    {
      icon: Phone,
      title: "Call Us",
      details: [
        "+91 98765 43210",
        "+91 22 2834 5678",
        "Toll Free: 1800 123 4567"
      ]
    },
    {
      icon: Mail,
      title: "Email Us",
      details: [
        "info@sanvimachinery.com",
        "sales@sanvimachinery.com",
        "support@sanvimachinery.com"
      ]
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: [
        "Monday - Friday: 9:00 AM - 6:00 PM",
        "Saturday: 9:00 AM - 2:00 PM",
        "Sunday: Closed"
      ]
    }
  ];

  return (
    <PublicLayout>
      {/* Page Header */}
      <PageHeader
        title="Contact Us"
        description="Ready to discuss your industrial machinery needs? Get in touch with our expert team for personalized solutions and competitive pricing."
        actions={
          <>
            <Button 
              size="lg" 
              className="bg-white text-teal-600 hover:bg-slate-100 font-semibold"
            >
              Get Free Quote
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-teal-600 font-semibold"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call Now
            </Button>
          </>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 text-center border border-slate-200">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <info.icon className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-4">{info.title}</h3>
              <div className="space-y-2">
                {info.details.map((detail, idx) => (
                  <p key={idx} className="text-slate-600">{detail}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-8">Send Us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="product-inquiry">Product Inquiry</option>
                  <option value="quotation-request">Quotation Request</option>
                  <option value="technical-support">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Tell us about your requirements..."
                ></textarea>
              </div>

              <div className="flex items-center">
                <input
                  id="newsletter"
                  name="newsletter"
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
                  Subscribe to our newsletter for product updates and industry insights
                </label>
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-3">
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Map and Additional Info */}
          <div className="space-y-6">
            {/* Map Placeholder */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Find Us</h3>
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-600">Interactive Map</p>
                  <p className="text-slate-500">123 Industrial Estate, Andheri East, Mumbai</p>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" className="w-full border-teal-600 text-teal-600 hover:bg-teal-50">
                  Get Directions
                </Button>
              </div>
            </div>

            {/* Quick Contact */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-8 text-white shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Need Immediate Assistance?</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">Call Now</p>
                    <p className="text-teal-100">+91 98765 43210</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">Email Us</p>
                    <p className="text-teal-100">info@sanvimachinery.com</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-teal-700">
                  Schedule a Call
                </Button>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">What is your delivery time?</h4>
                  <p className="text-sm text-gray-600">Standard delivery is 7-14 business days for in-stock items.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Do you provide installation?</h4>
                  <p className="text-sm text-gray-600">Yes, we provide complete installation and training services.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">What warranty do you offer?</h4>
                  <p className="text-sm text-gray-600">All our machines come with 1-2 years comprehensive warranty.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <CTASection
          title="Ready to Get Started?"
          description="Our team of experts is ready to help you find the perfect machinery solution for your business."
          actions={[
            {
              label: "Request Free Consultation",
            },
            {
              label: "Download Product Catalog",
              variant: "outline",
            },
          ]}
          className="mt-20"
        />
      </main>
    </PublicLayout>
  );
}