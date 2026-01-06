import { useEffect, useState } from "react";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Clock, Phone, Navigation, Package, User, Truck, AlertTriangle, Shield, AlertCircle, CheckCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { checkStockAvailability, reserveStock, getStoreById } from "@/lib/store-service";
import { triggerAudit, getAuditDashboardData, type AuditReport } from "@/lib/ai-auditor";

const getItemImage = (item: string) => {
  const itemName = item.toLowerCase();
  // Use direct imports for Vite to correctly handle assets
  if (itemName.includes('rice')) {
    const riceImg = new URL('/src/assets/rice.jpg', import.meta.url).href;
    return riceImg;
  }
  if (itemName.includes('wheat')) return new URL('/src/assets/wheat.jpg', import.meta.url).href;
  if (itemName.includes('sugar')) return new URL('/src/assets/sugar.jpg', import.meta.url).href;
  return '/placeholder.svg';
};

interface Order {
  id: string;
  status: string;
  profiles: { full_name: string; mobile_number: string; } | null;
  delivery_address: string;
  items: string[];
  total_amount: number;
  eta?: string;
  driver?: { full_name: string; mobile_number: string; } | null;
  fulfillment_type?: 'delivery' | 'pickup';
  payment_method?: 'online' | 'cod';
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [auditDashboard, setAuditDashboard] = useState<any>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      // First try to get from Supabase
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_customer_id_fkey(full_name, mobile_number),
          driver:profiles!orders_delivery_partner_id_fkey(full_name, mobile_number)
        `)
        .order('created_at', { ascending: false });

      let allOrders = data ? (data as any[]) : [];

      // Also load demo orders from localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('orders') || '[]');
        if (Array.isArray(stored) && stored.length > 0) {
          // Merge with Supabase orders, avoiding duplicates
          const existingIds = new Set(allOrders.map(o => o.id));
          const newOrders = stored.filter(o => !existingIds.has(o.id));
          allOrders = [...allOrders, ...newOrders];
        } else {
          // Add some dummy orders for admin demo
          const dummyOrders = [
            {
              id: 'ORD-ADMIN-001',
              customer_id: 'demo-user-1',
              status: 'pending',
              delivery_address: '123 MG Road, Angamaly, Kerala',
              total_amount: 1250,
              created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
              items: ['Premium Rice (10kg)', 'Wheat Flour (5kg)', 'Sugar (2kg)'],
              fulfillment_type: 'delivery',
              payment_method: 'online',
              profiles: { full_name: 'Rajesh Kumar', mobile_number: '+91 98765 43210' },
              driver: null,
              eta: 'Processing'
            },
            {
              id: 'ORD-ADMIN-002',
              customer_id: 'demo-user-2',
              status: 'pending',
              delivery_address: 'Pickup at Ration Shop',
              total_amount: 850,
              created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
              items: ['Premium Rice (8kg)', 'Cooking Oil (2L)'],
              fulfillment_type: 'pickup',
              payment_method: 'cod',
              profiles: { full_name: 'Priya Sharma', mobile_number: '+91 87654 32109' },
              driver: null,
              eta: 'Ready for pickup'
            },
            {
              id: 'ORD-ADMIN-003',
              customer_id: 'demo-user-3',
              status: 'approved',
              delivery_address: '456 Market Road, Angamaly, Kerala',
              total_amount: 2100,
              created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
              items: ['Premium Rice (15kg)', 'Wheat Flour (10kg)', 'Sugar (5kg)', 'Cooking Oil (5L)'],
              fulfillment_type: 'delivery',
              payment_method: 'online',
              profiles: { full_name: 'Amit Patel', mobile_number: '+91 76543 21098' },
              driver: { full_name: 'Ravi Kumar', mobile_number: '+91 91234 56789' },
              eta: '45 mins'
            },
            {
              id: 'ORD-ADMIN-004',
              customer_id: 'demo-user-4',
              status: 'out_for_delivery',
              delivery_address: '789 Temple Road, Angamaly, Kerala',
              total_amount: 1650,
              created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
              items: ['Premium Rice (12kg)', 'Wheat Flour (8kg)', 'Sugar (3kg)'],
              fulfillment_type: 'delivery',
              payment_method: 'cod',
              profiles: { full_name: 'Sunita Devi', mobile_number: '+91 65432 10987' },
              driver: { full_name: 'Mohan Singh', mobile_number: '+91 89876 54321' },
              eta: '15 mins'
            }
          ];
          allOrders = [...allOrders, ...dummyOrders];
          // Store in localStorage for demo
          localStorage.setItem('orders', JSON.stringify(dummyOrders));
        }
      } catch (error) {
        console.error('Error loading demo orders:', error);
      }

      // Sort by creation date (newest first)
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOrders(allOrders);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleApproveOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // For pickup orders, check stock availability at the selected store
    if (order.fulfillment_type === 'pickup') {
      try {
        // Parse items from the order (assuming format like "Premium Rice (10kg)")
        const parsedItems = order.items.map(item => {
          const match = item.match(/^(.+?)\s*\((\d+)(kg|L)\)$/);
          if (match) {
            const [, name, quantity, unit] = match;
            // Map item names to our inventory keys
            const itemKey = name.toLowerCase().includes('rice') ? 'rice' :
                           name.toLowerCase().includes('wheat') ? 'wheat' :
                           name.toLowerCase().includes('sugar') ? 'sugar' :
                           name.toLowerCase().includes('dal') ? 'dal' :
                           name.toLowerCase().includes('oil') ? 'oil' :
                           name.toLowerCase().includes('salt') ? 'salt' :
                           name.toLowerCase().includes('tea') ? 'tea' : 'other';

            return {
              id: itemKey,
              name: name.trim(),
              quantity: parseInt(quantity)
            };
          }
          return null;
        }).filter(Boolean) as Array<{ id: string; name: string; quantity: number }>;

        // Use default store for demo (in real app, this would come from order data)
        const stockCheck = checkStockAvailability('store-001', parsedItems);

        if (!stockCheck.available) {
          const unavailableList = stockCheck.unavailableItems.map(item =>
            `${item.name}: requested ${item.requested}, available ${item.available}`
          ).join('\n');

          alert(`Cannot approve order - Insufficient stock at selected store:\n\n${unavailableList}\n\nPlease select a different store or wait for stock replenishment.`);
          return;
        }

        // Reserve the stock
        const stockReserved = reserveStock('store-001', parsedItems);
        if (!stockReserved) {
          alert('Failed to reserve stock. Please try again.');
          return;
        }

        alert(`✅ Stock verified and reserved!\n\nOrder ${orderId.slice(0, 8)} has been approved for pickup.`);
      } catch (error) {
        console.error('Stock check error:', error);
        alert('Error checking stock availability. Please try again.');
        return;
      }
    }

    // Update order status to approved
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'approved', eta: 'Driver assignment pending' }
        : order
    );
    setOrders(updatedOrders);

    // Update localStorage
    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedStored = storedOrders.map((order: any) =>
      order.id === orderId
        ? { ...order, status: 'approved', eta: 'Driver assignment pending' }
        : order
    );
    localStorage.setItem('orders', JSON.stringify(updatedStored));
  };

  const handleRejectOrder = (orderId: string) => {
    if (confirm('Are you sure you want to reject this order?')) {
      // Update order status to cancelled
      const updatedOrders = orders.map(order =>
        order.id === orderId
          ? { ...order, status: 'cancelled' }
          : order
      );
      setOrders(updatedOrders);

      // Update localStorage
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedStored = storedOrders.map((order: any) =>
        order.id === orderId
          ? { ...order, status: 'cancelled' }
          : order
      );
      localStorage.setItem('orders', JSON.stringify(updatedStored));

      alert(`Order ${orderId.slice(0, 8)} has been rejected.`);
    }
  };

  const handleAssignDriver = (orderId: string) => {
    // Demo driver assignment - in real app, this would be more sophisticated
    const demoDrivers = [
      { full_name: 'Ravi Kumar', mobile_number: '+91 91234 56789' },
      { full_name: 'Mohan Singh', mobile_number: '+91 89876 54321' },
      { full_name: 'Suresh Patel', mobile_number: '+91 98765 12345' },
    ];

    const randomDriver = demoDrivers[Math.floor(Math.random() * demoDrivers.length)];

    // Update order with assigned driver
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? {
            ...order,
            status: 'out_for_delivery',
            driver: randomDriver,
            eta: '45 mins'
          }
        : order
    );
    setOrders(updatedOrders);

    // Update localStorage
    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedStored = storedOrders.map((order: any) =>
      order.id === orderId
        ? {
            ...order,
            status: 'out_for_delivery',
            driver: randomDriver,
            eta: '45 mins'
          }
        : order
    );
    localStorage.setItem('orders', JSON.stringify(updatedStored));

    alert(`Driver ${randomDriver.full_name} has been assigned to order ${orderId.slice(0, 8)}!`);
  };

  const handleRunAudit = async (storeId: string = 'store-001') => {
    setAuditLoading(true);
    try {
      const report = await triggerAudit(storeId);
      if (report) {
        setAuditReport(report);
        alert(`🤖 AI Audit completed!\n\nRisk Level: ${report.risk_score.toUpperCase()}\nCompliance: ${report.compliance_rate.toFixed(1)}%\nFlagged Orders: ${report.flagged_orders.length}`);
      } else {
        alert('Audit failed. Please try again.');
      }
    } catch (error) {
      console.error('Audit error:', error);
      alert('Error running audit. Please try again.');
    } finally {
      setAuditLoading(false);
    }
  };

  const loadAuditDashboard = () => {
    const dashboard = getAuditDashboardData();
    setAuditDashboard(dashboard);
  };

  useEffect(() => {
    loadAuditDashboard();
  }, []);

  if (loading) return <MainLayout><div>Loading orders...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="gradient-gold text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package className="icon-lg" />
              All Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg p-4 space-y-3 card-vibrant shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary' as any}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-sm font-semibold">₹{order.total_amount}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{order.profiles?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${order.profiles?.mobile_number}`} className="text-sm text-blue-600 hover:underline">{order.profiles?.mobile_number}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.delivery_address}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Items:</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 border rounded-md">
                              <img src={getItemImage(item)} alt={item} className="w-8 h-8 rounded object-cover" />
                              <span className="text-sm text-muted-foreground">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">ETA: {order.eta || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Driver: {order.driver?.full_name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${order.driver?.mobile_number}`} className="text-sm text-blue-600 hover:underline">{order.driver?.mobile_number || 'N/A'}</a>
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
                    {order.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleApproveOrder(order.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          ✓ Approve Order
                        </Button>
                        <Button
                          onClick={() => handleRejectOrder(order.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          ✗ Reject Order
                        </Button>
                      </>
                    )}
                    {order.status === 'approved' && !order.driver && (
                      <Button
                        onClick={() => handleAssignDriver(order.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        👤 Assign Driver
                      </Button>
                    )}
                    {order.driver && (
                      <>
                        <Button asChild variant="outline" className="flex-1">
                          <a href={`tel:${order.driver?.mobile_number}`}>
                            <Phone className="w-4 h-4 mr-2" /> Contact Driver
                          </a>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                          <a href={`tel:${order.profiles?.mobile_number}`}>
                            <Phone className="w-4 h-4 mr-2" /> Contact Customer
                          </a>
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Navigation className="w-4 h-4 mr-2" /> Navigate
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Auditor Section */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Shield className="icon-lg" />
              AI Auditor - Fraud Detection & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audit Dashboard */}
            {auditDashboard && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{auditDashboard.totalAudits}</div>
                    <div className="text-sm text-blue-700">Total Audits</div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{auditDashboard.averageCompliance?.toFixed(1)}%</div>
                    <div className="text-sm text-green-700">Avg Compliance</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{auditDashboard.criticalIssues}</div>
                    <div className="text-sm text-red-700">Critical Issues</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{auditDashboard.recentReports?.length || 0}</div>
                    <div className="text-sm text-yellow-700">Recent Reports</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Run Audit Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Run AI Audit
              </h3>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleRunAudit('store-001')}
                  disabled={auditLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {auditLoading ? '🔍 Auditing...' : '🤖 Run Audit for Angamaly Store'}
                </Button>
                <Button
                  onClick={() => handleRunAudit('store-002')}
                  disabled={auditLoading}
                  variant="outline"
                >
                  {auditLoading ? '🔍 Auditing...' : '🏪 Audit Aluva Store'}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                AI auditor checks beneficiary eligibility, quota compliance, unusual patterns, and suspicious transactions.
              </p>
            </div>

            {/* Latest Audit Report */}
            {auditReport && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Latest Audit Report
                </h3>

                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold mb-2">Audit Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div>Store: <span className="font-medium">{auditReport.store_id}</span></div>
                          <div>Period: <span className="font-medium">{auditReport.period}</span></div>
                          <div>Total Orders: <span className="font-medium">{auditReport.total_orders}</span></div>
                          <div>Total Amount: <span className="font-medium">₹{auditReport.total_amount.toLocaleString()}</span></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Risk Assessment</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              auditReport.risk_score === 'low' ? 'default' :
                              auditReport.risk_score === 'medium' ? 'secondary' :
                              auditReport.risk_score === 'high' ? 'destructive' : 'destructive'
                            }>
                              {auditReport.risk_score.toUpperCase()} RISK
                            </Badge>
                          </div>
                          <div>Compliance Rate: <span className="font-medium">{auditReport.compliance_rate.toFixed(1)}%</span></div>
                          <div>Flagged Orders: <span className="font-medium text-red-600">{auditReport.flagged_orders.length}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-sm text-gray-700">{auditReport.summary}</p>
                    </div>

                    {auditReport.flagged_orders.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-red-700">🚨 Flagged Issues</h4>
                        <div className="space-y-2">
                          {auditReport.flagged_orders.slice(0, 5).map((issue, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-red-800">{issue.description}</span>
                                <Badge variant={
                                  issue.severity === 'critical' ? 'destructive' :
                                  issue.severity === 'high' ? 'destructive' :
                                  issue.severity === 'medium' ? 'secondary' : 'outline'
                                }>
                                  {issue.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-red-700">{issue.evidence}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {auditReport.recommendations.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2 text-blue-700">💡 Recommendations</h4>
                        <ul className="space-y-1">
                          {auditReport.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
