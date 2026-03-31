"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllDemos } from "@/content/demos.config";

const PASS_KEY = "app_unlocked";
const CORRECT_PASSWORD = "Qwerty123";

export default function DemosIndexPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(PASS_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

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

  const demos = getAllDemos();

  return (
    <div className="pt-16 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">
        Demos
      </h1>
      <p className="text-base text-stone-500 mb-12">
        Client demos and prototypes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demos.map((demo) => (
          <Link
            key={`${demo.clientSlug}/${demo.toolSlug}`}
            href={demo.href || `/app/${demo.clientSlug}/${demo.toolSlug}`}
            className="group block border border-stone-200 p-6 hover:border-stone-400 transition-colors"
          >
            <p className="text-xs font-sans font-medium tracking-wider uppercase text-stone-400 mb-2">
              {demo.clientName}
            </p>
            <h2 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-accent-dark transition-colors mb-2">
              {demo.toolName}
            </h2>
            <p className="text-sm text-stone-600">{demo.description}</p>
          </Link>
        ))}

        <a
          href="https://cwis-creator-hub.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="group block border border-stone-200 p-6 hover:border-stone-400 transition-colors"
        >
          <p className="text-xs font-sans font-medium tracking-wider uppercase text-stone-400 mb-2">
            S4C
          </p>
          <h2 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-accent-dark transition-colors mb-2">
            Cwis Bob Dydd
          </h2>
          <p className="text-sm text-stone-600">
            Quiz content creation suite — question bank, leaderboards, social media planner, and branded graphic builder.
          </p>
        </a>
      </div>
    </div>
  );
}
