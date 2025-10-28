import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Truck, Users, Smartphone, Clock, CheckCircle, Star, Download, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePerformance } from '@/hooks/usePerformance';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Lazy load the background image with low quality placeholder
const templeBg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjRkFGOUY2Ii8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0E5QjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5KQURBWVUgU21hcnQgUmF0aW9uIFN5c3RlbTwvdGV4dD4KPC9zdmc+';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { metrics, logPerformance } = usePerformance();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Log performance metrics on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      logPerformance();
    }, 2000);

    return () => clearTimeout(timer);
  }, [logPerformance]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Secure & Verified",
      description: "Government-verified ration card system with Aadhaar integration"
    },
    {
      icon: <Truck className="w-8 h-8 text-primary" />,
      title: "Doorstep Delivery",
      description: "Get your ration delivered directly to your home"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-primary" />,
      title: "Digital QR System",
      description: "Contactless verification with QR codes for safe delivery"
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Real-time Tracking",
      description: "Track your orders in real-time with live updates"
    }
  ];

  const benefits = [
    "Subsidized rates for eligible beneficiaries",
    "Multiple ration card types supported (AAY, PHH, etc.)",
    "Easy document upload and verification",
    "24/7 customer support",
    "Offline-capable for low connectivity areas"
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Beneficiary",
      content: "JADAYU has made getting ration so much easier. No more standing in long queues!",
      rating: 5
    },
    {
      name: "Rajesh Kumar",
      role: "Delivery Partner",
      content: "Great platform for delivery partners. Easy to use and reliable payments.",
      rating: 5
    },
    {
      name: "Anita Devi",
      role: "Shop Owner",
      content: "Managing inventory and orders has never been this simple. Highly recommended!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative h-screen bg-cover bg-center"
        style={{ backgroundImage: `url(${templeBg})` }}
      >
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />

        {/* Top Navigation Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Language Switcher for Landing Page */}
            <LanguageSwitcher />
          </div>

          {/* Connection Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isOnline
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? 'Online' : 'Offline Mode'}
          </div>
        </div>

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
              🏛️ Government Approved • Aadhaar Verified
            </Badge>

            <h1 className="text-6xl md:text-7xl font-extrabold mb-6 heading-premium leading-tight">
              JADAYU
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              Smart Ration Delivery System
            </p>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Traditional values meet modern technology. Get your entitled ration delivered safely to your doorstep with our secure, government-verified platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="gradient-gold hover:opacity-90 text-lg px-8 py-6 shadow-premium"
                onClick={() => navigate('/auth')}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2 hover:bg-primary hover:text-primary-foreground"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10K+</div>
                <div className="text-muted-foreground">Happy Families</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Delivery Partners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 heading-premium">
              Why Choose JADAYU?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of ration distribution with our comprehensive digital platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-premium transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 heading-premium">
                Your Benefits
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-lg text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="shadow-premium border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Supported Ration Cards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-100 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                      <div className="font-semibold">AAY (Yellow)</div>
                      <div className="text-sm text-muted-foreground">Antyodaya</div>
                    </div>
                    <div className="text-center p-4 bg-pink-100 rounded-lg">
                      <div className="w-8 h-8 bg-pink-500 rounded-full mx-auto mb-2"></div>
                      <div className="font-semibold">PHH (Pink)</div>
                      <div className="text-sm text-muted-foreground">Priority Household</div>
                    </div>
                    <div className="text-center p-4 bg-blue-100 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                      <div className="font-semibold">Blue</div>
                      <div className="text-sm text-muted-foreground">Non-Priority</div>
                    </div>
                    <div className="text-center p-4 bg-gray-100 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 border rounded-full mx-auto mb-2"></div>
                      <div className="font-semibold">White</div>
                      <div className="text-sm text-muted-foreground">Non-Subsidy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 heading-premium">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Real experiences from our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-premium transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 heading-premium">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of families who trust JADAYU for their ration needs.
            Sign up today and experience the difference.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="gradient-gold hover:opacity-90 text-lg px-8 py-6 shadow-premium"
              onClick={() => navigate('/auth')}
            >
              Sign Up Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Free to use
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No hidden fees
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Government approved
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 heading-premium">JADAYU</h3>
              <p className="text-muted-foreground mb-4">
                Smart Ration Delivery System for modern India
              </p>
              <div className="flex gap-4">
                <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                  isOnline
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Offline Ready'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/auth" className="hover:text-primary">Ration Delivery</Link></li>
                <li><Link to="/auth" className="hover:text-primary">QR Verification</Link></li>
                <li><Link to="/auth" className="hover:text-primary">Order Tracking</Link></li>
                <li><Link to="/auth" className="hover:text-primary">Document Upload</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                <li><a href="#" className="hover:text-primary">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Government</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">NFSA Guidelines</a></li>
                <li><a href="#" className="hover:text-primary">Aadhaar Integration</a></li>
                <li><a href="#" className="hover:text-primary">Ration Card Types</a></li>
                <li><a href="#" className="hover:text-primary">Eligibility Check</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 JADAYU. All rights reserved. | Government of India Initiative</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
