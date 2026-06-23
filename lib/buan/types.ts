// Buan core domain types (P0).
export type OrderStatus = "new" | "preparing" | "enroute" | "delivered" | "cancelled";
export type StockType = "unlimited" | "limited" | "out";
export type Plan = "free" | "pro" | "business" | "enterprise";

export interface Business {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  category?: string | null;
}

export interface Location {
  id: string;
  business_id: string;
  slug: string;
  name: string;
  address?: string | null;
  opening_hours?: Record<string, unknown>;
  collection_instructions?: string | null;
}

export interface Stock {
  product_id: string;
  type: StockType;
  qty: number;
}

export interface Product {
  id: string;
  location_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  category?: string | null;
  prep_time_mins: number;
  allergens: string[];
  dietary_tags: string[];
  visible: boolean;
  stock?: Stock | Stock[] | null;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  business_id: string;
  location_id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  collection_slot?: string | null;
  customer_name?: string | null;
  placed_at: string;
}
