import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Star, ThumbsUp, ThumbsDown, Send, Bot, ShoppingCart, MapPin, QrCode, History, Store, Shield, AlertCircle, Package, Navigation, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavHeader } from "@/components/NavHeader";
import { QuotaCard } from "@/components/QuotaCard";
import { RationItem } from "@/components/RationItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import riceImg from "@/assets/rice.jpg";
import wheatImg from "@/assets/wheat.jpg";
import sugarImg from "@/assets/sugar.jpg";
import { useCart } from "@/hooks/useCart";
import QRCodeLib from 'qrcode';
import { logger } from '@/lib/logger';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';

// --- Map and Tracking Setup ---
const pickup: LatLngExpression = [10.1988, 76.3869]; // Angamaly
const destination: LatLngExpression = [10.1965, 76.3912];

const truckIcon = new L.DivIcon({
  html: '<div style="font-size:22px">🚚</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const CustomerDashboard = () => {
  const { profile } = useAuth();
  const { lines, add, remove, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();
  const cardType = profile?.ration_card_type as 'yellow' | 'pink' | 'blue' | 'white' | undefined;
  const members = profile?.household_members || 1;
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("shop");
  const [showReview, setShowReview] = useState(false);

  // --- State from OrdersCustomer and Track ---
  const [orders, setOrders] = useState<any[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [route, setRoute] = useState<LatLngExpression[]>([]);
  const [position, setPosition] = useState<LatLngExpression>(pickup);
  const [etaMinutes, setEtaMinutes] = useState<number>(18);
  const progressRef = useRef<number>(0);


  // Data and logic from Dashboard.tsx

  const handleRating = (value: number) => {
    setRating(value);
  };

  const handleSubmitReview = () => {
    if (rating && reviewText.trim()) {
      // In a real app, this would save to Supabase
      // TODO: Implement review submission to database
      setReviewText("");
      setRating(null);
      setShowReview(false);
    }
  };

  const handleChatSend = () => {
    if (chatInput.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        text: chatInput,
        isUser: true,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);
      
      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: "Thank you for your feedback! We're here to help with any questions about your ration delivery. How can we assist you today?",
          isUser: false,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, botResponse]);
      }, 1000);
      
      setChatInput("");
    }
  };

  const quotaData = [
    { name: "Rice", allocated: 10, used: 3, unit: "kg" },
    { name: "Wheat", allocated: 8, used: 2, unit: "kg" },
    { name: "Sugar", allocated: 2, used: 0.5, unit: "kg" },
  ];

  const rationItemsBase = [
    { id: "rice", name: "Premium Rice", price: 25.50, image: riceImg, available: 7, unit: "kg", subsidized: true },
    { id: "wheat", name: "Wheat Flour", price: 18.75, image: wheatImg, available: 6, unit: "kg", subsidized: true },
    { id: "sugar", name: "Sugar", price: 35.00, image: sugarImg, available: 1.5, unit: "kg", subsidized: true },
  ];

  const rationItems = useMemo(() => {
    const t = cardType;
    if (!t) return rationItemsBase;
    const copy = rationItemsBase.map(i => ({ ...i }));
    if (t === 'yellow') {
      copy.find(i => i.id === 'rice')!.available = 20;
      copy.find(i => i.id === 'wheat')!.available = 15;
      copy.find(i => i.id === 'rice')!.price = 3;
      copy.find(i => i.id === 'wheat')!.price = 2;
    } else if (t === 'pink') {
      copy.find(i => i.id === 'rice')!.price = 3;
      copy.find(i => i.id === 'wheat')!.price = 2;
      copy.find(i => i.id === 'rice')!.available = 4 * members;
      copy.find(i => i.id === 'wheat')!.available = 1 * members;
    } else if (t === 'blue') {
      copy.find(i => i.id === 'rice')!.price = 4;
      copy.find(i => i.id === 'wheat')!.price = 18.75;
      copy.find(i => i.id === 'rice')!.available = 2 * members;
      copy.find(i => i.id === 'wheat')!.available = 0;
    } else if (t === 'white') {
      copy.find(i => i.id === 'rice')!.price = 10.90;
      copy.find(i => i.id === 'rice')!.available = 5;
      copy.find(i => i.id === 'wheat')!.price = 18.75;
      copy.find(i => i.id === 'wheat')!.available = 0;
    }
    return copy;
  }, [profile, members]);

  const handleAddToCart = (id: string, quantity: number) => {
    const item = rationItems.find(r => r.id === id);
    if (!item) return;
    add({ id: item.id, name: item.name, unit: item.unit, price: item.price }, quantity);
  };

  const handleRemoveFromCart = (id: string, quantity: number) => {
    remove(id, quantity);
  };

  const getCartQuantity = (id: string) => {
    return lines.find(l => l.id === id)?.quantity || 0;
  };

  // --- Logic from OrdersCustomer and Track ---
  const generatedRoute = useMemo(() => {
    const [lat1, lon1] = pickup as [number, number];
    const [lat2, lon2] = destination as [number, number];
    const points: LatLngExpression[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = lat1 + (lat2 - lat1) * t;
      const lon = lon1 + (lon2 - lon1) * t;
      points.push([lat, lon]);
    }
    return points;
  }, []);

  useEffect(() => setRoute(generatedRoute), [generatedRoute]);

  useEffect(() => {
    if (route.length === 0 || !showLiveTracking) return;
    const interval = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 1, route.length - 1);
      const idx = progressRef.current;
      setPosition(route[idx]);
      const remaining = route.length - 1 - idx;
      setEtaMinutes(Math.max(1, Math.ceil((remaining / route.length) * 18)));
    }, 500);
    return () => clearInterval(interval);
  }, [route, showLiveTracking]);

  // Load orders from localStorage (demo) and generate QR images
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('orders') || '[]');
      if (Array.isArray(stored) && stored.length) {
        setOrders(stored);
      } else {
        const demoOrders = [
          { id: 'ORD-ABC1', status: 'out_for_delivery', address: '123 MG Road, Angamaly', items: ['Rice (5kg)', 'Wheat (3kg)'], total_amount: 450, eta: '18 mins', qr_code: JSON.stringify({ orderId: 'ORD-ABC1', exp: Date.now() + 3600000 }), qr_expires_at: new Date(Date.now() + 3600000).toISOString() },
          { id: 'ORD-DEF2', status: 'delivered', address: '456 Market Road, Angamaly', items: ['Rice (3kg)', 'Dal (2kg)'], total_amount: 320, eta: 'N/A' },
        ];
        setOrders(demoOrders);
        localStorage.setItem('orders', JSON.stringify(demoOrders));
      }
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      const map: Record<string, string> = {};
      for (const o of orders) {
        if (o.qr_code) {
          try {
            map[o.id] = await QRCodeLib.toDataURL(o.qr_code, { width: 180 });
          } catch (e) {
            logger.error('QR gen failed', e);
          }
        }
      }
      setQrMap(map);
    })();
  }, [orders]);

  const handleTabChange = (value: string) => {
    // Reset tracking state if navigating away from the track tab
    if (activeTab === 'track' && value !== 'track') {
      setShowLiveTracking(false);
    }
    setActiveTab(value);
  };

  useEffect(() => {
    const generateQR = async () => {
      if (profile?.user_id) {
        const qrData = JSON.stringify({
          userId: profile.user_id,
          cardType: profile.ration_card_type,
          cardNumber: profile.ration_card_number,
          timestamp: Date.now()
        });
        try {
          const dataUrl = await QRCodeLib.toDataURL(qrData, { width: 200 });
          setQrCodeDataUrl(dataUrl);
        } catch (error) {
          logger.error('Error generating QR code:', error);
        }
      }
    };
    generateQR();
  }, [profile]);

  const handlePlaceOrder = () => {
    if (totalItems === 0) return;
    setShowAuthDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream overflow-x-hidden">
      <NavHeader />
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

        {/* Shopping Section */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Available Ration Items</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rationItems.map((item) => (
                    <RationItem
                      key={item.id}
                      {...item}
                      onAddToCart={handleAddToCart}
                      onRemoveFromCart={handleRemoveFromCart}
                      cartQuantity={getCartQuantity(item.id)}
                    />
                  ))}
                </div>
              </div>

              <QuotaCard
                quotaItems={quotaData}
                cardNumber={profile?.ration_card_number || "XXXX-XXXX-1234"}
                validUntil="Dec 2024"
              />
            </div>

            <div className="space-y-6">
              {totalItems > 0 && (
                <Card className="shadow-gold">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Your Cart ({totalItems} items)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lines.map((l) => (
                      <div key={l.id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{l.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {l.quantity} {l.unit} × ₹{l.price}
                          </div>
                        </div>
                        <div className="font-semibold">₹{(l.price * l.quantity).toFixed(2)}</div>
                      </div>
                    ))}

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button variant="premium" className="w-full" onClick={handlePlaceOrder}>
                      Place Order
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5" />
                    <span>Your QR Code</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="User QR Code"
                        className="w-32 h-32 mx-auto mb-3 rounded-lg border"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Show this QR code to confirm delivery
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Orders Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-6 h-6" />
                Your Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border rounded-lg p-4 space-y-3">
                    {order.qr_expires_at && order.status !== 'delivered' && (
                      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                        <div className="text-xs text-muted-foreground">
                          Show this QR to delivery partner. Expires: {new Date(order.qr_expires_at).toLocaleTimeString()}
                        </div>
                        {qrMap[order.id] ? (
                          <img src={qrMap[order.id]} alt="Order QR" className="h-24 w-24" />
                        ) : (
                          <QrCode className="w-6 h-6" />
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary'}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Order #{order.id}</span>
                      </div>
                      <div className="text-sm font-semibold">₹{order.total_amount}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{order.address}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Items:</span>
                          <ul className="list-disc list-inside mt-1">
                            {order.items.map((item: string, idx: number) => (
                              <li key={idx} className="text-muted-foreground">{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">ETA: {order.eta}</span>
                        </div>
                      </div>
                    </div>
                    {order.status === 'out_for_delivery' && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowLiveTracking(prev => !prev)} className="flex-1">
                          <Navigation className="w-4 h-4 mr-2" />
                          {showLiveTracking ? 'Hide' : 'Show'} Live Tracking
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {showLiveTracking && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-6 h-6" /> Live Tracking
                  <span className="ml-auto text-sm text-muted-foreground">ETA: <span className="font-semibold text-foreground">{etaMinutes} min</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="map-wrapper w-full h-[400px] rounded-lg overflow-hidden border">
                  {/* @ts-ignore */}
                  <MapContainer center={pickup} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={destination}><Popup>Destination: You</Popup></Marker>
                    {route.length > 0 && <Polyline positions={route} pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.8 }} />}
                    {/* @ts-ignore */}
                    <Marker position={position} icon={truckIcon as any}><Popup>Current Location</Popup></Marker>
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
      
      {/* Review Section */}
      <Card className="shadow-soft container mx-auto px-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
                              <MessageCircle className="w-6 h-6" />            Share Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowReview(!showReview)}>{showReview ? 'Hide' : 'Write a'} Review</Button>
          {showReview && (<>
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">
              How was your ration delivery?
            </p>
            
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="icon"
                  className="tap-target"
                  onClick={() => handleRating(star)}
                >
                  <Star 
                    className={`w-6 h-6 ${
                      rating && star <= rating 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                </Button>
              ))}
            </div>

            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant={rating === 1 ? "default" : "outline"}
                onClick={() => handleRating(1)}
                className="tap-target"
              >
                <ThumbsDown className="w-6 h-6 mr-2" />
                Poor
              </Button>
              <Button
                variant={rating === 5 ? "default" : "outline"}
                onClick={() => handleRating(5)}
                className="tap-target"
              >
                <ThumbsUp className="w-6 h-6 mr-2" />
                Excellent
              </Button>
            </div>

            {rating && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Tell us more about your experience..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-[100px] text-lg"
                />
                <Button 
                  onClick={handleSubmitReview}
                  className="w-full tap-target"
                  disabled={!reviewText.trim()}
                >
                  Submit Review
                </Button>
              </div>
            )}
          </div>
          </>)}

          {/* Chatbot Section */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-primary" />
                <span className="text-lg font-medium">Need Help?</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowChatbot(!showChatbot)}
                className="tap-target"
              >
                {showChatbot ? 'Hide Chat' : 'Start Chat'}
              </Button>
            </div>

            {showChatbot && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      <Bot className="w-6 h-6 mx-auto mb-2" />
                      <p>Hello! I'm here to help with your ration delivery questions.</p>
                      <p className="text-sm mt-1">Traditional Values • Modern Technology</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border border-border'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 min-h-[60px] text-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                    className="tap-target"
                  >
                    <Send className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Authentication Dialog (Demo) */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Identity Verification (Demo)
            </DialogTitle>
            <DialogDescription>
              This is a demo verification. Tap the button below to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Simulated verification: no real data is checked.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => { setShowAuthDialog(false); navigate('/cart'); }}>Simulate Verification & Continue</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;
