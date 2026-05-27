import { redirect } from "next/navigation";
import { loginAction } from "./actions/auth";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/play");

  const { error } = await searchParams;

  return (
    <main className="min-h-screen grid place-items-center px-4 py-10 pitch-stripes">
      <div className="w-full max-w-md rounded-2xl border border-pitch-700/15 bg-white/90 dark:bg-slate-900/80 shadow-xl backdrop-blur p-8">
        <div className="flex justify-center mb-6">
          <Logo size={56} />
        </div>
        <h1 className="text-center text-xl font-bold mb-1">
          Bienvenido a la polla
        </h1>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
          Ingresa tu <strong>código de invitación</strong> (te lo dio el admin
          de la Natillera).
        </p>

        <form action={loginAction} className="space-y-3">
          <label className="block text-sm font-medium">
            Código de invitación
            <input
              name="code"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              maxLength={32}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-3 text-center text-2xl font-mono tracking-[0.25em] uppercase focus:outline-none focus:ring-2 focus:ring-pitch-500"
              placeholder="•••••"
            />
          </label>
          {error === "invalid" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Código no válido. Pídele uno nuevo al admin.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-pitch-600 hover:bg-pitch-700 text-white font-semibold py-3 transition shadow"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-slate-400">
          Hecho con cariño para la familia, con saludos a{" "}
          <span className="font-semibold text-pitch-700 dark:text-pitch-300">
            Krypto
          </span>{" "}
          🐶
        </p>
      </div>
    </main>
  );
}
