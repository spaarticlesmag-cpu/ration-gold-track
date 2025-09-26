import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, QrCode, Navigation, Phone, Star, DollarSign, Timer } from 'lucide-react';
import { NavHeader } from '@/components/NavHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  distance?: string;
  estimated_time?: string;
  items?: string[];
  delivery_fee?: number;
}

// Demo orders data
const demoOrders: Order[] = [
  {
    id: 'ORD001',
    customer_id: 'cust_001',
    total_amount: 450,
    status: 'approved',
    delivery_address: '123 MG Road, Bangalore, Karnataka 560001',
    created_at: new Date().toISOString(),
    profiles: {
      full_name: 'Rajesh Kumar',
      mobile_number: '+91 98765 43210'
    },
    distance: '2.5 km',
    estimated_time: '15 mins',
    items: ['Rice (5kg)', 'Wheat (3kg)', 'Sugar (2kg)'],
    delivery_fee: 25
  },
  {
    id: 'ORD002',
    customer_id: 'cust_002',
    total_amount: 320,
    status: 'approved',
    delivery_address: '456 Brigade Road, Bangalore, Karnataka 560025',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    profiles: {
      full_name: 'Priya Sharma',
      mobile_number: '+91 87654 32109'
    },
    distance: '1.8 km',
    estimated_time: '12 mins',
    items: ['Rice (3kg)', 'Dal (2kg)'],
    delivery_fee: 20
  },
  {
    id: 'ORD003',
    customer_id: 'cust_003',
    total_amount: 580,
    status: 'out_for_delivery',
    delivery_address: '789 Indiranagar, Bangalore, Karnataka 560038',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    profiles: {
      full_name: 'Amit Patel',
      mobile_number: '+91 76543 21098'
    },
    distance: '3.2 km',
    estimated_time: '18 mins',
    items: ['Rice (5kg)', 'Wheat (5kg)', 'Oil (1L)'],
    delivery_fee: 30
  }
];

const DeliveryDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Using demo orders instead of fetching from database
    setLoading(false);
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
      setOrders((data || []) as unknown as Order[]);
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

  const openMap = (order: Order) => {
    setSelectedOrder(order);
    setShowMap(true);
  };

  const closeMap = () => {
    setShowMap(false);
    setSelectedOrder(null);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Update local state for demo
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus as any,
                delivered_at: newStatus === 'delivered' ? new Date().toISOString() : order.delivered_at
              }
            : order
        )
      );
      
      toast({
        title: "Order Updated",
        description: `Order ${orderId} status updated to ${newStatus}`,
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
    <div className="min-h-screen bg-gray-50">
      <NavHeader />
      
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Hello, {profile?.full_name || 'Delivery Partner'}! 👋
              </h1>
              <p className="text-gray-600">
                You have {availableOrders.length} new orders and {assignedOrders.length} active deliveries
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">₹{orders.reduce((sum, order) => sum + (order.delivery_fee || 0), 0)}</div>
                <div className="text-sm text-gray-500">Today's Earnings</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit bg-white shadow-sm">
            <TabsTrigger value="available" className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Package className="w-4 h-4" />
              New Orders ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Truck className="w-4 h-4" />
              Active Deliveries ({assignedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No New Orders</h3>
                <p className="text-gray-500">
                  Check back later for new delivery opportunities!
                </p>
              </div>
            ) : (
              availableOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₹{order.total_amount}</div>
                        <div className="text-sm text-gray-500">Order Value</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Star className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{order.profiles?.full_name}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.profiles?.mobile_number}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-gray-900">Delivery Address</h4>
                            <p className="text-sm text-gray-600">{order.delivery_address}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {order.distance}
                              </span>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {order.estimated_time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items & Earnings */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Items to Deliver</h4>
                          <div className="space-y-1">
                            {order.items?.map((item, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">Delivery Fee</span>
                            <span className="text-lg font-bold text-green-600">₹{order.delivery_fee}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <Button 
                        onClick={() => openMap(order)}
                        variant="outline" 
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        View on Map
                      </Button>
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Accept Order
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            {assignedOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Deliveries</h3>
                <p className="text-gray-500">
                  You don't have any active deliveries at the moment.
                </p>
              </div>
            ) : (
              assignedOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Active Delivery Header */}
                  <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Truck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Active Delivery #{order.id}</h3>
                          <p className="text-sm text-gray-600">Out for delivery • {formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₹{order.total_amount}</div>
                        <div className="text-sm text-gray-500">Order Value</div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Info */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Star className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{order.profiles?.full_name}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.profiles?.mobile_number}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-gray-900">Delivery Address</h4>
                            <p className="text-sm text-gray-600">{order.delivery_address}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {order.distance}
                              </span>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {order.estimated_time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items & QR */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Items to Deliver</h4>
                          <div className="space-y-1">
                            {order.items?.map((item, index) => (
                              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">Delivery Fee</span>
                            <span className="text-lg font-bold text-orange-600">₹{order.delivery_fee}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                      <Button 
                        onClick={() => openMap(order)}
                        variant="outline" 
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Navigate
                      </Button>
                      <Button 
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Delivered
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Map Dialog */}
        <Dialog open={showMap} onOpenChange={setShowMap}>
          <DialogContent className="max-w-4xl h-[600px] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Location - Order #{selectedOrder?.id}
              </DialogTitle>
              <DialogDescription>
                Navigate to {selectedOrder?.delivery_address}
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 pt-0">
              {/* Mock Map - In a real app, you'd integrate with Google Maps or similar */}
              <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Location</h3>
                  <p className="text-gray-600 mb-4">{selectedOrder?.delivery_address}</p>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-4 h-4" />
                      {selectedOrder?.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      {selectedOrder?.estimated_time}
                    </span>
                  </div>
                </div>
                
                {/* Mock route line */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-orange-500 opacity-30"></div>
                
                {/* Current location marker */}
                <div className="absolute top-4 left-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                
                {/* Delivery location marker */}
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={closeMap}
                  variant="outline" 
                  className="flex-1"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Navigation Started",
                      description: "Opening in your default maps app...",
                    });
                    closeMap();
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Maps
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DeliveryDashboard;