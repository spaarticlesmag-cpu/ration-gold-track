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
