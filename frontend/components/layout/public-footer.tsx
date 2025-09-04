"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

interface FooterSection {
  title: string;
  links: Array<{
    href: string;
    label: string;
  }>;
}

const footerSections: FooterSection[] = [
  {
    title: "Products",
    links: [
      { href: "/products?category=cutting", label: "Cutting Machines" },
      { href: "/products?category=welding", label: "Welding Equipment" },
      { href: "/products?category=drilling", label: "Drilling Machines" },
      { href: "/products?category=press", label: "Press Machinery" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/services", label: "Services" },
      { href: "/contact", label: "Contact" },
      { href: "/support", label: "Support" },
    ],
  },
];

const contactInfo = [
  {
    icon: Mail,
    label: "info@sanvimachinery.com",
    href: "mailto:info@sanvimachinery.com",
  },
  {
    icon: Phone,
    label: "+91 98765 43210",
    href: "tel:+919876543210",
  },
  {
    icon: MapPin,
    label: "Mumbai, Maharashtra, India",
    href: "#",
  },
];

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="font-bold text-2xl">Sanvi Machinery</span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-lg">
              Leading provider of industrial machinery solutions for businesses worldwide.
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-xl mb-6">{section.title}</h3>
              <ul className="space-y-3 text-slate-400">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-white transition-colors text-lg"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-xl mb-6">Contact Info</h3>
            <div className="space-y-4 text-slate-400">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-center text-lg">
                  <info.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  {info.href.startsWith("#") ? (
                    <span>{info.label}</span>
                  ) : (
                    <a
                      href={info.href}
                      className="hover:text-white transition-colors"
                    >
                      {info.label}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
          <p className="text-lg">
            &copy; {new Date().getFullYear()} Sanvi Machinery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}