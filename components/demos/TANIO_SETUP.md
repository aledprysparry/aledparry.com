# Tanio demo – setup

Live demo route: **`/app/msparc/tanio`** (e.g. `https://aledparry.com/app/msparc/tanio`).

The QR code on the landing view encodes `…/app/msparc/tanio?view=menu`, so a phone
that scans it opens the customer ordering flow directly. The café opens
`…/app/msparc/tanio?view=dashboard` on a separate screen.

Bilingual (English / Cymraeg, toggle persisted per device). Customers identify
their car by **numberplate** (stored on each order, so it powers visit stats and a
simple loyalty layer – returning-customer badge on the dashboard + a "free coffee
every 5 orders" indicator on the confirmation). Order status runs
**new → preparing → on its way → delivered**, and the customer's confirmation
screen tracks it live.

## Two modes (chosen automatically at runtime)

| Mode | When | Behaviour |
|------|------|-----------|
| **Local** | Supabase env vars absent | Orders live in `localStorage` + `BroadcastChannel`. Works live across tabs in the **same browser only**. Great for a quick single-device walkthrough, zero setup. |
| **Live (cross-device)** | both env vars set | Orders go to a Supabase `tanio_orders` table via PostgREST. The dashboard polls every ~2.5s, so a phone order appears on a **separate** café screen. |

The footer chip on each view shows which mode is active.

## To enable cross-device live mode

1. **Pick a Supabase project.** A throwaway/free project is ideal – this table is
   public-demo only. (Don't reuse a production project's anon key for a public demo
   unless you're comfortable with the permissive policy below.)

2. **Run the migration** in that project's SQL editor:
   `supabase/migrations/20260602_tanio_orders.sql`
   It creates `public.tanio_orders`, enables RLS with a permissive anon policy
   (fine for a public demo – see the warning in the file), and grants the Data API.

3. **Set two env vars** (Vercel → Project → Settings → Environment Variables, and
   `.env.local` for local dev). Both are `NEXT_PUBLIC_*` because the browser needs
   them – the anon key is safe to expose:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. **Redeploy** (or restart `npm run dev`). The chip should now read
   “Live · cross-device”. Scan the QR on a phone, place an order, and watch it land
   on the dashboard open on another device.

## Notes

- No new npm dependency – the store talks to Supabase over plain `fetch` (PostgREST).
- "Clear all" on the dashboard deletes every demo row (anon has delete rights). Fine
  for a demo; remove the delete grant/policy if you don't want that.
- Latency is the ~2.5s poll interval. If you want instant push later, swap the poll
  in `tanioStore.js#subscribe` for Supabase Realtime (would add `@supabase/supabase-js`).
