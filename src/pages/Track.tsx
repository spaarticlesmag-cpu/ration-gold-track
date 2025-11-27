import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { NavHeader } from '@/components/NavHeader';
import {
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  Search,
  Navigation,
  Phone,
  RefreshCw,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import { SkeletonLoading } from '@/components/ui/skeleton-loading';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_delivery'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

interface OrderLocation {
  lat: number;
  lng: number;
  timestamp: Date;
  status: OrderStatus;
}

interface TrackedOrder {
  id: string;
  customer_name: string;
  items: string[];
  total_amount: number;
  status: OrderStatus;
  estimated_delivery: Date;
  delivery_partner?: {
    name: string;
    phone: string;
    vehicle_number: string;
  };
  current_location?: OrderLocation;
  locations: OrderLocation[];
  created_at: Date;
}

const Track = () => {
  const { profile } = useAuth();
  const [trackingId, setTrackingId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<TrackedOrder[]>([]);

  // Mock orders for demonstration
  const mockOrders: TrackedOrder[] = [
    {
      id: 'ORD001',
      customer_name: 'Rajesh Kumar',
      items: ['Rice (5kg)', 'Wheat (3kg)', 'Sugar (2kg)'],
      total_amount: 450,
      status: 'out_for_delivery',
      estimated_delivery: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
      delivery_partner: {
        name: 'Amit Singh',
        phone: '+91 98765 43210',
        vehicle_number: 'KA 01 AB 1234'
      },
      current_location: {
        lat: 12.9716,
        lng: 77.5946,
        timestamp: new Date(),
        status: 'out_for_delivery'
      },
      locations: [
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'confirmed' },
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), status: 'preparing' },
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), status: 'ready_for_delivery' },
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 30 * 60 * 1000), status: 'out_for_delivery' }
      ],
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: 'ORD002',
      customer_name: 'Priya Sharma',
      items: ['Rice (3kg)', 'Dal (2kg)'],
      total_amount: 320,
      status: 'delivered',
      estimated_delivery: new Date(Date.now() - 2 * 60 * 60 * 1000),
      locations: [
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), status: 'confirmed' },
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000), status: 'preparing' },
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), status: 'ready_for_delivery' },
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000), status: 'out_for_delivery' },
        { lat: 12.9716, lng: 77.5946, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'delivered' }
      ],
      created_at: new Date(Date.now() - 4 * 60 * 60 * 60 * 1000)
    }
  ];

  useEffect(() => {
    // Load recent orders for the logged-in user
    if (profile?.role === 'customer' && mockOrders.length > 0) {
      // Simulate getting user's recent orders
      const userOrders = mockOrders.slice(0, 3);
      setRecentOrders(userOrders.filter(order => order.status !== 'delivered').slice(0, 2));
    }
  }, [profile]);

  const trackOrder = async () => {
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackedOrder(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Find order by tracking ID
      const mockOrder = mockOrders.find(order =>
        order.id.toLowerCase().includes(trackingId.toLowerCase())
      );

      if (mockOrder) {
        setTrackedOrder(mockOrder);
      } else {
        setError('Order not found. Please check your tracking ID.');
      }
    } catch (err) {
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'out_for_delivery': return <Truck className="h-5 w-5 text-blue-600" />;
      case 'ready_for_delivery':
      case 'preparing': return <Clock className="h-5 w-5 text-orange-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'ready_for_delivery':
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 10;
      case 'confirmed': return 20;
      case 'preparing': return 40;
      case 'ready_for_delivery': return 60;
      case 'out_for_delivery': return 80;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
        <NavHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <SkeletonLoading variant="default" className="h-12 w-64 mx-auto mb-4" />
            <SkeletonLoading variant="default" className="h-6 w-96 mx-auto" />
          </div>
          <div className="max-w-3xl mx-auto">
            <SkeletonLoading variant="card" className="h-96 mb-8" />
            <SkeletonLoading variant="card" className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      <NavHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
            <p className="text-muted-foreground text-lg">
              Enter your order ID to track your ration delivery in real-time
            </p>
          </div>

          {/* Track Order Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Track Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="tracking-id">Order ID</Label>
                  <Input
                    id="tracking-id"
                    placeholder="Enter your order ID (e.g., ORD001)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="pt-7">
                  <Button onClick={trackOrder} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Track
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders for Customers */}
          {profile?.role === 'customer' && recentOrders.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Your Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setTrackingId(order.id);
                        setTrackedOrder(order);
                        setError(null);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{order.id}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {order.items.join(', ')}
                      </div>
                      <div className="text-sm font-medium">₹{order.total_amount}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracked Order Details */}
          {trackedOrder && (
            <div className="space-y-6">

              {/* Order Status Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Order {trackedOrder.id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {trackedOrder.customer_name} • {formatDateTime(trackedOrder.created_at)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(trackedOrder.status)} flex items-center gap-1`}>
                      {getStatusIcon(trackedOrder.status)}
                      {trackedOrder.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {trackedOrder.items.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        ₹{trackedOrder.total_amount}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {getProgressPercentage(trackedOrder.status)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {trackedOrder.status === 'delivered'
                          ? 'Delivered'
                          : formatTime(trackedOrder.estimated_delivery)
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trackedOrder.status === 'delivered' ? 'Status' : 'ETA'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{getProgressPercentage(trackedOrder.status)}% Complete</span>
                    </div>
                    <Progress value={getProgressPercentage(trackedOrder.status)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Partner Info */}
              {trackedOrder.delivery_partner && trackedOrder.status !== 'delivered' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Delivery Partner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{trackedOrder.delivery_partner.name}</div>
                          <div className="text-sm text-muted-foreground">Delivery Partner</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{trackedOrder.delivery_partner.phone}</div>
                          <div className="text-sm text-muted-foreground">Contact Number</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{trackedOrder.delivery_partner.vehicle_number}</div>
                          <div className="text-sm text-muted-foreground">Vehicle Number</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackedOrder.locations
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                      .map((location, index) => {
                        const isLatest = index === 0;
                        return (
                          <div key={index} className={`flex gap-4 ${isLatest ? 'font-medium' : ''}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isLatest ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                              {getStatusIcon(location.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={isLatest ? 'text-primary font-semibold' : ''}>
                                  {location.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatTime(location.timestamp)}
                                </span>
                              </div>
                              {isLatest && trackedOrder.current_location && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  Last updated: {formatDateTime(location.timestamp)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Refresh Button */}
              <div className="text-center">
                <Button variant="outline" onClick={trackOrder}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Tracking
                </Button>
              </div>
            </div>
          )}

          {/* No Order Found */}
          {!trackedOrder && !loading && trackingId && !error && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Order Found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find an order with ID "{trackingId}".<br />
                  Please check your order ID and try again.
                </p>
                <Button variant="outline" onClick={() => setTrackingId('')}>
                  Try Another ID
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Track;
