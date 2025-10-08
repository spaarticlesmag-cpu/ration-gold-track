import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Truck, CheckCircle, Phone, Navigation, Package, User } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';

// Demo coordinates (Chennai area)
const pickup: LatLngExpression = [13.0827, 80.2707];
const destination: LatLngExpression = [13.0359, 80.2449];

// Create truck icon
const truckIcon = new L.DivIcon({
  html: '<div style="font-size:22px">🚚</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Demo order data
const demoOrders = [
  {
    id: 'ORD001',
    status: 'out_for_delivery',
    customer: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    address: '123 MG Road, Angamaly, Kerala 683572',
    items: ['Rice (5kg)', 'Wheat (3kg)', 'Sugar (2kg)'],
    total: 450,
    delivery_fee: 25,
    eta: '18 mins',
    driver: 'R. Kumar',
    driver_phone: '+91 87654 32109'
  },
  {
    id: 'ORD002',
    status: 'out_for_delivery',
    customer: 'Priya Sharma',
    phone: '+91 87654 32109',
    address: '456 Market Road, Angamaly, Kerala 683572',
    items: ['Rice (3kg)', 'Dal (2kg)'],
    total: 320,
    delivery_fee: 20,
    eta: '12 mins',
    driver: 'S. Patel',
    driver_phone: '+91 76543 21098'
  }
];

export default function Track() {
  const [route, setRoute] = useState<LatLngExpression[]>([]);
  const [position, setPosition] = useState<LatLngExpression>(pickup);
  const [etaMinutes, setEtaMinutes] = useState<number>(18);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const progressRef = useRef<number>(0);

  // Generate a simple interpolated route between pickup and destination
  const generatedRoute = useMemo(() => {
    const [lat1, lon1] = pickup as [number, number];
    const [lat2, lon2] = destination as [number, number];
    const points: LatLngExpression[] = [];
    const steps = 60; // smoother path
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = lat1 + (lat2 - lat1) * t;
      const lon = lon1 + (lon2 - lon1) * t;
      points.push([lat, lon]);
    }
    return points;
  }, []);

  useEffect(() => {
    setRoute(generatedRoute);
  }, [generatedRoute]);

  // Animate marker along the route
  useEffect(() => {
    if (route.length === 0) return;
    const interval = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 1, route.length - 1);
      const idx = progressRef.current;
      setPosition(route[idx]);
      const remaining = route.length - 1 - idx;
      setEtaMinutes(Math.max(1, Math.ceil((remaining / route.length) * 18)));
    }, 500);
    return () => clearInterval(interval);
  }, [route]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="icon-lg" />
              Your Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoOrders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary'}>
                        {order.status === 'out_for_delivery' ? 'Out for Delivery' : order.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Order #{order.id}</span>
                    </div>
                    <div className="text-sm font-semibold">₹{order.total}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{order.customer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.phone}</span>
                      </div>
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
                    <Button variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Driver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {showLiveTracking && (
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="icon-lg" />
                Live Order Tracking
              </CardTitle>
              <div className="text-sm text-muted-foreground">ETA: <span className="font-semibold text-foreground">{etaMinutes} min</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="map-wrapper w-full h-[380px] md:h-[460px] rounded-lg overflow-hidden border border-border">
                <MapContainer center={pickup} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Pickup Marker */}
                  <Marker position={pickup}>
                    <Popup>
                      <div className="text-sm"><span className="font-medium">Pickup</span><br/>Warehouse</div>
                    </Popup>
                  </Marker>

                  {/* Destination Marker */}
                  <Marker position={destination}>
                    <Popup>
                      <div className="text-sm"><span className="font-medium">Destination</span><br/>Beneficiary</div>
                    </Popup>
                  </Marker>

                  {/* Route */}
                  {route.length > 0 && (
                    <Polyline positions={route} pathOptions={{ color: '#f59e0b', weight: 6, opacity: 0.8 }} />
                  )}

                  {/* Moving Truck */}
                  <Marker position={position} icon={truckIcon}>
                    <Popup>
                      <div className="text-sm">
                        Driver: R. Kumar<br/>
                        Current Location<br/>
                        ETA: {etaMinutes} min
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  Driver at: <span className="font-medium text-foreground">{Array.isArray(position) ? `${(position as [number, number])[0].toFixed(4)}, ${(position as [number, number])[1].toFixed(4)}` : ''}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">View All Orders</Button>
                  <Button className="shadow-gold">Contact Driver</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}


