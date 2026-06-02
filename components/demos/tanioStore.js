"use client";

/* ============================================================
   Tanio – order store / realtime layer
   ------------------------------------------------------------
   Primary: a shared server store via the /api/tanio route
   (backed by Vercel Blob). This gives cross-device sync – a
   phone order shows up on a café screen on another device,
   because the orders live server-side. The dashboard polls
   every ~2.5s.

   Fallback: if the API is unreachable (e.g. running locally
   with no Blob token), it transparently uses localStorage +
   BroadcastChannel so the demo still works live across tabs in
   the same browser. The footer chip reflects which mode is
   active (see probeApi).
   ============================================================ */

const API = "/api/tanio";
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
export const normPlate = (p) => (p || "").toUpperCase().replace(/\s+/g, "");

/* ---------- API (Vercel Blob) ---------- */
async function api(method, body) {
  const res = await fetch(API, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error("api " + res.status);
  return res.json();
}

/* True if the shared server store is reachable (cross-device mode). */
export async function probeApi() {
  try { await api("GET"); return true; } catch { return false; }
}

/* ---------- localStorage fallback ---------- */
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

/* ---------- public API (API-first, localStorage fallback) ---------- */
export async function loadOrders() {
  try { return (await api("GET")).orders || []; }
  catch { return lsLoad(); }
}

export async function placeOrder({ id, name, plate, items, total }) {
  const order = { id, name, plate, items, total, status: "new", placed_at: new Date().toISOString() };
  try { return (await api("POST", order)).order || order; }
  catch { return lsPlace(order); }
}

export async function setStatus(id, status) {
  try { await api("PATCH", { id, status }); }
  catch { lsStatus(id, status); }
}

export async function clearAll() {
  try { await api("DELETE"); }
  catch {
    localStorage.removeItem(LS_KEY);
    try { new BroadcastChannel(CHANNEL).postMessage("changed"); } catch {}
  }
}

/* Subscribe to changes. Returns an unsubscribe fn.
   Polls every 2.5s (covers cross-device server updates) and also
   listens to BroadcastChannel + storage for instant same-browser
   updates in the localStorage-fallback case. */
export function subscribe(onChange) {
  let stop = false;
  const tick = async () => { if (!stop) { try { onChange(await loadOrders()); } catch {} } };

  tick();
  const interval = setInterval(tick, 2500);

  let bc;
  const onStorage = (e) => { if (e.key === LS_KEY) tick(); };
  try { bc = new BroadcastChannel(CHANNEL); bc.onmessage = tick; } catch {}
  window.addEventListener("storage", onStorage);

  return () => {
    stop = true;
    clearInterval(interval);
    if (bc) bc.close();
    window.removeEventListener("storage", onStorage);
  };
}
