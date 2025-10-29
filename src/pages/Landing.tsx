import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Star, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import templeBg from '@/assets/temple-bg.jpg';

// Features data
const features = [
  {
    icon: <CheckCircle className="w-8 h-8 text-green-500" />,
    title: "Aadhaar Verification",
    description: "Secure biometric and OTP-based verification for government compliance"
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-blue-500" />,
    title: "Real-time Tracking",
    description: "GPS-enabled delivery tracking with SMS notifications"
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-yellow-500" />,
    title: "QR Code Validation",
    description: "QR-based ration distribution with instant beneficiary confirmation"
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-purple-500" />,
    title: "Multi-language Support",
    description: "Available in 10+ regional languages for better accessibility"
  }
];

// Benefits data
const benefits = [
  "Doorstep delivery within 24 hours",
  "Transparent pricing with no hidden charges",
  "Government-subsidized rates maintained",
  "Quality assurance for all delivered items",
  "Emergency ration delivery options",
  "Digital receipts and transaction history"
];

// Testimonials data
const testimonials = [
  {
    name: "Priya Sharma",
    role: "Housewife",
    rating: 5,
    content: "JADAYU has made ration shopping so convenient. No more standing in long queues and the quality is amazing."
  },
  {
    name: "Rajesh Kumar",
    role: "Daily Wage Worker",
    rating: 5,
    content: "The delivery is always on time, and the verification process is smooth. Great government initiative!"
  },
  {
    name: "Sunita Patel",
    role: "Teacher",
    rating: 5,
    content: "As a working mother, this service saves me so much time. The real-time tracking gives me peace of mind."
  }
];

