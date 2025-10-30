import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useMap } from 'react-leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGeolocation } from '@/hooks/useGeolocation'

interface DeliveryMarker {
  id: string
  position: [number, number]
  status: 'pending' | 'in_transit' | 'delivered' | 'failed'
  driver: string
  estimatedTime: string
  address: string
}

// Custom vehicle icon for deliveries
const createVehicleIcon = (status: string) => {
  const color = status === 'in_transit' ? 'blue' : status === 'pending' ? 'gray' : 'green'
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
      <span style="color: white; font-weight: bold; font-size: 14px;">🚛</span>
    </div>`,
    className: 'custom-vehicle-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })
}

// Custom destination icon
const createDestinationIcon = () => {
  return L.divIcon({
    html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
      <span style="color: white; font-weight: bold; font-size: 10px;">📍</span>
    </div>`,
    className: 'custom-destination-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

// Mock delivery data - in real app, this would come from Supabase
const mockDeliveries: DeliveryMarker[] = [
  {
    id: '1',
    position: [12.9716, 77.5946], // Bangalore
    status: 'in_transit',
    driver: 'Rajesh Kumar',
    estimatedTime: '15 mins',
    address: 'MG Road, Bangalore'
  },
  {
    id: '2',
    position: [13.0827, 80.2707], // Chennai
    status: 'pending',
    driver: 'Arun Patel',
    estimatedTime: '2 hrs',
    address: 'T.Nagar, Chennai'
  },
  {
    id: '3',
    position: [22.5726, 88.3639], // Kolkata
    status: 'delivered',
    driver: 'Mohan Das',
    estimatedTime: 'Delivered',
    address: 'Salt Lake City, Kolkata'
  }
]

// Component to handle map updates
function MapController() {
  const map = useMap()
  const { position } = useGeolocation()

  useEffect(() => {
    if (position) {
      map.flyTo([position.latitude, position.longitude], 13)
    }
  }, [position, map])

  return null
}

interface DeliveryMapProps {
  className?: string
  height?: string
}

export function DeliveryMap({ className = "", height = "500px" }: DeliveryMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<DeliveryMarker | null>(null)
  const [showRoute, setShowRoute] = useState(false)
  const mapRef = useRef<L.Map>(null)

  const { position, error, loading, startWatching, stopWatching, isWatching } = useGeolocation()

  const routeCoordinates: [number, number][] = [
    [12.9716, 77.5946], // Bangalore
    [13.0827, 80.2707], // Chennai
    [19.0760, 72.8777], // Mumbai
    [22.5726, 88.3639], // Kolkata
  ]

  const handleEmergencyAlert = () => {
    if (position) {
      // In real app, this would send emergency alert
      console.log('Emergency alert triggered:', position)
      alert(`Emergency alert sent! Location: ${position.latitude}, ${position.longitude}`)
    } else {
      alert('GPS location not available for emergency alert')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit': return 'bg-blue-500'
      case 'pending': return 'bg-gray-500'
      case 'delivered': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_transit': return 'En Route'
      case 'pending': return 'Pending'
      case 'delivered': return 'Delivered'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🗺️</span>
            Live Delivery Tracking - JADAYU System
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live Updates
            </Badge>
            <Button
              onClick={isWatching ? stopWatching : startWatching}
              variant={isWatching ? "destructive" : "default"}
              size="sm"
            >
              {isWatching ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* GPS Status & Emergency Button */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={loading ? "secondary" : position ? "default" : "destructive"}>
                {loading ? '📡' : position ? '📍' : '❌'}
              </Badge>
              <span className="text-sm">
                {loading ? 'Getting location...' : position ? 'GPS Active' : error || 'GPS Error'}
              </span>
            </div>
            {position && (
              <Badge variant="outline" className="font-mono text-xs">
                {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
              </Badge>
            )}
            {position?.accuracy && position.accuracy > 100 && (
              <Badge variant="destructive" className="text-xs">
                Low Accuracy: {Math.round(position.accuracy)}m
              </Badge>
            )}
          </div>

          <Button
            onClick={handleEmergencyAlert}
            variant="destructive"
            size="sm"
            className="flex items-center gap-1"
          >
            🚨 Emergency
          </Button>
        </div>

        {/* GPS Error Alert */}
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Map Placeholder - GPS Integration Demo */}
        <div style={{ height }} className="relative rounded-lg overflow-hidden border bg-gradient-to-br from-blue-50 to-green-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl">🗺️</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">JADAYU Delivery Tracking System</h3>
                <p className="text-muted-foreground max-w-md">
                  Real-time GPS tracking of delivery vehicles across India.
                  Integration with Leaflet maps coming soon!
                </p>
                <div className="flex justify-center space-x-4 mt-4">
                  <Badge className="bg-blue-500">✅ GPS Hook Ready</Badge>
                  <Badge className="bg-green-500">✅ Location Updates</Badge>
                  <Badge className="bg-orange-500">⏳ Map Integration</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Mock delivery status bubbles */}
          <div className="absolute top-4 left-4 space-y-2">
            {mockDeliveries.map((delivery, index) => (
              <Button
                key={delivery.id}
                variant="outline"
                size="sm"
                className="text-xs bg-white/80 hover:bg-white"
                onClick={() => setSelectedMarker(delivery)}
              >
                🚛 {delivery.driver} ({getStatusText(delivery.status)})
              </Button>
            ))}
          </div>
        </div>

        {/* Delivery Status Summary */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {['in_transit', 'pending', 'delivered', 'failed'].map((status) => {
            const count = mockDeliveries.filter(d => d.status === status).length
            return (
              <div key={status} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${getStatusColor(status)}`}></div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {getStatusText(status)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Delivery Details */}
        {selectedMarker && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>🚛 Delivery {selectedMarker.id} - Live Tracking</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMarker(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Driver</p>
                  <p className="text-sm text-muted-foreground">{selectedMarker.driver}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge className={getStatusColor(selectedMarker.status)}>
                    {getStatusText(selectedMarker.status)}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Destination</p>
                  <p className="text-sm text-muted-foreground">{selectedMarker.address}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">ETA</p>
                  <p className="text-sm text-muted-foreground">{selectedMarker.estimatedTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default DeliveryMap
