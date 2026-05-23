"use client";

import { useState, FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

const RECIPIENT = "hello@aledparry.com";

export function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    project: "",
    budget: "",
    timeline: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // Compose mailto: link from form values. We don't run a server-side mailer
    // (Resend account / domain verification not set up); opening the user's mail
    // client with everything pre-filled is reliable and works the same way on
    // desktop and mobile.
    const subject = `New enquiry from ${form.name}`;
    const bodyLines = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      ``,
      `Project:`,
      form.project,
      ``,
      `Budget: ${form.budget || "Not specified"}`,
      `Timeline: ${form.timeline || "Not specified"}`,
    ];
    const mailto = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
    window.location.href = mailto;

    setStatus("success");
    setForm({ name: "", email: "", project: "", budget: "", timeline: "" });
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
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "..." : t.contact.form.submit}
      </Button>
    </form>
  );
}
