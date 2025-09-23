import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const recentOrders = [
    { id: "ORD001", date: "2024-01-15", items: "Rice (5kg), Wheat (3kg)", status: "Delivered", amount: 167.25 },
    { id: "ORD002", date: "2023-12-20", items: "Rice (5kg), Sugar (1kg)", status: "Delivered", amount: 162.50 },
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


