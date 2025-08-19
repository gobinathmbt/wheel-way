
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Shield, Users, BarChart3, Globe, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import section components
import HeroSection from '@/components/landing/HeroSection';
import PlatformSection from '@/components/landing/PlatformSection';
import InspectionSection from '@/components/landing/InspectionSection';
import TradeinSection from '@/components/landing/TradeinSection';
import AnalyticsSection from '@/components/landing/AnalyticsSection';
import EnterpriseSection from '@/components/landing/EnterpriseSection';

const Landing = () => {
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    { id: 'platform', title: 'Platform Overview', icon: Globe, component: PlatformSection },
    { id: 'inspection', title: 'Inspection Management', icon: Shield, component: InspectionSection },
    { id: 'tradein', title: 'Trade-in Appraisal', icon: Car, component: TradeinSection },
    { id: 'analytics', title: 'Analytics & Reporting', icon: BarChart3, component: AnalyticsSection },
    { id: 'enterprise', title: 'Enterprise Features', icon: Users, component: EnterpriseSection }
  ];

  const plans = [
    {
      name: 'Basic',
      price: '$99',
      period: '/month',
      users: '15 Users',
      features: [
        'Vehicle inspection management',
        'Basic reporting',
        'Email support',
        'Mobile app access',
        'Standard integrations'
      ],
      popular: false
    },
    {
      name: 'Intermediate',
      price: '$199',
      period: '/month',
      users: '30 Users',
      features: [
        'Everything in Basic',
        'Advanced analytics',
        'Priority support',
        'Custom workflows',
        'API access',
        'Multi-location support'
      ],
      popular: true
    },
    {
      name: 'Pro',
      price: '$399',
      period: '/month',
      users: '50 Users',
      features: [
        'Everything in Intermediate',
        'Custom UI requirements',
        'Dedicated account manager',
        'Advanced integrations',
        'White-label options',
        'Custom training'
      ],
      popular: false
    }
  ];

  const ActiveSectionComponent = sections[activeSection].component;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">VehiclePro</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register-company">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Carousel */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Solution</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore our platform's powerful features designed for the automotive industry
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Button
                  key={section.id}
                  variant={activeSection === index ? "default" : "outline"}
                  onClick={() => setActiveSection(index)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </Button>
              );
            })}
          </div>

          {/* Active Section Component */}
          <ActiveSectionComponent />
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Flexible pricing options to match your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <Badge variant="secondary" className="mb-6">
                    {plan.users}
                  </Badge>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-success mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register-company">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 gradient-primary">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto">
            Join thousands of automotive professionals who trust VehiclePro for their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register-company">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-foreground">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Car className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">VehiclePro</span>
              </div>
              <p className="text-muted-foreground">
                Enterprise vehicle management platform for the modern automotive industry.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Inspections</li>
                <li>Trade-ins</li>
                <li>Analytics</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>About</li>
                <li>Careers</li>
                <li>Contact</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Security</li>
                <li>Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 VehiclePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
