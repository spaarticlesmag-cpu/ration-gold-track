// Ration Store Service - Manages store locations, inventory, and availability

export interface RationStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  phone: string;
  operating_hours: string;
  inventory: Record<string, number>; // item_id -> quantity available
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Sample ration stores in Kerala (realistic locations)
const RATION_STORES: RationStore[] = [
  {
    id: 'store-001',
    name: 'Angamaly Ration Depot',
    address: 'Market Road, Angamaly, Kerala 683572',
    latitude: 10.1965,
    longitude: 76.3912,
    district: 'Ernakulam',
    state: 'Kerala',
    phone: '+91 484 245 1234',
    operating_hours: '9:00 AM - 5:00 PM',
    inventory: {
      'rice': 500,    // kg
      'wheat': 300,
      'sugar': 200,
      'dal': 150,
      'oil': 100,     // liters
      'salt': 80,
      'tea': 60
    }
  },
  {
    id: 'store-002',
    name: 'Aluva Civil Supplies',
    address: 'Civil Station Road, Aluva, Kerala 683101',
    latitude: 10.1075,
    longitude: 76.3570,
    district: 'Ernakulam',
    state: 'Kerala',
    phone: '+91 484 262 5678',
    operating_hours: '8:30 AM - 6:00 PM',
    inventory: {
      'rice': 450,
      'wheat': 280,
      'sugar': 180,
      'dal': 120,
      'oil': 90,
      'salt': 75,
      'tea': 55
    }
  },
  {
    id: 'store-003',
    name: 'Periyar Nagar Ration Shop',
    address: 'Periyar Nagar, Elphinstone Road, Fort Kochi, Kerala 682001',
    latitude: 9.9658,
    longitude: 76.2875,
    district: 'Ernakulam',
    state: 'Kerala',
    phone: '+91 484 221 9012',
    operating_hours: '9:00 AM - 5:30 PM',
    inventory: {
      'rice': 320,
      'wheat': 200,
      'sugar': 150,
      'dal': 100,
      'oil': 75,
      'salt': 60,
      'tea': 45
    }
  },
  {
    id: 'store-004',
    name: 'Tripunithura Supply Center',
    address: 'MG Road, Tripunithura, Kerala 682301',
    latitude: 9.9475,
    longitude: 76.3438,
    district: 'Ernakulam',
    state: 'Kerala',
    phone: '+91 484 278 3456',
    operating_hours: '8:00 AM - 5:00 PM',
    inventory: {
      'rice': 380,
      'wheat': 240,
      'sugar': 160,
      'dal': 110,
      'oil': 85,
      'salt': 70,
      'tea': 50
    }
  },
  {
    id: 'store-005',
    name: 'North Paravur Depot',
    address: 'Main Road, North Paravur, Kerala 683513',
    latitude: 10.1430,
    longitude: 76.2325,
    district: 'Ernakulam',
    state: 'Kerala',
    phone: '+91 484 244 7890',
    operating_hours: '9:30 AM - 5:30 PM',
    inventory: {
      'rice': 420,
      'wheat': 260,
      'sugar': 170,
      'dal': 130,
      'oil': 95,
      'salt': 78,
      'tea': 58
    }
  }
];

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Get user's current location
export async function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

// Find closest stores to user location
export function findClosestStores(userLocation: UserLocation, limit: number = 3): Array<RationStore & { distance: number }> {
  const storesWithDistance = RATION_STORES.map(store => ({
    ...store,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      store.latitude,
      store.longitude
    )
  }));

  // Sort by distance and return top results
  return storesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

// Check if items are available at a specific store
export function checkStockAvailability(
  storeId: string,
  items: Array<{ id: string; quantity: number; name: string }>
): {
  available: boolean;
  unavailableItems: Array<{ id: string; name: string; requested: number; available: number }>;
  store: RationStore;
} {
  const store = RATION_STORES.find(s => s.id === storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  const unavailableItems: Array<{ id: string; name: string; requested: number; available: number }> = [];

  for (const item of items) {
    const availableStock = store.inventory[item.id] || 0;
    if (item.quantity > availableStock) {
      unavailableItems.push({
        id: item.id,
        name: item.name,
        requested: item.quantity,
        available: availableStock
      });
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
    store
  };
}

// Reserve stock for an order (reduce available inventory)
export function reserveStock(storeId: string, items: Array<{ id: string; quantity: number }>): boolean {
  const store = RATION_STORES.find(s => s.id === storeId);
  if (!store) return false;

  // Check if all items are available
  for (const item of items) {
    const availableStock = store.inventory[item.id] || 0;
    if (item.quantity > availableStock) {
      return false; // Insufficient stock
    }
  }

  // Reserve the stock
  for (const item of items) {
    store.inventory[item.id] -= item.quantity;
  }

  return true;
}

// Get store details by ID
export function getStoreById(storeId: string): RationStore | undefined {
  return RATION_STORES.find(store => store.id === storeId);
}

// Get all stores (for admin purposes)
export function getAllStores(): RationStore[] {
  return [...RATION_STORES];
}

// Update store inventory (for admin/replenishment)
export function updateStoreInventory(storeId: string, itemId: string, newQuantity: number): boolean {
  const store = RATION_STORES.find(s => s.id === storeId);
  if (!store) return false;

  store.inventory[itemId] = newQuantity;
  return true;
}

// Get stores within a certain radius
export function getStoresInRadius(userLocation: UserLocation, radiusKm: number = 50): Array<RationStore & { distance: number }> {
  return RATION_STORES.map(store => ({
    ...store,
    distance: calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      store.latitude,
      store.longitude
    )
  })).filter(store => store.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}
