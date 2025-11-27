import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShieldCheck, Truck, Users, Star, MapPin, Clock, Award, CheckCircle, ArrowRight, Phone, Mail, Zap, IndianRupee } from 'lucide-react';
import { NavHeader } from '@/components/NavHeader';
import templeBg from '@/assets/temple-bg.jpg';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-amber-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-orange-200 rounded-full opacity-30 animate-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-40 left-20 w-12 h-12 bg-yellow-200 rounded-full opacity-25 animate-pulse" style={{animationDelay: '2s'}}></div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply"
          style={{ backgroundImage: `url(${templeBg})` }}
        />

        {/* Animated Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-white/10 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <NavHeader />
          <div className="pt-16 pb-20 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <span className="inline-block bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
                  🌟 Smart Ration Delivery System
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
                <span className="bg-gradient-to-r from-white via-amber-100 to-yellow-100 bg-clip-text text-transparent">
                  JADAYU
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-amber-100 mb-8 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in-delayed">
                Ensuring <span className="font-semibold text-white">fair, transparent</span>, and
                <span className="font-semibold text-white"> timely distribution</span> of food grains to every beneficiary through cutting-edge technology.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 animate-fade-in-delayed-more">
                <Button asChild size="lg" className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Link to="/auth" className="flex items-center gap-2">
                    🚀 Get Started
                  </Link>
                </Button>
                <Button asChild size="lg" className="bg-white/20 text-white border-2 border-white/70 hover:bg-white hover:text-amber-600 backdrop-blur-sm font-semibold px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <a href="#how-it-works" className="flex items-center gap-2">
                    📖 Learn More
                  </a>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-16 flex flex-wrap justify-center items-center gap-6 opacity-90">
                <div className="flex items-center gap-2 text-amber-100">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Zero Leakage</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">99.2% On-Time</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">24/7 Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-gold-light">Beneficiaries Served</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">1,200+</div>
              <div className="text-gold-light">Delivery Partners</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">98.5%</div>
              <div className="text-gold-light">On-Time Delivery</div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-bold mb-2">₹2.5Cr</div>
              <div className="text-gold-light">Monthly Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How JADAYU Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple 3-step process for fair and transparent ration distribution
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Verify & Order</h3>
              <p className="text-muted-foreground">
                Beneficiaries verify their ration cards online and place orders for their monthly entitlements
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Allocation</h3>
              <p className="text-muted-foreground">
                AI-powered system allocates delivery partners and optimizes routes for efficiency
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure Delivery</h3>
              <p className="text-muted-foreground">
                GPS-tracked delivery partners deliver rations with QR code verification for transparency
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Key Benefits</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Modern technology solving traditional challenges in food distribution
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Zero Leakage</CardTitle>
                    <Badge variant="secondary" className="mt-1">Government Priority</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  End-to-end tracking prevents diversion of subsidized food grains to open market
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Real-time Monitoring</CardTitle>
                    <Badge variant="secondary" className="mt-1">24/7 Oversight</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Government officials can monitor supply chain operations in real-time from anywhere
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Reliable Delivery</CardTitle>
                    <Badge variant="secondary" className="mt-1">99.2% Success Rate</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Beneficiaries receive their entitled rations on time, every month without fail
                </p>
              </CardContent>
            </Card>


          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What People Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real experiences from our users across different roles
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    B
                  </div>
                  <div>
                    <div className="font-semibold">Mrs. Lakshmi Bhat</div>
                    <div className="text-sm text-muted-foreground">Beneficiary • Bangalore</div>
                  </div>
                </div>
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">
                  "No more standing in long queues! I order my monthly rations online and get them delivered to my doorstep. The system is transparent and reliable."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    R
                  </div>
                  <div>
                    <div className="font-semibold">Ravi Kumar</div>
                    <div className="text-sm text-muted-foreground">Delivery Partner • Chennai</div>
                  </div>
                </div>
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">
                  "Clear navigation, fair earnings, and easy delivery verification. This system makes my job much more efficient than traditional methods."
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    S
                  </div>
                  <div>
                    <div className="font-semibold">Mr. Suresh Nair</div>
                    <div className="text-sm text-muted-foreground">Government Officer • Kerala</div>
                  </div>
                </div>
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">
                  "Real-time monitoring helps us prevent irregularities and ensure every beneficiary gets their entitled rations. A game-changer for PDS."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">
            Why Choose JADAYU?
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Leveraging technology to bring efficiency and trust to the public
            distribution system.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center shadow-soft">
            <CardHeader>
              <div className="mx-auto bg-gold-light/20 rounded-full h-16 w-16 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-4">For Beneficiaries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View your entitlements, place orders online, and get rations
                delivered to your doorstep.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft">
            <CardHeader>
              <div className="mx-auto bg-gold-light/20 rounded-full h-16 w-16 flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-4">For Shop Owners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage inventory, process orders digitally, and maintain
                transparent records with ease.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft">
            <CardHeader>
              <div className="mx-auto bg-gold-light/20 rounded-full h-16 w-16 flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-4">For Delivery Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Accept delivery tasks, navigate easily, and confirm deliveries
                with a secure QR code scan.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-soft">
            <CardHeader>
              <div className="mx-auto bg-gold-light/20 rounded-full h-16 w-16 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-4">For Government</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor the entire supply chain in real-time, reduce leakage,
                and ensure accountability.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
                JADAYU
              </h3>
              <p className="text-gold-light mb-4 max-w-md">
                Ensuring fair, transparent, and timely distribution of food grains to every beneficiary through cutting-edge technology.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gold-light" />
                  <span className="text-sm text-gold-light">1800-XXX-XXXX</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gold-light" />
                  <span className="text-sm text-gold-light">support@jadayu.gov.in</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gold-light">
                <li><Link to="/auth" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gold-light">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
                <li><span className="text-xs">© 2025 JADAYU. All rights reserved.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
