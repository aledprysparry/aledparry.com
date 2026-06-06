"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const PASS_KEY = "app_unlocked";
const CORRECT_PASSWORD = "Qwerty123";

/**
 * Client-side password gate for the /app client area.
 *
 * Renders the password prompt until the visitor has unlocked the area in this
 * browser session (sessionStorage `app_unlocked === "true"`), then renders
 * `children`. Use this on every /app/* page that exposes a client demo so the
 * demos can't be discovered by guessing a direct URL.
 */
export default function AppGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(PASS_KEY) === "true") {
      setUnlocked(true);
    }
    setReady(true);
  }, []);

  // Avoid a flash of gated content before the sessionStorage check runs.
  if (!ready) {
    return null;
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input === CORRECT_PASSWORD) {
              sessionStorage.setItem(PASS_KEY, "true");
              setUnlocked(true);
            } else {
              setError(true);
              setInput("");
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
            className="w-full px-4 py-3 border border-stone-300 bg-white text-stone-900 text-sm font-sans placeholder:text-stone-400 focus:outline-none focus:border-stone-500 mb-3"
          />
          {error && (
            <p className="text-xs text-red-500 mb-3">Incorrect password.</p>
          )}
          <button
            type="submit"
            className="w-full bg-stone-900 text-white px-4 py-3 text-sm font-sans font-medium tracking-wide hover:bg-stone-800 transition-colors"
          >
            Enter
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
