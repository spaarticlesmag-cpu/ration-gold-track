import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { NavHeader } from '@/components/NavHeader';
import { QrCode, Camera, CheckCircle, XCircle, RefreshCw, Smartphone } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ScanResult {
  orderId: string;
  customerId: string;
  customerName: string;
  isValid: boolean;
  timestamp: Date;
  location?: string;
}

const QRScanner = () => {
  const { profile } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mock QR codes for demonstration
  const mockQRCodes = [
    { data: JSON.stringify({ orderId: 'ORD001', customerId: 'CUST001', customerName: 'Rajesh Kumar', exp: Date.now() + 3600000 }) },
    { data: JSON.stringify({ orderId: 'ORD002', customerId: 'CUST002', customerName: 'Priya Sharma', exp: Date.now() + 3600000 }) },
    { data: JSON.stringify({ orderId: 'ORD003', customerId: 'CUST003', customerName: 'Amit Patel', exp: Date.now() + 3600000 }) },
  ];

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionStatus(result.state);
      return result.state === 'granted';
    } catch (error) {
      setPermissionStatus('unknown');
      return false;
    }
  };

  const startScanning = async () => {
    setError(null);
    setScanResult(null);

    try {
      const hasPermission = await checkCameraPermission();
      if (!hasPermission && permissionStatus !== 'granted') {
        setError('Camera permission is required for QR scanning. Please grant permission and try again.');
        return;
      }

      setIsScanning(true);

      // Simulate starting camera
      setTimeout(() => {
        if (videoRef.current) {
          // Mock camera feed - in real app, this would be navigator.mediaDevices.getUserMedia()
          videoRef.current.style.background = 'linear-gradient(45deg, #1a1a1a, #333, #1a1a1a)';
          videoRef.current.style.animation = 'pulse 2s infinite';
        }
      }, 1000);

    } catch (err) {
      logger.error('Error starting scanner:', err);
      setError('Failed to access camera. Please check your camera permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.style.animation = '';
      videoRef.current.style.background = '#f3f3f3';
    }
  };

  const simulateScan = () => {
    if (!isScanning) return;

    // Randomly select one of the mock QR codes
    const randomQR = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];

    try {
      const parsedData = JSON.parse(randomQR.data);

      // Validate QR data
      if (!parsedData.orderId || !parsedData.customerId) {
        throw new Error('Invalid QR code format');
      }

      if (Date.now() > parsedData.exp) {
        throw new Error('QR code has expired');
      }

      const result: ScanResult = {
        orderId: parsedData.orderId,
        customerId: parsedData.customerId,
        customerName: parsedData.customerName,
        isValid: true,
        timestamp: new Date(),
        location: 'Current Location', // In real app, get GPS location
      };

      setScanResult(result);
      setScanHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 scans
      setError(null);

      // Simulate successful delivery confirmation
      setTimeout(() => {
        setScanResult(null); // Clear result after showing success
      }, 3000);

    } catch (err) {
      const errorResult: ScanResult = {
        orderId: 'Invalid',
        customerId: 'Invalid',
        customerName: 'Invalid QR Code',
        isValid: false,
        timestamp: new Date(),
      };

      setScanResult(errorResult);
      setError(err instanceof Error ? err.message : 'Invalid QR code scanned');
    }

    stopScanning();
  };

  const deliverOrder = async (orderId: string) => {
    try {
      // In real app, this would update the order status in database
      logger.info(`Delivering order ${orderId}`);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setScanHistory(prev =>
        prev.map(item =>
          item.orderId === orderId
            ? { ...item, isValid: true }
            : item
        )
      );

    } catch (error) {
      logger.error('Error delivering order:', error);
      setError('Failed to deliver order. Please try again.');
    }
  };

  useEffect(() => {
    checkCameraPermission();
    return () => stopScanning();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      <NavHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">QR Code Scanner</h1>
            <p className="text-muted-foreground text-lg">
              Scan customer QR codes to verify and confirm deliveries
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Scanner Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Live Scanner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Camera Feed */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ background: '#f3f3f3' }}
                  />

                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <QrCode className="h-16 w-16 mx-auto mb-4 opacity-80" />
                        <div className="text-lg font-medium">Scanning...</div>
                        <div className="text-sm opacity-80">Point camera at QR code</div>
                      </div>
                    </div>
                  )}

                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Smartphone className="h-16 w-16 mx-auto mb-4" />
                        <div className="text-lg font-medium">Camera Ready</div>
                        <div className="text-sm">Press "Start Scanning" to begin</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Scan Result */}
                {scanResult && (
                  <Card className={scanResult.isValid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        {scanResult.isValid ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )}

                        <div className="flex-1">
                          <div className="font-semibold">
                            {scanResult.customerName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Order: {scanResult.orderId}
                          </div>
                        </div>

                        {scanResult.isValid && (
                          <Button
                            size="sm"
                            onClick={() => deliverOrder(scanResult.orderId)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Confirm Delivery
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Control Buttons */}
                <div className="flex gap-3">
                  {!isScanning ? (
                    <Button
                      onClick={startScanning}
                      className="flex-1"
                      disabled={permissionStatus === 'denied'}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Scanning
                    </Button>
                  ) : (
                    <>
                      <Button onClick={simulateScan} variant="outline" className="flex-1">
                        <QrCode className="h-4 w-4 mr-2" />
                        Simulate Scan
                      </Button>
                      <Button onClick={stopScanning} variant="outline">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Camera Permission Status */}
                {permissionStatus === 'denied' && (
                  <Alert>
                    <AlertDescription>
                      Camera access is denied. Please enable camera permissions in your browser settings.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Scan History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Recent Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <div>No scans yet</div>
                      <div className="text-sm">Recent QR scans will appear here</div>
                    </div>
                  ) : (
                    scanHistory.map((scan, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          scan.isValid
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {scan.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{scan.customerName}</div>
                              <div className="text-xs text-muted-foreground">{scan.orderId}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {scan.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => setScanHistory([])}
                  disabled={scanHistory.length === 0}
                >
                  Clear History
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-8 bg-muted/50">
            <CardContent className="py-6">
              <h3 className="font-semibold mb-4">How QR Scanning Works:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>Customer shows QR code from their app</div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>Scan the QR code with your device camera</div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>Verify customer details and order information</div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>Confirm delivery to complete the transaction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
