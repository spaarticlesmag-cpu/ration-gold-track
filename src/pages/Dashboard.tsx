import { useState } from "react";
import { ShoppingCart, MapPin, QrCode, History } from "lucide-react";
import { NavHeader } from "@/components/NavHeader";
import { QuotaCard } from "@/components/QuotaCard";
import { RationItem } from "@/components/RationItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import templeBg from "@/assets/temple-bg.jpg";
import riceImg from "@/assets/rice.jpg";
import wheatImg from "@/assets/wheat.jpg";
import sugarImg from "@/assets/sugar.jpg";

interface CartItem {
  id: string;
  quantity: number;
}

export default function Dashboard() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const quotaData = [
    { name: "Rice", allocated: 10, used: 3, unit: "kg" },
    { name: "Wheat", allocated: 8, used: 2, unit: "kg" },
    { name: "Sugar", allocated: 2, used: 0.5, unit: "kg" },
  ];

  const rationItems = [
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
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id, quantity }];
    });
  };

  const handleRemoveFromCart = (id: string, quantity: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity - quantity) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const getCartQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  const getTotalCartItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, cartItem) => {
      const item = rationItems.find(r => r.id === cartItem.id);
      return sum + (item?.price || 0) * cartItem.quantity;
    }, 0);
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
          <h1 className="text-4xl font-bold gradient-gold bg-clip-text text-transparent mb-2">
            Welcome to JADAYU
          </h1>
          <p className="text-lg text-muted-foreground">
            Smart Ration Delivery Service • Traditional Values, Modern Technology
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="grid grid-cols-4 max-w-md mx-auto">
            <TabsTrigger value="shop" className="flex items-center space-x-1">
              <ShoppingCart className="w-4 h-4" />
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

                {cart.length > 0 && (
                  <Card className="shadow-gold">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Your Cart ({getTotalCartItems()} items)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cart.map((cartItem) => {
                        const item = rationItems.find(r => r.id === cartItem.id);
                        if (!item) return null;
                        
                        return (
                          <div key={cartItem.id} className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {cartItem.quantity} {item.unit} × ₹{item.price}
                              </div>
                            </div>
                            <div className="font-semibold">
                              ₹{(item.price * cartItem.quantity).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">₹{getTotalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <Button variant="premium" className="w-full">
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
                      <div className="w-32 h-32 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
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
      </div>
    </div>
  );
}