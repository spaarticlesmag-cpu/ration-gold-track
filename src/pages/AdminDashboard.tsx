import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Users, 
  TrendingUp, 
  ShoppingCart,
  Plus,
  Edit,
  Trash2,
  Eye,
  Crown
} from 'lucide-react';
import { NavHeader } from '@/components/NavHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RationItem {
  id: string;
  name: string;
  price_per_kg: number;
  stock_quantity: number;
  image_url?: string;
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: 'pending' | 'approved' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
  profiles?: {
    full_name: string;
    mobile_number: string;
  } | null;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  inventoryValue: number;
}

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<RationItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    inventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RationItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price_per_kg: '',
    stock_quantity: '',
    image_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchItems(),
        fetchOrders(),
        fetchStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('ration_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

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
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch order stats
      const { data: orderStats } = await supabase
        .from('orders')
        .select('total_amount, status');

      const totalOrders = orderStats?.length || 0;
      const totalRevenue = orderStats?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;

      // Fetch active customers count
      const { count: activeCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      // Calculate inventory value
      const inventoryValue = items.reduce((sum, item) => sum + (item.price_per_kg * item.stock_quantity), 0);

      setStats({
        totalOrders,
        totalRevenue,
        activeCustomers: activeCustomers || 0,
        inventoryValue,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveItem = async () => {
    try {
      const itemData = {
        name: formData.name,
        price_per_kg: parseFloat(formData.price_per_kg),
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: formData.image_url || null,
      };

      let error;
      if (selectedItem) {
        ({ error } = await supabase
          .from('ration_items')
          .update(itemData)
          .eq('id', selectedItem.id));
      } else {
        ({ error } = await supabase
          .from('ration_items')
          .insert([itemData]));
      }

      if (error) throw error;

      await fetchItems();
      setIsDialogOpen(false);
      resetForm();

      toast({
        title: selectedItem ? "Item Updated" : "Item Added",
        description: `Successfully ${selectedItem ? 'updated' : 'added'} ${formData.name}`,
      });
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: "Failed to save item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('ration_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await fetchItems();
      toast({
        title: "Item Deleted",
        description: "Item has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const openDialog = (item?: RationItem) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        price_per_kg: item.price_per_kg.toString(),
        stock_quantity: item.stock_quantity.toString(),
        image_url: item.image_url || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      price_per_kg: '',
      stock_quantity: '',
      image_url: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'outline',
      approved: 'secondary',
      out_for_delivery: 'default',
      delivered: 'default',
      cancelled: 'destructive',
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
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
      <NavHeader 
        userName={profile?.full_name} 
        userRole="admin" 
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage inventory, orders, and monitor system performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.inventoryValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Inventory Management</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => openDialog()} className="gradient-gold hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedItem ? 'Edit Item' : 'Add New Item'}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedItem ? 'Update item details' : 'Add a new ration item to your inventory'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Rice, Wheat, Sugar"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price per KG (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price_per_kg}
                        onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity (KG)</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL (Optional)</Label>
                      <Input
                        id="image"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveItem} className="gradient-gold hover:opacity-90">
                      {selectedItem ? 'Update' : 'Add'} Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>
                          ₹{item.price_per_kg}/kg
                        </CardDescription>
                      </div>
                      <Badge variant={item.stock_quantity > 50 ? 'default' : item.stock_quantity > 0 ? 'secondary' : 'destructive'}>
                        {item.stock_quantity} kg
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total Value: ₹{(item.price_per_kg * item.stock_quantity).toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(item)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-2xl font-bold">Recent Orders</h2>
            
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="shadow-soft">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer: {order.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Contact: {order.profiles?.mobile_number || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{order.total_amount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;