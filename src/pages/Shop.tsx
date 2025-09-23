import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { RationItem } from "@/components/RationItem";
import { QuotaCard } from "@/components/QuotaCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import riceImg from "@/assets/rice.jpg";
import wheatImg from "@/assets/wheat.jpg";
import sugarImg from "@/assets/sugar.jpg";

interface CartItem { id: string; quantity: number; }

export default function Shop() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { add, remove } = useCart();

  const quotaData = [
    { name: "Rice", allocated: 10, used: 3, unit: "kg" },
    { name: "Wheat", allocated: 8, used: 2, unit: "kg" },
    { name: "Sugar", allocated: 2, used: 0.5, unit: "kg" },
  ];

  const rationItems = [
    { id: "rice", name: "Premium Rice", price: 25.5, image: riceImg, available: 7, unit: "kg", subsidized: true },
    { id: "wheat", name: "Wheat Flour", price: 18.75, image: wheatImg, available: 6, unit: "kg", subsidized: true },
    { id: "sugar", name: "Sugar", price: 35.0, image: sugarImg, available: 1.5, unit: "kg", subsidized: true },
  ];

  const handleAddToCart = (id: string, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => (item.id === id ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...prev, { id, quantity }];
    });
    const item = rationItems.find(r => r.id === id);
    if (item) add({ id: item.id, name: item.name, unit: item.unit, price: item.price }, quantity);
  };

  const handleRemoveFromCart = (id: string, quantity: number) => {
    setCart(prev => prev
      .map(item => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item))
      .filter(item => item.quantity > 0));
    remove(id, quantity);
  };

  const getCartQuantity = (id: string) => cart.find(item => item.id === id)?.quantity || 0;
  const getTotalCartItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalAmount = () => cart.reduce((sum, cartItem) => {
    const item = rationItems.find(r => r.id === cartItem.id);
    return sum + (item?.price || 0) * cartItem.quantity;
  }, 0);

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-4">Shop Ration Items</h1>
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
          <QuotaCard quotaItems={quotaData} cardNumber="XXXX-XXXX-1234" validUntil="Dec 2024" />

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
                        <div className="text-sm text-muted-foreground">{cartItem.quantity} {item.unit} × ₹{item.price}</div>
                      </div>
                      <div className="font-semibold">₹{(item.price * cartItem.quantity).toFixed(2)}</div>
                    </div>
                  );
                })}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
                <Button variant="premium" className="w-full">Place Order</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}


