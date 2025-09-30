import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
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

export default function Track() {
  const [route, setRoute] = useState<LatLngExpression[]>([]);
  const [position, setPosition] = useState<LatLngExpression>(pickup);
  const [etaMinutes, setEtaMinutes] = useState<number>(18);
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
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="icon-lg" />
            Live Order Tracking
          </CardTitle>
          <div className="text-sm text-muted-foreground">ETA: <span className="font-semibold text-foreground">{etaMinutes} min</span></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full h-[380px] md:h-[460px] rounded-lg overflow-hidden border border-border">
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
    </MainLayout>
  );
}


