"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

type Action = (formData: FormData) => Promise<ActionResult>;
type NoArgAction = () => Promise<ActionResult>;

export function ActionButton({
  action,
  label,
  loadingLabel,
  className,
  confirm,
}: {
  action: NoArgAction;
  label: string;
  loadingLabel?: string;
  className?: string;
  confirm?: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function go() {
    if (confirm && !window.confirm(confirm)) return;
    setMsg(null);
    start(async () => {
      const r = await action();
      setMsg({ ok: r.ok, text: r.message });
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-semibold shadow disabled:opacity-60",
          className ?? "bg-pitch-600 hover:bg-pitch-700 text-white"
        )}
      >
        {pending ? loadingLabel ?? "Procesando…" : label}
      </button>
      {msg && (
        <span
          className={cn(
            "text-sm",
            msg.ok ? "text-pitch-700 dark:text-pitch-300" : "text-red-600"
          )}
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}

export function FormAction({
  action,
  children,
  className,
  resetOnSuccess,
  onResult,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onResult?: (r: ActionResult) => void;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(formData: FormData, form: HTMLFormElement) {
    setMsg(null);
    start(async () => {
      const r = await action(formData);
      setMsg({ ok: r.ok, text: r.message });
      onResult?.(r);
      if (r.ok && resetOnSuccess) form.reset();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        submit(fd, e.currentTarget);
      }}
      className={className}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {msg && (
        <p
          className={cn(
            "text-sm mt-2",
            msg.ok ? "text-pitch-700 dark:text-pitch-300" : "text-red-600"
          )}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}
