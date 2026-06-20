"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/**
 * Password gate for the /app client area.
 *
 * The real protection is server-side: POST /api/app/unlock validates the
 * password (held in APP_GATE_PASSWORD, never in this bundle) and sets an
 * HttpOnly signed cookie that the paid API routes verify. This component only
 * drives the UI - it asks the server whether this browser is already unlocked
 * (GET) and submits the password (POST). No password or unlock flag lives in
 * client storage any more.
 */
export default function AppGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/app/unlock", { method: "GET" })
      .then((r) => r.json())
      .then((d) => { if (active) setUnlocked(Boolean(d?.unlocked)); })
      .catch(() => { /* treat as locked */ })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  // Avoid a flash of gated content before the unlock check resolves.
  if (!ready) {
    return null;
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(false);
            try {
              const r = await fetch("/api/app/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: input }),
              });
              if (r.ok) {
                setUnlocked(true);
              } else {
                setError(true);
                setInput("");
              }
            } catch {
              setError(true);
            } finally {
              setSubmitting(false);
            }
          }}
          className="w-full max-w-xs text-center"
        >
          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">
            Client Area
          </h1>
          <p className="text-sm text-stone-500 mb-8">
            Enter the password to continue.
          </p>
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            autoFocus
            disabled={submitting}
            className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 text-sm font-sans placeholder:text-stone-400 focus:outline-none focus:border-stone-500 mb-3 disabled:opacity-60"
          />
          {error && (
            <p className="text-xs text-red-500 mb-3">Incorrect password.</p>
          )}
          <button
            type="submit"
            disabled={submitting || !input}
            className="w-full bg-stone-900 text-white px-4 py-3 text-sm font-sans font-medium tracking-wide hover:bg-stone-800 transition-colors disabled:opacity-60"
          >
            {submitting ? "Checking…" : "Enter"}
          </button>
          <Link
            href="/"
            className="inline-block mt-6 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            &larr; Back to aledparry.com
          </Link>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
