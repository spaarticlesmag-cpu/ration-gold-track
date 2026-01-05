import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, QrCode, Navigation, Phone, Star, DollarSign, Timer, Camera, Route, Activity, Award, Target } from 'lucide-react';
import { NavHeader } from '@/components/NavHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    delivery_address: '123 MG Road, Angamaly, Kerala 683572',
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
    delivery_address: '456 Market Road, Angamaly, Kerala 683572',
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
    delivery_address: '789 Railway Station Road, Angamaly, Kerala 683572',
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
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      logger.error('Error fetching orders:', error);
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
      logger.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const openScanner = (order: Order) => {
    setSelectedOrder(order);
    setShowScanner(true);
    setScannedCode(null);
    setScanError(null);
  };

  const closeScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setShowScanner(false);
    setScannedCode(null);
    setScanError(null);
  };

  const startScanning = async () => {
    try {
      setScanError(null);
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      toast({ title: 'Scanner Ready', description: 'Point camera at customer QR' });
    } catch (err) {
      setScanning(false);
      setScanError('Camera access denied. Please grant permission.');
      toast({ title: 'Camera Error', description: 'Unable to access camera', variant: 'destructive' });
    }
  };

  const simulateScan = () => {
    if (!selectedOrder) return;
    const payload = selectedOrder.qr_code || JSON.stringify({ orderId: selectedOrder.id, exp: Date.now() + 1 });
    setScannedCode(payload);
    setScanning(false);
    toast({ title: 'QR Scanned', description: `Scanned a code for Order #${selectedOrder.id}` });
  };

  const confirmDeliveryAfterScan = async () => {
    if (!selectedOrder) return;
    if (!scannedCode) {
      setScanError('No QR code scanned yet.');
      return;
    }
    // Validate QR payload and expiry
    try {
      const parsed = JSON.parse(scannedCode);
      if (parsed.orderId !== selectedOrder.id) {
        setScanError('QR mismatch. Please scan the correct order QR.');
        return;
      }
      if (typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
        setScanError('QR expired. Ask customer to refresh their orders.');
        return;
      }
    } catch {
      setScanError('Invalid QR payload.');
      return;
    }
    await updateOrderStatus(selectedOrder.id, 'delivered');
    closeScanner();
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <NavHeader />

      {/* Delivery Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-pink-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Delivery Command Center
                </h1>
                <p className="text-red-100 text-lg">
                  Welcome back, {profile?.full_name || 'Delivery Partner'}! 🚀
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">₹{orders.reduce((sum, order) => sum + (order.delivery_fee || 0), 0)}</div>
              <div className="text-red-200">Today's Earnings</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                  <p className="text-3xl font-bold text-red-600">{assignedOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Orders</p>
                  <p className="text-3xl font-bold text-green-600">{availableOrders.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Delivery Time</p>
                  <p className="text-3xl font-bold text-pink-600">24m</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <Timer className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-orange-600">98%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Delivery Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Route Map */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Delivery Route Map
                </CardTitle>
                <CardDescription className="text-red-100">
                  Real-time tracking and route optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 rounded-b-lg">
                  {/* Route Header */}
                  <div className="p-6 border-b border-red-100 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Route className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-red-900">Optimized Delivery Route</h3>
                          <p className="text-sm text-red-700">Smart routing for maximum efficiency</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-red-100 text-red-800 border-red-200 mb-2">3 Active Stops</Badge>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Live Tracking Active
                        </div>
                      </div>
                    </div>

                    {/* Route Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/60 rounded-lg p-3 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-gray-600">Distance</span>
                        </div>
                        <p className="text-lg font-bold text-red-800">8.2 km</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Timer className="w-4 h-4 text-pink-500" />
                          <span className="text-xs font-medium text-gray-600">Est. Time</span>
                        </div>
                        <p className="text-lg font-bold text-red-800">45 min</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-medium text-gray-600">Earnings</span>
                        </div>
                        <p className="text-lg font-bold text-red-800">₹145</p>
                      </div>
                    </div>
                  </div>

                  {/* Route Visualization */}
                  <div className="p-6">
                    <div className="bg-white/80 rounded-xl p-4 border border-red-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800">Route Visualization</h4>
                        <Badge variant="outline" className="text-xs">Real-time</Badge>
                      </div>

                      {/* Clean Route Map */}
                      <div className="relative">
                        <svg viewBox="0 0 400 180" className="w-full h-44">
                          {/* Background grid for better visual appeal */}
                          <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />

                          {/* Route path with gradient */}
                          <defs>
                            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" style={{stopColor:'#EF4444', stopOpacity:1}} />
                              <stop offset="50%" style={{stopColor:'#EC4899', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'#DC2626', stopOpacity:1}} />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 50 140 Q 100 60 200 80 Q 300 100 350 140"
                            stroke="url(#routeGradient)"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                            className="drop-shadow-sm"
                          />

                          {/* Animated progress indicator */}
                          <circle r="6" fill="#10B981" stroke="#fff" strokeWidth="3" className="drop-shadow-md">
                            <animateMotion dur="8s" repeatCount="indefinite">
                              <path d="M 50 140 Q 100 60 200 80 Q 300 100 350 140" />
                            </animateMotion>
                            <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                          </circle>

                          {/* Delivery stops */}
                          <g className="drop-shadow-sm">
                            {/* Stop 1 - Pickup */}
                            <circle cx="50" cy="140" r="12" fill="#F59E0B" stroke="#fff" strokeWidth="3" />
                            <circle cx="50" cy="140" r="6" fill="#D97706" />
                            <text x="50" y="147" fontSize="10" fill="#fff" fontWeight="bold" textAnchor="middle">1</text>

                            {/* Stop 2 - Current */}
                            <circle cx="200" cy="80" r="14" fill="#DC2626" stroke="#fff" strokeWidth="4" className="animate-pulse" />
                            <circle cx="200" cy="80" r="8" fill="#B91C1C" />
                            <text x="200" y="87" fontSize="11" fill="#fff" fontWeight="bold" textAnchor="middle">2</text>

                            {/* Stop 3 - Next */}
                            <circle cx="350" cy="140" r="12" fill="#7C3AED" stroke="#fff" strokeWidth="3" />
                            <circle cx="350" cy="140" r="6" fill="#6D28D9" />
                            <text x="350" cy="140" r="6" fill="#6D28D9" />
                            <text x="350" y="147" fontSize="10" fill="#fff" fontWeight="bold" textAnchor="middle">3</text>
                          </g>

                          {/* Location labels */}
                          <text x="50" y="165" fontSize="12" fill="#374151" fontWeight="600" textAnchor="middle">Pickup Point</text>
                          <text x="200" y="105" fontSize="12" fill="#DC2626" fontWeight="700" textAnchor="middle">Current Location</text>
                          <text x="350" y="165" fontSize="12" fill="#374151" fontWeight="600" textAnchor="middle">Next Stop</text>
                        </svg>

                        {/* Route Progress Bar */}
                        <div className="mt-4 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className="bg-gradient-to-r from-red-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out" style={{width: '67%'}}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span>2 of 3 deliveries completed</span>
                          <span>67% route progress</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Actions */}
                  <div className="p-6 bg-white/95 border-t border-red-100">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        onClick={() => toast({ title: 'Navigation Started', description: 'Opening Google Maps with optimized route...' })}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Navigation
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                        onClick={() => toast({ title: 'Route Optimized', description: 'Route recalculated for traffic conditions!' })}
                      >
                        <Route className="w-4 h-4 mr-2" />
                        Optimize Route
                      </Button>
                      <Button
                        variant="outline"
                        className="border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400 transition-all duration-200"
                        onClick={() => toast({ title: 'Live Tracking Enabled', description: 'Location sharing activated for dispatcher...' })}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Live Tracking
                      </Button>
                      <Button
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                        onClick={() => toast({ title: 'Route Details Sent', description: 'Complete route information sent to your device.' })}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Route Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Active Deliveries */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {assignedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No active deliveries</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedOrders.map((order) => (
                      <div key={order.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-green-800">#{order.id}</span>
                          <Badge className="bg-green-500">Active</Badge>
                        </div>
                        <p className="text-sm text-green-700 font-medium mb-1">{order.profiles?.full_name}</p>
                        <p className="text-xs text-green-600 mb-2">{order.distance} • {order.estimated_time}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
                            onClick={() => openMap(order)}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Map
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openScanner(order)}
                          >
                            <QrCode className="w-3 h-3 mr-1" />
                            Scan
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    const availableOrders = orders.filter(order => order.status === 'approved');
                    if (availableOrders.length > 0) {
                      toast({
                        title: "New Orders Available",
                        description: `Found ${availableOrders.length} orders ready for pickup!`,
                      });
                    } else {
                      toast({
                        title: "No New Orders",
                        description: "Check back later for new delivery opportunities.",
                      });
                    }
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Browse New Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    toast({
                      title: "Emergency Contact",
                      description: "Calling dispatch center... 📞",
                    });
                    // In a real app, this would initiate a phone call
                    setTimeout(() => {
                      toast({
                        title: "Connected",
                        description: "Emergency line connected successfully.",
                      });
                    }, 2000);
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Emergency Contact
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    const completedOrders = orders.filter(order => order.status === 'delivered').length;
                    const totalEarnings = orders.reduce((sum, order) => sum + (order.delivery_fee || 0), 0);
                    const avgRating = 4.8; // Mock rating

                    toast({
                      title: "Performance Report",
                      description: `Completed: ${completedOrders} deliveries | Earnings: ₹${totalEarnings} | Rating: ${avgRating}⭐`,
                    });
                  }}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Performance Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    toast({
                      title: "Break Time",
                      description: "Break mode activated. You won't receive new orders for 30 minutes.",
                    });
                  }}
                >
                  <Timer className="w-4 h-4 mr-2" />
                  Take Break
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Orders Section */}
        {availableOrders.length > 0 && (
          <Card className="mt-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Available Delivery Opportunities ({availableOrders.length})
              </CardTitle>
              <CardDescription className="text-orange-100">
                Accept new orders to expand your delivery route
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableOrders.map((order) => (
                  <div key={order.id} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-orange-800">#{order.id}</span>
                      <Badge variant="secondary" className="bg-orange-500 text-white">₹{order.delivery_fee}</Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-blue-600">👤</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{order.profiles?.full_name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-gray-600">{order.distance}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-gray-600">{order.estimated_time}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Accept Delivery
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-red-500 opacity-30"></div>
                
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

        {/* QR Scanner Dialog */}
        <Dialog open={showScanner} onOpenChange={(o) => { if (!o) closeScanner(); }}>
          <DialogContent className="max-w-xl p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scan Customer QR — Order #{selectedOrder?.id}
              </DialogTitle>
              <DialogDescription>
                Ask the customer to show their QR in their app; scan to authenticate delivery.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 pt-0 space-y-4">
              {scanError && (
                <Alert variant="destructive">
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}
              <div className="map-wrapper w-full h-[320px] rounded-lg overflow-hidden border border-border bg-black/80 flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-white/70 mx-auto mb-3" />
                      <div className="text-white/80 text-sm">Start scanner to scan customer QR</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {!scanning ? (
                  <Button onClick={startScanning} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    <Camera className="w-4 h-4 mr-2" /> Start Scanner
                  </Button>
                ) : (
                  <Button onClick={() => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setScanning(false); }} variant="outline" className="flex-1">
                    Stop Scanner
                  </Button>
                )}
                <Button onClick={simulateScan} variant="secondary" className="flex-1">Simulate Scan</Button>
              </div>
              <div className="flex gap-3">
                <Button onClick={closeScanner} variant="outline" className="flex-1">Cancel</Button>
                <Button onClick={confirmDeliveryAfterScan} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={!scannedCode}>Confirm Delivery</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DeliveryDashboard;
