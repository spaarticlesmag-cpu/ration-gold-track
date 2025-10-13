import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavHeader } from "@/components/NavHeader";

const Index = () => {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="relative">
        <div className="absolute inset-0 gradient-cream" />
        <NavHeader />
        <section className="relative container mx-auto px-4 py-12 text-center">
          <h1 className="text-5xl md:text-6xl heading-premium mb-4">JADAYU</h1>
          <p className="max-w-2xl mx-auto subheading-muted">
            Smart Ration Delivery Service — fast, transparent and secure for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button asChild className="gradient-gold">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth#signup">Create an Account</Link>
            </Button>
          </div>
        </section>
      </div>

      <section className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-card shadow-soft text-left">
          <h3 className="text-xl font-semibold mb-2">Government-grade Identity</h3>
          <p className="text-sm text-muted-foreground">Aadhaar and ration card verification for secure delivery.</p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-soft text-left">
          <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
          <p className="text-sm text-muted-foreground">Track orders and delivery partner location with ease.</p>
        </div>
        <div className="p-6 rounded-xl border bg-card shadow-soft text-left">
          <h3 className="text-xl font-semibold mb-2">Transparent Quotas</h3>
          <p className="text-sm text-muted-foreground">Clear allotments and prices, tailored to your card.</p>
        </div>
      </section>
    </div>
  );
};

export default Index;
