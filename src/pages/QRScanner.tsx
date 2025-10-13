import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NavHeader } from '@/components/NavHeader';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Camera, CheckCircle, AlertCircle, ArrowLeft, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      toast({
        title: "Camera Started",
        description: "Point your camera at a QR code to scan",
      });
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
      setScanning(false);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setScannedCode(null);
    setError(null);
  };

  const simulateScan = () => {
    // Simulate scanning a QR code for demo purposes
    setScannedCode("DEMO_ORDER_12345");
    setScanning(false);
    toast({
      title: "QR Code Scanned",
      description: "Order verification successful!",
    });
  };

  const handleVerification = () => {
    if (scannedCode) {
      toast({
        title: "Order Verified",
        description: `Order ${scannedCode} has been successfully verified and delivered.`,
      });
      setScannedCode(null);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gold-light/20 to-cream">
      <NavHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            QR Code Scanner
          </h1>
          <p className="text-muted-foreground">
            Scan QR codes to verify and complete deliveries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Point your camera at the customer's QR code to verify delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!scanning && !scannedCode && (
                <div className="flex flex-col items-center justify-center py-12 bg-muted rounded-lg">
                  <QrCode className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Scan</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Click the button below to start scanning QR codes
                  </p>
                  <Button onClick={startScanning} className="gradient-gold hover:opacity-90">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>
              )}

              {scanning && (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-primary rounded-lg opacity-70 shadow-[0_0_40px_rgba(255,200,0,0.4)]"></div>
                      <div className="absolute left-6 right-6 h-0.5 bg-primary/70 animate-pulse" style={{ top: '25%' }}></div>
                      <div className="absolute left-6 right-6 h-0.5 bg-primary/70 animate-pulse" style={{ bottom: '25%' }}></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={stopScanning} variant="outline" className="flex-1">
                      Stop Scanning
                    </Button>
                    <Button onClick={simulateScan} variant="secondary" className="flex-1">
                      Simulate Scan (Demo)
                    </Button>
                  </div>
                </div>
              )}

              {scannedCode && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      QR Code scanned successfully! Order ID: {scannedCode}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Order Details</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Order ID:</span> {scannedCode}</p>
                      <p><span className="font-medium">Customer:</span> John Doe</p>
                      <p><span className="font-medium">Items:</span> Rice (5kg), Wheat (3kg)</p>
                      <p><span className="font-medium">Total:</span> ₹450</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleVerification} className="gradient-gold hover:opacity-90 flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify & Complete Delivery
                    </Button>
                    <Button onClick={() => setScannedCode(null)} variant="outline" className="flex-1">
                      Scan Another
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Instructions Section */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>How to Use QR Scanner</CardTitle>
              <CardDescription>
                Follow these steps to verify deliveries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Start Scanning</h4>
                    <p className="text-sm text-muted-foreground">
                      Click "Start Scanning" to activate your camera
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Point at QR Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Align the QR code within the scanning frame
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Verify Details</h4>
                    <p className="text-sm text-muted-foreground">
                      Check the order details and confirm delivery
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">Complete Delivery</h4>
                    <p className="text-sm text-muted-foreground">
                      Mark the order as delivered and move to next order
                    </p>
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure you have good lighting and hold the phone steady for best scanning results.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
