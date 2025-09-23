import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";

export default function Payment() {
  const { totalAmount, clear } = useCart();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    clear();
    setProcessing(false);
    alert("Payment successful (demo). Order placed!");
  };

  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Demo Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">This is a demo payment page. No real charge will occur.</div>
          <div className="flex items-center justify-between font-bold">
            <div>Amount</div>
            <div className="text-primary">₹{totalAmount.toFixed(2)}</div>
          </div>
          <Button onClick={handlePay} disabled={processing || totalAmount === 0} variant="premium" className="w-full">
            {processing ? "Processing..." : "Pay Now"}
          </Button>
        </CardContent>
      </Card>
    </MainLayout>
  );
}


