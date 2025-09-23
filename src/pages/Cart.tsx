import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";

export default function Cart() {
  const { lines, totalAmount, clear } = useCart();
  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.length === 0 ? (
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
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={clear}>Clear Cart</Button>
                <Button asChild variant="premium" className="flex-1"><Link to="/payment">Proceed to Payment</Link></Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}


