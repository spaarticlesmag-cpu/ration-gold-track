import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useGeolocation } from '@/hooks/useGeolocation'
import { JADAYU_CONFIG } from '@/lib/constants'
import { supabase } from '@/integrations/supabase/client'
import { generateRouteCoordinates, optimizeDeliveryRoute, type DeliveryPoint } from '@/lib/route-optimization'
import { auditLogger } from '@/lib/audit-logger'
import { sendEmergencySMS } from '@/lib/sms-service'

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

interface DeliveryMapProps {
  className?: string
  height?: string
  orderId?: string // Optional order ID for GPS tracking
}

export function DeliveryMap({ className = "", height = "500px", orderId }: DeliveryMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<DeliveryMarker | null>(null)
  const [showRoute, setShowRoute] = useState(false)
  const [lastGpsUpdate, setLastGpsUpdate] = useState<number | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { position, error, loading, startWatching, stopWatching, isWatching } = useGeolocation()

  const routeCoordinates: [number, number][] = [
    [12.9716, 77.5946], // Bangalore
    [13.0827, 80.2707], // Chennai
    [19.0760, 72.8777], // Mumbai
    [22.5726, 88.3639], // Kolkata
  ]

  // Helper functions
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

  // Function to save GPS location to Supabase (temporarily disabled - table needs migration)
  const saveLocationToDatabase = useCallback(async (location: typeof position, orderId?: string) => {
    if (!location) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Log GPS update to audit trail
      if (orderId) {
        await auditLogger.logGPSUpdate(user.id, orderId, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        }, location.speed)
      }

      console.log('GPS location audit logged:', {
        user: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        orderId
      })

      // TODO: Enable GPS storage after database migration
      /* const locationData = {
        delivery_partner_id: user.id,
        order_id: orderId || null,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        speed: location.speed || null,
        heading: location.heading || null,
        status: 'active'
      }

      const { error: insertError } = await supabase
        .from('delivery_location_tracking')
        .insert([locationData])

      if (insertError) {
        console.error('Error saving GPS location:', insertError)
      } else {
        console.log('GPS location saved:', locationData)
      } */

      setLastGpsUpdate(Date.now())
    } catch (error) {
      console.error('Error processing GPS location:', error)
    }
  }, [])

  // Initialize Leaflet map
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      const defaultCenter = position
        ? [position.latitude, position.longitude] as [number, number]
        : [12.9716, 77.5946] as [number, number]

      const map = L.map(mapRef.current).setView(defaultCenter, 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      // Add delivery markers
      mockDeliveries.forEach(delivery => {
        const marker = L.marker(delivery.position, {
          icon: delivery.status === 'delivered' ? createDestinationIcon() : createVehicleIcon(delivery.status)
        })
        .addTo(map)
        .bindPopup(`
          <div class="p-2">
            <h4 class="font-semibold">🚛 ${delivery.driver}</h4>
            <p class="text-sm text-gray-600">${delivery.address}</p>
            <div class="mt-1">
              <span class="inline-block px-2 py-1 text-xs font-medium rounded" style="background-color: ${
                delivery.status === 'in_transit' ? '#3b82f6' :
                delivery.status === 'pending' ? '#6b7280' : '#10b981'
              }; color: white;">
                ${getStatusText(delivery.status)}
              </span>
            </div>
            <p class="text-sm mt-1">ETA: ${delivery.estimatedTime}</p>
          </div>
        `)

        marker.on('click', () => setSelectedMarker(delivery))
      })

      leafletMapRef.current = map
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  // Update user location marker when position changes
  useEffect(() => {
    if (leafletMapRef.current && position) {
      // Remove existing user marker if any
      leafletMapRef.current.eachLayer((layer) => {
        if ((layer as any)._customUserMarker) {
          leafletMapRef.current!.removeLayer(layer)
        }
      })

      const userIcon = L.divIcon({
        html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
          <span style="color: white; font-weight: bold; font-size: 10px;">📍</span>
        </div>`,
        className: 'current-location-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })

      const userMarker = L.marker([position.latitude, position.longitude], { icon: userIcon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div class="p-2">
            <h4 class="font-semibold">📍 Your Location</h4>
            <p class="text-sm text-gray-600">
              ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}
            </p>
            <p class="text-sm">Accuracy: ${Math.round(position.accuracy)}m</p>
            ${position.speed ? `<p class="text-sm">Speed: ${Math.round(position.speed * 3.6)} km/h</p>` : ''}
          </div>
        `)

      ;(userMarker as any)._customUserMarker = true

      leafletMapRef.current.setView([position.latitude, position.longitude])
    }
  }, [position, getStatusText])

  // Handle route visualization
  useEffect(() => {
    if (leafletMapRef.current) {
      // Remove existing route polyline
      leafletMapRef.current.eachLayer((layer) => {
        if ((layer as any)._customRoutePolyline) {
          leafletMapRef.current!.removeLayer(layer)
        }
      })

      if (showRoute && routeCoordinates.length > 1) {
        const routePolyline = L.polyline(routeCoordinates, {
          color: '#ef4444',
          weight: 3,
          opacity: 0.8,
          dashArray: '10, 10'
        }).addTo(leafletMapRef.current)

        ;(routePolyline as any)._customRoutePolyline = true
      }
    }
  }, [showRoute, routeCoordinates])

  // Start GPS tracking when watching is enabled
  useEffect(() => {
    if (isWatching && orderId) {
      // Save location immediately when tracking starts
      if (position) {
        saveLocationToDatabase(position, orderId)
      }

      // Set up interval to save GPS data every 10 seconds
      trackingIntervalRef.current = setInterval(() => {
        if (position) {
          saveLocationToDatabase(position, orderId)
        }
      }, JADAYU_CONFIG.GPS_CONFIG.UPDATE_INTERVAL)

      return () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current)
        }
      }
    } else {
      // Stop tracking when not watching or no order ID
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
        trackingIntervalRef.current = null
      }
    }
  }, [isWatching, position, orderId, saveLocationToDatabase])

  const handleEmergencyAlert = useCallback(async () => {
    if (position) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Log emergency alert to audit trail
          await auditLogger.logEmergencyAlert(user.id, {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy
          })

          console.log('Emergency alert audit logged:', {
            user: user.id,
            lat: position.latitude,
            lng: position.longitude,
            accuracy: position.accuracy
          })

          // TODO: Enable SMS alert and emergency RPC after services are configured
          /* const { data: alertId, error } = await supabase.rpc('handle_emergency_alert', {
            partner_id: user.id,
            emergency_lat: position.latitude,
            emergency_lng: position.longitude,
            emergency_accuracy: position.accuracy
          })

          // Send SMS alert
          await sendEmergencySMS(user.id, {
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy
          }) */

          alert(`🚨 Emergency alert sent! Location: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`)
        }
      } catch (error) {
        console.error('Error sending emergency alert:', error)
        alert('Failed to send emergency alert. Please try again.')
      }
    } else {
      alert('GPS location not available for emergency alert')
    }
  }, [position])

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

        {/* Interactive Leaflet Map */}
        <div style={{ height }} className="relative rounded-lg overflow-hidden border">
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

          {/* Map Controls Overlay */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Button
                onClick={() => setShowRoute(!showRoute)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {showRoute ? 'Hide Route' : 'Show Route'}
              </Button>
            </div>
            <div className="text-xs text-gray-600">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>In Transit</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Delivered</span>
              </div>
            </div>
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
