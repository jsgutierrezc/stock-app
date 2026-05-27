import Link from "next/link";

const tabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/partidos", label: "Partidos" },
  { href: "/admin/reglas", label: "Reglas" },
  { href: "/admin/participantes", label: "Participantes" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={
            "rounded-full border px-4 py-1.5 text-sm font-medium transition " +
            (active === t.href
              ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-600")
          }
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
