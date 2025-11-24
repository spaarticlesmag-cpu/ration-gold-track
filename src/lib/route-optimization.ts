import { JADAYU_CONFIG } from './constants'

export interface Coordinates {
  lat: number
  lng: number
}

export interface DeliveryPoint {
  id: string
  coordinates: Coordinates
  priority?: 'high' | 'medium' | 'low'
  timeWindow?: {
    start: Date
    end: Date
  }
  estimatedTime?: number // minutes to deliver
}

export interface RouteOptimizationResult {
  route: DeliveryPoint[]
  totalDistance: number
  totalTime: number
  efficiency: number
  fuelConsumption: number
}

// Haversine distance calculation
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers

  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLng = toRadians(coord2.lng - coord1.lng)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance // returns distance in km
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Estimate delivery time based on distance and traffic
export function estimateDeliveryTime(distance: number, baseSpeed: number = 30): number {
  // Consider average speed, traffic factors, loading/unloading time
  const averageSpeed = baseSpeed * 0.8 // accounting for traffic
  const travelTime = (distance / averageSpeed) * 60 // in minutes
  const bufferTime = 10 // loading/unloading/confirmation time
  return Math.ceil(travelTime + bufferTime)
}

// Basic route optimization using nearest neighbor algorithm
export function optimizeDeliveryRoute(
  startPoint: Coordinates,
  deliveryPoints: DeliveryPoint[],
  currentTime: Date = new Date()
): RouteOptimizationResult {
  if (deliveryPoints.length === 0) {
    return {
      route: [],
      totalDistance: 0,
      totalTime: 0,
      efficiency: 0,
      fuelConsumption: 0
    }
  }

  const route: DeliveryPoint[] = []
  let totalDistance = 0
  let totalTime = 0
  let currentLocation = startPoint
  let remainingPoints = [...deliveryPoints]

  // Sort by priority and time windows
  remainingPoints.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority || 'medium']
    const bPriority = priorityOrder[b.priority || 'medium']

    if (aPriority !== bPriority) return bPriority - aPriority

    // If same priority, sort by time urgency
    if (a.timeWindow && b.timeWindow) {
      const aUrgency = a.timeWindow.end.getTime() - currentTime.getTime()
      const bUrgency = b.timeWindow.end.getTime() - currentTime.getTime()
      return aUrgency - bUrgency
    }

    return 0
  })

  while (remainingPoints.length > 0) {
    // Find nearest point
    let nearestIndex = 0
    let nearestDistance = calculateDistance(currentLocation, remainingPoints[0].coordinates)

    for (let i = 1; i < remainingPoints.length; i++) {
      const distance = calculateDistance(currentLocation, remainingPoints[i].coordinates)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    const nextPoint = remainingPoints[nearestIndex]
    route.push(nextPoint)
    totalDistance += nearestDistance
    totalTime += estimateDeliveryTime(nearestDistance)

    // Check time window constraints
    if (nextPoint.timeWindow) {
      const arrivalTime = new Date(currentTime.getTime() + totalTime * 60 * 1000)
      if (arrivalTime > nextPoint.timeWindow.end) {
        console.warn(`Delivery ${nextPoint.id} will be late by ${Math.round((arrivalTime.getTime() - nextPoint.timeWindow.end.getTime()) / 60000)} minutes`)
      }
    }

    currentLocation = nextPoint.coordinates
    remainingPoints.splice(nearestIndex, 1)
  }

  // Calculate efficiency (target: >85%)
  const directDistance = calculateDistance(startPoint, route[route.length - 1].coordinates)
  const efficiency = directDistance > 0 ? (directDistance / totalDistance) * 100 : 100

  // Estimate fuel consumption (rough approximation: 8 liters per 100km average)
  const fuelConsumption = totalDistance * 0.08

  return {
    route,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTime: Math.round(totalTime),
    efficiency: Math.round(efficiency * 10) / 10,
    fuelConsumption: Math.round(fuelConsumption * 10) / 10
  }
}

