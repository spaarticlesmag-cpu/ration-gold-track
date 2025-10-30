import { useState, useEffect, useCallback } from 'react';
import { JADAYU_CONFIG } from '@/lib/constants';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

export interface GeolocationState {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  isWatching: boolean;
  watchId: number | null;
}

const DEFAULT_POSITION: GeolocationPosition = {
  latitude: 28.6139, // New Delhi coordinates as fallback
  longitude: 77.2090,
  accuracy: 1000,
  timestamp: Date.now(),
};

export const useGeolocation = (options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    isWatching: false,
    watchId: null,
  });

  const updatePosition = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      position,
      error: null,
      loading: false,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Location access denied';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geolocationPosition: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };

          updatePosition(geolocationPosition);
          resolve(geolocationPosition);
        },
        (error) => {
          handleError(error);
          reject(error);
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 300000, // 5 minutes
        }
      );
    });
  }, [options, updatePosition, handleError]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      }));
      return null;
    }

    setState(prev => ({ ...prev, isWatching: true, error: null }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const geolocationPosition: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };

        updatePosition(geolocationPosition);
      },
      handleError,
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? JADAYU_CONFIG.GPS_CONFIG.UPDATE_INTERVAL,
        maximumAge: options?.maximumAge ?? JADAYU_CONFIG.GPS_CONFIG.STALE_LOCATION_TIMEOUT,
      }
    );

    setState(prev => ({ ...prev, watchId }));
    return watchId;
  }, [options, updatePosition, handleError]);

  const stopWatching = useCallback(() => {
    if (state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
      setState(prev => ({
        ...prev,
        isWatching: false,
        watchId: null,
      }));
    }
  }, [state.watchId]);

  // Check if location is stale
  const isLocationStale = useCallback(() => {
    if (!state.position) return true;
    const now = Date.now();
    return (now - state.position.timestamp) > JADAYU_CONFIG.GPS_CONFIG.STALE_LOCATION_TIMEOUT;
  }, [state.position]);

  // Check accuracy threshold
  const isLocationAccurate = useCallback(() => {
    if (!state.position) return false;
    return state.position.accuracy <= JADAYU_CONFIG.GPS_CONFIG.ACCURACY_THRESHOLD;
  }, [state.position]);

  // Auto-start watching if in delivery partner mode (could be enhanced)
  useEffect(() => {
    // This could be enhanced to only watch for delivery partners
    // For now, we'll keep it manual

    return () => {
      if (state.watchId) {
        navigator.geolocation.clearWatch(state.watchId);
      }
    };
  }, [state.watchId]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isLocationStale,
    isLocationAccurate,
    defaultPosition: DEFAULT_POSITION,
  };
};

export default useGeolocation;
