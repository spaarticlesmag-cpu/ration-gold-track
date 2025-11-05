# Hooks API

## `useAuth`

Context hook providing auth state and actions backed by Supabase.

Exports: `useAuth`, `AuthProvider` (component), plus dev helpers.

State
- `user`: Supabase `User | null`
- `session`: Supabase `Session | null`
- `profile`: user profile with ration metadata
- `loading`: boolean

Actions
- `signIn(email, password): Promise<{ error: any }>`
- `signUp(email, password, fullName, mobile, address, role?, rationCardData?): Promise<{ error: any }>`
- `signOut(): Promise<void>`
- `refreshProfile(): Promise<void>`
- `devSignIn(role, opts?)`: mock session for local/demo
- `devSignOut()`: clear mock

Usage
```tsx
import { AuthProvider, useAuth } from "@/hooks/useAuth";

export function AppShell() {
  return (
    <AuthProvider>
      <MyRoutes />
    </AuthProvider>
  );
}

function ProfileButton() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return <button onClick={signOut}>Sign out</button>;
}
```

## `useCart`

Client-side cart with localStorage persistence.

State
- `lines: CartLine[]` where `CartLine = { id, name, unit, price, quantity }`
- `totalItems: number`
- `totalAmount: number`

Actions
- `add(line: Omit<CartLine, "quantity">, qty = 1)`
- `remove(id: string, qty = 1)`
- `clear()`

Usage
```tsx
import { CartProvider, useCart } from "@/hooks/useCart";

function Root() {
  return (
    <CartProvider>
      <Shop />
    </CartProvider>
  );
}

function AddToCart({ item }) {
  const { add } = useCart();
  return (
    <button onClick={() => add({ id: item.id, name: item.name, unit: item.unit, price: item.price }, 1)}>
      Add
    </button>
  );
}
```

## `useIsMobile`

Responsive helper returning a boolean for `max-width: 768px`.

Usage
```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function Layout() {
  const isMobile = useIsMobile();
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>;
}
```

## `useToast` and `toast`
### Examples

#### Sign up with ration data
```tsx
const { signUp } = useAuth();
await signUp(
  "user@example.com",
  "password123",
  "Asha",
  "9999999999",
  "Kochi, Kerala",
  "customer",
  { ration_card_type: "pink", ration_card_number: "KRL-1234", household_members: 4 }
);
```

#### Add to cart and compute totals
```tsx
const { add, totalItems, totalAmount } = useCart();
add({ id: "rice", name: "Rice", unit: "kg", price: 25 }, 2);
```

#### Trigger a toast
```tsx
const { toast } = useToast();
toast({ title: "Saved", description: "Your changes were saved." });
```

Global toast system.

- `useToast()` returns `{ toasts, toast, dismiss }`
- `toast(opts)` returns `{ id, update, dismiss }`

Usage
```tsx
import { useToast } from "@/hooks/use-toast";

function SaveButton() {
  const { toast } = useToast();
  return (
    <button
      onClick={() => toast({ title: 'Saved', description: 'Your changes were saved.' })}
    >
      Save
    </button>
  );
}
```