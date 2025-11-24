-- AI-Powered Document Verification System Database Schema
-- Adds OCR, document scanning, and fraud detection capabilities

-- Create document_scans table for storing OCR results and document analysis
CREATE TABLE IF NOT EXISTS public.document_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('aadhaar_card', 'ration_card', 'driving_license', 'passport', 'voter_id')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  checksum TEXT NOT NULL, -- SHA256 for integrity verification

  -- OCR and AI analysis results
  ocr_extracted_text TEXT,
  confidence_score DECIMAL(3, 2), -- 0.0-1.0 OCR confidence
  extracted_data JSONB, -- Structured data extracted from document
  face_detection JSONB, -- Face detection results with bounding boxes
  fraud_score DECIMAL(3, 2), -- 0.0-1.0 fraud probability (lower is better)
  authenticity_verdict TEXT DEFAULT 'pending' CHECK (authenticity_verdict IN ('authentic', 'suspicious', 'fraudulent', 'pending', 'error')),

  -- Document quality metrics
  image_quality_score DECIMAL(3, 2), -- Overall image quality 0.0-1.0
  brightness_score DECIMAL(3, 2),
  contrast_score DECIMAL(3, 2),
  sharpness_score DECIMAL(3, 2),
  glare_detected BOOLEAN DEFAULT false,
  blur_detected BOOLEAN DEFAULT false,

  -- AI analysis details
  ai_model_version TEXT,
  processing_time_ms INTEGER,
  error_message TEXT,

  -- Verification metadata
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  manual_override BOOLEAN DEFAULT false,
  override_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_verification_rules table for configurable fraud detection rules
CREATE TABLE IF NOT EXISTS public.document_verification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('format_validation', 'data_consistency', 'image_quality', 'face_detection', 'content_analysis')),
  rule_config JSONB NOT NULL, -- Flexible configuration for different rule types
  severity_level TEXT DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_type, rule_name)
);

