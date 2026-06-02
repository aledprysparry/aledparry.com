# Tanio demo – notes

Live demo route: **`/app/msparc/tanio`** (e.g. `https://www.aledparry.com/app/msparc/tanio`).

The QR code on the landing view encodes `…/app/msparc/tanio?view=menu`, so a phone
that scans it opens the customer ordering flow directly. The café opens
`…/app/msparc/tanio?view=dashboard` on a separate screen.

Bilingual (English / Cymraeg, toggle persisted per device). Customers identify
their car by **numberplate** (stored on each order, so it powers visit stats and a
simple spend-based loyalty layer – returning-customer badge on the dashboard + a
"free coffee every £50" indicator on the confirmation). Order status runs
**new → preparing → on its way → delivered**, tracked live on the customer's
confirmation screen.

## Backend – Vercel Blob (no setup required)

Orders are shared server-side via the **`/api/tanio`** route, backed by **Vercel
Blob** (one JSON blob per order under `tanio/orders/`). This is what makes the
demo work **cross-device** – a phone order shows up on a café screen on another
device, because the orders live on the server, not in the browser.

- Uses aledparry's existing `BLOB_READ_WRITE_TOKEN` (already set in Vercel). **No
  external account, no migration, nothing to configure** – it just works on deploy.
- The dashboard polls `/api/tanio` every ~2.5s.
- "Clear all" on the dashboard deletes every demo blob.

### Local fallback
If the Blob token isn't present (e.g. `npm run dev` locally without pulling Vercel
env), the `/api/tanio` route returns 503 and the client transparently falls back to
`localStorage` + `BroadcastChannel` – still live across tabs in the **same browser**,
just not cross-device. The footer chip shows which mode is active
("Live · cross-device" vs "Local demo (this browser)").

To exercise the real Blob path locally, pull the token first:
`vercel link` then `vercel env pull .env.local`, then `npm run dev`.

## Notes
- The Blob store is **private**: order JSON is written/read server-side with the
  token (`get(..., { access: 'private' })`), never exposed by a public URL, so
  names / numberplates stay server-side. Still a demo – don't put anything truly
  sensitive through it.
- Concurrency-safe creates: each order is its own blob, so simultaneous orders can't
  clobber each other. Status updates overwrite that one order's blob.
