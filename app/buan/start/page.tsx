"use client";

import { useEffect, useMemo, useState } from "react";
import { slugify, isValidSlug, isReservedSlug } from "@/lib/buan/config";

/* Buan onboarding wizard (P2). Business basics -> unique link (slug) ->
   first location -> QR + go-live. Admin-facing; English for now (bilingual
   admin is a follow-up — customer-facing pages are bilingual). Persists once
   Supabase Auth + project are wired; until then it produces the slug + QR and
   simulates "create". */

type SlugState = "idle" | "checking" | "ok" | "taken" | "invalid" | "reserved";

function qr(url: string, fmt: "png" | "svg" = "png", size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&format=${fmt}&data=${encodeURIComponent(url)}`;
}

export default function BuanOnboarding() {
  const [step, setStep] = useState(1);
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [locName, setLocName] = useState("");
  const [locSlug, setLocSlug] = useState("");
  const [address, setAddress] = useState("");
  const [done, setDone] = useState(false);

  // auto-suggest the business slug from the name until the user edits it
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(bizName));
  }, [bizName, slugEdited]);

  // auto-suggest the location slug from its name
  useEffect(() => {
    setLocSlug((cur) => (cur && cur !== slugify(locName) ? cur : slugify(locName)));
  }, [locName]);

  // live slug availability check (debounced)
  useEffect(() => {
    if (!slug) return setSlugState("idle");
    if (isReservedSlug(slug)) return setSlugState("reserved");
    if (!isValidSlug(slug)) return setSlugState("invalid");
    setSlugState("checking");
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/buan/slug-check?slug=${encodeURIComponent(slug)}`);
        const j = await r.json();
        setSlugState(j.available ? "ok" : "taken");
      } catch {
        setSlugState("ok");
      }
    }, 350);
    return () => clearTimeout(id);
  }, [slug]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bizUrl = `${origin}/buan/${slug || "your-business"}`;
  const locUrl = `${bizUrl}/${locSlug || "location"}`;

  const canLink = slugState === "ok" || slugState === "checking";
  const checklist = useMemo(
    () => [
      ["Business details", Boolean(bizName.trim())],
      ["Your Buan link", canLink && Boolean(slug)],
      ["First location", Boolean(locName.trim() && locSlug)],
      ["QR code generated", Boolean(locSlug)],
    ] as [string, boolean][],
    [bizName, canLink, slug, locName, locSlug]
  );

  if (done) {
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-3xl text-emerald-950">✓</div>
          <h1 className="mt-4 text-2xl font-bold">Your Buan is ready</h1>
          <p className="mt-1 text-stone-400">{bizName} — share your QR and start taking orders.</p>
          <div className="mx-auto mt-6 inline-block rounded-xl bg-white p-4">
            <img src={qr(locUrl)} width={180} height={180} alt="QR code" />
          </div>
          <p className="mt-3 break-all rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-300">{locUrl}</p>
          <div className="mt-4 flex justify-center gap-3 text-sm">
            <a className="text-emerald-400 hover:underline" href={qr(locUrl, "png", 600)} target="_blank" rel="noreferrer">Download PNG</a>
            <a className="text-emerald-400 hover:underline" href={qr(locUrl, "svg", 600)} target="_blank" rel="noreferrer">Download SVG</a>
          </div>
          <p className="mt-6 text-xs text-stone-500">Scaffold: connect Supabase + sign-in to persist this business for real.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Steps step={step} />

      {step === 1 && (
        <Card title="About your business">
          <Field label="Business name"><input className={inp} value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="e.g. The Bridge Café" /></Field>
          <Field label="Business type"><input className={inp} value={bizType} onChange={(e) => setBizType(e.target.value)} placeholder="e.g. café" /></Field>
          <Field label="Contact email"><input className={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" /></Field>
          <Next disabled={!bizName.trim()} onClick={() => setStep(2)} />
        </Card>
      )}

      {step === 2 && (
        <Card title="Your Buan link">
          <p className="mb-3 text-sm text-stone-400">Customers will scan or visit this. You can change it before launch.</p>
          <Field label="buan.co /">
            <input
              className={inp}
              value={slug}
              onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
              placeholder="bridge-cafe"
            />
          </Field>
          <SlugHint state={slugState} />
          <p className="mt-2 break-all rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-400">{bizUrl}</p>
          <div className="mt-3 rounded-lg border border-emerald-700/40 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
            ★ Pro: claim a clean short slug or your own domain (order.yourcafe.com).
          </div>
          <div className="mt-5 flex gap-2">
            <Back onClick={() => setStep(1)} />
            <Next disabled={!(slugState === "ok" && slug)} onClick={() => setStep(3)} />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card title="Your first location">
          <Field label="Location name"><input className={inp} value={locName} onChange={(e) => setLocName(e.target.value)} placeholder="e.g. Main counter" /></Field>
          <Field label="Location link"><input className={inp} value={locSlug} onChange={(e) => setLocSlug(slugify(e.target.value))} placeholder="main" /></Field>
          <Field label="Address (optional)"><input className={inp} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, town" /></Field>
          <p className="mt-1 break-all rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-400">{locUrl}</p>
          <div className="mt-5 flex gap-2">
            <Back onClick={() => setStep(2)} />
            <Next disabled={!(locName.trim() && locSlug)} onClick={() => setStep(4)} />
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card title="QR code & go-live">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-3"><img src={qr(locUrl)} width={120} height={120} alt="QR code" /></div>
            <div className="text-sm">
              <div className="flex gap-3">
                <a className="text-emerald-400 hover:underline" href={qr(locUrl, "png", 600)} target="_blank" rel="noreferrer">PNG</a>
                <a className="text-emerald-400 hover:underline" href={qr(locUrl, "svg", 600)} target="_blank" rel="noreferrer">SVG</a>
              </div>
              <p className="mt-2 break-all text-xs text-stone-400">{locUrl}</p>
            </div>
          </div>
          <ul className="mt-5 space-y-1 text-sm">
            {checklist.map(([label, ok]) => (
              <li key={label} className={ok ? "text-stone-200" : "text-stone-500"}>{ok ? "✓" : "○"} {label}</li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2">
            <Back onClick={() => setStep(3)} />
            <button onClick={() => setDone(true)} className="flex-1 rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:brightness-105">Create my Buan</button>
          </div>
          <p className="mt-3 text-xs text-stone-500">Products &amp; payments come next (P3 / P5).</p>
        </Card>
      )}
    </Shell>
  );
}

/* ---- small UI helpers ---- */
const inp = "w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-stone-100 focus:border-emerald-400 focus:outline-none";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-950 px-6 py-12 text-stone-100">
      <div className="mx-auto max-w-md">
        <a href="/buan" className="text-lg font-extrabold tracking-tight">Buan</a>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
function Steps({ step }: { step: number }) {
  return (
    <div className="mb-5 flex gap-2">
      {["Business", "Link", "Location", "Launch"].map((l, i) => (
        <div key={l} className={`flex-1 rounded-full px-2 py-1 text-center text-[11px] ${i + 1 === step ? "bg-emerald-400 font-bold text-emerald-950" : i + 1 < step ? "border border-emerald-500 text-emerald-400" : "border border-stone-700 text-stone-500"}`}>{l}</div>
      ))}
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-5">
      <h1 className="mb-4 text-xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm text-stone-400">{label}</span>
      {children}
    </label>
  );
}
function Next({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return <button disabled={disabled} onClick={onClick} className="flex-1 rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:brightness-105 disabled:opacity-40">Continue</button>;
}
function Back({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="rounded-lg border border-stone-700 px-4 py-3 font-semibold hover:border-emerald-400">Back</button>;
}
function SlugHint({ state }: { state: SlugState }) {
  const map: Record<SlugState, { t: string; c: string }> = {
    idle: { t: "", c: "" },
    checking: { t: "Checking…", c: "text-stone-400" },
    ok: { t: "✓ Available", c: "text-emerald-400" },
    taken: { t: "✗ Already taken", c: "text-red-400" },
    invalid: { t: "Use lowercase letters, numbers and hyphens", c: "text-amber-400" },
    reserved: { t: "✗ That word is reserved", c: "text-red-400" },
  };
  const m = map[state];
  return m.t ? <p className={`text-xs ${m.c}`}>{m.t}</p> : null;
}