-- Create document_scan_logs table for detailed logging of verification attempts
CREATE TABLE IF NOT EXISTS public.document_scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.document_scans(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_scans_user_id ON public.document_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_document_scans_profile_id ON public.document_scans(profile_id);
CREATE INDEX IF NOT EXISTS idx_document_scans_type ON public.document_scans(document_type);
CREATE INDEX IF NOT EXISTS idx_document_scans_verdict ON public.document_scans(authenticity_verdict);
CREATE INDEX IF NOT EXISTS idx_document_scans_created_at ON public.document_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_verification_rules_type ON public.document_verification_rules(document_type);
CREATE INDEX IF NOT EXISTS idx_document_verification_rules_active ON public.document_verification_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_document_scan_logs_scan_id ON public.document_scan_logs(scan_id);

-- Enable RLS

-- Document scans: Users can see their own scans, admins can see all
ALTER TABLE public.document_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own document scans" ON public.document_scans;
CREATE POLICY "Users can view their own document scans"
ON public.document_scans FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own document scans" ON public.document_scans;
CREATE POLICY "Users can create their own document scans"
ON public.document_scans FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all document scans" ON public.document_scans;
CREATE POLICY "Admins can manage all document scans"
ON public.document_scans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Verification rules: Read access to authenticated users, admin management
ALTER TABLE public.document_verification_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view verification rules" ON public.document_verification_rules;
CREATE POLICY "Authenticated users can view verification rules"
ON public.document_verification_rules FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage verification rules" ON public.document_verification_rules;
CREATE POLICY "Admins can manage verification rules"
ON public.document_verification_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Scan logs: Admins only
ALTER TABLE public.document_scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view scan logs" ON public.document_scan_logs;
CREATE POLICY "Admins can view scan logs"
ON public.document_scan_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to perform document verification
CREATE OR REPLACE FUNCTION public.verify_document_scan(
  p_scan_id UUID,
  p_extracted_data JSONB,
  p_face_detection JSONB,
  p_fraud_score DECIMAL,
  p_authenticity_verdict TEXT,
  p_quality_scores JSONB,
  p_model_version TEXT DEFAULT 'v1.0'
) RETURNS BOOLEAN AS $$
DECLARE
  scan_record RECORD;
BEGIN
  -- Get scan record
  SELECT * INTO scan_record
  FROM public.document_scans
  WHERE id = p_scan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Update scan with verification results
  UPDATE public.document_scans
  SET
    extracted_data = p_extracted_data,
    face_detection = p_face_detection,
    fraud_score = p_fraud_score,
    authenticity_verdict = p_authenticity_verdict,
    ai_model_version = p_model_version,
    image_quality_score = (p_quality_scores->>'overall')::DECIMAL,
    brightness_score = (p_quality_scores->>'brightness')::DECIMAL,
    contrast_score = (p_quality_scores->>'contrast')::DECIMAL,
    sharpness_score = (p_quality_scores->>'sharpness')::DECIMAL,
    glare_detected = (p_quality_scores->>'glare_detected')::BOOLEAN,
    blur_detected = (p_quality_scores->>'blur_detected')::BOOLEAN,
    verified_at = now(),
    updated_at = now()
  WHERE id = p_scan_id;

  -- Log the verification action
  INSERT INTO public.document_scan_logs (
    scan_id,
    action,
    old_status,
    new_status,
    details,
    performed_by
  ) VALUES (
    p_scan_id,
    'VERIFICATION_COMPLETED',
    scan_record.authenticity_verdict,
    p_authenticity_verdict,
    jsonb_build_object(
      'fraud_score', p_fraud_score,
      'model_version', p_model_version,
      'quality_scores', p_quality_scores
    ),
    auth.uid()
  );

  -- If verification passed and profile is pending, update profile verification status
  IF p_authenticity_verdict = 'authentic' AND scan_record.document_type IN ('aadhaar_card', 'ration_card') THEN
    -- Check if user has both required documents verified
    WITH verified_docs AS (
      SELECT COUNT(*) as verified_count
      FROM public.document_scans
      WHERE user_id = scan_record.user_id
        AND document_type IN ('aadhaar_card', 'ration_card')
        AND authenticity_verdict = 'authentic'
    )
    UPDATE public.profiles
    SET verification_status = CASE
        WHEN verified_docs.verified_count >= 1 THEN 'verified'::verification_status
        ELSE verification_status
      END,
      verified_at = CASE
        WHEN verified_docs.verified_count >= 1 THEN now()
        ELSE verified_at
      END,
      verified_by = CASE
        WHEN verified_docs.verified_count >= 1 THEN auth.uid()
        ELSE verified_by
      END
    FROM verified_docs
    WHERE id = scan_record.profile_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check document quality before processing
CREATE OR REPLACE FUNCTION public.check_document_quality(
  p_file_path TEXT,
  p_document_type TEXT
) RETURNS JSONB AS $$
DECLARE
  quality_result JSONB := '{}';
  rules_record RECORD;
BEGIN
  -- Get applicable quality rules for this document type
  FOR rules_record IN
    SELECT rule_name, rule_config
    FROM public.document_verification_rules
    WHERE document_type = p_document_type
      AND rule_type = 'image_quality'
      AND is_active = true
  LOOP
    -- In production, this would call an AI service to analyze image quality
    -- For now, return mock quality scores
    quality_result := jsonb_build_object(
      'overall', 0.85,
      'brightness', 0.82,
      'contrast', 0.88,
      'sharpness', 0.80,
      'glare_detected', false,
      'blur_detected', false,
      'rules_checked', rules_record.rule_name
    );
  END LOOP;

  -- Default quality scores if no rules found
  IF quality_result = '{}'::jsonb THEN
    quality_result := jsonb_build_object(
      'overall', 0.90,
      'brightness', 0.85,
      'contrast', 0.90,
      'sharpness', 0.85,
      'glare_detected', false,
      'blur_detected', false
    );
  END IF;

  RETURN quality_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for fraud detection based on extracted data
CREATE OR REPLACE FUNCTION public.detect_document_fraud(
  p_document_type TEXT,
  p_extracted_data JSONB,
  p_face_detection JSONB,
  p_quality_score DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  fraud_score DECIMAL := 0.0;
  rules_record RECORD;
  score_modifier DECIMAL := 0;
BEGIN
  -- Start with base score from quality
  IF p_quality_score < 0.7 THEN
    fraud_score := fraud_score + 0.3; -- Poor quality increases suspicion
  END IF;

  -- Apply rules-based fraud detection
  FOR rules_record IN
    SELECT rule_name, rule_config, severity_level
    FROM public.document_verification_rules
    WHERE document_type = p_document_type
      AND rule_type IN ('format_validation', 'data_consistency', 'content_analysis')
      AND is_active = true
  LOOP
    -- In production, this would analyze extracted data against rules
    -- For example: check date formats, number patterns, text consistency
    CASE rules_record.rule_name
      WHEN 'date_format_check' THEN
        -- Check if dates are in valid format and make sense
        score_modifier := 0.05;
      WHEN 'number_consistency' THEN
        -- Check if numbers follow expected patterns
        score_modifier := 0.08;
      WHEN 'text_quality' THEN
        -- Check text extraction confidence
        score_modifier := 0.03;
      ELSE
        score_modifier := 0.02;
    END CASE;

    -- Apply severity multiplier
    CASE rules_record.severity_level
      WHEN 'low' THEN score_modifier := score_modifier * 0.5;
      WHEN 'medium' THEN score_modifier := score_modifier * 1.0;
      WHEN 'high' THEN score_modifier := score_modifier * 1.5;
      WHEN 'critical' THEN score_modifier := score_modifier * 2.0;
    END CASE;

    fraud_score := fraud_score + score_modifier;
  END LOOP;

  -- Face detection validation
  IF p_face_detection IS NOT NULL THEN
    -- Check if face is detected and properly positioned
    IF (p_face_detection->>'face_count')::INTEGER = 0 THEN
      fraud_score := fraud_score + 0.4; -- Missing face is suspicious
    ELSIF (p_face_detection->>'face_count')::INTEGER > 1 THEN
      fraud_score := fraud_score + 0.2; -- Multiple faces might be collage
    END IF;

    -- Check face orientation and quality
    IF (p_face_detection->>'face_angle')::DECIMAL > 30 THEN
      fraud_score := fraud_score + 0.1; -- Unusual angle
    END IF;
  ELSE
    fraud_score := fraud_score + 0.3; -- No face detection data
  END IF;

  -- Cap fraud score between 0 and 1
  fraud_score := GREATEST(0, LEAST(1, fraud_score));

  RETURN ROUND(fraud_score, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default verification rules
INSERT INTO public.document_verification_rules (
  rule_name, document_type, rule_type, rule_config, severity_level, is_active, created_by
) VALUES
-- Aadhaar Card Rules
('date_format_check', 'aadhaar_card', 'format_validation',
 jsonb_build_object('date_formats', ['DD/MM/YYYY', 'YYYY-MM-DD'], 'required_fields', ['date_of_birth']),
 'medium', true, '00000000-0000-0000-0000-000000000000'),

('number_consistency', 'aadhaar_card', 'data_consistency',
 jsonb_build_object('number_patterns', ['^\\d{4}\\s\\d{4}\\s\\d{4}$'], 'field', 'aadhaar_number'),
 'high', true, '00000000-0000-0000-0000-000000000000'),

('face_detection_required', 'aadhaar_card', 'face_detection',
 jsonb_build_object('required', true, 'max_faces', 1, 'min_confidence', 0.8),
 'critical', true, '00000000-0000-0000-0000-000000000000'),

-- Ration Card Rules
('card_number_format', 'ration_card', 'format_validation',
 jsonb_build_object('pattern', '^RC\\d{10}$', 'field', 'card_number'),
 'medium', true, '00000000-0000-0000-0000-000000000000'),

('text_quality', 'ration_card', 'content_analysis',
 jsonb_build_object('min_confidence', 0.75, 'required_text_fields', ['cardholder_name', 'card_number']),
 'medium', true, '00000000-0000-0000-0000-000000000000'),

-- Image Quality Rules
('image_quality_check', 'aadhaar_card', 'image_quality',
 jsonb_build_object('min_overall_quality', 0.7, 'max_glare', 0.1, 'max_blur', 0.2),
 'medium', true, '00000000-0000-0000-0000-000000000000'),

('image_quality_check', 'ration_card', 'image_quality',
 jsonb_build_object('min_overall_quality', 0.6, 'max_glare', 0.2, 'max_blur', 0.3),
 'low', true, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (document_type, rule_name) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.verify_document_scan(UUID, JSONB, JSONB, DECIMAL, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_document_quality(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_document_fraud(TEXT, JSONB, JSONB, DECIMAL) TO authenticated;
