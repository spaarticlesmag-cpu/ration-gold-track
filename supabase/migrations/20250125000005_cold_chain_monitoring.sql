-- Cold Chain Monitoring System Database Schema
-- Adds IoT temperature/humidity sensors and quality tracking for rations

-- Create iot_devices table for sensor management
CREATE TABLE IF NOT EXISTS public.iot_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE, -- Hardware device identifier
  device_name TEXT,
  device_type TEXT NOT NULL CHECK (device_type IN ('temperature_sensor', 'humidity_sensor', 'multi_sensor', 'gps_tracker')),
  vehicle_id UUID REFERENCES public.vehicles(id), -- Assuming we have a vehicles table
  storage_unit_id TEXT, -- For warehouse/storage tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  battery_level DECIMAL(5, 2), -- Battery percentage 0-100
  last_seen TIMESTAMP WITH TIME ZONE,
  firmware_version TEXT,
  calibration_date TIMESTAMP WITH TIME ZONE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sensor_readings table for time-series data
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  reading_type TEXT NOT NULL CHECK (reading_type IN ('temperature', 'humidity', 'pressure', 'gps')),
  value DECIMAL(10, 4) NOT NULL,
  unit TEXT NOT NULL, -- 'celsius', 'fahrenheit', 'percentage', 'lat', 'lng'
  accuracy DECIMAL(5, 2), -- Sensor accuracy confidence 0-100
  quality_score DECIMAL(3, 2), -- Data quality 0.0-1.0
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  order_id UUID REFERENCES public.orders(id), -- Link to specific delivery
  batch_id TEXT, -- For batch tracking (ration item batches)
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cold_chain_alerts table for threshold violations
CREATE TABLE IF NOT EXISTS public.cold_chain_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.iot_devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('temperature_high', 'temperature_low', 'humidity_high', 'humidity_low', 'device_offline', 'battery_low', 'sensor_failure')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  threshold_value DECIMAL(10, 4),
  actual_value DECIMAL(10, 4),
  description TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_notes TEXT,
  auto_resolved BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage_conditions table for required conditions per item type
CREATE TABLE IF NOT EXISTS public.storage_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL, -- 'rice', 'wheat', 'sugar', 'milk', 'vegetables'
  min_temperature DECIMAL(6, 2), -- Celsius
  max_temperature DECIMAL(6, 2), -- Celsius
  min_humidity DECIMAL(5, 2), -- Percentage
  max_humidity DECIMAL(5, 2), -- Percentage
  max_exposure_hours INTEGER, -- Maximum hours outside range before spoilage
  shelf_life_days INTEGER,
  requires_refrigeration BOOLEAN NOT NULL DEFAULT false,
  monitoring_required BOOLEAN NOT NULL DEFAULT true,
  quality_degradation_rate DECIMAL(3, 2), -- Quality loss per hour outside range
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_type)
);

-- Create batch_tracking table for ration item batches
CREATE TABLE IF NOT EXISTS public.batch_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  item_type TEXT NOT NULL,
  manufacturer TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  initial_quantity INTEGER NOT NULL,
  current_quantity INTEGER NOT NULL,
  storage_location TEXT,
  quality_score DECIMAL(3, 2) NOT NULL DEFAULT 1.0, -- 0.0-1.0 quality rating
  temperature_violations INTEGER NOT NULL DEFAULT 0,
  total_violation_hours DECIMAL(6, 2) NOT NULL DEFAULT 0.0,
  last_inspection TIMESTAMP WITH TIME ZONE,
  inspector UUID REFERENCES auth.users(id),
  is_recalled BOOLEAN NOT NULL DEFAULT false,
  recall_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_iot_devices_device_id ON public.iot_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_active ON public.iot_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device ON public.sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON public.sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type ON public.sensor_readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_order ON public.sensor_readings(order_id);
CREATE INDEX IF NOT EXISTS idx_cold_chain_alerts_device ON public.cold_chain_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_cold_chain_alerts_unresolved ON public.cold_chain_alerts(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_cold_chain_alerts_timestamp ON public.cold_chain_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_batch_tracking_expiry ON public.batch_tracking(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batch_tracking_quality ON public.batch_tracking(quality_score);

-- Enable RLS

-- IoT devices: Admin management, partner view access
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage IoT devices" ON public.iot_devices;
CREATE POLICY "Admins can manage IoT devices"
ON public.iot_devices FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Delivery partners can view assigned devices" ON public.iot_devices;
CREATE POLICY "Delivery partners can view assigned devices"
ON public.iot_devices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.iot_devices d ON d.vehicle_id = p.vehicle_id
    WHERE p.user_id = auth.uid() AND p.role = 'delivery_partner'
  )
);

