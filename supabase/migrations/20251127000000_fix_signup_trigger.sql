-- Update the handle_new_user function to properly handle signup data
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
