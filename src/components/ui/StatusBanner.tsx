import type { ReactNode } from "react";

const styles = {
  success:
    "border-emerald-500/25 bg-emerald-950/35 text-emerald-100",
  info: "border-indigo-400/25 bg-indigo-500/10 text-indigo-100",
  warning:
    "border-amber-500/30 bg-amber-950/25 text-amber-100",
  error: "border-rose-500/30 bg-rose-950/25 text-rose-100",
} as const;

export function StatusBanner({
  tone,
  children,
  icon,
}: {
  tone: keyof typeof styles;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      role="status"
      className={`animate-fade-up flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${styles[tone]}`}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
