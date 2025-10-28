import { useTranslation } from "react-i18next";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, Phone, Navigation, Package, User, Truck } from "lucide-react";

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
    customerPhone: '+91 98765 43210',
    driver: 'R. Kumar',
    driverPhone: '+91 87654 32109',
    address: '123 MG Road, Angamaly, Kerala 683572',
    items: ['Rice (5kg)', 'Wheat (3kg)', 'Sugar (2kg)'],
    total: 450,
    eta: '18 mins',
  },
  {
    id: 'ORD002',
    status: 'approved',
    customer: 'Priya Sharma',
    customerPhone: '+91 87654 32109',
    driver: 'S. Patel',
    driverPhone: '+91 76543 21098',
    address: '456 Market Road, Angamaly, Kerala 683572',
    items: ['Rice (3kg)', 'Dal (2kg)'],
    total: 320,
    eta: '30 mins',
  },
  {
    id: 'ORD003',
    status: 'pending',
    customer: 'Amit Singh',
    customerPhone: '+91 99876 54321',
    driver: 'P. Sharma',
    driverPhone: '+91 88765 43210',
    address: '789 Junction Road, Angamaly, Kerala 683572',
    items: ['Wheat (4kg)', 'Rice (2kg)', 'Sugar (1kg)'],
    total: 380,
    eta: 'N/A',
  }
];

export default function OrdersAdmin() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="gradient-gold text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package className="icon-lg" />
              {t("nav.orders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoOrders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 space-y-3 card-vibrant shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary'}>
                        {order.status === 'out_for_delivery' ? t("order.status.outForDelivery") : t("order.status.pending")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{t("order.orderId", { id: order.id })}</span>
                    </div>
                    <div className="text-sm font-semibold">₹{order.total}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{order.customer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${order.customerPhone}`} className="text-sm text-blue-600 hover:underline">{order.customerPhone}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.address}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">{t("order.items")}:</span>
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
                        <span className="text-sm">{t("order.eta")}: {order.eta}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Driver: {order.driver}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${order.driverPhone}`} className="text-sm text-blue-600 hover:underline">{order.driverPhone}</a>
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
                      <a href={`tel:${order.driverPhone}`}>
                        <Phone className="w-4 h-4 mr-2" /> Contact Driver
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <a href={`tel:${order.customerPhone}`}>
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
