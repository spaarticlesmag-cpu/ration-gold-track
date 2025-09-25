import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { NavHeader } from '@/components/NavHeader';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address: string;
  created_at: string;
  delivered_at?: string;
  qr_code?: string;
  qr_expires_at?: string;
  profiles?: {
    full_name: string;
    mobile_number: string;
  } | null;
}

const DeliveryDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_customer_id_fkey (
            full_name,
            mobile_number
          )
        `)
        .in('status', ['approved', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      await fetchOrders();
      
      toast({
        title: "Order Updated",
        description: `Order status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Clock },
      approved: { variant: 'secondary' as const, icon: Package },
      out_for_delivery: { variant: 'default' as const, icon: Truck },
      delivered: { variant: 'default' as const, icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const availableOrders = orders.filter(order => order.status === 'approved');
  const assignedOrders = orders.filter(order => order.status === 'out_for_delivery');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      <NavHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Delivery Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your delivery assignments and track orders
          </p>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit">
            <TabsTrigger value="available" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Available Orders ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              My Deliveries ({assignedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Orders Available</h3>
                  <p className="text-muted-foreground text-center">
                    There are no confirmed orders available for pickup at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableOrders.map((order) => (
                <Card key={order.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {order.delivery_address}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Customer</p>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles?.full_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contact</p>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles?.mobile_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Amount</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{order.total_amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Date</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full gradient-gold hover:opacity-90"
                      onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Accept Delivery
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            {assignedOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Truck className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Deliveries</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any active deliveries at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              assignedOrders.map((order) => (
                <Card key={order.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" />
                          {order.delivery_address}
                        </CardDescription>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Customer</p>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles?.full_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contact</p>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles?.mobile_number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Amount</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{order.total_amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Date</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    {order.qr_code && (
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <QrCode className="w-4 h-4" />
                          <span className="text-sm font-medium">Delivery QR Code</span>
                        </div>
                        <p className="text-sm font-mono text-muted-foreground break-all">
                          {order.qr_code}
                        </p>
                        {order.qr_expires_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires: {formatDate(order.qr_expires_at)}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      className="w-full gradient-gold hover:opacity-90"
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Delivered
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeliveryDashboard;