import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Navigation, Package } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { useMemo, useRef, useState, useEffect } from 'react';

// Demo coordinates (Angamaly area approximation)
const pickup: LatLngExpression = [10.1988, 76.3869];
const destination: LatLngExpression = [10.1965, 76.3912];

const truckIcon = new L.DivIcon({
  html: '<div style="font-size:22px">🚚</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const demoOrders = [
  {
    id: 'ORD001',
    status: 'out_for_delivery',
    customer: 'You',
    phone: '',
    address: '123 MG Road, Angamaly, Kerala 683572',
    items: ['Rice (5kg)', 'Wheat (3kg)', 'Sugar (2kg)'],
    total: 450,
    eta: '18 mins',
  },
  {
    id: 'ORD002',
    status: 'approved',
    customer: 'You',
    phone: '',
    address: '456 Market Road, Angamaly, Kerala 683572',
    items: ['Rice (3kg)', 'Dal (2kg)'],
    total: 320,
    eta: '30 mins',
  }
];

export default function OrdersCustomer() {
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [route, setRoute] = useState<LatLngExpression[]>([]);
  const [position, setPosition] = useState<LatLngExpression>(pickup);
  const [etaMinutes, setEtaMinutes] = useState<number>(18);
  const progressRef = useRef<number>(0);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="icon-lg" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoOrders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary'}>
                        {order.status === 'out_for_delivery' ? 'Out for Delivery' : 'Pending'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Order #{order.id}</span>
                    </div>
                    <div className="text-sm font-semibold">₹{order.total}</div>
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
                          {order.items.map((item, idx) => (
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
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowLiveTracking(!showLiveTracking)}
                      className="flex-1"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      {showLiveTracking ? 'Hide' : 'Show'} Live Tracking
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {showLiveTracking && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="icon-lg" /> Live Tracking
                <span className="ml-auto text-sm text-muted-foreground">ETA: <span className="font-semibold text-foreground">{etaMinutes} min</span></span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="map-wrapper w-full h-[380px] md:h-[460px] rounded-lg overflow-hidden border border-border">
                <MapContainer center={pickup} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={pickup}><Popup>Pickup: Warehouse</Popup></Marker>
                  <Marker position={destination}><Popup>Destination: You</Popup></Marker>
                  {route.length > 0 && (
                    <Polyline positions={route} pathOptions={{ color: '#ef4444', weight: 6, opacity: 0.8 }} />
                  )}
                  <Marker position={position} icon={truckIcon}>
                    <Popup>Current Location</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}