const Landing = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return (
    <>
      {/* Hero Section */}
      <div
        className="relative min-h-screen bg-cover bg-center flex items-center overflow-hidden"
        style={{ backgroundImage: `url(${templeBg})` }}
      >
        {/* Animated background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-primary/10" />

        {/* Top Navigation Bar */}
        <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>

          {/* Connection Status Indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            isOnline
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
            <span className="sm:hidden">{isOnline ? '🟢' : '🔴'}</span>
          </div>
        </div>

        <div className="relative container mx-auto px-6 h-full flex items-center">
          <div className="max-w-5xl mx-auto text-center">
            <Badge
              variant="secondary"
              className="mb-6 px-6 py-3 text-base font-medium shadow-lg hover:shadow-premium transition-all duration-300 animate-fade-in"
            >
              🏛️ Government Approved • Aadhaar Verified • NFSA Certified
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black mb-6 heading-premium leading-tight animate-fade-in-up animation-delay-200">
              JADAYU
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto font-medium animate-fade-in-up animation-delay-400">
              Smart Ration Delivery System
            </p>

            <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-600">
              Bridging traditional values with cutting-edge technology. Experience secure, government-verified ration delivery that brings India's essential commodities right to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up animation-delay-800">
              <Button
                size="lg"
                className="gradient-gold hover:scale-105 transform transition-all duration-300 text-lg px-10 py-8 shadow-premium hover:shadow-gold w-full sm:w-auto group"
                onClick={() => navigate('/auth')}
              >
                Start Your Journey
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="text-lg px-10 py-8 border-2 hover:bg-primary hover:text-white transition-all duration-300 w-full sm:w-auto hover:scale-105"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-1000">
              <div className="text-center group">
                <div className="text-4xl font-bold text-primary mb-3 group-hover:scale-110 transition-transform duration-300">10K+</div>
                <div className="text-base text-muted-foreground font-medium">Happy Families</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold text-primary mb-3 group-hover:scale-110 transition-transform duration-300">500+</div>
                <div className="text-base text-muted-foreground font-medium">Delivery Partners</div>
              </div>
              <div className="text-center group">
                <div className="text-base text-muted-foreground font-medium">50+</div>
                <div className="text-sm opacity-75">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold mb-4 heading-premium">
              Why Choose JADAYU?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of ration distribution with our comprehensive digital platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`text-center hover:shadow-premium hover:scale-105 hover:-translate-y-1 transition-all duration-500 border-0 bg-card/80 backdrop-blur-sm group cursor-pointer ${
                  index === 0 ? 'animate-fade-in-up' :
                  index === 1 ? 'animate-fade-in-up animation-delay-200' :
                  index === 2 ? 'animate-fade-in-up animation-delay-400' :
                  'animate-fade-in-up animation-delay-600'
                }`}
              >
                <CardHeader>
                  <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 animate-fade-in-up">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold mb-6 heading-premium">
                Your Benefits
              </h2>
              <div className="space-y-5">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-all duration-300 group ${
                      index === 0 ? 'animate-fade-in-up' :
                      index === 1 ? 'animate-fade-in-up animation-delay-200' :
                      index === 2 ? 'animate-fade-in-up animation-delay-400' :
                      'animate-fade-in-up animation-delay-600'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <CheckCircle className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-lg text-muted-foreground leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="shadow-premium border-0 bg-card/80 backdrop-blur-sm hover:shadow-gold transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-2xl text-center heading-premium">Supported Ration Cards</CardTitle>
                  <p className="text-center text-muted-foreground">All government-issued cards accepted</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-100 rounded-xl hover:bg-yellow-50 transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"></div>
                      <div className="font-semibold text-sm">AAY (Yellow)</div>
                      <div className="text-xs text-muted-foreground mt-1">Antyodaya</div>
                    </div>
                    <div className="text-center p-4 bg-pink-100 rounded-xl hover:bg-pink-50 transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer">
                      <div className="w-10 h-10 bg-pink-500 rounded-full mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"></div>
                      <div className="font-semibold text-sm">PHH (Pink)</div>
                      <div className="text-xs text-muted-foreground mt-1">Priority Household</div>
                    </div>
                    <div className="text-center p-4 bg-blue-100 rounded-xl hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer">
                      <div className="w-10 h-10 bg-blue-500 rounded-full mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"></div>
                      <div className="font-semibold text-sm">Blue</div>
                      <div className="text-xs text-muted-foreground mt-1">Non-Priority</div>
                    </div>
                    <div className="text-center p-4 bg-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer">
                      <div className="w-10 h-10 bg-gray-300 border border-gray-400 rounded-full mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"></div>
                      <div className="font-semibold text-sm">White</div>
                      <div className="text-xs text-muted-foreground mt-1">Non-Subsidy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30 animate-fade-in-up">
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
              <Card
                key={index}
                className={`hover:shadow-premium hover:scale-105 hover:-translate-y-1 transition-all duration-500 border-0 bg-card/80 backdrop-blur-sm group animate-fade-in-up cursor-pointer ${
                  index === 0 ? '' :
                  index === 1 ? 'animation-delay-200' :
                  'animation-delay-400'
                }`}
              >
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="flex mb-6 justify-center">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-300" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic text-center leading-relaxed group-hover:text-foreground transition-colors duration-300">
                    "{testimonial.content}"
                  </p>
                  <div className="text-center border-t pt-4 group-hover:border-primary/20 transition-colors duration-300">
                    <div className="font-bold text-lg group-hover:text-primary transition-colors duration-300">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-transparent to-gold-light/5 animate-fade-in-up">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2 bg-primary/10 hover:bg-primary/20 transition-colors duration-300">
            🚀 Join 10K+ Happy Families
          </Badge>

          <h2 className="text-4xl font-bold mb-6 heading-premium">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of families who trust JADAYU for their ration needs.
            Sign up today and experience the convenience of doorstep ration delivery.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button
              size="lg"
              className="gradient-gold hover:scale-105 transform transition-all duration-300 text-lg px-12 py-8 shadow-premium hover:shadow-gold w-full sm:w-auto group"
              onClick={() => navigate('/auth')}
            >
              Sign Up Now
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-12 py-8 border-2 hover:bg-primary hover:text-white transition-all duration-500 w-full sm:w-auto hover:scale-105 hover:shadow-lg"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in-up animation-delay-300">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-all duration-300 group">
              <CheckCircle className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-medium text-green-800">Free to use</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all duration-300 group">
              <CheckCircle className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-medium text-blue-800">No hidden fees</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-all duration-300 group">
              <CheckCircle className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-medium text-yellow-800">Government approved</span>
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
    </>
  );
};

export default Landing;
