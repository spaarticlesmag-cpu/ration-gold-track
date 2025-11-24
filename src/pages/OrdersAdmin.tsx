import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, Phone, Navigation, Package, User, Truck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const getItemImage = (item: string) => {
  const itemName = item.toLowerCase();
  // Use direct imports for Vite to correctly handle assets
  if (itemName.includes('rice')) {
    const riceImg = new URL('/src/assets/rice.jpg', import.meta.url).href;
    return riceImg;
  }
  if (itemName.includes('wheat')) return new URL('/src/assets/wheat.jpg', import.meta.url).href;
  if (itemName.includes('sugar')) return new URL('/src/assets/sugar.jpg', import.meta.url).href;
  return '/placeholder.svg';
};

interface Order {
  id: string;
  status: string;
  profiles: { full_name: string; mobile_number: string; } | null;
  delivery_address: string;
  items: string[];
  total_amount: number;
  eta?: string;
  driver?: { full_name: string; mobile_number: string; } | null;
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_customer_id_fkey(full_name, mobile_number),
          driver:profiles!orders_delivery_partner_id_fkey(full_name, mobile_number)
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data as any[]);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  if (loading) return <MainLayout><div>Loading orders...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="gradient-gold text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package className="icon-lg" />
              All Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 space-y-3 card-vibrant shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary' as any}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-sm font-semibold">₹{order.total_amount}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{order.profiles?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${order.profiles?.mobile_number}`} className="text-sm text-blue-600 hover:underline">{order.profiles?.mobile_number}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.delivery_address}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Items:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 border rounded-md">
                              <img src={getItemImage(item)} alt={item} className="w-8 h-8 rounded object-cover" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">ETA: {order.eta || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Driver: {order.driver?.full_name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${order.driver?.mobile_number}`} className="text-sm text-blue-600 hover:underline">{order.driver?.mobile_number || 'N/A'}</a>
                      </div>
                    </div>
                  </div>
                  {order.status === 'out_for_delivery' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Delivery Progress</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button asChild variant="outline" className="flex-1">
                      <a href={`tel:${order.driver?.mobile_number}`}>
                        <Phone className="w-4 h-4 mr-2" /> Contact Driver
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <a href={`tel:${order.profiles?.mobile_number}`}>
                        <Phone className="w-4 h-4 mr-2" /> Contact Customer
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Navigation className="w-4 h-4 mr-2" /> Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
