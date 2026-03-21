"use client";

import { useState, FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    project: "",
    budget: "",
    timeline: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", project: "", budget: "", timeline: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-stone-100 p-8 text-center">
        <p className="text-base text-stone-700">{t.contact.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label={t.contact.form.name}
          name="name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          required
        />
        <FormField
          label={t.contact.form.email}
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          required
        />
      </div>
      <FormField
        label={t.contact.form.project}
        name="project"
        type="textarea"
        value={form.project}
        onChange={(v) => setForm({ ...form, project: v })}
        required
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label={t.contact.form.budget.label}
          name="budget"
          type="select"
          value={form.budget}
          onChange={(v) => setForm({ ...form, budget: v })}
          options={t.contact.form.budget.options}
        />
        <FormField
          label={t.contact.form.timeline.label}
          name="timeline"
          type="select"
          value={form.timeline}
          onChange={(v) => setForm({ ...form, timeline: v })}
          options={t.contact.form.timeline.options}
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-600">{t.contact.error}</p>
      )}
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "..." : t.contact.form.submit}
      </Button>
    </form>
  );
}
