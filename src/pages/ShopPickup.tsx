import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Store, QrCode, Camera, CheckCircle, X, User, Package, DollarSign } from 'lucide-react';
import { NavHeader } from '@/components/NavHeader';
import { logger } from '@/lib/logger';

interface PickupOrder {
  id: string;
  customer_id: string;
  total_amount: number;
  items: any[];
  fulfillment_type: 'pickup';
  payment_method: 'online' | 'cod';
  shop_location: string;
  customer_name?: string;
  customer_phone?: string;
}

export default function ShopPickup() {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [pickupOrder, setPickupOrder] = useState<PickupOrder | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [processingPickup, setProcessingPickup] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanError(null);
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setScanning(false);
      setScanError('Camera access denied. Please grant permission.');
      logger.error('Camera error:', err);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setScannedData(null);
    setScanError(null);
  };

  const simulateScan = () => {
    // Demo QR data for testing
    const demoQRData = JSON.stringify({
      orderId: 'ORD-DEMO-001',
      userId: 'demo-user',
      type: 'pickup_cod',
      shopLocation: 'Nearest Ration Shop',
      exp: Date.now() + 24 * 60 * 60 * 1000
    });
    handleScanResult(demoQRData);
  };

  const handleScanResult = (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData);

      // Validate QR structure
      if (!parsed.orderId || !parsed.userId || !parsed.type) {
        throw new Error('Invalid QR code format');
      }

      // Check expiry
      if (parsed.exp && Date.now() > parsed.exp) {
        setScanError('QR code has expired');
        return;
      }

      // Check if it's a pickup order
      if (!parsed.type.includes('pickup')) {
        setScanError('This QR code is not for shop pickup');
        return;
      }

      setScannedData(qrData);

      // Find order in localStorage (demo)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const order = orders.find((o: any) => o.id === parsed.orderId);

      if (order) {
        setPickupOrder({
          ...order,
          customer_name: 'Demo Customer', // In real app, fetch from profiles
          customer_phone: '+91 98765 43210'
        });
        setShowOrderDialog(true);
      } else {
        setScanError('Order not found');
      }

      stopScanning();
    } catch (error) {
      setScanError('Invalid QR code data');
      logger.error('QR parse error:', error);
    }
  };

  const processPickup = async () => {
    if (!pickupOrder) return;

    setProcessingPickup(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

    try {
      // Update order status in localStorage (demo)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = orders.map((o: any) =>
        o.id === pickupOrder.id
          ? {
              ...o,
              status: 'delivered',
              delivered_at: new Date().toISOString(),
              payment_status: pickupOrder.payment_method === 'cod' ? 'collected' : 'paid'
            }
          : o
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));

      setShowOrderDialog(false);
      setPickupOrder(null);
      setScannedData(null);

      // Show success message
      alert(`Order ${pickupOrder.id} pickup completed successfully!${pickupOrder.payment_method === 'cod' ? ' Payment collected.' : ''}`);
    } catch (error) {
      logger.error('Pickup processing error:', error);
      alert('Error processing pickup. Please try again.');
    } finally {
      setProcessingPickup(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavHeader />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Store className="h-4 w-4" />
            Shop Staff Portal
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Scanner</h1>
          <p className="text-gray-600">Scan customer QR codes for ration pickup authentication</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Customer QR Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80">
                    <div className="text-center text-white">
                      <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Ready to Scan</p>
                      <p className="text-sm opacity-75">Click start to begin scanning</p>
                    </div>
                  </div>
                )}
              </div>

              {scanError && (
                <Alert variant="destructive">
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                {!scanning ? (
                  <>
                    <Button onClick={startScanning} className="flex-1 gap-2">
                      <Camera className="h-4 w-4" />
                      Start Scanner
                    </Button>
                    <Button onClick={simulateScan} variant="outline" className="flex-1">
                      Demo Scan
                    </Button>
                  </>
                ) : (
                  <Button onClick={stopScanning} variant="outline" className="w-full gap-2">
                    <X className="h-4 w-4" />
                    Stop Scanning
                  </Button>
                )}
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Ask customers to show their QR code from the Orders page</p>
                <p className="mt-1">Valid for pickup orders only</p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>How to Process Pickups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Customer Arrives</h4>
                    <p className="text-sm text-gray-600">Customer arrives at shop with their order QR code</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Scan QR Code</h4>
                    <p className="text-sm text-gray-600">Scan the QR code displayed on customer's device</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Verify Identity</h4>
                    <p className="text-sm text-gray-600">Check customer ID proof matches order details</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium">Process Payment</h4>
                    <p className="text-sm text-gray-600">Collect cash for COD orders, confirm online payments</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <div>
                    <h4 className="font-medium">Complete Pickup</h4>
                    <p className="text-sm text-gray-600">Hand over ration items and mark order as delivered</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">Important Notes</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Verify customer identity before releasing items</li>
                  <li>• Check ration card entitlement limits</li>
                  <li>• Ensure all items are available in stock</li>
                  <li>• Collect exact payment amount for COD</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Pickup Details
            </DialogTitle>
            <DialogDescription>
              Verify customer details and process the pickup
            </DialogDescription>
          </DialogHeader>

          {pickupOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Order ID:</span>
                  <p className="font-mono">{pickupOrder.id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Amount:</span>
                  <p className="font-bold text-green-600">₹{pickupOrder.total_amount}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Customer:</span> {pickupOrder.customer_name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Pickup Location:</span> {pickupOrder.shop_location}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Payment:</span>
                  <Badge variant={pickupOrder.payment_method === 'cod' ? 'secondary' : 'default'} className="ml-2">
                    {pickupOrder.payment_method === 'cod' ? 'Cash on Pickup' : 'Prepaid'}
                  </Badge>
                </span>
              </div>

              <div>
                <h4 className="font-medium mb-2">Order Items:</h4>
                <ul className="text-sm space-y-1">
                  {pickupOrder.items?.map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.quantity} {item.unit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={processPickup}
                  disabled={processingPickup}
                  className="flex-1 gap-2"
                >
                  {processingPickup ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Complete Pickup
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
