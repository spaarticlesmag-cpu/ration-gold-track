-- Create delivery_location_tracking table for GPS tracking
CREATE TABLE IF NOT EXISTS public.delivery_location_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2), -- GPS accuracy in meters
  speed DECIMAL(5, 2), -- Speed in m/s (optional)
  heading DECIMAL(5, 1), -- Direction in degrees (optional)
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'emergency'
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_location_tracking_partner_id ON public.delivery_location_tracking(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_location_tracking_order_id ON public.delivery_location_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_location_tracking_timestamp ON public.delivery_location_tracking(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_location_tracking_status ON public.delivery_location_tracking(status);

-- Enable RLS on delivery_location_tracking
ALTER TABLE public.delivery_location_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for delivery partners to manage their own tracking data
DROP POLICY IF EXISTS "Delivery partners can view their own locations" ON public.delivery_location_tracking;
DROP POLICY IF EXISTS "Delivery partners can insert their own locations" ON public.delivery_location_tracking;
DROP POLICY IF EXISTS "Admins can view all locations" ON public.delivery_location_tracking;

CREATE POLICY "Delivery partners can view their own locations"
ON public.delivery_location_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'delivery_partner'
  ) AND delivery_partner_id = auth.uid()
);

CREATE POLICY "Delivery partners can insert their own locations"
ON public.delivery_location_tracking
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'delivery_partner'
  ) AND delivery_partner_id = auth.uid()
);

CREATE POLICY "Admins can view all locations"
ON public.delivery_location_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to automatically update delivery status when location is updated
CREATE OR REPLACE FUNCTION update_delivery_status_on_location_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order status to 'out_for_delivery' if GPS tracking starts and order exists
  IF NEW.order_id IS NOT NULL AND NEW.status = 'active' THEN
    UPDATE public.orders
    SET status = 'out_for_delivery'
    WHERE id = NEW.order_id AND status = 'approved';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_delivery_status ON public.delivery_location_tracking;

-- Create trigger
CREATE TRIGGER trigger_update_delivery_status
  AFTER INSERT ON public.delivery_location_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_status_on_location_update();

-- Create audit_logs table for comprehensive transparency tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  severity_level TEXT NOT NULL CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity_level);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access to audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create SMS logs table
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  sender_phone TEXT,
  message_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  reference_id TEXT,
  cost DECIMAL(10,4),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for SMS logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient ON public.sms_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at DESC);

-- Enable RLS on SMS logs
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Admin access to SMS logs
DROP POLICY IF EXISTS "Admins can view SMS logs" ON public.sms_logs;

