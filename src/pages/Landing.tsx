import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import templeBg from "@/assets/temple-bg.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div
        className="relative min-h-[70vh] bg-cover bg-center flex items-center"
        style={{ backgroundImage: `url(${templeBg})` }}
      >
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative container mx-auto px-4 py-16 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl heading-premium">JADAYU</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart Ration Delivery System — Traditional Values, Modern Technology
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gradient-gold text-foreground">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth#signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg bg-card shadow-soft">
            <h3 className="text-xl font-semibold mb-2">Secure Identity</h3>
            <p className="text-muted-foreground">Aadhaar-ready flow with clear privacy choices.</p>
          </div>
          <div className="p-6 border rounded-lg bg-card shadow-soft">
            <h3 className="text-xl font-semibold mb-2">Transparent Quotas</h3>
            <p className="text-muted-foreground">Clear entitlement view per card and member.</p>
          </div>
          <div className="p-6 border rounded-lg bg-card shadow-soft">
            <h3 className="text-xl font-semibold mb-2">Track & Verify</h3>
            <p className="text-muted-foreground">Real-time delivery tracking and QR confirmation.</p>
          </div>
        </div>
      </section>

      {/* Roles CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h4 className="font-semibold mb-1">Customers / Beneficiaries</h4>
            <p className="text-sm text-muted-foreground mb-3">Shop subsidized items, view quota, track orders.</p>
            <Button asChild variant="outline"><Link to="/auth">Get Started</Link></Button>
          </div>
          <div className="p-6 border rounded-lg">
            <h4 className="font-semibold mb-1">Delivery Partners</h4>
            <p className="text-sm text-muted-foreground mb-3">Optimized routes and QR-based handover.</p>
            <Button asChild variant="outline"><Link to="/auth">Join</Link></Button>
          </div>
          <div className="p-6 border rounded-lg">
            <h4 className="font-semibold mb-1">Admins / Shop Owners</h4>
            <p className="text-sm text-muted-foreground mb-3">Inventory, approvals, analytics — mobile-first.</p>
            <Button asChild variant="outline"><Link to="/auth">Sign In</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
