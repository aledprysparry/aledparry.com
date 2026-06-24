// Shared tab nav for the Buan business dashboard pages (P8).
export default function ManageNav({ active }: { active: "menu" | "orders" | "analytics" }) {
  const tabs: [string, string][] = [
    ["menu", "/buan/manage"],
    ["orders", "/buan/manage/orders"],
    ["analytics", "/buan/manage/analytics"],
  ];
  return (
    <div className="flex gap-1 text-xs">
      {tabs.map(([k, href]) => (
        <a
          key={k}
          href={href}
          className={`rounded-full px-3 py-1 capitalize ${k === active ? "bg-emerald-400 font-bold text-emerald-950" : "border border-stone-700 text-stone-400 hover:border-emerald-400"}`}
        >
          {k}
        </a>
      ))}
    </div>
  );
}
