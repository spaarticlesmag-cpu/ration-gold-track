import MainLayout from "@/components/MainLayout"; // Corrected import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";

export default function Payment() {
  const { lines, totalAmount, clear } = useCart();
  const { profile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    // Create demo order with per-order QR payload and 3-hour expiry
    const orderId = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const expiresAt = Date.now() + 3 * 60 * 60 * 1000; // 3 hours
    const qrPayload = {
      orderId,
      userId: profile?.user_id || "demo-user",
      exp: expiresAt,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("orders") || "[]");
      const newOrder = {
        id: orderId,
        customer_id: profile?.user_id || "demo-user",
        total_amount: totalAmount,
        status: 'approved',
        delivery_address: profile?.address || 'Your saved address',
        created_at: new Date().toISOString(),
        qr_code: JSON.stringify(qrPayload), // This should be handled server-side in a real app
        qr_expires_at: new Date(expiresAt).toISOString(),
        items: [],
      };
      localStorage.setItem("orders", JSON.stringify([newOrder, ...existing]));
    } catch (e) {
      logger.error('Failed to store order locally', e);
    }
    clear();
    setProcessing(false);
    navigate('/user/dashboard'); // Redirect to customer dashboard
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