-- Sensor readings: Authenticated read access for monitoring
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage sensor readings" ON public.sensor_readings;
CREATE POLICY "Admins can manage sensor readings"
ON public.sensor_readings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Authenticated users can view relevant readings" ON public.sensor_readings;
CREATE POLICY "Authenticated users can view relevant readings"
ON public.sensor_readings FOR SELECT
USING (
  auth.role() = 'authenticated' AND (
    -- Users can see readings for their orders
    order_id IN (
      SELECT o.id FROM public.orders o WHERE o.customer_id = auth.uid()
    ) OR
    -- Delivery partners can see readings from their vehicles
    device_id IN (
      SELECT d.id FROM public.iot_devices d
      WHERE d.vehicle_id IN (
        SELECT p.vehicle_id FROM public.profiles p WHERE p.user_id = auth.uid()
      )
    )
  )
);

-- Cold chain alerts: Related users can view
ALTER TABLE public.cold_chain_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage alerts" ON public.cold_chain_alerts;
CREATE POLICY "Admins can manage alerts"
ON public.cold_chain_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view alerts for their orders/deliveries" ON public.cold_chain_alerts;
CREATE POLICY "Users can view alerts for their orders/deliveries"
ON public.cold_chain_alerts FOR SELECT
USING (
  order_id IN (
    SELECT o.id FROM public.orders o WHERE o.customer_id = auth.uid()
  ) OR
  device_id IN (
    SELECT d.id FROM public.iot_devices d
    WHERE d.vehicle_id IN (
      SELECT p.vehicle_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
);

-- Storage conditions and batch tracking: Public read for customers, admin management
ALTER TABLE public.storage_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view storage conditions" ON public.storage_conditions;
CREATE POLICY "Authenticated users can view storage conditions"
ON public.storage_conditions FOR SELECT
USING (auth.role() = 'authenticated' AND monitoring_required = true);

DROP POLICY IF EXISTS "Admins can manage storage conditions" ON public.storage_conditions;
CREATE POLICY "Admins can manage storage conditions"
ON public.storage_conditions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can view batch information" ON public.batch_tracking;
CREATE POLICY "Users can view batch information"
ON public.batch_tracking FOR SELECT
USING (auth.role() = 'authenticated' AND is_recalled = false);

DROP POLICY IF EXISTS "Admins can manage batches" ON public.batch_tracking;
CREATE POLICY "Admins can manage batches"
ON public.batch_tracking FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function for temperature monitoring and alerts
CREATE OR REPLACE FUNCTION public.monitor_cold_chain_conditions()
RETURNS VOID AS $$
DECLARE
  reading_record RECORD;
  condition_record RECORD;
  violation_count INTEGER := 0;
BEGIN
  -- Check recent sensor readings against storage conditions
  FOR reading_record IN
    SELECT sr.*, sc.*,
           CASE
             WHEN sr.reading_type = 'temperature' THEN
               CASE WHEN sr.value < sc.min_temperature OR sr.value > sc.max_temperature THEN true ELSE false END
             WHEN sr.reading_type = 'humidity' THEN
               CASE WHEN sr.value < sc.min_humidity OR sr.value > sc.max_humidity THEN true ELSE false END
             ELSE false
           END as is_violation
    FROM public.sensor_readings sr
    JOIN public.batch_tracking bt ON sr.batch_id = bt.batch_number
    JOIN public.storage_conditions sc ON bt.item_type = sc.item_type
    WHERE sr.timestamp > now() - INTERVAL '1 hour'  -- Check last hour
      AND (sr.reading_type = 'temperature' OR sr.reading_type = 'humidity')
  LOOP
    IF reading_record.is_violation THEN
      -- Create alert
      INSERT INTO public.cold_chain_alerts (
        device_id,
        alert_type,
        severity,
        threshold_value,
        actual_value,
        description,
        order_id
      ) VALUES (
        reading_record.device_id,
        CASE reading_record.reading_type
          WHEN 'temperature' THEN
            CASE WHEN reading_record.value > reading_record.max_temperature THEN 'temperature_high' ELSE 'temperature_low' END
          WHEN 'humidity' THEN
            CASE WHEN reading_record.value > reading_record.max_humidity THEN 'humidity_high' ELSE 'humidity_low' END
        END,
        CASE
          WHEN abs(reading_record.value -
            CASE WHEN reading_record.reading_type = 'temperature' THEN (reading_record.min_temperature + reading_record.max_temperature)/2
                 ELSE (reading_record.min_humidity + reading_record.max_humidity)/2 END) > 10 THEN 'critical'
          ELSE 'high'
        END,
        CASE reading_record.reading_type
          WHEN 'temperature' THEN CASE WHEN reading_record.value > reading_record.max_temperature THEN reading_record.max_temperature ELSE reading_record.min_temperature END
          WHEN 'humidity' THEN CASE WHEN reading_record.value > reading_record.max_humidity THEN reading_record.max_humidity ELSE reading_record.min_humidity END
        END,
        reading_record.value,
        format('%s violation: %.2f %s (threshold: %.2f-%.2f)',
               reading_record.reading_type,
               reading_record.value,
               reading_record.unit,
               CASE WHEN reading_record.reading_type = 'temperature' THEN reading_record.min_temperature ELSE reading_record.min_humidity END,
               CASE WHEN reading_record.reading_type = 'temperature' THEN reading_record.max_temperature ELSE reading_record.max_humidity END
        ),
        reading_record.order_id
      );

      -- Update batch quality score
      UPDATE public.batch_tracking
      SET quality_score = GREATEST(0, quality_score - reading_record.quality_degradation_rate),
          temperature_violations = temperature_violations + 1,
          total_violation_hours = total_violation_hours + 1, -- Assuming 1 hour check interval
          updated_at = now()
      WHERE batch_number = reading_record.batch_id;

      violation_count := violation_count + 1;
    END IF;
  END LOOP;

  -- Check for offline devices
  INSERT INTO public.cold_chain_alerts (device_id, alert_type, severity, description)
  SELECT
    id,
    'device_offline'::text,
    'medium'::text,
    'IoT device has not reported in over 30 minutes'::text
  FROM public.iot_devices
  WHERE is_active = true
    AND last_seen < now() - INTERVAL '30 minutes';

  -- Check battery levels
  INSERT INTO public.cold_chain_alerts (device_id, alert_type, severity, description)
  SELECT
    id,
    'battery_low'::text,
    CASE WHEN battery_level < 10 THEN 'critical'::text ELSE 'medium'::text END,
    format('Device battery is at %s%%', battery_level)
  FROM public.iot_devices
  WHERE is_active = true
    AND battery_level < 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate quality degradation
CREATE OR REPLACE FUNCTION public.calculate_batch_quality(batch_number TEXT)
RETURNS DECIMAL AS $$
DECLARE
  batch_record RECORD;
  quality_score DECIMAL;
BEGIN
  SELECT * INTO batch_record
  FROM public.batch_tracking
  WHERE batch_number = batch_number;

  IF NOT FOUND THEN
    RETURN 0.0;
  END IF;

  -- Base quality from storage conditions
  SELECT 1.0 - (quality_degradation_rate * batch_record.total_violation_hours)
  INTO quality_score
  FROM public.storage_conditions
  WHERE item_type = batch_record.item_type;

  -- Factor in time to expiry (closer to expiry reduces quality)
  IF batch_record.expiry_date IS NOT NULL THEN
    DECLARE
      days_to_expiry INTEGER := EXTRACT(EPOCH FROM (batch_record.expiry_date - CURRENT_DATE))/86400;
      days_since_manufacture INTEGER := EXTRACT(EPOCH FROM (CURRENT_DATE - batch_record.manufacturing_date))/86400;

      IF days_to_expiry < 30 THEN
        quality_score := quality_score * (days_to_expiry / 30.0); -- Rapid decline near expiry
      END IF;
    END;
  END IF;

  RETURN GREATEST(0.0, LEAST(1.0, quality_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get device status summary
CREATE OR REPLACE FUNCTION public.get_cold_chain_status()
RETURNS JSONB AS $$
DECLARE
  status_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'active_devices', (
      SELECT COUNT(*) FROM public.iot_devices WHERE is_active = true
    ),
    'online_devices', (
      SELECT COUNT(*) FROM public.iot_devices
      WHERE is_active = true AND last_seen > now() - INTERVAL '10 minutes'
    ),
    'total_alerts', (
      SELECT COUNT(*) FROM public.cold_chain_alerts
      WHERE resolved = false AND timestamp > now() - INTERVAL '24 hours'
    ),
    'critical_alerts', (
      SELECT COUNT(*) FROM public.cold_chain_alerts
      WHERE resolved = false AND severity = 'critical' AND timestamp > now() - INTERVAL '24 hours'
    ),
    'temperature_violations_last_hour', (
      SELECT COUNT(*) FROM public.cold_chain_alerts
      WHERE alert_type LIKE 'temperature%' AND timestamp > now() - INTERVAL '1 hour'
    ),
    'average_battery_level', (
      SELECT AVG(battery_level) FROM public.iot_devices WHERE is_active = true
    ),
    'batch_health_score', (
      SELECT AVG(quality_score) FROM public.batch_tracking WHERE is_recalled = false
    )
  ) INTO status_data;

  RETURN status_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default storage conditions for common ration items
INSERT INTO public.storage_conditions (
  item_type, min_temperature, max_temperature, min_humidity, max_humidity,
  max_exposure_hours, shelf_life_days, requires_refrigeration, quality_degradation_rate
) VALUES
('rice', 15, 30, 40, 70, 72, 365, false, 0.01),
('wheat', 10, 25, 35, 60, 96, 365, false, 0.008),
('sugar', 15, 35, 30, 60, 168, 730, false, 0.005),
('milk_powder', 4, 25, 30, 50, 24, 180, false, 0.02),
('pulses', 10, 25, 40, 60, 120, 365, false, 0.015),
('cooking_oil', 10, 30, 20, 50, 8760, 730, false, 0.002)
ON CONFLICT (item_type) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.monitor_cold_chain_conditions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_batch_quality(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cold_chain_status() TO authenticated;
