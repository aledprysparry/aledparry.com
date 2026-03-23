"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const PASS_KEY = "app_unlocked";
const CORRECT_PASSWORD = "Qwerty123";

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(PASS_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  if (unlocked) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === CORRECT_PASSWORD) {
      sessionStorage.setItem(PASS_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs text-center">
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

export default function DemosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PasswordGate>
      <div className="min-h-screen bg-white">
        <div className="fixed top-4 left-4 z-50">
          <Link
            href="/"
            className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors"
          >
            &larr; aledparry.com
          </Link>
        </div>
        {children}
      </div>
    </PasswordGate>
  );
}
