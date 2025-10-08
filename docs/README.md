# JADAYU Documentation

Welcome to the documentation for the JADAYU Smart Ration Delivery Service.

- Audience: Developers and operators integrating or extending the web app.
- Tech stack: Vite, React 18, TypeScript, Tailwind CSS, shadcn-ui, React Router v6, TanStack Query, Supabase.

## Contents

- Overview: features and roles
- How to use (role-based flows)
- Route map
- API Reference
  - Hooks
  - Components
  - Utilities
  - Integrations

## Overview: Features and Roles

- Customers/Beneficiaries
  - View ration quota by card type and household size
  - Shop subsidized items, manage cart, place orders
  - Live delivery tracking map and order history
  - Profile management; upload Aadhaar and ration card docs
  - Display personal QR for secure delivery verification
- Delivery Partners
  - View approved and assigned orders
  - Navigate to delivery address, scan customer QR, confirm delivery
  - See earnings summary (demo)
- Admin/Shop Owner
  - Inventory management for ration items (CRUD)
  - Review incoming orders; approve/reject; update statuses
  - Dashboard with key stats (orders, revenue, customers, inventory value)

## How It’s Used (Role-based)

- Customer flow
  1. Sign up or sign in
  2. Complete profile and upload documents in `Profile`
  3. Check `Quota` for entitlements; browse and add items in `Shop` (or `Dashboard > Shop` tab)
  4. Place order; identity verification dialog simulates card/Aadhaar checks
  5. Track delivery in `Track` or via dashboard; view `History`
- Delivery Partner flow
  1. Sign in and see `DeliveryDashboard`
  2. Accept approved orders; navigate via map dialog
  3. Open scanner, scan customer QR, confirm delivery
- Admin flow
  1. Sign in; `AdminDashboard` shows stats
  2. Manage inventory (add/edit/delete)
  3. Review `IncomingOrders`; approve or reject

## Route Map

- `/auth`: authentication screen
- `/`: role router → `AdminDashboard` | `DeliveryDashboard` | `CustomerDashboard`
- `/shop`, `/quota`, `/track`, `/history`, `/cart`, `/payment`, `/profile`
- `/incoming-orders` (admin), `/beneficiaries` (admin), `/qr-scanner` (delivery demo)
- `/verify/:id`: delivery verification view

## API Reference

See module docs:
- Hooks: [hooks.md](hooks.md)
- Components: [components.md](components.md)
- Utilities: [utilities.md](utilities.md)
- Integrations: [integrations.md](integrations.md)

