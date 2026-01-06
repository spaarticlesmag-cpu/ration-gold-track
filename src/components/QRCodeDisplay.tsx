import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Store, Clock, RefreshCw, Download, Share2 } from 'lucide-react';

interface QRCodeDisplayProps {
  qrData: string;
  orderId: string;
  shopLocation?: string;
  expiresAt: string;
  fulfillmentType: 'pickup' | 'delivery';
}

export const QRCodeDisplay = ({
  qrData,
  orderId,
  shopLocation,
  expiresAt,
  fulfillmentType
}: QRCodeDisplayProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR code URL using a public QR code service
    const qrText = encodeURIComponent(qrData);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrText}`;
    setQrCodeUrl(qrUrl);

    // Update countdown timer
    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [qrData, expiresAt]);

  const handleRefresh = () => {
    // In a real app, this would request a new QR code from the server
    window.location.reload();
  };

  const handleDownload = () => {
    // Create a download link for the QR code
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `order-${orderId}-qr.png`;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Order QR Code',
          text: `Order ${orderId} - ${fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'} QR Code`,
          url: qrCodeUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy QR data to clipboard
      navigator.clipboard.writeText(qrData);
      alert('QR code data copied to clipboard');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Store className="h-5 w-5" />
          {fulfillmentType === 'pickup' ? 'Pickup QR Code' : 'Order QR Code'}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Order #{orderId}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {shopLocation && (
          <div className="text-center">
            <Badge variant="outline" className="mb-2">
              {shopLocation}
            </Badge>
          </div>
        )}

        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className={`w-48 h-48 border-2 rounded-lg ${isExpired ? 'opacity-50 grayscale' : ''}`}
            />
            {isExpired && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <span className="text-white font-bold text-lg">EXPIRED</span>
              </div>
            )}
          </div>
        </div>

        {/* Expiry Timer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className={isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {isExpired ? 'QR Code Expired' : `Expires in: ${timeLeft}`}
            </span>
          </div>
        </div>

        {isExpired && (
          <Alert>
            <AlertDescription>
              This QR code has expired. Please refresh to get a new one or contact support.
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-center space-y-2">
          <h4 className="font-medium text-sm">
            {fulfillmentType === 'pickup'
              ? 'Show this QR code at the ration shop'
              : 'Show this QR code to the delivery person'
            }
          </h4>
          <p className="text-xs text-muted-foreground">
            {fulfillmentType === 'pickup'
              ? 'Bring a valid ID proof for verification'
              : 'Keep this code ready for authentication'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isExpired}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Download className="h-4 w-4" />
            <span className="text-xs">Download</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex flex-col items-center gap-1 h-auto py-2"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
