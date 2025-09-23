import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function Track() {
  return (
    <MainLayout>
      <Card>
        <CardHeader>
          <CardTitle>Track Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active deliveries at the moment</p>
            <Button variant="outline" className="mt-4">View All Orders</Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}


