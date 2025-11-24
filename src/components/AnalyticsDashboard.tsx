import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock,
  MapPin, Users, Truck, AlertCircle, Activity, Globe, Shield
} from 'lucide-react'

interface AnalyticsData {
  totalDeliveries: number
  onTimeDeliveries: number
  averageDelay: number
  totalPartners: number
  activePartners: number
  corruptionAlerts: number
  fuelEfficiency: number
  routeOptimization: number
  deliveryLocations: Array<{
    name: string
    latitude: number
    longitude: number
    deliveries: number
    efficiency: number
  }>
  monthlyStats: Array<{
    month: string
    deliveries: number
    efficiency: number
    complaints: number
  }>
  corruptionIndicators: Array<{
    type: string
    count: number
    severity: 'low' | 'medium' | 'high'
  }>
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('last-30-days')

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        totalDeliveries: 15420,
        onTimeDeliveries: 14285,
        averageDelay: 8.5,
        totalPartners: 342,
        activePartners: 298,
        corruptionAlerts: 23,
        fuelEfficiency: 92.3,
        routeOptimization: 87.5,
        deliveryLocations: [
          { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, deliveries: 4230, efficiency: 91.2 },
          { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, deliveries: 3876, efficiency: 89.8 },
          { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, deliveries: 3654, efficiency: 93.1 },
          { name: 'Delhi', latitude: 28.7041, longitude: 77.1025, deliveries: 2845, efficiency: 88.6 },
          { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, deliveries: 815, efficiency: 86.4 }
        ],
        monthlyStats: [
          { month: 'Jan', deliveries: 1240, efficiency: 89.2, complaints: 12 },
          { month: 'Feb', deliveries: 1380, efficiency: 91.5, complaints: 8 },
          { month: 'Mar', deliveries: 1520, efficiency: 93.1, complaints: 15 },
          { month: 'Apr', deliveries: 1680, efficiency: 94.2, complaints: 6 },
          { month: 'May', deliveries: 1820, efficiency: 92.8, complaints: 9 },
          { month: 'Jun', deliveries: 1960, efficiency: 95.1, complaints: 4 }
        ],
        corruptionIndicators: [
          { type: 'Route Deviation', count: 12, severity: 'high' },
          { type: 'Timing Anomalies', count: 8, severity: 'medium' },
          { type: 'Stock Discrepancies', count: 3, severity: 'low' }
        ]
      })
      setLoading(false)
    }, 1500)
  }, [selectedPeriod])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  const onTimePercentage = (analyticsData.onTimeDeliveries / analyticsData.totalDeliveries) * 100
  const partnerUtilization = (analyticsData.activePartners / analyticsData.totalPartners) * 100

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛡️ JADAYU Analytics Dashboard</h1>
          <p className="text-gray-600">Government Transparency & Corruption Prevention System</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Data
          </Button>
          <Button className="flex items-center gap-2">
            📊 Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {analyticsData.corruptionAlerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{analyticsData.corruptionAlerts} Potential Corruption Indicators Detected</strong> - Immediate investigation required.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalDeliveries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.3% from last month
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTimePercentage.toFixed(1)}%</div>
            <Progress value={onTimePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analyticsData.onTimeDeliveries.toLocaleString()} deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnerUtilization.toFixed(1)}%</div>
            <Progress value={partnerUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground">
              {analyticsData.activePartners}/{analyticsData.totalPartners} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Efficiency</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.routeOptimization}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">87.5% efficiency</span> - 232km saved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Corruption Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Corruption Detection & Prevention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {analyticsData.corruptionIndicators.map((indicator, index) => (
                <div key={index} className="text-center p-4 rounded-lg border">
                  <div className={`text-2xl font-bold mb-1 ${
                    indicator.severity === 'high' ? 'text-red-600' :
                    indicator.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {indicator.count}
                  </div>
                  <div className="text-sm font-medium">{indicator.type}</div>
                  <Badge variant={
                    indicator.severity === 'high' ? 'destructive' :
                    indicator.severity === 'medium' ? 'secondary' : 'default'
                  } className="mt-1 text-xs">
                    {indicator.severity}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recent Alerts:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Route deviation in Bangalore sector - Driver ID: DP001</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span>Unusual delay pattern detected - Partner ID: P234</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>Stock arrival discrepancy - Location: Chennai Central</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Efficiency Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Fuel Efficiency</span>
                  <span className="text-sm text-muted-foreground">{analyticsData.fuelEfficiency}%</span>
                </div>
                <Progress value={analyticsData.fuelEfficiency} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Route Optimization</span>
                  <span className="text-sm text-muted-foreground">{analyticsData.routeOptimization}%</span>
                </div>
                <Progress value={analyticsData.routeOptimization} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Partner Performance</span>
                  <span className="text-sm text-muted-foreground">94.7%</span>
                </div>
                <Progress value={94.7} className="h-2" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-2xl font-bold text-green-600">₹2.4M</div>
              <p className="text-sm text-muted-foreground">Monthly Savings</p>
              <p className="text-xs text-green-600 mt-1">+18.3% vs last quarter</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Delivery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="deliveries" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Distribution Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.deliveryLocations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="deliveries" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Government Compliance Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Government Compliance Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Transparency Score</h3>
              <div className="text-3xl font-bold text-green-600">98.2%</div>
              <p className="text-sm text-gray-600 mt-1">Fully compliant with RTI Act</p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Beneficiary Reach</h3>
              <div className="text-3xl font-bold text-blue-600">2.1M</div>
              <p className="text-sm text-gray-600 mt-1">Citizens served monthly</p>
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <Shield className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Corruption Detection</h3>
              <div className="text-3xl font-bold text-orange-600">23</div>
              <p className="text-sm text-gray-600 mt-1">Flagged for investigation</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Recent Government Reports</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded">
                <span className="text-sm">Monthly PDS Distribution Report</span>
                <Button size="sm" variant="outline">Download</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded">
                <span className="text-sm">Corruption Prevention Audit</span>
                <Button size="sm" variant="outline">Download</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded">
                <span className="text-sm">Fuel Efficiency & Route Optimization Data</span>
                <Button size="sm" variant="outline">Download</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
