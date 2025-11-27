import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { NavHeader } from '@/components/NavHeader';
import { Package, ShoppingCart, Plus, Info } from 'lucide-react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { SkeletonLoading } from '@/components/ui/skeleton-loading';
import { Footer } from '@/components/Footer';

interface RationItem {
  id: string;
  name: string;
  unit: string;
  price_per_unit: number;
  image?: string;
  quantity: number;
}

const Shop = () => {
  const { profile } = useAuth();
  const { add, lines } = useCart();
  const [items, setItems] = useState<RationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQuota, setUserQuota] = useState<any>(null);

  // Sample ration items for demonstration
  const sampleItems: RationItem[] = [
    { id: 'rice', name: 'Premium Rice', unit: 'kg', price_per_unit: 25.50, image: '/rice.jpg', quantity: 0 },
    { id: 'wheat', name: 'Wheat Flour', unit: 'kg', price_per_unit: 18.75, image: '/wheat.jpg', quantity: 0 },
    { id: 'sugar', name: 'Sugar', unit: 'kg', price_per_unit: 35.00, image: '/sugar.jpg', quantity: 0 },
    { id: 'dal', name: 'Toor Dal (Lentils)', unit: 'kg', price_per_unit: 120.00, image: '/toor-daal.jpg', quantity: 0 },
    { id: 'oil', name: 'Cooking Oil', unit: 'L', price_per_unit: 160.00, image: '/cooking-oil.jpg', quantity: 0 },
    { id: 'salt', name: 'Iodized Salt', unit: 'kg', price_per_unit: 18.00, image: '/iodized-salt.jpg', quantity: 0 },
    { id: 'tea', name: 'Tea Powder', unit: 'kg', price_per_unit: 180.00, image: '/tea-powder.jpg', quantity: 0 },
  ];

  useEffect(() => {
    // Simulate API call to load ration items and user quota
    const loadData = async () => {
      try {
        setLoading(true);

        // Simulate loading items
        setTimeout(() => {
          setItems(sampleItems);
          setLoading(false);
        }, 1000);

        // For demo purposes, simulate user quota based on card type
        if (profile) {
          // Simulate quota data based on ration card type
          const mockQuota = [
            { item_name: 'Rice', allocated_quantity: profile.ration_card_type === 'pink' ? 4 : 5, unit: 'kg' },
            { item_name: 'Wheat', allocated_quantity: profile.ration_card_type === 'pink' ? 1 : 2, unit: 'kg' },
            { item_name: 'Sugar', allocated_quantity: 1 + (profile.household_members || 1) * 0.2, unit: 'kg' },
          ];
          setUserQuota(mockQuota);
        }
      } catch (error) {
        logger.error('Error loading shop data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [profile]);

  const handleAddToCart = (item: RationItem, qty: number = 1) => {
    add({
      id: item.id,
      name: item.name,
      unit: item.unit,
      price: item.price_per_unit,
    }, qty);
  };

  const getCartQuantity = (itemId: string) => {
    const cartItem = lines.find(line => line.id === itemId);
    return cartItem?.quantity || 0;
  };

  const getRemainingQuota = (itemName: string) => {
    if (!userQuota) return null;
    const quota = userQuota.find((q: any) => q.item_name.toLowerCase() === itemName.toLowerCase());
    return quota ? quota.allocated_quantity : null;
  };

  const getItemIcon = (itemId: string) => {
    switch (itemId) {
      case 'rice':
        return <span className="text-4xl">🌾</span>; // Rice emoji
      case 'wheat':
        return <span className="text-4xl">🌾</span>; // Wheat emoji
      case 'sugar':
        return <span className="text-4xl">🍚</span>; // Sugar bowl emoji
      case 'dal':
        return <span className="text-4xl">🥘</span>; // Lentils/cooking pot
      case 'oil':
        return <span className="text-4xl">🫒</span>; // Olive oil/droplet
      case 'salt':
        return <span className="text-4xl">🧂</span>; // Salt shaker
      case 'tea':
        return <span className="text-4xl">☕</span>; // Tea cup
      default:
        return <Package className="h-12 w-12 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
        <NavHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <SkeletonLoading variant="default" className="h-12 w-64 mx-auto mb-4" />
            <SkeletonLoading variant="default" className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLoading key={i} variant="card" className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      <NavHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 py-24 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 left-8 w-16 h-16 bg-amber-400 rounded-full blur-xl"></div>
          <div className="absolute top-32 right-16 w-12 h-12 bg-orange-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-16 left-1/3 w-20 h-20 bg-yellow-300 rounded-full blur-2xl"></div>
          <div className="absolute bottom-8 right-8 w-8 h-8 bg-amber-500 rounded-full blur-lg"></div>
        </div>

        {/* Floating Food Images */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 opacity-10 animate-bounce" style={{ animationDelay: '0s' }}>
            <img src="/rice.jpg" alt="Rice" className="w-16 h-16 rounded-full object-cover shadow-lg" />
          </div>
          <div className="absolute top-32 right-1/4 opacity-10 animate-bounce" style={{ animationDelay: '1s' }}>
            <img src="/wheat.jpg" alt="Wheat" className="w-14 h-14 rounded-full object-cover shadow-lg" />
          </div>
          <div className="absolute bottom-24 left-1/6 opacity-10 animate-bounce" style={{ animationDelay: '2s' }}>
            <img src="/sugar.jpg" alt="Sugar" className="w-12 h-12 rounded-full object-cover shadow-lg" />
          </div>
          <div className="absolute bottom-32 right-1/3 opacity-10 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <img src="/cooking-oil.jpg" alt="Oil" className="w-18 h-18 rounded-full object-cover shadow-lg" />
          </div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-sm">
              <span className="text-2xl">🏪</span>
              <span className="text-sm font-medium text-amber-800">Government Ration Distribution</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Your Essential
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"> Ration Shop</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Access subsidized essential commodities with ease. Fresh, quality items delivered directly to your doorstep with transparent pricing and fair distribution.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm">
                <span className="text-green-600 font-semibold">✓</span>
                <span className="text-sm font-medium">Government Subsidized</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm">
                <span className="text-blue-600 font-semibold">✓</span>
                <span className="text-sm font-medium">Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg px-4 py-3 shadow-sm">
                <span className="text-purple-600 font-semibold">✓</span>
                <span className="text-sm font-medium">Fair Distribution</span>
              </div>
            </div>
            {profile && (
              <Badge variant="secondary" className="bg-white/90 text-amber-800 border-amber-300 text-sm px-4 py-2 shadow-sm">
                Card Type: {profile.ration_card_type?.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">

        {/* Shop Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Ration Items</h2>
          <p className="text-gray-600">Select from our quality-assured essential commodities</p>
        </div>

        {/* Enhanced Cart Summary */}
        {lines.length > 0 && (
          <Card className="mb-10 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-in slide-in-from-top-4">
            <CardContent className="py-6 px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-gray-900">
                      {lines.reduce((sum, line) => sum + line.quantity, 0)} items in cart
                    </span>
                    <p className="text-sm text-gray-600">Ready for checkout</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    ₹{lines.reduce((sum, line) => sum + line.price * line.quantity, 0).toFixed(2)}
                  </div>
                  <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                    <Link to="/cart">View Cart</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Ration Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
          {items.map((item, index) => {
            const cartQty = getCartQuantity(item.id);
            const remainingQuota = getRemainingQuota(item.name);

            return (
              <Card key={item.id} className="group relative bg-white border-0 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-6" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <CardHeader className="pb-4 relative">
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-4 relative overflow-hidden shadow-inner">
                    {cartQty > 0 && (
                      <Badge className="absolute top-3 right-3 z-20 bg-amber-500 hover:bg-amber-600 text-white shadow-lg animate-bounce">
                        {cartQty} in cart
                      </Badge>
                    )}

                    {/* Enhanced image display */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.querySelector('.image-placeholder')!.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 ${item.image ? 'hidden image-placeholder' : ''} group-hover:scale-110 transition-transform duration-500`}>
                      <div className="text-6xl group-hover:scale-125 transition-transform duration-300">
                        {getItemIcon(item.id)}
                      </div>
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">{item.name}</CardTitle>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold text-amber-600">₹{item.price_per_unit}</span>
                      <span className="text-sm text-gray-500">per {item.unit}</span>
                    </div>

                    {remainingQuota !== null && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                        Quota: {remainingQuota} {item.unit}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 px-6 pb-6">
                  {remainingQuota !== null && (
                    <div className="flex items-center gap-2 text-sm mb-4 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-blue-700 font-medium">
                        Monthly entitlement: {remainingQuota} {item.unit}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200"
                      onClick={() => handleAddToCart(item, 1)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add 1 {item.unit}
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 transition-all duration-200 hover:shadow-md"
                      onClick={() => handleAddToCart(item, 5)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add 5 {item.unit}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <Card className="bg-muted/50 border-muted">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> All prices are subsidised government rates.
                Items are subject to your monthly entitlement limits.
                Please verify your quota before proceeding to checkout.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Shop;
