import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShieldCheck, Truck, Users } from 'lucide-react';
import { NavHeader } from '@/components/NavHeader';
import templeBg from '@/assets/temple-bg.jpg';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${templeBg})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative container mx-auto px-4">
          <NavHeader />
          <div className="py-24 md:py-32 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
              JADAYU
            </h1>
            <p className="text-lg md:text-xl text-gold-light mb-8 max-w-3xl mx-auto">
              A Smart Ration Delivery System ensuring fair, transparent, and
              timely distribution of food grains to every beneficiary.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" variant="premium">
                <Link to="/auth">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default Landing;