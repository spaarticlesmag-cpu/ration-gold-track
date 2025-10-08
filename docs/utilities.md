# Utilities

## `cn(...inputs)`

- Source: `src/lib/utils.ts`
- Merges conditional class names with Tailwind Merge.

Signature
```ts
function cn(...inputs: ClassValue[]): string
```

Usage
```tsx
import { cn } from "@/lib/utils";

<div className={cn('p-4', isActive && 'bg-primary', 'text-foreground')} />
```