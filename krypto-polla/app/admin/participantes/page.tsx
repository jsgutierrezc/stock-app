import { currentUser } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { AdminNav } from "@/components/AdminNav";
import { FormAction } from "@/components/ActionButton";
import {
  createParticipantAction,
  deleteParticipantAction,
  regenerateCodeAction,
} from "@/app/actions/admin";
import type { Participant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminParticipantes() {
  const me = (await currentUser())!;
  const { data } = await db()
    .from("participants")
    .select("*")
    .order("created_at", { ascending: true });
  const list = (data ?? []) as Participant[];

  return (
    <>
      <Header user={me} active="admin" />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <AdminNav active="/admin/participantes" />
        <h1 className="text-2xl font-extrabold mb-4">Participantes</h1>

        <section className="rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-bold mb-3">Agregar participante</h2>
          <FormAction
            action={createParticipantAction}
            resetOnSuccess
            className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto,auto] gap-2 items-end"
          >
            <label className="text-sm">
              <span className="font-medium block">Nombre</span>
              <input
                name="name"
                required
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium block">
                Código (opcional, se genera si lo dejas vacío)
              </span>
              <input
                name="invite_code"
                maxLength={32}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2 font-mono uppercase tracking-widest"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium block">Rol</span>
              <select
                name="role"
                defaultValue="player"
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-2"
              >
                <option value="player">Jugador</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-pitch-600 hover:bg-pitch-700 text-white font-semibold px-4 py-2"
            >
              Crear
            </button>
          </FormAction>
        </section>

        <div className="overflow-hidden rounded-xl border border-pitch-700/15 bg-white/70 dark:bg-slate-900/60 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-pitch-700/10">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">
                    <code className="font-mono tracking-widest text-pitch-700 dark:text-pitch-300">
                      {p.invite_code}
                    </code>
                  </td>
                  <td className="px-3 py-2 capitalize">{p.role}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <FormAction action={regenerateCodeAction} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-xs underline text-slate-500 hover:text-slate-700"
                        >
                          Nuevo código
                        </button>
                      </FormAction>
                      {p.id !== me.id && (
                        <FormAction action={deleteParticipantAction} className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <button
                            type="submit"
                            className="text-xs underline text-red-600 hover:text-red-800"
                            onClick={(e) => {
                              if (
                                !window.confirm(
                                  `¿Eliminar a ${p.name}? Sus pronósticos también se borran.`
                                )
                              )
                                e.preventDefault();
                            }}
                          >
                            Eliminar
                          </button>
                        </FormAction>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Comparte el código por WhatsApp con cada familiar para que entren a
          jugar.
        </p>
      </main>
    </>
  );
}
