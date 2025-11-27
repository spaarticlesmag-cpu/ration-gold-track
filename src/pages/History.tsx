import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const recentOrders = [
    { id: "ORD098", date: "2024-11-25", items: "Rice (5kg), Toor Dal (2kg), Tea Powder (1kg)", status: "Delivered", amount: 543.75 },
    { id: "ORD097", date: "2024-11-20", items: "Wheat Flour (3kg), Sugar (1kg), Cooking Oil (1L)", status: "Delivered", amount: 312.50 },
    { id: "ORD096", date: "2024-11-15", items: "Rice (4kg), Iodized Salt (2kg)", status: "Delivered", amount: 238.00 },
    { id: "ORD095", date: "2024-11-10", items: "Toor Dal (1kg), Tea Powder (500g), Sugar (500g)", status: "Delivered", amount: 187.50 },
    { id: "ORD094", date: "2024-11-05", items: "Cooking Oil (2L), Wheat Flour (2kg)", status: "Delivered", amount: 428.00 },
    { id: "ORD093", date: "2024-10-30", items: "Rice (5kg), Cooking Oil (1L), Sugar (2kg)", status: "Delivered", amount: 498.75 },
    { id: "ORD092", date: "2024-10-25", items: "Rice (3kg), Wheat Flour (4kg), Toor Dal (2kg)", status: "Delivered", amount: 487.25 },
    { id: "ORD091", date: "2024-10-20", items: "Sugar (1kg), Tea Powder (1kg), Iodized Salt (1kg)", status: "Delivered", amount: 283.00 },
  ];
  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <div className="font-medium">Order #{order.id}</div>
                  <div className="text-sm text-muted-foreground">{order.items}</div>
                  <div className="text-sm text-muted-foreground">{order.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{order.amount.toFixed(2)}</div>
                  <Badge variant="secondary" className="text-xs">{order.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