// Generate route coordinates for map display
export function generateRouteCoordinates(
  startPoint: Coordinates,
  deliveryPoints: DeliveryPoint[]
): [number, number][] {
  const coordinates: [number, number][] = []

  if (deliveryPoints.length === 0) {
    coordinates.push([startPoint.lat, startPoint.lng])
    return coordinates
  }

  coordinates.push([startPoint.lat, startPoint.lng])

  const optimizedRoute = optimizeDeliveryRoute(startPoint, deliveryPoints)
  optimizedRoute.route.forEach(point => {
    coordinates.push([point.coordinates.lat, point.coordinates.lng])
  })

  return coordinates
}

// Predict demand based on historical data and seasonality
export function predictDeliveryDemand(
  location: Coordinates,
  currentHour: number,
  dayOfWeek: number,
  historicalData?: any[]
): number {
  // Basic demand prediction (can be enhanced with ML models)
  const baseDemand = 1.0

  // Time-based multipliers
  const timeMultiplier = getTimeMultiplier(currentHour)
  const dayMultiplier = getDayMultiplier(dayOfWeek)

  // Location-based adjustments (simplified)
  const locationMultiplier = getLocationMultiplier(location)

  const predictedDemand = baseDemand * timeMultiplier * dayMultiplier * locationMultiplier

  return Math.round(predictedDemand * 10) / 10
}

function getTimeMultiplier(hour: number): number {
  // Peak hours: 11am-2pm and 6pm-8pm
  if ((hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 20)) {
    return 1.8
  }
  // Shoulder hours: 8am-11am and 2pm-6pm
  if ((hour >= 8 && hour <= 11) || (hour >= 14 && hour <= 18)) {
    return 1.3
  }
  return 0.7 // Off-peak
}

function getDayMultiplier(dayOfWeek: number): number {
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  if (dayOfWeek === 0) return 1.5 // Sunday
  if (dayOfWeek === 6) return 1.4 // Saturday
  return 1.0 // Weekdays
}

function getLocationMultiplier(location: Coordinates): number {
  // Simplified location-based demand (could use population/density data)
  // This is a placeholder - in real implementation, use external data sources
  const lat = location.lat
  const lng = location.lng

  // Major cities get higher multipliers
  if (Math.abs(lat - 12.9716) < 0.5 && Math.abs(lng - 77.5946) < 0.5) return 2.0 // Bangalore
  if (Math.abs(lat - 19.0760) < 0.5 && Math.abs(lng - 72.8777) < 0.5) return 1.8 // Mumbai
  if (Math.abs(lat - 13.0827) < 0.5 && Math.abs(lng - 80.2707) < 0.5) return 1.6 // Chennai
  if (Math.abs(lat - 22.5726) < 0.5 && Math.abs(lng - 88.3639) < 0.5) return 1.4 // Kolkata

  return 1.0 // Standard rural areas
}

// Calculate route efficiency and provide suggestions
export function analyzeRouteEfficiency(routeResult: RouteOptimizationResult): {
  score: number
  suggestions: string[]
  status: 'excellent' | 'good' | 'needs_improvement'
} {
  const suggestions: string[] = []

  let score = routeResult.efficiency
  let status: 'excellent' | 'good' | 'needs_improvement' = 'needs_improvement'

  if (score >= JADAYU_CONFIG.AI_CONFIG.EFFICIENCY_THRESHOLD) {
    status = 'excellent'
  } else if (score >= 75) {
    status = 'good'
  } else {
    suggestions.push('Consider route optimization or combining multiple deliveries')
  }

  // Time efficiency analysis
  const avgDeliveryTime = routeResult.totalTime / (routeResult.route.length || 1)
  if (avgDeliveryTime > 45) {
    suggestions.push('Consider increasing vehicle speed or optimizing loading times')
  }

  // Fuel efficiency
  if (routeResult.fuelConsumption > routeResult.totalDistance * 0.1) {
    suggestions.push('Review fuel consumption - consider more efficient routes')
  }

  return {
    score: Math.round(score),
    suggestions,
    status
  }
}
