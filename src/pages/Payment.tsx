import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { logger } from "@/lib/logger";
import { Badge } from "@/components/ui/badge";
import { Truck, Store, CreditCard, DollarSign, QrCode } from "lucide-react";

export default function Payment() {
  const { lines, totalAmount, clear } = useCart();
  const { profile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get data from cart navigation state
  const { fulfillmentType = "delivery", paymentMethod = "online", cartData } = location.state || {};

  // Use cart data from state if available, otherwise use current cart
  const cartLines = cartData?.lines || lines;
  const cartTotal = cartData?.totalAmount || totalAmount;

  const handlePayment = async () => {
    if (paymentMethod === 'cod') {
      await handleCODConfirmation();
    } else {
      await handleOnlinePayment();
    }
  };

  const handleOnlinePayment = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1200));

    const orderId = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const expiresAt = Date.now() + 3 * 60 * 60 * 1000; // 3 hours

    // Different QR payload based on fulfillment type
    const qrPayload = fulfillmentType === 'pickup' ? {
      orderId,
      userId: profile?.user_id || "demo-user",
      type: 'pickup',
      shopLocation: 'Nearest Ration Shop', // In real app, this would be selected
      exp: expiresAt,
    } : {
      orderId,
      userId: profile?.user_id || "demo-user",
      type: 'delivery',
      exp: expiresAt,
    };

    try {
      const existing = JSON.parse(localStorage.getItem("orders") || "[]");
      const newOrder = {
        id: orderId,
        customer_id: profile?.user_id || "demo-user",
        total_amount: cartTotal,
        status: 'approved',
        delivery_address: fulfillmentType === 'pickup' ? 'Pickup at Ration Shop' : (profile?.address || 'Your saved address'),
        created_at: new Date().toISOString(),
        qr_code: JSON.stringify(qrPayload),
        qr_expires_at: new Date(expiresAt).toISOString(),
        fulfillment_type: fulfillmentType,
        payment_method: paymentMethod,
        shop_location: fulfillmentType === 'pickup' ? 'Nearest Ration Shop' : null,
        items: cartLines,
      };
      localStorage.setItem("orders", JSON.stringify([newOrder, ...existing]));
    } catch (e) {
      logger.error('Failed to store order locally', e);
    }
    clear();
    setProcessing(false);
    navigate('/orders'); // Redirect to orders page
  };

  const handleCODConfirmation = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 800));

    const orderId = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours for COD

    const qrPayload = fulfillmentType === 'pickup' ? {
      orderId,
      userId: profile?.user_id || "demo-user",
      type: 'pickup_cod',
      shopLocation: 'Nearest Ration Shop',
      exp: expiresAt,
    } : {
      orderId,
      userId: profile?.user_id || "demo-user",
      type: 'delivery_cod',
      exp: expiresAt,
    };

    try {
      const existing = JSON.parse(localStorage.getItem("orders") || "[]");
      const newOrder = {
        id: orderId,
        customer_id: profile?.user_id || "demo-user",
        total_amount: cartTotal,
        status: 'pending', // COD orders start as pending until payment collected
        delivery_address: fulfillmentType === 'pickup' ? 'Pickup at Ration Shop' : (profile?.address || 'Your saved address'),
        created_at: new Date().toISOString(),
        qr_code: JSON.stringify(qrPayload),
        qr_expires_at: new Date(expiresAt).toISOString(),
        fulfillment_type: fulfillmentType,
        payment_method: paymentMethod,
        shop_location: fulfillmentType === 'pickup' ? 'Nearest Ration Shop' : null,
        items: cartLines,
      };
      localStorage.setItem("orders", JSON.stringify([newOrder, ...existing]));
    } catch (e) {
      logger.error('Failed to store order locally', e);
    }
    clear();
    setProcessing(false);
    navigate('/orders');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartLines.map((line: any) => (
              <div key={line.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{line.name}</div>
                  <div className="text-sm text-muted-foreground">{line.quantity} {line.unit} × ₹{line.price}</div>
                </div>
                <div className="font-semibold">₹{(line.price * line.quantity).toFixed(2)}</div>
              </div>
            ))}

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {fulfillmentType === 'delivery' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                  {fulfillmentType === 'delivery' ? 'Home Delivery' : 'Pickup at Ration Shop'}
                </span>
                <Badge variant="outline">
                  {fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {paymentMethod === 'online' ? <CreditCard className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                  {paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery/Pickup'}
                </span>
                <Badge variant={paymentMethod === 'online' ? 'default' : 'secondary'}>
                  {paymentMethod === 'online' ? 'Paid Online' : 'Pay Later'}
                </Badge>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex items-center justify-between font-bold text-lg">
              <div>Total Amount</div>
              <div className="text-primary">₹{cartTotal.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Payment/Confirmation Section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {paymentMethod === 'cod' ? 'Order Confirmation' : 'Secure Payment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethod === 'online' ? (
              <>
                <div className="text-sm text-muted-foreground">
                  This is a demo payment page. No real charge will occur.
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Information
                  </div>
                  <p className="text-sm text-blue-700">
                    Your payment will be processed securely. Order will be {fulfillmentType === 'delivery' ? 'delivered to your address' : 'ready for pickup at the ration shop'}.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Cash on {fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} - Pay when you receive your order.
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                    <DollarSign className="h-4 w-4" />
                    Cash Payment
                  </div>
                  <p className="text-sm text-green-700">
                    You will pay ₹{cartTotal.toFixed(2)} in cash when your order is {fulfillmentType === 'delivery' ? 'delivered' : 'picked up from the shop'}.
                    {fulfillmentType === 'pickup' && ' Bring a valid ID for verification.'}
                  </p>
                </div>
              </>
            )}

            <Button
              onClick={handlePayment}
              disabled={processing || cartTotal === 0}
              variant="premium"
              className="w-full"
            >
              {processing ? "Processing..." : (paymentMethod === 'cod' ? 'Confirm Order' : 'Pay Now')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
