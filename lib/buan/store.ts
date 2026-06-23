// Buan - data-access layer (multi-tenant, Supabase-backed).
//
// Generalises the single-tenant Tanio store (components/demos/tanioStore.js,
// Vercel Blob) into a tenant + location scoped Supabase store. The Tanio demo
// is left untouched; this is additive.
//
// Env-gated: when Supabase is not configured every read returns empty and every
// write is a no-op, so `npm run build` and any page importing this still pass.
// Realtime uses Supabase Postgres changes when available, falling back to
// polling - same contract as Tanio's `subscribe`.

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { getBuanClient } from "./supabaseClient";
import type {
  Business,
  BuanScope,
  Location,
  Offer,
  Order,
  OrderItem,
  OrderStatus,
  Product,
} from "./types";

const POLL_MS = 2500;

/* ---------- shared helpers ---------- */

/** Format integer pennies as GBP (or another ISO currency). */
export function money(pennies: number, currency = "GBP"): string {
  const value = (Number(pennies) || 0) / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return "£" + value.toFixed(2);
  }
}

/** Short human-facing order code, e.g. "BU1234". */
export function newOrderCode(prefix = "BU"): string {
  return prefix + Math.floor(1000 + Math.random() * 9000);
}

export function timeAgo(ts: string | number | Date, lang = "en"): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (lang === "cy") {
    if (s < 60) return "nawr";
    if (m < 60) return `${m} munud yn ôl`;
    return `${h} awr yn ôl`;
  }
  if (s < 60) return "just now";
  if (m < 60) return `${m} min ago`;
  return `${h}h ago`;
}

/** Normalise a customer reference (numberplate / table label) for matching. */
export const normRef = (r?: string | null): string =>
  (r || "").toUpperCase().replace(/\s+/g, "");

/* ---------- slug resolution ---------- */

export async function getBusinessBySlug(
  slug: string
): Promise<Business | null> {
  const sb = getBuanClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data as Business) ?? null;
}

export async function getLocationBySlug(
  businessId: string,
  slug: string
): Promise<Location | null> {
  const sb = getBuanClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("locations")
    .select("*")
    .eq("business_id", businessId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data as Location) ?? null;
}

/** Resolve a buan.co/<business>/<location> pair in one call. */
export async function resolveScope(
  businessSlug: string,
  locationSlug: string
): Promise<{ business: Business; location: Location } | null> {
  const business = await getBusinessBySlug(businessSlug);
  if (!business) return null;
  const location = await getLocationBySlug(business.id, locationSlug);
  if (!location) return null;
  return { business, location };
}

/* ---------- catalogue ---------- */

export async function loadProducts(scope: BuanScope): Promise<Product[]> {
  const sb = getBuanClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("business_id", scope.businessId)
    .or(`location_id.eq.${scope.locationId},location_id.is.null`)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return data as Product[];
}

export async function loadOffers(scope: BuanScope): Promise<Offer[]> {
  const sb = getBuanClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("offers")
    .select("*")
    .eq("business_id", scope.businessId)
    .or(`location_id.eq.${scope.locationId},location_id.is.null`)
    .eq("active", true);
  if (error || !data) return [];
  return data as Offer[];
}

/* ---------- orders ---------- */

export async function loadOrders(scope: BuanScope): Promise<Order[]> {
  const sb = getBuanClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("business_id", scope.businessId)
    .eq("location_id", scope.locationId)
    .order("placed_at", { ascending: false });
  if (error || !data) return [];
  return data as Order[];
}

export interface NewOrderInput {
  customerName?: string;
  customerRef?: string;
  subLocationId?: string | null;
  items: OrderItem[];
  totalPennies: number;
  currency?: string;
  code?: string;
  notes?: string;
}

export async function placeOrder(
  scope: BuanScope,
  input: NewOrderInput
): Promise<Order | null> {
  const sb = getBuanClient();
  if (!sb) return null;
  const row = {
    business_id: scope.businessId,
    location_id: scope.locationId,
    sub_location_id: input.subLocationId ?? null,
    code: input.code ?? newOrderCode(),
    customer_name: input.customerName ?? null,
    customer_ref: input.customerRef ?? null,
    items: input.items,
    total_pennies: input.totalPennies,
    currency: input.currency ?? "GBP",
    status: "new" as OrderStatus,
    notes: input.notes ?? null,
  };
  const { data, error } = await sb
    .from("orders")
    .insert(row)
    .select("*")
    .single();
  if (error || !data) return null;
  return data as Order;
}

export async function setOrderStatus(
  scope: BuanScope,
  id: string,
  status: OrderStatus
): Promise<void> {
  const sb = getBuanClient();
  if (!sb) return;
  await sb
    .from("orders")
    .update({ status })
    .eq("id", id)
    .eq("business_id", scope.businessId);
}

/** Clear all orders for a location (staff action). No-op when unconfigured. */
export async function clearOrders(scope: BuanScope): Promise<void> {
  const sb = getBuanClient();
  if (!sb) return;
  await sb
    .from("orders")
    .delete()
    .eq("business_id", scope.businessId)
    .eq("location_id", scope.locationId);
}

/**
 * Subscribe to a location's orders. Returns an unsubscribe fn. Uses Supabase
 * realtime when available and always polls as a safety net (same contract as
 * Tanio's `subscribe`). No-op (calls back once with []) when unconfigured.
 */
export function subscribeOrders(
  scope: BuanScope,
  onChange: (orders: Order[]) => void
): () => void {
  const sb = getBuanClient();
  if (!sb) {
    onChange([]);
    return () => {};
  }

  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      onChange(await loadOrders(scope));
    } catch {
      /* transient - next tick retries */
    }
  };

  tick();
  const interval = setInterval(tick, POLL_MS);

  let channel: RealtimeChannel | undefined;
  try {
    channel = (sb as SupabaseClient)
      .channel(`buan-orders-${scope.locationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "buan",
          table: "orders",
          filter: `location_id=eq.${scope.locationId}`,
        },
        tick
      )
      .subscribe();
  } catch {
    /* realtime unavailable - polling covers it */
  }

  return () => {
    stopped = true;
    clearInterval(interval);
    if (channel) {
      try {
        (sb as SupabaseClient).removeChannel(channel);
      } catch {
        /* ignore */
      }
    }
  };
}
