"use client";

import { Button } from "@/components/ui/button";
import {
    Wrench,
    Truck,
    GraduationCap,
    Shield,
    Clock,
    CheckCircle,
    Phone,
    Mail,
    ArrowRight,
    Settings,
    Users,
    Award
} from "lucide-react";
import PublicLayout from "@/components/layout/public-layout";
import PageHeader from "@/components/ui/page-header";
import SectionHeader from "@/components/ui/section-header";
import FeatureCard from "@/components/ui/feature-card";
import CTASection from "@/components/ui/cta-section";

const services = [
    {
        icon: Wrench,
        title: "Equipment Maintenance & Repair",
        description: "Comprehensive maintenance and repair services for all types of industrial machinery and equipment.",
        features: [
            "Preventive maintenance programs",
            "Emergency repair services",
            "Parts replacement and sourcing",
            "Performance optimization"
        ]
    },
    {
        icon: Settings,
        title: "Custom Manufacturing Solutions",
        description: "Tailored manufacturing solutions designed to meet your specific industrial requirements.",
        features: [
            "Custom machinery design",
            "Prototype development",
            "Production line setup",
            "Quality assurance testing"
        ]
    },
    {
        icon: Truck,
        title: "Equipment Installation & Setup",
        description: "Professional installation and setup services ensuring optimal performance from day one.",
        features: [
            "Site preparation and planning",
            "Professional installation",
            "System integration",
            "Performance testing"
        ]
    },
    {
        icon: GraduationCap,
        title: "Training & Consultation",
        description: "Expert training programs and consultation services to maximize your team's efficiency.",
        features: [
            "Operator training programs",
            "Safety protocol training",
            "Technical consultation",
            "Process optimization"
        ]
    },
    {
        icon: Shield,
        title: "Quality Assurance & Testing",
        description: "Rigorous quality assurance and testing services to ensure reliability and performance.",
        features: [
            "Quality control inspections",
            "Performance testing",
            "Compliance verification",
            "Certification assistance"
        ]
    },
    {
        icon: Users,
        title: "Technical Support",
        description: "24/7 technical support to keep your operations running smoothly without interruption.",
        features: [
            "24/7 helpdesk support",
            "Remote diagnostics",
            "On-site technical visits",
            "Emergency response team"
        ]
    }
];

const processSteps = [
    {
        step: "01",
        title: "Consultation",
        description: "We analyze your requirements and provide expert recommendations."
    },
    {
        step: "02",
        title: "Planning",
        description: "Detailed project planning with timelines and resource allocation."
    },
    {
        step: "03",
        title: "Implementation",
        description: "Professional execution with regular progress updates."
    },
    {
        step: "04",
        title: "Support",
        description: "Ongoing support and maintenance to ensure optimal performance."
    }
];

export default function ServicesPage() {
    return (
        <PublicLayout>
            {/* Page Header */}
            <PageHeader
                title="Our Services"
                description="Comprehensive industrial machinery solutions tailored to your business needs"
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

            {/* Services Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <SectionHeader
                        title="What We Offer"
                        description="From equipment maintenance to custom manufacturing solutions, we provide comprehensive services to keep your operations running at peak efficiency."
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8 border border-slate-200"
                            >
                                <div className="flex items-center mb-6">
                                    <div className="bg-teal-100 p-3 rounded-lg mr-4">
                                        <service.icon className="h-8 w-8 text-teal-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        {service.title}
                                    </h3>
                                </div>

                                <p className="text-slate-600 mb-6">
                                    {service.description}
                                </p>

                                <ul className="space-y-3">
                                    {service.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-center text-slate-700">
                                            <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700"
                                >
                                    Learn More
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <SectionHeader
                        title="Our Process"
                        description="We follow a proven methodology to ensure successful project delivery and customer satisfaction."
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processSteps.map((step, index) => (
                            <div key={index} className="text-center">
                                <div className="bg-teal-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    {step.step}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-slate-600">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <SectionHeader
                            title="Why Choose Sanvi Machinery?"
                            description="With decades of experience and a commitment to excellence, we're your trusted partner for industrial machinery solutions."
                        />

                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={Award}
                                title="25+ Years Experience"
                                description="Decades of expertise in industrial machinery and manufacturing solutions."
                            />
                            <FeatureCard
                                icon={Clock}
                                title="24/7 Support"
                                description="Round-the-clock technical support to keep your operations running smoothly."
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Quality Guaranteed"
                                description="All our services come with comprehensive warranties and quality assurance."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <CTASection
                title="Ready to Get Started?"
                description="Contact us today to discuss your industrial machinery needs and discover how we can help optimize your operations."
                actions={[
                    {
                        label: "Get Free Quote",
                        icon: <Mail className="h-5 w-5" />,
                    },
                    {
                        label: "Call Now: +91 98765 43210",
                        variant: "outline",
                        icon: <Phone className="h-5 w-5" />,
                    },
                ]}
            />
        </PublicLayout>
    );
}