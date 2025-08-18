
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Car, Shield, Users, Zap, Globe, BarChart3, CheckCircle, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  const sections = [
    {
      id: 'platform',
      title: 'Platform Overview',
      icon: Globe,
      slides: [
        {
          title: 'Enterprise Vehicle Management',
          content: 'Comprehensive platform for vehicle trade-in and inspection management across multiple companies.',
          image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop'
        },
        {
          title: 'Multi-Role Access Control',
          content: 'Sophisticated role-based permissions for master admins, company admins, and super admins.',
          image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop'
        },
        {
          title: 'Scalable Architecture',
          content: 'Built to handle thousands of vehicles and users with enterprise-grade performance.',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop'
        },
        {
          title: 'Real-time Analytics',
          content: 'Live dashboards and reporting for complete visibility into your operations.',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
        },
        {
          title: 'API Integration',
          content: 'Seamless integration with existing systems through robust APIs and webhooks.',
          image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=400&fit=crop'
        },
        {
          title: 'Mobile Ready',
          content: 'Native mobile applications for field inspections and real-time updates.',
          image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop'
        },
        {
          title: 'Cloud Infrastructure',
          content: 'Secure, scalable cloud hosting with 99.9% uptime guarantee.',
          image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop'
        },
        {
          title: 'Data Security',
          content: 'Enterprise-grade security with encryption and compliance standards.',
          image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop'
        },
        {
          title: 'Workflow Automation',
          content: 'Automated processes for inspection scheduling and notification management.',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'
        },
        {
          title: 'Global Support',
          content: '24/7 customer support and dedicated account management for enterprise clients.',
          image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop'
        }
      ]
    },
    {
      id: 'inspection',
      title: 'Inspection Management',
      icon: Shield,
      slides: [
        {
          title: 'Digital Inspection Forms',
          content: 'Customizable digital forms with photo capture and condition scoring.',
          image: 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=800&h=400&fit=crop'
        },
        {
          title: 'Quality Assurance',
          content: 'Multi-level review process ensuring consistent inspection standards.',
          image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=400&fit=crop'
        },
        {
          title: 'Photo Documentation',
          content: 'High-resolution photo capture with automatic compression and cloud storage.',
          image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&h=400&fit=crop'
        },
        {
          title: 'Damage Assessment',
          content: 'Advanced damage detection and cost estimation algorithms.',
          image: 'https://images.unsplash.com/photo-1625047509252-8ec7f8090e37?w=800&h=400&fit=crop'
        },
        {
          title: 'Inspector Tracking',
          content: 'Real-time location tracking and performance monitoring for field inspectors.',
          image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop'
        },
        {
          title: 'Report Generation',
          content: 'Automated report generation with customizable templates and branding.',
          image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop'
        },
        {
          title: 'Condition Scoring',
          content: 'Standardized scoring system for consistent vehicle condition assessment.',
          image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop'
        },
        {
          title: 'Compliance Tracking',
          content: 'Regulatory compliance monitoring and audit trail maintenance.',
          image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop'
        },
        {
          title: 'Time Optimization',
          content: 'Efficient scheduling and routing for maximum inspector productivity.',
          image: 'https://images.unsplash.com/photo-1508780709619-79562169bc64?w=800&h=400&fit=crop'
        },
        {
          title: 'Integration APIs',
          content: 'Seamless integration with existing dealer management systems.',
          image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop'
        }
      ]
    },
    {
      id: 'tradein',
      title: 'Trade-in Appraisal',
      icon: Car,
      slides: [
        {
          title: 'Market Valuation',
          content: 'Real-time market data integration for accurate vehicle pricing.',
          image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=400&fit=crop'
        },
        {
          title: 'Instant Quotes',
          content: 'Generate competitive trade-in offers in seconds based on market data.',
          image: 'https://images.unsplash.com/photo-1549399478-8861d2a3ba95?w=800&h=400&fit=crop'
        },
        {
          title: 'Condition Factors',
          content: 'Advanced algorithms considering condition, mileage, and market demand.',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=400&fit=crop'
        },
        {
          title: 'Historical Analytics',
          content: 'Track pricing trends and market performance over time.',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
        },
        {
          title: 'Negotiation Tools',
          content: 'Built-in tools for transparent and efficient price negotiations.',
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop'
        },
        {
          title: 'Document Management',
          content: 'Secure storage and processing of vehicle documentation.',
          image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop'
        },
        {
          title: 'Customer Portal',
          content: 'Self-service portal for customers to track their trade-in process.',
          image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop'
        },
        {
          title: 'Auction Integration',
          content: 'Direct integration with major automotive auction platforms.',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop'
        },
        {
          title: 'Finance Options',
          content: 'Integrated financing options and payment processing.',
          image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop'
        },
        {
          title: 'ROI Tracking',
          content: 'Comprehensive analytics on trade-in program profitability.',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reporting',
      icon: BarChart3,
      slides: [
        {
          title: 'Executive Dashboards',
          content: 'High-level KPIs and metrics for strategic decision making.',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
        },
        {
          title: 'Performance Metrics',
          content: 'Detailed performance tracking for inspectors and appraisers.',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'
        },
        {
          title: 'Revenue Analytics',
          content: 'Comprehensive revenue analysis and forecasting tools.',
          image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop'
        },
        {
          title: 'Custom Reports',
          content: 'Build custom reports with drag-and-drop interface.',
          image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop'
        },
        {
          title: 'Predictive Analytics',
          content: 'AI-powered insights for market trends and demand forecasting.',
          image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=400&fit=crop'
        },
        {
          title: 'Operational Insights',
          content: 'Deep dive into operational efficiency and process optimization.',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
        },
        {
          title: 'Market Intelligence',
          content: 'Competitive analysis and market positioning insights.',
          image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop'
        },
        {
          title: 'Risk Assessment',
          content: 'Automated risk scoring and fraud detection systems.',
          image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop'
        },
        {
          title: 'Export & API',
          content: 'Flexible data export options and API access for custom integrations.',
          image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=400&fit=crop'
        },
        {
          title: 'Real-time Updates',
          content: 'Live data feeds and instant notification systems.',
          image: 'https://images.unsplash.com/photo-1508780709619-79562169bc64?w=800&h=400&fit=crop'
        }
      ]
    },
    {
      id: 'enterprise',
      title: 'Enterprise Features',
      icon: Users,
      slides: [
        {
          title: 'Multi-tenancy',
          content: 'Secure isolation between companies with shared infrastructure.',
          image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=400&fit=crop'
        },
        {
          title: 'White Labeling',
          content: 'Complete branding customization for your company identity.',
          image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=400&fit=crop'
        },
        {
          title: 'SSO Integration',
          content: 'Single sign-on with Active Directory and SAML support.',
          image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop'
        },
        {
          title: 'API Management',
          content: 'Enterprise-grade API gateway with rate limiting and monitoring.',
          image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=400&fit=crop'
        },
        {
          title: 'Compliance Suite',
          content: 'Built-in compliance tools for automotive industry regulations.',
          image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop'
        },
        {
          title: 'Advanced Security',
          content: 'End-to-end encryption and advanced threat protection.',
          image: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=400&fit=crop'
        },
        {
          title: 'Backup & Recovery',
          content: 'Automated backups and disaster recovery procedures.',
          image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop'
        },
        {
          title: 'Training & Support',
          content: 'Comprehensive training programs and dedicated support teams.',
          image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'
        },
        {
          title: 'Custom Development',
          content: 'Tailored solutions and custom feature development services.',
          image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop'
        },
        {
          title: 'Implementation',
          content: 'End-to-end implementation services with dedicated project managers.',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
        }
      ]
    }
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

  const nextSlide = () => {
    setActiveSlide((prev) => 
      prev === sections[activeSection].slides.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setActiveSlide((prev) => 
      prev === 0 ? sections[activeSection].slides.length - 1 : prev - 1
    );
  };

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
      <section className="py-20 px-6 gradient-hero text-white">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            Enterprise Vehicle Management Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Transform Your Vehicle
            <br />
            <span className="text-accent">Operations</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/80 max-w-3xl mx-auto">
            Complete platform for vehicle inspections, trade-in appraisals, and fleet management 
            with enterprise-grade security and scalability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register-company">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-foreground">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

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
                  onClick={() => {
                    setActiveSection(index);
                    setActiveSlide(0);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </Button>
              );
            })}
          </div>

          {/* Slide Display */}
          <Card className="overflow-hidden automotive-shadow">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0 min-h-[400px]">
                <div className="p-8 flex flex-col justify-center">
                  <Badge variant="outline" className="mb-4 w-fit">
                    {sections[activeSection].title}
                  </Badge>
                  <h3 className="text-3xl font-bold mb-4">
                    {sections[activeSection].slides[activeSlide].title}
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    {sections[activeSection].slides[activeSlide].content}
                  </p>
                  
                  {/* Slide Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {sections[activeSection].slides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveSlide(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === activeSlide ? 'bg-primary' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={prevSlide}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={nextSlide}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div 
                  className="bg-cover bg-center min-h-[300px] md:min-h-full"
                  style={{ 
                    backgroundImage: `url(${sections[activeSection].slides[activeSlide].image})` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
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
