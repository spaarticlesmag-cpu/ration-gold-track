import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, Phone, Navigation, Package, User } from "lucide-react";

const getItemImage = (item: string) => {
  const itemName = item.toLowerCase();
  if (itemName.includes('rice')) return '/src/assets/rice.jpg';
  if (itemName.includes('wheat')) return '/src/assets/wheat.jpg';
  if (itemName.includes('sugar')) return '/src/assets/sugar.jpg';
  return '/placeholder.svg';
};

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
    items: ['Rice (3kg)', 'Dal (2kg)', 'Sugar (1kg)'],
    total: 320,
    eta: '30 mins',
  },
  {
    id: 'ORD003',
    status: 'out_for_delivery',
    customer: 'Amit Singh',
    phone: '+91 99876 54321',
    address: '789 Junction Road, Angamaly, Kerala 683572',
    items: ['Wheat (4kg)', 'Rice (2kg)'],
    total: 280,
    eta: '12 mins',
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
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 border rounded-md">
                              <img src={getItemImage(item)} alt={item} className="w-8 h-8 rounded object-cover" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">ETA: {order.eta}</span>
                      </div>
                    </div>
                  </div>
                  {order.status === 'out_for_delivery' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Delivery Progress</span>
                        <span>80%</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button asChild variant="outline" className="w-full sm:flex-1">
                      <a href={`tel:${order.phone}`}>
                        <Phone className="w-4 h-4 mr-2" /> Call Customer
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full sm:flex-1">
                      <Navigation className="w-4 h-4 mr-2" /> Navigate to Location
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
