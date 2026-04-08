"use client";

import { useState, useEffect, FormEvent } from "react";

interface Stat {
  label: string;
  labelCy: string;
  value: string;
}

interface ProjectListItem {
  slug: string;
  title: string;
  client: string;
  year: number;
  type: string;
  featured: boolean;
}

const emptyStats: Stat[] = [
  { label: "", labelCy: "", value: "" },
  { label: "", labelCy: "", value: "" },
  { label: "", labelCy: "", value: "" },
];

type View = "list" | "form";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  // View state
  const [view, setView] = useState<View>("list");
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [titleCy, setTitleCy] = useState("");
  const [client, setClient] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [role, setRole] = useState("");
  const [roleCy, setRoleCy] = useState("");
  const [type, setType] = useState<string>("digital");
  const [featured, setFeatured] = useState(false);
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [summaryCy, setSummaryCy] = useState("");
  const [stats, setStats] = useState<Stat[]>(emptyStats);
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [testimonialQuoteCy, setTestimonialQuoteCy] = useState("");
  const [testimonialAuthor, setTestimonialAuthor] = useState("");
  const [testimonialRole, setTestimonialRole] = useState("");
  const [brief, setBrief] = useState("");
  const [myRole, setMyRole] = useState("");
  const [approach, setApproach] = useState("");
  const [outcome, setOutcome] = useState("");
  const [showTestimonial, setShowTestimonial] = useState(false);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [resultSlug, setResultSlug] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Check auth on page load
  useState(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("admin_pw") : null;
    if (stored) {
      setPassword(stored);
      setAuthed(true);
    }
  });

  const getAuthHeader = () => sessionStorage.getItem("admin_pw") || "";

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/project", {
      method: "POST",
      headers: { "x-admin-password": password, "Content-Type": "application/json" },
      body: JSON.stringify({ _authCheck: true }),
    });
    if (res.ok) {
      sessionStorage.setItem("admin_pw", password);
      setAuthed(true);
    } else {
      setAuthError("Wrong password");
    }
  };

  // Load project list
  const loadProjects = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/project", {
        headers: { "x-admin-password": getAuthHeader() },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (authed) loadProjects();
  }, [authed]);

  // Load single project for editing
  const loadProject = async (slug: string) => {
    setLoadingProject(true);
    try {
      const res = await fetch(`/api/admin/project?slug=${slug}`, {
        headers: { "x-admin-password": getAuthHeader() },
      });
      if (res.ok) {
        const data = await res.json();
        setEditSlug(slug);
        setTitle(data.title || "");
        setTitleCy(data.titleCy || "");
        setClient(data.client || "");
        setYear(data.year || new Date().getFullYear());
        setRole(data.role || "");
        setRoleCy(data.roleCy || "");
        setType(data.type || "digital");
        setFeatured(data.featured || false);
        setSummary(data.summary || "");
        setSummaryCy(data.summaryCy || "");
        setBrief(data.brief || "");
        setMyRole(data.myRole || "");
        setApproach(data.approach || "");
        setOutcome(data.outcome || "");

        // Stats
        if (data.stats && data.stats.length > 0) {
          const loaded = data.stats.map((s: { label?: string; labelCy?: string; value?: string }) => ({
            label: s.label || "",
            labelCy: s.labelCy || "",
            value: s.value || "",
          }));
          while (loaded.length < 3) loaded.push({ label: "", labelCy: "", value: "" });
          setStats(loaded);
        } else {
          setStats(emptyStats);
        }

        // Testimonial
        if (data.testimonial) {
          setTestimonialQuote(data.testimonial.quote || "");
          setTestimonialQuoteCy(data.testimonial.quoteCy || "");
          setTestimonialAuthor(data.testimonial.author || "");
          setTestimonialRole(data.testimonial.role || "");
          setShowTestimonial(true);
        } else {
          setTestimonialQuote("");
          setTestimonialQuoteCy("");
          setTestimonialAuthor("");
          setTestimonialRole("");
          setShowTestimonial(false);
        }

        setHeroImage(null);
        setStatus("idle");
        setView("form");
      }
    } finally {
      setLoadingProject(false);
    }
  };

  const clearForm = () => {
    setEditSlug(null);
    setTitle("");
    setTitleCy("");
    setClient("");
    setYear(new Date().getFullYear());
    setRole("");
    setRoleCy("");
    setType("digital");
    setFeatured(false);
    setHeroImage(null);
    setSummary("");
    setSummaryCy("");
    setStats(emptyStats);
    setTestimonialQuote("");
    setTestimonialQuoteCy("");
    setTestimonialAuthor("");
    setTestimonialRole("");
    setShowTestimonial(false);
    setBrief("");
    setMyRole("");
    setApproach("");
    setOutcome("");
    setStatus("idle");
    setErrorMsg("");
  };

  const updateStat = (index: number, field: keyof Stat, value: string) => {
    const next = [...stats];
    next[index] = { ...next[index], [field]: value };
    setStats(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const formData = new FormData();
    if (editSlug) formData.append("editSlug", editSlug);
    formData.append("title", title);
    formData.append("titleCy", titleCy);
    formData.append("client", client);
    formData.append("year", String(year));
    formData.append("role", role);
    formData.append("roleCy", roleCy);
    formData.append("type", type);
    formData.append("featured", String(featured));
    formData.append("summary", summary);
    formData.append("summaryCy", summaryCy);
    formData.append("stats", JSON.stringify(stats.filter((s) => s.label && s.value)));
    formData.append("brief", brief);
    formData.append("myRole", myRole);
    formData.append("approach", approach);
    formData.append("outcome", outcome);

    if (testimonialQuote) {
      formData.append(
        "testimonial",
        JSON.stringify({
          quote: testimonialQuote,
          quoteCy: testimonialQuoteCy,
          author: testimonialAuthor,
          role: testimonialRole,
        })
      );
    }

    if (heroImage) formData.append("heroImage", heroImage);

    try {
      const res = await fetch("/api/admin/project", {
        method: "POST",
        headers: { "x-admin-password": getAuthHeader() },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setResultSlug(data.slug);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Failed to save project");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  };

  const inputClass =
    "w-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 font-sans focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors";
  const labelClass = "block text-sm font-sans font-medium text-stone-700 mb-1";
  const sectionClass = "border-t border-stone-200 pt-8 mt-8";

  // ── Password gate ─────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <h1 className="text-2xl font-serif font-bold text-stone-900">Admin</h1>
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button
            type="submit"
            className="w-full bg-stone-900 text-white px-4 py-2.5 text-sm font-sans font-medium hover:bg-stone-800 transition-colors"
          >
            Log in
          </button>
        </form>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-stone-900">
          Project {editSlug ? "updated" : "saved"}
        </h1>
        <p className="text-stone-600">
          {editSlug ? "Updated" : "Created"}{" "}
          <code className="bg-stone-100 px-2 py-0.5 text-sm">{resultSlug}.mdx</code>
        </p>
        <div className="flex gap-4">
          <a
            href={`/work/${resultSlug}`}
            className="bg-stone-900 text-white px-4 py-2.5 text-sm font-sans hover:bg-stone-800 transition-colors"
          >
            View project
          </a>
          <button
            onClick={() => {
              clearForm();
              setView("list");
              loadProjects();
            }}
            className="border border-stone-900 text-stone-900 px-4 py-2.5 text-sm font-sans hover:bg-stone-900 hover:text-white transition-colors"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  // ── Project list ──────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-stone-900">Projects</h1>
          <button
            onClick={() => {
              clearForm();
              setView("form");
            }}
            className="bg-stone-900 text-white px-4 py-2.5 text-sm font-sans font-medium hover:bg-stone-800 transition-colors"
          >
            + Add New
          </button>
        </div>

        {loadingList ? (
          <p className="text-sm text-stone-500">Loading...</p>
        ) : (
          <div className="space-y-1">
            {projects.map((p) => (
              <button
                key={p.slug}
                onClick={() => loadProject(p.slug)}
                disabled={loadingProject}
                className="w-full text-left px-4 py-3 border border-stone-100 hover:border-stone-300 hover:bg-stone-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-sm font-sans font-medium text-stone-900 group-hover:text-accent-dark">
                    {p.title}
                  </span>
                  <span className="text-xs text-stone-400 ml-3">
                    {p.client} &middot; {p.year}
                  </span>
                </div>
                <span className="text-xs font-sans text-stone-400 bg-stone-100 px-2 py-0.5">
                  {p.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Form (create or edit) ─────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-stone-900">
          {editSlug ? `Edit: ${title || editSlug}` : "Add Project"}
        </h1>
        <button
          type="button"
          onClick={() => {
            clearForm();
            setView("list");
          }}
          className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors"
        >
          &larr; Back to list
        </button>
      </div>

      {/* Core metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Title (EN) *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Title (CY)</label>
          <input value={titleCy} onChange={(e) => setTitleCy(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Client *</label>
          <input value={client} onChange={(e) => setClient(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Year *</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            <option value="broadcast">Broadcast</option>
            <option value="digital">Digital</option>
            <option value="content">Content</option>
            <option value="format">Format</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Role (EN) *</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Role (CY)</label>
          <input value={roleCy} onChange={(e) => setRoleCy(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="featured"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="w-4 h-4 accent-accent"
        />
        <label htmlFor="featured" className="text-sm font-sans text-stone-700">
          Featured on homepage
        </label>
      </div>

      <div>
        <label className={labelClass}>Hero Image {editSlug && "(leave empty to keep current)"}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setHeroImage(e.target.files?.[0] || null)}
          className="text-sm font-sans text-stone-600 file:mr-4 file:py-2 file:px-4 file:border file:border-stone-200 file:text-sm file:font-sans file:bg-white file:text-stone-700 hover:file:bg-stone-50 file:cursor-pointer"
        />
      </div>

      {/* Summary */}
      <div className={sectionClass}>
        <h2 className="text-lg font-serif font-semibold text-stone-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Summary (EN)</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className={inputClass} rows={3} />
          </div>
          <div>
            <label className={labelClass}>Summary (CY)</label>
            <textarea value={summaryCy} onChange={(e) => setSummaryCy(e.target.value)} className={inputClass} rows={3} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={sectionClass}>
        <h2 className="text-lg font-serif font-semibold text-stone-900 mb-4">Stats (up to 3)</h2>
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <input placeholder="Label (EN)" value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} className={inputClass} />
              <input placeholder="Label (CY)" value={stat.labelCy} onChange={(e) => updateStat(i, "labelCy", e.target.value)} className={inputClass} />
              <input placeholder="Value" value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} className={inputClass} />
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className={sectionClass}>
        <button
          type="button"
          onClick={() => setShowTestimonial(!showTestimonial)}
          className="text-sm font-sans font-medium text-accent-dark hover:text-stone-900 transition-colors"
        >
          {showTestimonial ? "- Remove testimonial" : "+ Add testimonial"}
        </button>
        {showTestimonial && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Quote (EN)</label>
                <textarea value={testimonialQuote} onChange={(e) => setTestimonialQuote(e.target.value)} className={inputClass} rows={3} />
              </div>
              <div>
                <label className={labelClass}>Quote (CY)</label>
                <textarea value={testimonialQuoteCy} onChange={(e) => setTestimonialQuoteCy(e.target.value)} className={inputClass} rows={3} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Author</label>
                <input value={testimonialAuthor} onChange={(e) => setTestimonialAuthor(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Author Role</label>
                <input value={testimonialRole} onChange={(e) => setTestimonialRole(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Body sections */}
      <div className={sectionClass}>
        <h2 className="text-lg font-serif font-semibold text-stone-900 mb-4">Content Sections</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>The Brief</label>
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} className={inputClass} rows={5} placeholder="What was the client looking for?" />
          </div>
          <div>
            <label className={labelClass}>My Role</label>
            <textarea value={myRole} onChange={(e) => setMyRole(e.target.value)} className={inputClass} rows={5} placeholder="What did you do on this project?" />
          </div>
          <div>
            <label className={labelClass}>Approach</label>
            <textarea value={approach} onChange={(e) => setApproach(e.target.value)} className={inputClass} rows={5} placeholder="How did you tackle it?" />
          </div>
          <div>
            <label className={labelClass}>Outcome</label>
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} className={inputClass} rows={5} placeholder="What were the results?" />
          </div>
        </div>
      </div>

      {/* Submit */}
      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-stone-900 text-white px-6 py-3 text-sm font-sans font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
      >
        {status === "submitting" ? "Saving..." : editSlug ? "Update Project" : "Save Project"}
      </button>
    </form>
  );
}
