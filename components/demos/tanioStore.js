"use client";

/* ============================================================
   Tanio – order store / realtime layer
   ------------------------------------------------------------
   Two modes, chosen automatically at runtime:

   1. SUPABASE (cross-device live) – when both
        NEXT_PUBLIC_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY
      are set. Orders are written to / read from the
      `tanio_orders` table via PostgREST (plain fetch – no SDK,
      no extra npm dependency). The café dashboard polls every
      ~2.5s, so a phone order shows up on a separate café screen.

   2. LOCAL fallback – when those env vars are absent (e.g. local
      preview before Supabase is wired). Uses localStorage +
      BroadcastChannel so it still works live across tabs on the
      SAME browser. Lets the demo run with zero setup.

   The component doesn't care which mode is active – same API.
   ============================================================ */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const LIVE = Boolean(URL && KEY);

const TABLE = "tanio_orders";
const LS_KEY = "tanio_orders";
const CHANNEL = "tanio-orders";

/* ---------- shared helpers ---------- */
export function money(n) {
  return "£" + Number(n || 0).toFixed(2);
}
export function newId() {
  return "TA" + Math.floor(1000 + Math.random() * 9000);
}
export function timeAgo(ts, lang = "en") {
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

/* ---------- Supabase REST mode ---------- */
function restHeaders(extra = {}) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function sbLoad() {
  const res = await fetch(
    `${URL}/rest/v1/${TABLE}?select=*&order=placed_at.desc&limit=50`,
    { headers: restHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error("load failed: " + res.status);
  return res.json();
}

async function sbPlace(order) {
  const res = await fetch(`${URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: restHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error("insert failed: " + res.status);
  return (await res.json())[0];
}

async function sbStatus(id, status) {
  const res = await fetch(`${URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: restHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("update failed: " + res.status);
}

/* ---------- localStorage fallback mode ---------- */
function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
function lsWrite(orders) {
  localStorage.setItem(LS_KEY, JSON.stringify(orders));
  try { new BroadcastChannel(CHANNEL).postMessage("changed"); } catch {}
}
function lsPlace(order) {
  const orders = lsLoad();
  orders.unshift(order);
  lsWrite(orders);
  return order;
}
function lsStatus(id, status) {
  const orders = lsLoad();
  const o = orders.find((x) => x.id === id);
  if (o) { o.status = status; lsWrite(orders); }
}

/* ---------- public API (mode-agnostic) ---------- */
export async function loadOrders() {
  return LIVE ? sbLoad() : lsLoad();
}

export async function placeOrder({ id, name, plate, items, total }) {
  const order = {
    id, name, plate, items, total,
    status: "new",
    placed_at: new Date().toISOString(),
  };
  return LIVE ? sbPlace(order) : lsPlace(order);
}

/* Normalise a numberplate for matching / loyalty lookups. */
export const normPlate = (p) => (p || "").toUpperCase().replace(/\s+/g, "");

export async function setStatus(id, status) {
  return LIVE ? sbStatus(id, status) : lsStatus(id, status);
}

export async function clearAll() {
  if (LIVE) {
    // delete every demo row (id is not null for all rows)
    await fetch(`${URL}/rest/v1/${TABLE}?id=not.is.null`, {
      method: "DELETE",
      headers: restHeaders(),
    });
  } else {
    localStorage.removeItem(LS_KEY);
    try { new BroadcastChannel(CHANNEL).postMessage("changed"); } catch {}
  }
}

/* Subscribe to changes. Returns an unsubscribe fn.
   - LIVE: polls every 2.5s (PostgREST has no push without the SDK).
   - LOCAL: instant via BroadcastChannel + storage event, plus a slow
     poll so relative timestamps refresh. */
export function subscribe(onChange) {
  let stop = false;
  const tick = async () => { if (!stop) { try { onChange(await loadOrders()); } catch {} } };

  tick();
  const interval = setInterval(tick, LIVE ? 2500 : 5000);

  let bc;
  const onStorage = (e) => { if (e.key === LS_KEY) tick(); };
  if (!LIVE) {
    try { bc = new BroadcastChannel(CHANNEL); bc.onmessage = tick; } catch {}
    window.addEventListener("storage", onStorage);
  }

  return () => {
    stop = true;
    clearInterval(interval);
    if (bc) bc.close();
    if (!LIVE) window.removeEventListener("storage", onStorage);
  };
}
