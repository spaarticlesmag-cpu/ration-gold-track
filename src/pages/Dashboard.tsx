import { useMemo, useState, useEffect } from "react";
import { ShoppingCart, MapPin, QrCode, History, Shield, CheckCircle, AlertCircle, Store } from "lucide-react";
import { NavHeader } from "@/components/NavHeader";
import { QuotaCard } from "@/components/QuotaCard";
import { RationItem } from "@/components/RationItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import templeBg from "@/assets/temple-bg.jpg";
import riceImg from "@/assets/rice.jpg";
import wheatImg from "@/assets/wheat.jpg";
import sugarImg from "@/assets/sugar.jpg";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import QRCodeLib from 'qrcode';

interface CartItem {
  id: string;
  quantity: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { lines, add, remove, totalItems, totalAmount } = useCart();
  const { profile } = useAuth();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authStep, setAuthStep] = useState<'card' | 'aadhaar' | 'complete'>('card');
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const quotaData = [
    { name: "Rice", allocated: 10, used: 3, unit: "kg" },
    { name: "Wheat", allocated: 8, used: 2, unit: "kg" },
    { name: "Sugar", allocated: 2, used: 0.5, unit: "kg" },
  ];

  const rationItemsBase = [
    {
      id: "rice",
      name: "Premium Rice",
      price: 25.50,
      image: riceImg,
      available: 7,
      unit: "kg",
      subsidized: true,
    },
    {
      id: "wheat",
      name: "Wheat Flour",
      price: 18.75,
      image: wheatImg,
      available: 6,
      unit: "kg",
      subsidized: true,
    },
    {
      id: "sugar",
      name: "Sugar",
      price: 35.00,
      image: sugarImg,
      available: 1.5,
      unit: "kg",
      subsidized: true,
    },
  ];

  // Adjust items based on ration card type (demo rules)
  const rationItems = useMemo(() => {
    const t = (profile as any)?.ration_card_type as 'yellow' | 'pink' | 'blue' | 'white' | undefined;
    if (!t) return rationItemsBase;
    const copy = rationItemsBase.map(i => ({ ...i }));
    if (t === 'yellow') {
      // AAY: show NFSA prices and full fixed allocation preview
      copy.find(i => i.id === 'rice')!.available = 20;
      copy.find(i => i.id === 'wheat')!.available = 15;
      copy.find(i => i.id === 'rice')!.price = 3;
      copy.find(i => i.id === 'wheat')!.price = 2;
    } else if (t === 'pink') {
      // PHH: per-member handled in Quota; show NFSA prices
      copy.find(i => i.id === 'rice')!.price = 3;
      copy.find(i => i.id === 'wheat')!.price = 2;
      // availability preview: 4kg rice + 1kg wheat per member (assume 2 members demo)
      copy.find(i => i.id === 'rice')!.available = 8;
      copy.find(i => i.id === 'wheat')!.available = 2;
    } else if (t === 'blue') {
      // Subsidy pricing
      copy.find(i => i.id === 'rice')!.price = 4;
      // Only rice subsidized; limit per-person handled on Quota
      copy.find(i => i.id === 'wheat')!.price = 18.75;
      copy.find(i => i.id === 'rice')!.available = 4; // demo 2 members × 2kg
      copy.find(i => i.id === 'wheat')!.available = 0;
    } else if (t === 'white') {
      // Non-subsidy: near-market pricing
      copy.find(i => i.id === 'rice')!.price = 10.90;
      copy.find(i => i.id === 'rice')!.available = 5; // fixed per card
      copy.find(i => i.id === 'wheat')!.price = 18.75; // near-market
      copy.find(i => i.id === 'wheat')!.available = 0; // fewer/no wheat
    }
    return copy;
  }, [profile]);

  const recentOrders = [
    {
      id: "ORD001",
      date: "2024-01-15",
      items: "Rice (5kg), Wheat (3kg)",
      status: "Delivered",
      amount: 167.25,
    },
    {
      id: "ORD002", 
      date: "2023-12-20",
      items: "Rice (5kg), Sugar (1kg)",
      status: "Delivered",
      amount: 162.50,
    },
  ];

  const handleAddToCart = (id: string, quantity: number) => {
    const item = rationItems.find(r => r.id === id);
    if (!item) return;
    add({ id: item.id, name: item.name, unit: item.unit, price: item.price }, quantity);
  };

  const handleRemoveFromCart = (id: string, quantity: number) => {
    remove(id, quantity);
  };

  const getCartQuantity = (id: string) => {
    return lines.find(l => l.id === id)?.quantity || 0;
  };

  // Generate QR code for user
  useEffect(() => {
    const generateQR = async () => {
      if (profile?.user_id) {
        const qrData = JSON.stringify({
          userId: profile.user_id,
          cardType: profile.ration_card_type,
          cardNumber: profile.ration_card_number,
          timestamp: Date.now()
        });
        try {
          const dataUrl = await QRCodeLib.toDataURL(qrData, { width: 200 });
          setQrCodeDataUrl(dataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    };
    generateQR();
  }, [profile]);

  const simulateAuth = async (step: 'card' | 'aadhaar') => {
    setAuthStatus('pending');
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success (in real app, this would verify against government databases)
    setAuthStatus('success');
    if (step === 'card') {
      setAuthStep('aadhaar');
    } else {
      setAuthStep('complete');
    }
  };

  const handlePlaceOrder = () => {
    if (totalItems === 0) return;
    setShowAuthDialog(true);
    setAuthStep('card');
    setAuthStatus('pending');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Temple Background */}
      <div 
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${templeBg})` }}
      >
        <div className="absolute inset-0 bg-background/80" />
        <NavHeader />
        
        <div className="relative container mx-auto px-4 py-8 text-center">
          <h1 className="text-5xl md:text-6xl heading-premium mb-3">
            Welcome to JADAYU
          </h1>
          <p className="subheading-muted">
            Smart Ration Delivery Service • Traditional Values, Modern Technology
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="grid grid-cols-4 max-w-md mx-auto">
            <TabsTrigger value="shop" className="flex items-center space-x-1">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Shop</span>
            </TabsTrigger>
            <TabsTrigger value="quota" className="flex items-center space-x-1">
              <Badge className="w-4 h-4" />
              <span className="hidden sm:inline">Quota</span>
            </TabsTrigger>
            <TabsTrigger value="track" className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Track</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-1">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Available Ration Items</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rationItems.map((item) => (
                      <RationItem
                        key={item.id}
                        {...item}
                        onAddToCart={handleAddToCart}
                        onRemoveFromCart={handleRemoveFromCart}
                        cartQuantity={getCartQuantity(item.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <QuotaCard
                  quotaItems={quotaData}
                  cardNumber="XXXX-XXXX-1234"
                  validUntil="Dec 2024"
                />

                {totalItems > 0 && (
                  <Card className="shadow-gold">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Your Cart ({totalItems} items)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {lines.map((l) => (
                        <div key={l.id} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{l.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {l.quantity} {l.unit} × ₹{l.price}
                            </div>
                          </div>
                          <div className="font-semibold">₹{(l.price * l.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                      
                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <Button variant="premium" className="w-full" onClick={handlePlaceOrder}>
                        Place Order
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <QrCode className="w-5 h-5" />
                      <span>Your QR Code</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="User QR Code" 
                          className="w-32 h-32 mx-auto mb-3 rounded-lg border"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                          <QrCode className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Show this QR code to confirm delivery
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quota">
            <div className="max-w-2xl mx-auto">
              <QuotaCard
                quotaItems={quotaData}
                cardNumber="XXXX-XXXX-1234"
                validUntil="Dec 2024"
              />
            </div>
          </TabsContent>

          <TabsContent value="track">
            <Card>
              <CardHeader>
                <CardTitle>Track Your Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active deliveries at the moment</p>
                  <Button variant="outline" className="mt-4">
                    View All Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <div className="font-medium">Order #{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.items}</div>
                        <div className="text-sm text-muted-foreground">{order.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{order.amount.toFixed(2)}</div>
                        <Badge variant="secondary" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Authentication Dialog (Demo) */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Identity Verification (Demo)
              </DialogTitle>
              <DialogDescription>
                This is a demo verification. Tap the button below to continue.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Simulated verification: no real data is checked.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                onClick={() => {
                  setShowAuthDialog(false);
                  navigate('/cart');
                }}
              >
                Simulate Verification & Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}