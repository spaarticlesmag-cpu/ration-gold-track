-- Align ration_quotas with specified benefits and pricing
-- Yellow: 35kg free essentials (20kg rice + 15kg wheat)
-- Pink: 5kg/member free (4kg rice + 1kg wheat)
-- Blue: Rice at ~₹4/kg (2kg per person) under state subsidy
-- White: Rice at ~₹10.90/kg fixed quantity per card; minimal/no wheat subsidy

-- Ensure ration_card_type exists (handled in earlier migration)

-- Upsert AAY (Yellow) quotas: 35kg (20 rice + 15 wheat) at NFSA prices
INSERT INTO public.ration_quotas (card_type, item_name, quantity_per_member, fixed_quantity, unit, price_per_unit, is_subsidized)
VALUES
  ('yellow', 'Rice', 0, 20, 'kg', 3, true),
  ('yellow', 'Wheat', 0, 15, 'kg', 2, true)
ON CONFLICT (card_type, item_name)
DO UPDATE SET
  quantity_per_member = EXCLUDED.quantity_per_member,
  fixed_quantity = EXCLUDED.fixed_quantity,
  unit = EXCLUDED.unit,
  price_per_unit = EXCLUDED.price_per_unit,
  is_subsidized = EXCLUDED.is_subsidized,
  updated_at = now();

-- Upsert PHH (Pink) quotas: 5kg/member (4 rice + 1 wheat) at NFSA prices
INSERT INTO public.ration_quotas (card_type, item_name, quantity_per_member, fixed_quantity, unit, price_per_unit, is_subsidized)
VALUES
  ('pink', 'Rice', 4, 0, 'kg', 3, true),
  ('pink', 'Wheat', 1, 0, 'kg', 2, true)
ON CONFLICT (card_type, item_name)
DO UPDATE SET
  quantity_per_member = EXCLUDED.quantity_per_member,
  fixed_quantity = EXCLUDED.fixed_quantity,
  unit = EXCLUDED.unit,
  price_per_unit = EXCLUDED.price_per_unit,
  is_subsidized = EXCLUDED.is_subsidized,
  updated_at = now();

-- Upsert Blue quotas
-- Only rice is explicitly specified: 2kg per person at ~₹4/kg, subsidized
INSERT INTO public.ration_quotas (card_type, item_name, quantity_per_member, fixed_quantity, unit, price_per_unit, is_subsidized)
VALUES
  ('blue', 'Rice', 2, 0, 'kg', 4, true)
ON CONFLICT (card_type, item_name)
DO UPDATE SET
  quantity_per_member = EXCLUDED.quantity_per_member,
  fixed_quantity = EXCLUDED.fixed_quantity,
  unit = EXCLUDED.unit,
  price_per_unit = EXCLUDED.price_per_unit,
  is_subsidized = EXCLUDED.is_subsidized,
  updated_at = now();

-- Optionally set Blue wheat to zero allocation (if previously present)
UPDATE public.ration_quotas
SET quantity_per_member = 0, fixed_quantity = 0, price_per_unit = 0, is_subsidized = true, updated_at = now()
WHERE card_type = 'blue' AND item_name = 'Wheat';

-- Upsert White quotas
-- Use a fixed per-card allocation; set to 5kg rice at ~₹10.90/kg, non-subsidized
INSERT INTO public.ration_quotas (card_type, item_name, quantity_per_member, fixed_quantity, unit, price_per_unit, is_subsidized)
VALUES
  ('white', 'Rice', 0, 5, 'kg', 10.90, false)
ON CONFLICT (card_type, item_name)
DO UPDATE SET
  quantity_per_member = EXCLUDED.quantity_per_member,
  fixed_quantity = EXCLUDED.fixed_quantity,
  unit = EXCLUDED.unit,
  price_per_unit = EXCLUDED.price_per_unit,
  is_subsidized = EXCLUDED.is_subsidized,
  updated_at = now();

-- Optionally set White wheat to zero or remove subsidized entries
UPDATE public.ration_quotas
SET quantity_per_member = 0, fixed_quantity = 0, price_per_unit = 0, is_subsidized = false, updated_at = now()
WHERE card_type = 'white' AND item_name = 'Wheat';

-- Create enums only if they don't exist
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('customer', 'delivery_partner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'approved', 'out_for_delivery', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  mobile_number TEXT,
  address TEXT,
  aadhaar_number TEXT,
  ration_card_number TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create ration_items table
CREATE TABLE IF NOT EXISTS public.ration_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ration_items
ALTER TABLE public.ration_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can view ration items" ON public.ration_items;
DROP POLICY IF EXISTS "Only admins can manage ration items" ON public.ration_items;

CREATE POLICY "Anyone can view ration items" 
ON public.ration_items 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage ration items" 
ON public.ration_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT NOT NULL,
  qr_code TEXT,
  qr_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can view approved orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can update order status" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Delivery partners can view approved orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'delivery_partner'
  ) AND status IN ('approved', 'out_for_delivery')
);

CREATE POLICY "Delivery partners can update order status" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'delivery_partner'
  ) AND status IN ('approved', 'out_for_delivery')
);

CREATE POLICY "Admins can manage all orders" 
ON public.orders 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing triggers if they exist and recreate
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_ration_items_updated_at ON public.ration_items;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ration_items_updated_at
  BEFORE UPDATE ON public.ration_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample ration items if they don't exist
INSERT INTO public.ration_items (name, price_per_kg, stock_quantity, image_url) 
SELECT 'Rice', 35.00, 1000, '/src/assets/rice.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.ration_items WHERE name = 'Rice');

INSERT INTO public.ration_items (name, price_per_kg, stock_quantity, image_url) 
SELECT 'Wheat', 28.00, 800, '/src/assets/wheat.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.ration_items WHERE name = 'Wheat');

INSERT INTO public.ration_items (name, price_per_kg, stock_quantity, image_url) 
SELECT 'Sugar', 42.00, 500, '/src/assets/sugar.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.ration_items WHERE name = 'Sugar');