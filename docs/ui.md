# UI Kit Reference

This project ships a full shadcn-ui based component library under `@/components/ui/*`. Below is a concise reference with imports and minimal usage examples.

## Quick start

Add the global toast host once near the root of your app.

```tsx
import { Toaster } from "@/components/ui/toaster";

export function Root() {
  return (
    <>
      <App />
      <Toaster />
    </>
  );
}
```

For programmatic toasts, use the custom hook documented in `hooks.md` (`useToast`).

---

## Inputs and Forms

### Button
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default">Click me</Button>
```

### Input
```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="Type here" />
```

### Textarea
```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea rows={3} placeholder="Your message" />
```

### Select
```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Choose" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="one">One</SelectItem>
    <SelectItem value="two">Two</SelectItem>
  </SelectContent>
</Select>
```

### Checkbox / RadioGroup / Switch / Slider
```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

<Checkbox defaultChecked />
<RadioGroup defaultValue="a">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="a" id="a" /> <label htmlFor="a">A</label>
  </div>
</RadioGroup>
<Switch defaultChecked />
<Slider defaultValue={[33]} />
```

### Input OTP
```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

### Form helpers
```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

<Form>
  <FormField name="email" render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )} />
</Form>
```

---

## Feedback and Overlays

### Dialog
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

### Drawer / Sheet
```tsx
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

<Drawer>
  <DrawerTrigger asChild><Button>Open Drawer</Button></DrawerTrigger>
  <DrawerContent>Drawer body</DrawerContent>
</Drawer>

<Sheet>
  <SheetTrigger asChild><Button>Open Sheet</Button></SheetTrigger>
  <SheetContent side="left">Sheet body</SheetContent>
</Sheet>
```

### Popover / Tooltip / HoverCard
```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

<Popover>
  <PopoverTrigger asChild><Button>Open</Button></PopoverTrigger>
  <PopoverContent>Content</PopoverContent>
</Popover>

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button>Hover</Button></TooltipTrigger>
    <TooltipContent>Tip</TooltipContent>
  </Tooltip>
</TooltipProvider>

<HoverCard>
  <HoverCardTrigger>Hover me</HoverCardTrigger>
  <HoverCardContent>Details</HoverCardContent>
</HoverCard>
```

### Toasts
```tsx
// Host once near root
import { Toaster } from "@/components/ui/toaster";
// Trigger via custom hook documented in hooks.md (useToast)
```

### Alert / Alert Dialog
```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

<Alert>
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>Something happened.</AlertDescription>
</Alert>

<AlertDialog>
  <AlertDialogTrigger asChild><Button>Delete</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction>Confirm</AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

---

## Layout and Navigation

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Body</CardContent>
</Card>
```

### Tabs
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="a">
  <TabsList>
    <TabsTrigger value="a">A</TabsTrigger>
    <TabsTrigger value="b">B</TabsTrigger>
  </TabsList>
  <TabsContent value="a">Tab A</TabsContent>
  <TabsContent value="b">Tab B</TabsContent>
</Tabs>
```

### Table
```tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Qty</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Rice</TableCell>
      <TableCell>3</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Pagination
```tsx
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious /></PaginationItem>
    <PaginationItem><PaginationNext /></PaginationItem>
  </PaginationContent>
</Pagination>
```

### Breadcrumb / Separator / ScrollArea
```tsx
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>Shop</BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
<Separator />
<ScrollArea className="h-48">Long content...</ScrollArea>
```

### Menus (Dropdown/MenuBar/NavigationMenu/ContextMenu)
```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild><Button>Open</Button></DropdownMenuTrigger>
  <DropdownMenuContent><DropdownMenuItem>Item</DropdownMenuItem></DropdownMenuContent>
</DropdownMenu>
```

### Sidebar / Resizable
```tsx
import { Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={25}>Left</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel>Right</ResizablePanel>
</ResizablePanelGroup>
```

---

## Data display and Media

### Badge / Avatar / Skeleton
```tsx
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

<Badge>New</Badge>
<Avatar><AvatarImage src="/avatar.png" /><AvatarFallback>AB</AvatarFallback></Avatar>
<Skeleton className="h-6 w-24" />
```

### Progress / Chart
```tsx
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

<Progress value={60} />
// See `src/components/ui/chart.tsx` for full configuration examples
```

### Carousel / AspectRatio
```tsx
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";

<Carousel>
  <CarouselContent>
    <CarouselItem>Item</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>

<AspectRatio ratio={16/9}>
  <img src="/public/placeholder.svg" alt="" />
</AspectRatio>
```

---

## Utilities

- `Label` from `@/components/ui/label`
- `cn` utility from `@/lib/utils` (see `utilities.md`)

---

## Notes

- Component props generally extend underlying HTML or Radix primitives; check TypeScript definitions for full prop types.
- Import paths are always from `@/components/ui/...`.
- Many components support `asChild` to render a custom element via Radix Slot.
