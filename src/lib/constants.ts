// Application constants
export const APP_CONFIG = {
  TIMEOUTS: {
    AUTH_LOADING: 4000, // ms
    API_REQUEST: 10000, // ms
    DEBOUNCE_DELAY: 300, // ms for search inputs
  },
  RATE_LIMITS: {
    API_CALLS_PER_MINUTE: 60,
    SEARCH_REQUESTS_PER_SECOND: 5,
  },
  VERSION: '1.0.0',
} as const;

// JADAYU System Constants
export const JADAYU_CONFIG = {
  // GPS tracking configuration
  GPS_CONFIG: {
    UPDATE_INTERVAL: 10000, // ms (10 seconds)
    ACCURACY_THRESHOLD: 10, // meters
    STALE_LOCATION_TIMEOUT: 60000, // ms (1 minute)
  },

  // AI optimization settings
  AI_CONFIG: {
    ROUTE_UPDATE_FREQUENCY: 300000, // ms (5 minutes)
    DEMAND_FORECAST_WINDOW: 7, // days
    EFFICIENCY_THRESHOLD: 0.85, // minimum acceptable efficiency
  },

  // Delivery status workflow
  DELIVERY_STATUS: {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    EN_ROUTE: 'en_route',
    ARRIVED: 'arrived',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },

  // Notification settings
  NOTIFICATIONS: {
    SMS_ENABLED: true,
    SMS_TEMPLATE: 'JADAYU: {status} - Expected delivery at {time} by driver {name}',
    PUSH_ENABLED: true,
    EMAIL_ENABLED: true,
  },
} as const;

// UI related constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 200, // ms
  TOAST_DURATION: 3000, // ms
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;
