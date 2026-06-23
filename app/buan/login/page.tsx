"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  buanConfigured,
  getSession,
  signInWithMagicLink,
} from "@/lib/buan/auth";

// Buan staff sign-in placeholder (Phase 0 - structure only).
// Wires the auth scaffold (lib/buan/auth) to a minimal form. Full role-aware
// dashboard routing after sign-in is P2. Because `login` is a reserved slug,
// this static route always wins over /buan/[business].
export default function BuanLogin() {
  const configured = buanConfigured();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    getSession().then((s) => setSignedIn(Boolean(s)));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const redirect =
      typeof window !== "undefined" ? `${window.location.origin}/buan` : undefined;
    const res = await signInWithMagicLink(email.trim(), redirect);
    setStatus(
      res.ok ? "Check your email for a sign-in link." : res.error || "Sign-in failed."
    );
    setBusy(false);
  };

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Staff sign in</h1>
      <p className="mt-2 text-sm text-stone-600">
        Buan dashboard access. Phase 0 scaffold - passwordless magic link.
      </p>

      {!configured && (
        <p className="mt-6 rounded-md border border-stone-200 bg-white p-3 text-sm text-stone-500">
          Auth is not configured yet. Set the Supabase env vars to enable
          sign-in.
        </p>
      )}

      {signedIn ? (
        <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          You are signed in.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm font-medium" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.co"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !configured}
            className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
        </form>
      )}

      {status && <p className="mt-4 text-sm text-stone-600">{status}</p>}

      <Link
        href="/buan"
        className="mt-10 inline-block text-sm text-stone-500 hover:text-stone-800"
      >
        ← Buan
      </Link>
    </main>
  );
}
