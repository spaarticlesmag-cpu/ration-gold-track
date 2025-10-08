# Components API

Only public exports are listed. Props are inferred from source.

## Layout and Navigation

### `MainLayout`
- Props: `{ children: React.ReactNode }`
- Provides header (`NavHeader`), container, and mobile bottom nav.

Usage
```tsx
import MainLayout from "@/components/MainLayout";

export default function Page() {
  return (
    <MainLayout>
      <div>Content</div>
    </MainLayout>
  );
}
```

### `NavHeader`
- Props: `{ userName?: string; userRole?: 'customer' | 'delivery' | 'admin' }`
- Reads auth context if available; falls back to props.
- Renders role-aware navigation and profile menu.

### `MobileSidebar`
- Props: `{ userName?: string; userRole?: 'customer' | 'delivery' | 'admin' }`
- Mobile-only sheet with role-aware links.

## Shopping and Quota

### `RationItem`
- Props:
  - `id: string`
  - `name: string`
  - `price: number`
  - `image: string`
  - `available: number`
  - `unit: string`
  - `subsidized?: boolean`
  - `onAddToCart(id, quantity)`
  - `onRemoveFromCart(id, quantity)`
  - `cartQuantity?: number`

Usage
```tsx
<RationItem id="rice" name="Rice" price={25.5} image={url} available={5} unit="kg"
  onAddToCart={(id,q)=>{}} onRemoveFromCart={(id,q)=>{}} cartQuantity={2} />
```

### `QuotaCard`
- Props:
  - `quotaItems: { name: string; allocated: number; used: number; unit: string }[]`
  - `cardNumber: string`
  - `validUntil: string`

Usage
```tsx
<QuotaCard quotaItems={[{ name:'Rice', allocated:10, used:3, unit:'kg'}]}
  cardNumber="XXXX-XXXX-1234" validUntil="Dec 2024" />
```

### `DocumentUpload`
- Props:
  - `userId: string`
  - `bucket: string`
  - `folder: string`
  - `label: string`
  - `accept?: string` (default `'image/*,application/pdf'`)
  - `currentUrl?: string | null`
  - `onUploaded?: (publicUrl: string) => void`
- Uploads to Supabase Storage and returns a public URL.

Usage
```tsx
<DocumentUpload userId={uid} bucket="documents" folder="aadhaar" label="Upload Aadhaar"
  onUploaded={(url)=>setUrl(url)} />
```

### `VerificationDialog`
- Props:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `beneficiary: { id, full_name, ration_card_number, ration_card_type, verification_status, verification_notes, aadhaar_document_url, ration_card_document_url, government_id, card_issue_date, card_expiry_date }`
  - `onVerificationComplete: () => void`
- Calls Supabase RPC `verify_ration_card` and displays status.

Usage
```tsx
<VerificationDialog isOpen={open} onClose={()=>setOpen(false)} beneficiary={b}
  onVerificationComplete={()=>refetch()} />
```

## UI Kit

Re-exports from `src/components/ui/*` follow shadcn-ui patterns, e.g. `Button`, `Card`, `Dialog`, `Tabs`, `Table`, `Progress`, etc. Import from `@/components/ui/...` and see TypeScript for prop types.