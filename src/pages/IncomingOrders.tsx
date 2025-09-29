import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NavHeader } from '@/components/NavHeader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, CheckCircle, XCircle, User, Phone, MapPin, Clock } from 'lucide-react';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_address: string;
  created_at: string;
  profiles?: {
    full_name: string;
    mobile_number: string;
  } | null;
}

const IncomingOrders = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

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
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as unknown as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast({ title: 'Order Updated', description: `Order ${orderId} marked ${status}` });
    } catch (error) {
      console.error('Error updating order status', error);
      toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
    }
  };

  const pending = orders.filter(o => o.status === 'pending');
  const approved = orders.filter(o => o.status === 'approved');

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'outline',
      approved: 'secondary',
      out_for_delivery: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

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
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Incoming Orders</h1>
          </div>
          <p className="text-muted-foreground">Review and approve incoming orders. Authentication is via admin session.</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pending.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No pending orders</CardContent></Card>
            ) : pending.map(order => (
              <Card key={order.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      <CardTitle>Order #{order.id.slice(0,8)}</CardTitle>
                    </div>
                    <CardDescription>{new Date(order.created_at).toLocaleString('en-IN')}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>{order.profiles?.full_name || 'Unknown'}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{order.profiles?.mobile_number || '—'}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span className="text-sm text-muted-foreground">{order.delivery_address}</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" />Placed {new Date(order.created_at).toLocaleDateString('en-IN')}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => updateStatus(order.id, 'cancelled')}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                      <Button className="gradient-gold" onClick={() => updateStatus(order.id, 'approved')}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approved.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No approved orders</CardContent></Card>
            ) : approved.map(order => (
              <Card key={order.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      <CardTitle>Order #{order.id.slice(0,8)}</CardTitle>
                    </div>
                    <CardDescription>{new Date(order.created_at).toLocaleString('en-IN')}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>{order.profiles?.full_name || 'Unknown'}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{order.profiles?.mobile_number || '—'}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span className="text-sm text-muted-foreground">{order.delivery_address}</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Ready for assignment</div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => updateStatus(order.id, 'pending')}>Move to Pending</Button>
                      <Button onClick={() => updateStatus(order.id, 'out_for_delivery')}>Mark Out For Delivery</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IncomingOrders;


