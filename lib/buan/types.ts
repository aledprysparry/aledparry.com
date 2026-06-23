// Buan - shared TypeScript types for the Phase 0 schema.
// These mirror buan/migrations/0001_init.sql. Keep them in sync when the
// schema changes.

export type OrderStatus =
  | "new"
  | "preparing"
  | "enroute"
  | "ready"
  | "delivered"
  | "cancelled";

export type MemberRole = "owner" | "admin" | "staff";

export interface Business {
  id: string;
  slug: string;
  name: string;
  owner_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  business_id: string;
  slug: string;
  name: string;
  address: string | null;
  timezone: string;
  active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SubLocation {
  id: string;
  business_id: string;
  location_id: string;
  slug: string | null;
  label: string;
  kind: "table" | "bay" | "room" | "seat" | "zone" | "other";
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  location_id: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  price_pennies: number;
  currency: string;
  emoji: string | null;
  category: string | null;
  active: boolean;
  sort_order: number;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id?: string;
  name: string;
  qty: number;
  price_pennies: number;
}

export interface Order {
  id: string;
  business_id: string;
  location_id: string;
  sub_location_id: string | null;
  code: string | null;
  customer_name: string | null;
  customer_ref: string | null;
  items: OrderItem[];
  total_pennies: number;
  currency: string;
  status: OrderStatus;
  notes: string | null;
  placed_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  business_id: string;
  location_id: string | null;
  title: string;
  description: string | null;
  kind: "discount" | "loyalty" | "bundle" | "freebie";
  value_pennies: number | null;
  value_percent: number | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Identifies the tenant + site every data-access call is scoped to. */
export interface BuanScope {
  businessId: string;
  locationId: string;
}