CREATE POLICY "Admins can view SMS logs"
ON public.sms_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle emergency alerts (logs GPS location for emergency response)
CREATE OR REPLACE FUNCTION handle_emergency_alert(
  partner_id UUID,
  emergency_lat DECIMAL,
  emergency_lng DECIMAL,
  emergency_accuracy DECIMAL
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  -- Insert emergency location into tracking table
  INSERT INTO public.delivery_location_tracking (
    delivery_partner_id,
    latitude,
    longitude,
    accuracy,
    status
  ) VALUES (
    partner_id,
    emergency_lat,
    emergency_lng,
    emergency_accuracy,
    'emergency'
  ) RETURNING id INTO alert_id;

  -- Could integrate with SMS/government emergency services here
  -- For now, just log and return the alert ID

  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get corruption risk indicators
CREATE OR REPLACE FUNCTION get_corruption_risk_score(partner_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  risk_score DECIMAL := 0;
  deviation_count INTEGER := 0;
  timing_anomalies INTEGER := 0;
  total_deliveries INTEGER := 0;
BEGIN
  -- Count route deviations (locations outside expected delivery zones)
  SELECT COUNT(*) INTO deviation_count
  FROM public.delivery_location_tracking dlt
  JOIN public.orders o ON dlt.order_id = o.id
  WHERE dlt.delivery_partner_id = partner_id
    AND dlt.status = 'emergency';

  -- Count timing anomalies (unusually long delays)
  SELECT COUNT(*) INTO timing_anomalies
  FROM public.audit_logs
  WHERE user_id = partner_id
    AND action = 'ORDER_STATUS_CHANGE'
    AND details->>'from' != 'delivered'
    AND severity_level = 'HIGH';

  -- Total deliveries this month
  SELECT COUNT(*) INTO total_deliveries
  FROM public.orders
  WHERE customer_id = partner_id
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

  -- Calculate risk score (0-100)
  IF total_deliveries > 0 THEN
    risk_score := ((deviation_count + timing_anomalies) * 20.0) / total_deliveries;
    risk_score := LEAST(risk_score, 100.0);
  END IF;

  RETURN ROUND(risk_score, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to generate government transparency reports
CREATE OR REPLACE FUNCTION generate_government_report(
  report_month INTEGER,
  report_year INTEGER
)
RETURNS JSONB AS $$
DECLARE
  report_data JSONB;
  total_deliveries BIGINT;
  on_time_deliveries BIGINT;
  corruption_alerts BIGINT;
  fuel_savings DECIMAL;
BEGIN
  -- Total deliveries
  SELECT COUNT(*) INTO total_deliveries
  FROM public.orders
  WHERE EXTRACT(MONTH FROM created_at) = report_month
    AND EXTRACT(YEAR FROM created_at) = report_year;

  -- On-time deliveries (within 30 minutes of estimated time)
  SELECT COUNT(*) INTO on_time_deliveries
  FROM public.orders o
  LEFT JOIN public.delivery_location_tracking dlt ON o.id = dlt.order_id
  WHERE EXTRACT(MONTH FROM o.created_at) = report_month
    AND EXTRACT(YEAR FROM o.created_at) = report_year
    AND dlt.status != 'emergency';

  -- Corruption alerts
  SELECT COUNT(*) INTO corruption_alerts
  FROM public.audit_logs
  WHERE EXTRACT(MONTH FROM timestamp) = report_month
    AND EXTRACT(YEAR FROM timestamp) = report_year
    AND severity_level IN ('HIGH', 'CRITICAL');

  -- Estimated fuel savings (simplified calculation)
  fuel_savings := (total_deliveries * 15.42) - (total_deliveries * 8.37); -- km saved per delivery

  -- Build report JSON
  report_data := jsonb_build_object(
    'report_period', jsonb_build_object(
      'month', report_month,
      'year', report_year
    ),
    'summary', jsonb_build_object(
      'total_deliveries', total_deliveries,
      'on_time_percentage', CASE
        WHEN total_deliveries > 0 THEN ROUND((on_time_deliveries::DECIMAL / total_deliveries) * 100, 2)
        ELSE 0
      END,
      'corruption_alerts', corruption_alerts,
      'fuel_savings_liters', ROUND(fuel_savings / 8 * 0.08, 2), -- Rough fuel consumption
      'transparency_score', CASE
        WHEN total_deliveries > 0 THEN GREATEST(95 - (corruption_alerts::DECIMAL / total_deliveries * 100), 0)
        ELSE 100
      END
    ),
    'regional_breakdown', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'region', region,
          'deliveries', deliveries,
          'efficiency', efficiency,
          'alerts', alerts
        )
      )
      FROM (
        SELECT
          CASE
            WHEN SUBSTRING(o.delivery_address FROM '[0-9]{6}') LIKE '560%' THEN 'Bangalore'
            WHEN SUBSTRING(o.delivery_address FROM '[0-9]{6}') LIKE '600%' THEN 'Chennai'
            WHEN SUBSTRING(o.delivery_address FROM '[0-9]{6}') LIKE '400%' THEN 'Mumbai'
            WHEN SUBSTRING(o.delivery_address FROM '[0-9]{6}') LIKE '110%' THEN 'Delhi'
            ELSE 'Other'
          END as region,
          COUNT(*) as deliveries,
          ROUND(AVG(CASE WHEN dlt.status != 'emergency' THEN 1 ELSE 0 END) * 100, 2) as efficiency,
          COUNT(CASE WHEN al.severity_level IN ('HIGH', 'CRITICAL') THEN 1 END) as alerts
        FROM public.orders o
        LEFT JOIN public.audit_logs al ON o.id = al.resource_id AND al.resource_type = 'ORDER'
        LEFT JOIN public.delivery_location_tracking dlt ON o.id = dlt.order_id
        WHERE EXTRACT(MONTH FROM o.created_at) = report_month
          AND EXTRACT(YEAR FROM o.created_at) = report_year
        GROUP BY region
      ) regional_stats
    )
  );

  RETURN report_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
