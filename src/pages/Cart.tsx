import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function Cart() {
  const { lines, totalAmount, clear } = useCart();
  const { profile } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authStep, setAuthStep] = useState<'card' | 'aadhaar' | 'complete'>('card');
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const simulateAuth = async (step: 'card' | 'aadhaar') => {
    setAuthStatus('pending');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAuthStatus('success');
    if (step === 'card') {
      setAuthStep('aadhaar');
    } else {
      setAuthStep('complete');
    }
  };

  const handleProceedToPayment = () => {
    if (lines.length === 0) return;
    setShowAuthDialog(true);
    setAuthStep('card');
    setAuthStatus('pending');
  };

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
                <Button variant="premium" className="flex-1" onClick={handleProceedToPayment}>
                  Proceed to Payment
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Identity Verification Required
            </DialogTitle>
            <DialogDescription>
              Please verify your ration card and Aadhaar to proceed with payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {authStep === 'card' && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Verifying your ration card details...
                  </AlertDescription>
                </Alert>
                
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Card Type: {profile?.ration_card_type?.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Card Number: {profile?.ration_card_number || 'DEMO-1234'}
                  </div>
                </div>

                {authStatus === 'pending' && (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}

                {authStatus === 'success' && (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Ration Card Verified
                  </div>
                )}

                {authStatus === 'success' && (
                  <Button 
                    onClick={() => simulateAuth('aadhaar')} 
                    className="w-full"
                  >
                    Continue to Aadhaar Verification
                  </Button>
                )}
              </div>
            )}

            {authStep === 'aadhaar' && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Verifying your Aadhaar details...
                  </AlertDescription>
                </Alert>
                
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Aadhaar: {profile?.aadhaar_number || 'XXXX-XXXX-1234'}
                  </div>
                </div>

                {authStatus === 'pending' && (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}

                {authStatus === 'success' && (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Aadhaar Verified
                  </div>
                )}

                {authStatus === 'success' && (
                  <Button asChild className="w-full">
                    <Link to="/payment">Proceed to Payment</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}


