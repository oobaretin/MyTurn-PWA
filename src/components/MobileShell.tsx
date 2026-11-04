import type { ReactNode } from "react";

export function MobileShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col bg-gradient-to-b from-indigo-950 via-slate-950 to-black px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-300/80">
          MyTurn
        </p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-base text-slate-300">{subtitle}</p>
        ) : null}
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "bg-indigo-500 active:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30"
      : variant === "danger"
        ? "bg-rose-600 active:bg-rose-500 text-white"
        : "bg-white/10 active:bg-white/20 text-white border border-white/20";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-14 w-full rounded-2xl px-6 text-lg font-semibold transition disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}
