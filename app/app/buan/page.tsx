import { redirect } from "next/navigation";

// The Buan landing now lives at the indexable top-level /buan route. This
// /app path is kept only so legacy/showcase links don't break – it redirects
// to the canonical URL.
export default function BuanAppRedirect() {
  redirect("/buan");
}
