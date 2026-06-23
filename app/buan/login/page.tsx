"use client";

import { useState } from "react";

// Buan login placeholder (P0). Static route, so it wins over /buan/[business]
// for the reserved "login" slug. Real Supabase Auth wiring is a post-P0 task.
export default function BuanLogin() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-600">Buan</p>
        <h1 className="mt-1 text-center text-2xl font-bold text-stone-900">Sign in</h1>
        <p className="mt-1 text-center text-sm text-stone-500">Manage your ordering pages.</p>

        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Auth isn't wired yet (P0 scaffold). See BUAN_P0_NOTES.md.");
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className="w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-900 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-900 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-emerald-950 transition hover:brightness-105"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-stone-400">
          P0 scaffold · Supabase Auth wiring to follow.
        </p>
      </div>
    </div>
  );
}
