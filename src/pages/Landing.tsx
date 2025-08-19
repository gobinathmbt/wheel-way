
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Shield, Users, BarChart3, Globe, CheckCircle, ArrowRight, Star, Award, Zap, Clock, Heart, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

// Import section components
import HeroSection from '@/components/landing/HeroSection';
import ComprehensiveSolution from '@/components/landing/ComprehensiveSolution';
import PlatformSection from '@/components/landing/PlatformSection';
import InspectionSection from '@/components/landing/InspectionSection';
import TradeinSection from '@/components/landing/TradeinSection';
import AnalyticsSection from '@/components/landing/AnalyticsSection';
import EnterpriseSection from '@/components/landing/EnterpriseSection';

const Landing = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentStats, setCurrentStats] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStats((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
        'Standard integrations',
        '5GB storage',
        'Basic analytics'
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
        'Multi-location support',
        '50GB storage',
        'Advanced reporting',
        'Custom integrations'
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
        'Custom training',
        'Unlimited storage',
        'Enterprise security',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'John Smith',
      role: 'Fleet Manager',
      company: 'AutoCorp Solutions',
      content: 'VehiclePro has revolutionized our inspection process. We\'ve reduced processing time by 75% and increased accuracy significantly.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'
    },
    {
      name: 'Sarah Johnson',
      role: 'Operations Director',
      company: 'Premium Motors',
      content: 'The analytics dashboard gives us insights we never had before. Our ROI has improved by 40% since implementation.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108755-2616b332c371?w=80&h=80&fit=crop&crop=face'
    },
    {
      name: 'Michael Chen',
      role: 'CEO',
      company: 'DriveMax Enterprise',
      content: 'Outstanding platform with exceptional support. The team went above and beyond to customize it for our needs.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face'
    },
    {
      name: 'Lisa Rodriguez',
      role: 'Quality Manager',
      company: 'Reliable Auto Group',
      content: 'Quality control has never been easier. The automated workflows save us hours every day.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Vehicles Inspected Daily', icon: Car },
    { number: '500+', label: 'Enterprise Clients', icon: Users },
    { number: '99.9%', label: 'Uptime Guarantee', icon: Shield },
    { number: '75%', label: 'Time Reduction', icon: Clock },
    { number: '$2M+', label: 'Cost Savings Generated', icon: Target },
    { number: '24/7', label: 'Support Available', icon: Heart }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Enterprise-grade security with end-to-end encryption and compliance standards.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with sub-second response times and real-time updates.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Award,
      title: 'Industry Leading',
      description: 'Recognized by automotive industry experts and trusted by Fortune 500 companies.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      title: 'Global Scale',
      description: 'Multi-region deployment with support for international operations and compliance.',
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  const industries = [
    {
      name: 'Automotive Dealers',
      description: 'Streamline your dealership operations with comprehensive vehicle management.',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
      features: ['Inventory Management', 'Trade-in Processing', 'Customer Relations']
    },
    {
      name: 'Fleet Management',
      description: 'Optimize your fleet operations with real-time tracking and maintenance scheduling.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      features: ['Fleet Tracking', 'Maintenance Alerts', 'Cost Analysis']
    },
    {
      name: 'Insurance Companies',
      description: 'Accelerate claims processing with digital inspection and damage assessment.',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop',
      features: ['Claims Processing', 'Damage Assessment', 'Risk Analysis']
    },
    {
      name: 'Rental Companies',
      description: 'Manage your rental fleet with automated check-in/check-out processes.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
      features: ['Fleet Status', 'Damage Tracking', 'Revenue Analytics']
    }
  ];

  const ActiveSectionComponent = sections[activeSection].component;
  const CurrentStat = stats[currentStats];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              VehiclePro
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="hover-scale">Login</Button>
            </Link>
            <Link to="/register-company">
              <Button className="hover-scale">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="animate-fade-in">
        <HeroSection />
      </div>

      {/* Stats Section */}
      <section className="py-12 px-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-6 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index} 
                  className={`text-center hover-scale transition-all duration-500 ${
                    currentStats === index ? 'scale-105 border-primary shadow-lg' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Why Choose VehiclePro?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built for the modern automotive industry with cutting-edge technology and innovative features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover-scale transition-all duration-300 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <ComprehensiveSolution />

      {/* Industries Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Trusted Across Industries</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From automotive dealers to fleet management companies, VehiclePro adapts to your industry needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industries.map((industry, index) => (
              <Card key={index} className="group hover-scale transition-all duration-300 hover:shadow-xl overflow-hidden">
                <div 
                  className="h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundImage: `url(${industry.image})` }}
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{industry.name}</h3>
                  <p className="text-muted-foreground mb-4">{industry.description}</p>
                  <ul className="space-y-1">
                    {industry.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-xl text-muted-foreground">
              Hear from industry leaders who trust VehiclePro
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="hover-scale transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="text-lg font-semibold">{testimonials[currentTestimonial].name}</h4>
                    <p className="text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                    <p className="text-sm text-primary">{testimonials[currentTestimonial].company}</p>
                  </div>
                  <div className="ml-auto flex space-x-1">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-lg text-muted-foreground italic">
                  "{testimonials[currentTestimonial].content}"
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Flexible pricing options to match your business needs with transparent, no-hidden-fees pricing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative hover-scale transition-all duration-300 ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-pulse">
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
                      className="w-full hover-scale" 
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
      <section className="py-20 px-6 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="container mx-auto text-center text-white relative z-10">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto animate-fade-in">
            Join thousands of automotive professionals who trust VehiclePro for their operations.
            Start your free trial today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/register-company">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 hover-scale">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-foreground hover-scale">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Car className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">VehiclePro</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Enterprise vehicle management platform for the modern automotive industry. 
                Trusted by Fortune 500 companies worldwide.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline">SOC 2 Certified</Badge>
                <Badge variant="outline">ISO 27001</Badge>
                <Badge variant="outline">GDPR Compliant</Badge>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">Inspections</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Trade-ins</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Analytics</li>
                <li className="hover:text-primary cursor-pointer transition-colors">API</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Mobile Apps</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">About</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Contact</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Support</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Partners</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">Documentation</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Help Center</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Blog</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Webinars</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Case Studies</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-muted-foreground">
            <p>&copy; 2024 VehiclePro. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
