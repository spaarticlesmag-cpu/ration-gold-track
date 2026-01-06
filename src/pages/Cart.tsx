import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Truck, Store, CreditCard, DollarSign } from "lucide-react";

export default function Cart() {
  const { lines, totalAmount, totalItems, clear } = useCart();
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  

  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalItems === 0 ? (
            <div className="text-center text-muted-foreground">Your cart is empty.</div>
          ) : (
            <>
              {lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-sm text-muted-foreground">{l.quantity} {l.unit} × ₹{l.price}</div>
                  </div>
                  <div className="font-semibold">₹{(l.price * l.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="border-t border-border pt-4 flex items-center justify-between font-bold">
                <div>Total</div>
                <div className="text-primary">₹{totalAmount.toFixed(2)}</div>
              </div>

              {/* Fulfillment Type Selection */}
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  How would you like to receive your order?
                </h3>
                <RadioGroup value={fulfillmentType} onValueChange={(value: "delivery" | "pickup") => setFulfillmentType(value)} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Home Delivery</div>
                        <div className="text-sm text-muted-foreground">Delivered to your address</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Store className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Pickup at Ration Shop</div>
                        <div className="text-sm text-muted-foreground">Collect from nearest shop with QR authentication</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Method Selection */}
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </h3>
                <RadioGroup value={paymentMethod} onValueChange={(value: "online" | "cod") => setPaymentMethod(value)} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium">Online Payment</div>
                        <div className="text-sm text-muted-foreground">Pay now securely</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                      <DollarSign className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Cash on Delivery/Pickup</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={clear}>Clear Cart</Button>
                <Button asChild variant="premium" className="flex-1">
                  <Link
                    to="/payment"
                    state={{
                      fulfillmentType,
                      paymentMethod,
                      cartData: { lines, totalAmount, totalItems }
                    }}
                  >
                    Proceed to {paymentMethod === 'cod' ? 'Confirmation' : 'Payment'}
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </MainLayout>
  );
}
