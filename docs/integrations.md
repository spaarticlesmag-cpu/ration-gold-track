# Integrations

## Supabase

- Client: `src/integrations/supabase/client.ts`
- Types: `src/integrations/supabase/types.ts`
- Usage
  ```ts
  import { supabase } from "@/integrations/supabase/client";
  const { data, error } = await supabase.from('profiles').select('*');
  ```
- Auth and Storage are used in hooks and components:
  - Auth: `useAuth` (sign in/up/out, session, profile fetch)
  - Storage: `DocumentUpload` (uploads and returns public URL)

Security notes
- Replace the anon key and URL with your project credentials.
- Restrict RLS policies appropriately for `profiles`, `orders`, and `ration_items` tables.
- RPC used: `verify_ration_card`, `get_user_ration_quota` (implement on your DB or remove calls).

## Firebase (optional)

- Client scaffold: `src/integrations/firebase/client.ts`
- Provides: `getFirebase()` returning `{ app, auth, db, storage }`.
- Environment variables (Vite):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID` (optional)

To migrate to Firebase
- Replace Supabase usage in `useAuth`, `DocumentUpload`, and any DB queries with Firebase Auth, Firestore, and Storage alternatives.