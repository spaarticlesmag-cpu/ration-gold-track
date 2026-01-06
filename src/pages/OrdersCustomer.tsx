import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Package, Navigation, Store, CheckCircle, Truck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavHeader } from "@/components/NavHeader";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
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

const OrdersCustomer = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [route, setRoute] = useState<LatLngExpression[]>([]);
  const [position, setPosition] = useState<LatLngExpression>(pickup);
  const [etaMinutes, setEtaMinutes] = useState<number>(18);
  const progressRef = useRef<number>(0);

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

  // Load dummy orders from localStorage (demo) and generate QR images
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('orders') || '[]');
      if (Array.isArray(stored) && stored.length) {
        setOrders(stored);
      } else {
        const demoOrders = [
          {
            id: 'ORD-CUSTOMER-001',
            status: 'out_for_delivery',
            address: '123 MG Road, Angamaly, Kerala',
            items: ['Premium Rice (10kg)', 'Wheat Flour (5kg)', 'Sugar (2kg)'],
            total_amount: 1250,
            eta: '15 mins',
            qr_code: JSON.stringify({ orderId: 'ORD-CUSTOMER-001', exp: Date.now() + 3600000 }),
            qr_expires_at: new Date(Date.now() + 3600000).toISOString(),
            order_date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            delivery_partner: 'Raj Delivery Services'
          },
          {
            id: 'ORD-CUSTOMER-002',
            status: 'delivered',
            address: '456 Market Road, Angamaly, Kerala',
            items: ['Premium Rice (8kg)', 'Cooking Oil (2L)'],
            total_amount: 850,
            eta: 'Delivered',
            qr_code: null,
            qr_expires_at: null,
            order_date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            delivery_partner: 'Express Delivery'
          },
          {
            id: 'ORD-CUSTOMER-003',
            status: 'preparing',
            address: '789 Railway Station Road, Angamaly, Kerala',
            items: ['Wheat Flour (8kg)', 'Sugar (3kg)', 'Dal (2kg)'],
            total_amount: 1080,
            eta: 'Ready in 45 mins',
            qr_code: null,
            qr_expires_at: null,
            order_date: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
            delivery_partner: 'FastTrack Logistics'
          },
          {
            id: 'ORD-CUSTOMER-004',
            status: 'confirmed',
            address: '321 Temple Road, Angamaly, Kerala',
            items: ['Premium Rice (5kg)', 'Sugar (1kg)'],
            total_amount: 650,
            eta: 'Processing',
            qr_code: null,
            qr_expires_at: null,
            order_date: new Date(Date.now() - 900000).toISOString(), // 15 min ago
            delivery_partner: 'Priority Delivery'
          }
        ];
        setOrders(demoOrders);
        localStorage.setItem('orders', JSON.stringify(demoOrders));
      }
    } catch (error) {
      logger.error('Error loading orders:', error);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'preparing':
        return <Package className="w-5 h-5 text-orange-600" />;
      case 'confirmed':
        return <Store className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream overflow-x-hidden">
      <NavHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track your ration delivery orders and view order history</p>
        </div>

        <div className="space-y-6">
          {orders.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">You haven't placed any orders yet. Start shopping to see your orders here!</p>
                <Button asChild className="gap-2">
                  <a href="/shop">
                    <Store className="w-4 h-4" />
                    Start Shopping
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="shadow-soft hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.order_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`mb-2 ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <p className="text-lg font-bold text-primary">₹{order.total_amount}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {order.qr_code && order.qr_expires_at && order.status !== 'delivered' && (
                    <div className="bg-muted/40 p-4 rounded-lg border-2 border-dashed border-primary/20">
                      {order.fulfillment_type === 'pickup' ? (
                        <QRCodeDisplay
                          qrData={order.qr_code}
                          orderId={order.id}
                          shopLocation={order.shop_location || 'Nearest Ration Shop'}
                          expiresAt={order.qr_expires_at}
                          fulfillmentType="pickup"
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              <div className="font-medium text-primary">
                                {order.payment_method === 'cod' ? 'Show QR to Delivery Partner for COD Payment' : 'Show this QR to Delivery Partner'}
                              </div>
                              <div className="text-muted-foreground">
                                Expires in {Math.ceil((new Date(order.qr_expires_at).getTime() - Date.now()) / (1000 * 60))} minutes
                              </div>
                            </div>
                          </div>
                          {qrMap[order.id] ? (
                            <img
                              src={qrMap[order.id]}
                              alt="Order QR"
                              className="h-20 w-20 rounded-lg border-2 border-white shadow-lg"
                            />
                          ) : (
                            <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium">Delivery Address</div>
                          <div className="text-muted-foreground">{order.address}</div>
                          {order.delivery_partner && (
                            <div className="text-xs text-muted-foreground mt-1">Delivered by: {order.delivery_partner}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">Status</div>
                          <div className="text-muted-foreground">{order.eta}</div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <div className="font-medium mb-2">Order Items</div>
                        <ul className="text-muted-foreground space-y-1">
                          {order.items.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2">
                              <ArrowRight className="w-3 h-3" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {order.status === 'out_for_delivery' && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowLiveTracking(prev => !prev)}
                        className="w-full gap-2 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Navigation className="w-4 h-4" />
                        {showLiveTracking ? 'Hide Live Tracking' : 'Show Live Tracking'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {showLiveTracking && (
          <Card className="mt-6 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-6 h-6" /> Live Delivery Tracking
                <span className="ml-auto text-sm text-muted-foreground">
                  ETA: <span className="font-semibold text-foreground">{etaMinutes} min</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="map-wrapper w-full h-[400px] rounded-lg overflow-hidden border">
                {/* @ts-ignore */}
                <MapContainer center={pickup} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={destination}><Popup>Your Location</Popup></Marker>
                  {route.length > 0 && <Polyline positions={route} pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.8 }} />}
                  {/* @ts-ignore */}
                  <Marker position={position} icon={truckIcon}><Popup>Current Location of Delivery Partner</Popup></Marker>
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrdersCustomer;
