-- Add ration card type enum
CREATE TYPE public.ration_card_type AS ENUM ('yellow', 'pink', 'blue', 'white');

-- Add ration card verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- Add new columns to profiles table for ration card system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ration_card_type ration_card_type,
ADD COLUMN IF NOT EXISTS household_members INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS aadhaar_document_url TEXT,
ADD COLUMN IF NOT EXISTS ration_card_document_url TEXT,
ADD COLUMN IF NOT EXISTS government_id TEXT,
ADD COLUMN IF NOT EXISTS card_issue_date DATE,
ADD COLUMN IF NOT EXISTS card_expiry_date DATE;

-- Create ration_quotas table to define quotas for each card type
CREATE TABLE IF NOT EXISTS public.ration_quotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_type ration_card_type NOT NULL,
  item_name TEXT NOT NULL,
  quantity_per_member DECIMAL(10,2) DEFAULT 0,
  fixed_quantity DECIMAL(10,2) DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit DECIMAL(10,2) DEFAULT 0,
  is_subsidized BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(card_type, item_name)
);

-- Enable RLS on ration_quotas
ALTER TABLE public.ration_quotas ENABLE ROW LEVEL SECURITY;

-- Create policies for ration_quotas
CREATE POLICY "Anyone can view ration quotas" 
ON public.ration_quotas 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage ration quotas" 
ON public.ration_quotas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for ration_quotas updated_at
CREATE TRIGGER update_ration_quotas_updated_at
  BEFORE UPDATE ON public.ration_quotas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ration quotas based on the provided specifications
INSERT INTO public.ration_quotas (card_type, item_name, quantity_per_member, fixed_quantity, unit, price_per_unit, is_subsidized) VALUES
-- Yellow Card (AAY) - Antyodaya Anna Yojana
('yellow', 'Rice', 0, 20, 'kg', 0, true),
('yellow', 'Wheat', 0, 15, 'kg', 0, true),
('yellow', 'Sugar', 0, 2, 'kg', 0, true),

-- Pink Card (Priority/BPL) - Below Poverty Line
('pink', 'Rice', 4, 0, 'kg', 0, true),
('pink', 'Wheat', 1, 0, 'kg', 0, true),
('pink', 'Sugar', 0, 2, 'kg', 0, true),

-- Blue Card (APL Subsidy) - Above Poverty Line with subsidy
('blue', 'Rice', 0, 9, 'kg', 2, true),
('blue', 'Wheat', 0, 2, 'kg', 6.7, true),
('blue', 'Sugar', 0, 1, 'kg', 0, true),

-- White Card (APL Non-Priority) - Above Poverty Line
('white', 'Rice', 2, 0, 'kg', 0, false),
('white', 'Wheat', 1, 0, 'kg', 0, false),
('white', 'Sugar', 0, 1, 'kg', 0, false)
ON CONFLICT (card_type, item_name) DO NOTHING;

-- Create function to get user's ration quota
CREATE OR REPLACE FUNCTION public.get_user_ration_quota(user_uuid UUID)
RETURNS TABLE (
  item_name TEXT,
  allocated_quantity DECIMAL(10,2),
  unit TEXT,
  price_per_unit DECIMAL(10,2),
  is_subsidized BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rq.item_name,
    CASE 
      WHEN rq.quantity_per_member > 0 THEN rq.quantity_per_member * COALESCE(p.household_members, 1)
      ELSE rq.fixed_quantity
    END as allocated_quantity,
    rq.unit,
    rq.price_per_unit,
    rq.is_subsidized
  FROM public.ration_quotas rq
  CROSS JOIN public.profiles p
  WHERE p.user_id = user_uuid 
    AND p.ration_card_type = rq.card_type
    AND p.verification_status = 'verified';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify ration card
CREATE OR REPLACE FUNCTION public.verify_ration_card(
  profile_id UUID,
  verification_status verification_status,
  verification_notes TEXT DEFAULT NULL,
  verified_by_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    verification_status = verify_ration_card.verification_status,
    verification_notes = verify_ration_card.verification_notes,
    verified_at = CASE 
      WHEN verify_ration_card.verification_status = 'verified' THEN now()
      ELSE verified_at
    END,
    verified_by = verify_ration_card.verified_by_uuid
  WHERE id = profile_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to handle new user registration with ration card data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    role,
    mobile_number,
    address,
    ration_card_type,
    ration_card_number,
    household_members,
    aadhaar_number,
    government_id,
    card_issue_date,
    card_expiry_date,
    aadhaar_document_url,
    ration_card_document_url
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role),
    NEW.raw_user_meta_data->>'mobile_number',
    NEW.raw_user_meta_data->>'address',
    (NEW.raw_user_meta_data->>'ration_card_type')::ration_card_type,
    NEW.raw_user_meta_data->>'ration_card_number',
    COALESCE((NEW.raw_user_meta_data->>'household_members')::INTEGER, 1),
    NEW.raw_user_meta_data->>'aadhaar_number',
    NEW.raw_user_meta_data->>'government_id',
    (NEW.raw_user_meta_data->>'card_issue_date')::DATE,
    (NEW.raw_user_meta_data->>'card_expiry_date')::DATE,
    NEW.raw_user_meta_data->>'aadhaar_document_url',
    NEW.raw_user_meta_data->>'ration_card_document_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_ration_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_ration_card(UUID, verification_status, TEXT, UUID) TO authenticated;
