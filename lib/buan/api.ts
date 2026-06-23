// Buan data layer (P0) — multi-tenant access over Supabase PostgREST.
//
// Deliberately uses plain fetch (no @supabase/supabase-js) so P0 adds NO new
// npm dependency — same approach proven in the Tanio store. Generalises the
// single-tenant Tanio store to business + location scope. Every function is
// env-gated: with no Supabase config it returns empty/null so the app still
// builds and renders a "not configured" placeholder.

import { SUPABASE_URL, SUPABASE_ANON_KEY, BUAN_LIVE } from "./config";
import type { Business, Location, Product, Order, OrderStatus } from "./types";

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers as Record<string, string> | undefined) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`buan rest ${res.status}: ${path}`);
  return (await res.json()) as T;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  if (!BUAN_LIVE) return null;
  const rows = await rest<Business[]>(
    `businesses?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`
  );
  return rows[0] ?? null;
}

export async function listLocations(businessId: string): Promise<Location[]> {
  if (!BUAN_LIVE) return [];
  return rest<Location[]>(
    `locations?business_id=eq.${businessId}&select=*&order=name.asc`
  );
}

export async function getLocationBySlug(
  businessId: string,
  slug: string
): Promise<Location | null> {
  if (!BUAN_LIVE) return null;
  const rows = await rest<Location[]>(
    `locations?business_id=eq.${businessId}&slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`
  );
  return rows[0] ?? null;
}

export async function getMenu(locationId: string): Promise<Product[]> {
  if (!BUAN_LIVE) return [];
  return rest<Product[]>(
    `products?location_id=eq.${locationId}&visible=eq.true&select=*,stock(*)&order=category.asc`
  );
}

export async function placeOrder(
  order: Omit<Order, "placed_at"> & { placed_at?: string }
): Promise<Order | null> {
  if (!BUAN_LIVE) return null;
  const body = { ...order, placed_at: order.placed_at ?? new Date().toISOString() };
  const rows = await rest<Order[]>(`orders`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  return rows[0] ?? null;
}

export async function listOrders(locationId: string): Promise<Order[]> {
  if (!BUAN_LIVE) return [];
  return rest<Order[]>(
    `orders?location_id=eq.${locationId}&select=*&order=placed_at.desc&limit=100`
  );
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (!BUAN_LIVE) return;
  await rest(`orders?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
