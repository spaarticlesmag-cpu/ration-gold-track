-- Enhanced Voice Navigation System Database Schema
-- Adds support for offline packages, traffic-adaptive routing, and advanced navigation features

-- Create offline_packages table for downloading map data and voice packs
CREATE TABLE IF NOT EXISTS public.offline_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_name TEXT NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('voice_pack', 'map_region', 'language_data')),
  language_code TEXT,
  region_name TEXT, -- e.g., 'bangalore', 'karnataka', 'south_india'
  file_path TEXT NOT NULL, -- S3/Storage path for compressed package
  file_size_bytes INTEGER NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  checksum TEXT NOT NULL, -- SHA256 for integrity verification
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_type, language_code, region_name)
);

-- Create traffic_data table for real-time and historical traffic information
CREATE TABLE IF NOT EXISTS public.traffic_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  road_segment_id TEXT, -- Optional: external road identifier
  traffic_level TEXT NOT NULL CHECK (traffic_level IN ('free_flow', 'light', 'moderate', 'heavy', 'congestion')),
  average_speed_kmh DECIMAL(6, 2), -- Average vehicle speed
  congestion_factor DECIMAL(3, 2), -- 0.0-2.0 multiplier (2.0 = 2x normal time)
  incident_type TEXT CHECK (incident_type IN ('accident', 'construction', 'road_closure', 'weather', 'special_event')),
  incident_description TEXT,
  data_source TEXT NOT NULL DEFAULT 'traffic_api', -- 'traffic_api', 'user_reports', 'sensor_fusion'
  confidence_score DECIMAL(3, 2) NOT NULL, -- 0.0-1.0, confidence in data accuracy
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When this traffic data expires
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create device_offline_packages table to track downloaded packages per device
CREATE TABLE IF NOT EXISTS public.device_offline_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL, -- Unique device identifier (can be UUID or IMEI-like)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.offline_packages(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  storage_path TEXT, -- Local storage path on device
  is_corrupted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(device_id, package_id)
);

-- Create navigation_session_logs table for detailed navigation analytics
CREATE TABLE IF NOT EXISTS public.navigation_session_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL, -- UUID-like string for grouping navigation session
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_distance_meters INTEGER,
  total_duration_seconds INTEGER,
  average_speed_kmh DECIMAL(6, 2),
  navigation_mode TEXT DEFAULT 'online' CHECK (navigation_mode IN ('online', 'offline', 'hybrid')),
  reroute_count INTEGER NOT NULL DEFAULT 0,
  traffic_delay_minutes INTEGER NOT NULL DEFAULT 0,
  language_used TEXT DEFAULT 'en',
  voice_instructions_count INTEGER NOT NULL DEFAULT 0,
  audio_files_used INTEGER NOT NULL DEFAULT 0,
  speech_synthesis_used INTEGER NOT NULL DEFAULT 0,
  offline_packages_used TEXT[], -- Array of package IDs used offline
  feedback_score INTEGER CHECK (feedback_score >= 1 AND feedback_score <= 5),
  user_feedback TEXT,
  error_count INTEGER NOT NULL DEFAULT 0,
  battery_drain_percentage DECIMAL(5, 2),
  network_type TEXT, -- '4g', '3g', 'wifi', 'offline'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offline_packages_type_language_region ON public.offline_packages(package_type, language_code, region_name);
