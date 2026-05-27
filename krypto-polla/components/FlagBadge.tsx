import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

export function FlagBadge({
  team,
  align = "left",
  className,
}: {
  team: Team | null;
  align?: "left" | "right";
  className?: string;
}) {
  if (!team) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-slate-400", className)}>
        <span className="size-6 rounded bg-slate-200 dark:bg-slate-700" />
        <span>—</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        align === "right" && "flex-row-reverse",
        className
      )}
    >
      {team.flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.flag}
          alt=""
          aria-hidden
          className="size-6 object-contain shrink-0"
        />
      ) : (
        <span className="size-6 rounded bg-slate-200 dark:bg-slate-700 inline-block" />
      )}
      <span className="font-medium leading-tight">{team.name}</span>
    </span>
  );
}
