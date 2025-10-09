import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, Navigation, Package, User } from "lucide-react";

const demoOrders = [
  {
    id: 'ORD001',
    status: 'out_for_delivery',
    customer: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    address: '123 MG Road, Angamaly, Kerala 683572',
    items: ['Rice (5kg)', 'Wheat (3kg)', 'Sugar (2kg)'],
    total: 450,
    eta: '18 mins',
  },
  {
    id: 'ORD002',
    status: 'approved',
    customer: 'Priya Sharma',
    phone: '+91 87654 32109',
    address: '456 Market Road, Angamaly, Kerala 683572',
    items: ['Rice (3kg)', 'Dal (2kg)'],
    total: 320,
    eta: '30 mins',
  }
];

export default function OrdersDelivery() {
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
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{order.customer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${order.phone}`} className="text-sm text-blue-600 hover:underline">{order.phone}</a>
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
                    <Button asChild variant="outline" className="flex-1">
                      <a href={`tel:${order.phone}`}>
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


