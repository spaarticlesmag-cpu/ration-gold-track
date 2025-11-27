import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { NavHeader } from '@/components/NavHeader';
import { Package, Users, Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { SkeletonLoading } from '@/components/ui/skeleton-loading';

interface QuotaItem {
  item_name: string;
  allocated_quantity: number;
  unit: string;
  used_quantity: number;
  remaining_quantity: number;
  percentage_used: number;
  is_exceeded: boolean;
}

const Quota = () => {
  const { profile } = useAuth();
  const [quotaData, setQuotaData] = useState<QuotaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    // Simulate loading quota data
    const loadQuotaData = async () => {
      try {
        setLoading(true);

        // Mock quota data based on ration card type
        const baseQuan = () => {
          switch (profile?.ration_card_type) {
            case 'yellow': return { rice: 20, wheat: 15, sugar: 2 }; // AAY
            case 'pink': return { rice: 4, wheat: 1, sugar: 2 }; // BPL
            case 'blue': return { rice: 9, wheat: 2, sugar: 1 }; // APL Subsidy
            case 'white': return { rice: 2, wheat: 1, sugar: 1 }; // APL
            default: return { rice: 5, wheat: 2, sugar: 1 };
          }
        };

        const entitlements = baseQuan();
        const mockData: QuotaItem[] = [
          {
            item_name: 'Rice',
            allocated_quantity: entitlements.rice,
            unit: 'kg',
            used_quantity: Math.random() * entitlements.rice * 0.3,
            remaining_quantity: entitlements.rice - (Math.random() * entitlements.rice * 0.3),
            percentage_used: Math.random() * 30,
            is_exceeded: false,
          },
          {
            item_name: 'Wheat',
            allocated_quantity: entitlements.wheat,
            unit: 'kg',
            used_quantity: Math.random() * entitlements.wheat * 0.25,
            remaining_quantity: entitlements.wheat - (Math.random() * entitlements.wheat * 0.25),
            percentage_used: Math.random() * 25,
            is_exceeded: false,
          },
          {
            item_name: 'Sugar',
            allocated_quantity: entitlements.sugar,
            unit: 'kg',
            used_quantity: Math.random() * entitlements.sugar * 0.4,
            remaining_quantity: entitlements.sugar - (Math.random() * entitlements.sugar * 0.4),
            percentage_used: Math.random() * 40,
            is_exceeded: Math.random() > 0.8, // 20% chance of exceeding
          },
        ];

        // Recalculate remaining and percentage
        const calculatedData = mockData.map(item => ({
          ...item,
          remaining_quantity: Math.max(0, item.allocated_quantity - item.used_quantity),
          percentage_used: (item.used_quantity / item.allocated_quantity) * 100,
          is_exceeded: item.used_quantity > item.allocated_quantity,
        }));

        setTimeout(() => {
          setQuotaData(calculatedData);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error loading quota data:', error);
        setLoading(false);
      }
    };

    if (profile) {
      loadQuotaData();
    } else {
      setLoading(false);
    }
  }, [profile, selectedMonth]);

  const getTotalEntitlement = () => quotaData.reduce((sum, item) => sum + item.allocated_quantity, 0);
  const getTotalUsed = () => quotaData.reduce((sum, item) => sum + item.used_quantity, 0);
  const getTotalRemaining = () => quotaData.reduce((sum, item) => sum + item.remaining_quantity, 0);
  const getOverallUsagePercentage = () => {
    const total = getTotalEntitlement();
    return total > 0 ? (getTotalUsed() / total) * 100 : 0;
  };

  const getCardTypeInfo = () => {
    switch (profile?.ration_card_type) {
      case 'yellow': return { name: 'Antyodaya Anna Yojana (AAY)', color: 'bg-red-100 text-red-800' };
      case 'pink': return { name: 'Below Poverty Line (BPL)', color: 'bg-pink-100 text-pink-800' };
      case 'blue': return { name: 'Above Poverty Line (APL) - Subsidised', color: 'bg-blue-100 text-blue-800' };
      case 'white': return { name: 'Above Poverty Line (APL)', color: 'bg-gray-100 text-gray-800' };
      default: return { name: 'Not Specified', color: 'bg-gray-100 text-gray-800' };
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <SkeletonLoading variant="card" className="h-48" />
            <SkeletonLoading variant="card" className="h-48" />
          </div>
          <SkeletonLoading variant="list" className="max-w-4xl mx-auto" />
        </div>
      </div>
    );
  }

  const cardTypeInfo = getCardTypeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gold-light/20 to-cream">
      <NavHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Monthly Entitlement Quota</h1>
          <p className="text-muted-foreground text-lg mb-4">
            Track your ration entitlements and usage for the current month
          </p>

          {/* Card Type Badge */}
          <Badge className={`px-4 py-2 text-sm font-medium ${cardTypeInfo.color}`}>
            {cardTypeInfo.name}
          </Badge>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entitlement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {getTotalEntitlement().toFixed(1)} kg
              </div>
              <div className="text-sm text-muted-foreground">This month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getTotalUsed().toFixed(1)} kg
              </div>
              <div className="text-sm text-muted-foreground">Consumed so far</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getTotalRemaining().toFixed(1)} kg
              </div>
              <div className="text-sm text-muted-foreground">Available to use</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usage Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getOverallUsagePercentage().toFixed(1)}%
              </div>
              <Progress value={getOverallUsagePercentage()} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Items */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item-wise Quota Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {quotaData.map((item) => (
                <div key={item.item_name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{item.item_name}</h3>
                      {item.is_exceeded && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Exceeded
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Monthly Limit</div>
                      <div className="font-semibold">{item.allocated_quantity} {item.unit}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-orange-600">Used</div>
                      <div className="text-lg font-bold text-orange-700">
                        {item.used_quantity.toFixed(1)} {item.unit}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-600">Remaining</div>
                      <div className="text-lg font-bold text-green-700">
                        {item.remaining_quantity.toFixed(1)} {item.unit}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-600">Usage Rate</div>
                      <div className="text-lg font-bold text-blue-700">
                        {item.percentage_used.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress
                      value={Math.min(item.percentage_used, 100)}
                      className={`h-2 ${item.is_exceeded ? 'opacity-50' : ''}`}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0 {item.unit}</span>
                      <span>{item.allocated_quantity} {item.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Household Info */}
        {profile && (
          <div className="max-w-4xl mx-auto mt-8">
            <Card className="bg-muted/50">
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-medium">Household Members</div>
                      <div className="text-2xl font-bold">{profile.household_members || 1}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <div className="font-medium">Current Month</div>
                      <div className="text-lg font-semibold">
                        {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quota;