CREATE INDEX IF NOT EXISTS idx_offline_packages_active ON public.offline_packages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_traffic_data_location_timestamp ON public.traffic_data(location_lat, location_lng, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_data_expires_at ON public.traffic_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_traffic_data_location_only ON public.traffic_data USING gist(point(location_lng, location_lat));
CREATE INDEX IF NOT EXISTS idx_device_offline_packages_device ON public.device_offline_packages(device_id);
CREATE INDEX IF NOT EXISTS idx_navigation_session_logs_user_session ON public.navigation_session_logs(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_navigation_session_logs_order ON public.navigation_session_logs(order_id);

-- Add RLS policies

-- Offline packages: Public read access
ALTER TABLE public.offline_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active offline packages" ON public.offline_packages;
CREATE POLICY "Anyone can view active offline packages"
ON public.offline_packages FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage offline packages" ON public.offline_packages;
CREATE POLICY "Admins can manage offline packages"
ON public.offline_packages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Traffic data: Authenticated read access
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read traffic data" ON public.traffic_data;
CREATE POLICY "Authenticated users can read traffic data"
ON public.traffic_data FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage traffic data" ON public.traffic_data;
CREATE POLICY "Admins can manage traffic data"
ON public.traffic_data FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Device offline packages: Users manage their own devices
ALTER TABLE public.device_offline_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own device packages" ON public.device_offline_packages;
CREATE POLICY "Users can manage their own device packages"
ON public.device_offline_packages FOR ALL
USING (user_id = auth.uid());

-- Navigation session logs: Users view their own, admins view all
ALTER TABLE public.navigation_session_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own navigation logs" ON public.navigation_session_logs;
CREATE POLICY "Users can view their own navigation logs"
ON public.navigation_session_logs FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all navigation logs" ON public.navigation_session_logs;
CREATE POLICY "Admins can view all navigation logs"
ON public.navigation_session_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to download offline package
CREATE OR REPLACE FUNCTION public.download_offline_package(
  p_device_id TEXT,
  p_package_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  package_record RECORD;
BEGIN
  -- Get package details
  SELECT * INTO package_record
  FROM public.offline_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Insert or update device package record
  INSERT INTO public.device_offline_packages (
    device_id,
    user_id,
    package_id,
    downloaded_at
  ) VALUES (
    p_device_id,
    auth.uid(),
    p_package_id,
    now()
  ) ON CONFLICT (device_id, package_id) DO UPDATE SET
    downloaded_at = now(),
    last_accessed_at = now(),
    is_corrupted = false;

  -- Increment download count
  UPDATE public.offline_packages
  SET download_count = download_count + 1
  WHERE id = p_package_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get traffic-aware routing
CREATE OR REPLACE FUNCTION public.get_traffic_aware_route(
  start_lat DECIMAL,
  start_lng DECIMAL,
  end_lat DECIMAL,
  end_lng DECIMAL,
  route_points JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  traffic_segments JSONB := '[]'::jsonb;
BEGIN
  -- Query traffic data along the route path
  -- This is a simplified version - in production integrate with traffic APIs
  SELECT jsonb_agg(
    jsonb_build_object(
      'lat', location_lat,
      'lng', location_lng,
      'traffic_level', traffic_level,
      'congestion_factor', congestion_factor,
      'average_speed', average_speed_kmh,
      'last_updated', timestamp
    )
  ) INTO traffic_segments
  FROM public.traffic_data
  WHERE ST_DWithin(
    ST_Point(location_lng, location_lat)::geography,
    ST_MakeLine(
      ARRAY[ST_Point(start_lng, start_lat), ST_Point(end_lng, end_lat)]
    )::geography,
    1000 -- Within 1km of route
  )
  AND timestamp > now() - INTERVAL '30 minutes'
  ORDER BY ST_Distance(
    ST_Point(location_lng, location_lat)::geography,
    ST_Point(start_lng, start_lat)::geography
  );

  -- Build result with traffic-adjusted route information
  result := jsonb_build_object(
    'route_segments', route_points,
    'traffic_data', COALESCE(traffic_segments, '[]'::jsonb),
    'generated_at', now(),
    'traffic_score', CASE
      WHEN traffic_segments IS NULL OR jsonb_array_length(traffic_segments) = 0 THEN 100
      ELSE GREATEST(0, 100 - (
        SELECT AVG((
          CASE traffic_level
            WHEN 'free_flow' THEN 0
            WHEN 'light' THEN 10
            WHEN 'moderate' THEN 25
            WHEN 'heavy' THEN 50
            WHEN 'congestion' THEN 75
            ELSE 0
          END
        ))::decimal
        FROM jsonb_array_elements(traffic_segments)
        WHERE value->>'traffic_level' IS NOT NULL
      ))
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log navigation session
CREATE OR REPLACE FUNCTION public.log_navigation_session(
  p_session_id TEXT,
  p_order_id UUID DEFAULT NULL,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_stats JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  session_uuid UUID;
BEGIN
  INSERT INTO public.navigation_session_logs (
    session_id,
    user_id,
    order_id,
    start_time,
    end_time,
    total_distance_meters,
    total_duration_seconds,
    average_speed_kmh,
    navigation_mode,
    reroute_count,
    traffic_delay_minutes,
    language_used,
    voice_instructions_count,
    audio_files_used,
    speech_synthesis_used,
    feedback_score,
    user_feedback,
    error_count,
    battery_drain_percentage,
    network_type
  ) VALUES (
    p_session_id,
    auth.uid(),
    p_order_id,
    p_start_time,
    p_end_time,
    (p_stats->>'total_distance_meters')::INTEGER,
    (p_stats->>'total_duration_seconds')::INTEGER,
    (p_stats->>'average_speed_kmh')::DECIMAL,
    COALESCE(p_stats->>'navigation_mode', 'online'),
    COALESCE((p_stats->>'reroute_count')::INTEGER, 0),
    COALESCE((p_stats->>'traffic_delay_minutes')::INTEGER, 0),
    COALESCE(p_stats->>'language_used', 'en'),
    COALESCE((p_stats->>'voice_instructions_count')::INTEGER, 0),
    COALESCE((p_stats->>'audio_files_used')::INTEGER, 0),
    COALESCE((p_stats->>'speech_synthesis_used')::INTEGER, 0),
    (p_stats->>'feedback_score')::INTEGER,
    p_stats->>'user_feedback',
    COALESCE((p_stats->>'error_count')::INTEGER, 0),
    (p_stats->>'battery_drain_percentage')::DECIMAL,
    p_stats->>'network_type'
  ) RETURNING id INTO session_uuid;

  RETURN session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample offline packages for testing
INSERT INTO public.offline_packages (
  package_name,
  package_type,
  language_code,
  region_name,
  file_path,
  file_size_bytes,
  version,
  checksum
) VALUES
('English Voice Pack', 'voice_pack', 'en', 'global', '/storage/voice/en/v2.0.zip', 52428800, '2.0.0', 'abc123...'),
('Hindi Voice Pack', 'voice_pack', 'hi', 'global', '/storage/voice/hi/v2.0.zip', 62914560, '2.0.0', 'def456...'),
('Kannada Voice Pack', 'voice_pack', 'kn', 'global', '/storage/voice/kn/v2.0.zip', 57671680, '2.0.0', 'ghi789...'),
('Bangalore Map Data', 'map_region', NULL, 'bangalore', '/storage/maps/bangalore/v1.5.zip', 1073741824, '1.5.0', 'jkl012...'),
('Karnataka Map Data', 'map_region', NULL, 'karnataka', '/storage/maps/karnataka/v1.5.zip', 5368709120, '1.5.0', 'mno345...'),
('English Karnataka', 'language_data', 'en', 'karnataka', '/storage/lang/en-ka/v1.0.zip', 10485760, '1.0.0', 'pqr678...'),
('Kannada Karnataka', 'language_data', 'kn', 'karnataka', '/storage/lang/kn-ka/v1.0.zip', 12582912, '1.0.0', 'stu901...')
ON CONFLICT (package_type, language_code, region_name) DO NOTHING;

-- Insert some mock traffic data for testing
INSERT INTO public.traffic_data (
  location_lat, location_lng, traffic_level, average_speed_kmh,
  congestion_factor, data_source, confidence_score, expires_at
) VALUES
(12.9716, 77.5946, 'moderate', 25.5, 1.4, 'traffic_api', 0.85, now() + INTERVAL '1 hour'),
(12.9352, 77.6245, 'heavy', 15.2, 2.1, 'sensor_fusion', 0.92, now() + INTERVAL '1 hour'),
(13.0827, 80.2707, 'light', 40.1, 1.1, 'traffic_api', 0.78, now() + INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.download_offline_package(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_traffic_aware_route(DECIMAL, DECIMAL, DECIMAL, DECIMAL, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_navigation_session(TEXT, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, JSONB) TO authenticated;
