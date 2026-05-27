import Link from "next/link";
import { Logo } from "./Logo";
import type { Participant } from "@/lib/types";
import { logoutAction } from "@/app/actions/auth";

export function Header({
  user,
  active,
}: {
  user: Participant;
  active?: "pronosticos" | "posiciones" | "info" | "admin";
}) {
  const tabs: { id: typeof active; href: string; label: string }[] = [
    { id: "pronosticos", href: "/play", label: "Pronósticos" },
    { id: "posiciones", href: "/play/posiciones", label: "Posiciones" },
    { id: "info", href: "/play/info", label: "Info General" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-pitch-700/15 bg-white/90 backdrop-blur dark:bg-slate-900/80">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/play" aria-label="Inicio">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={
                "px-3 py-1.5 rounded-md transition " +
                (active === t.id
                  ? "bg-pitch-600 text-white shadow-sm"
                  : "text-slate-700 dark:text-slate-200 hover:bg-pitch-100 dark:hover:bg-slate-800")
              }
            >
              {t.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className={
                "ml-1 px-3 py-1.5 rounded-md text-sm transition " +
                (active === "admin"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800")
              }
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right leading-tight">
            <div className="font-semibold">{user.name}</div>
            <div className="text-xs text-slate-500 capitalize">{user.role}</div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs underline text-slate-500 hover:text-slate-700"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
