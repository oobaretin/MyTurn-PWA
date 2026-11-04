import type { InputHTMLAttributes, ReactNode } from "react";
import { IconDroplets } from "./ui/Icons";

export function MobileShell({
  title,
  subtitle,
  children,
  hero,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  hero?: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col overflow-hidden px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[#070b14]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-2xl"
        aria-hidden
      />

      <header className="mb-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <IconDroplets className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-indigo-200/90">
            MyTurn
          </span>
        </div>
        {hero}
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1.5 text-base leading-relaxed text-slate-400">
            {subtitle}
          </p>
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
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-600/35 active:scale-[0.98]"
      : variant === "danger"
        ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg shadow-rose-600/30 active:scale-[0.98]"
        : variant === "ghost"
          ? "bg-transparent text-indigo-200 underline-offset-4 hover:underline"
          : "border border-white/15 bg-white/8 text-white backdrop-blur-sm active:bg-white/12";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-14 w-full rounded-2xl px-6 text-lg font-semibold transition disabled:opacity-40 disabled:active:scale-100 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
      {children}
    </span>
  );
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/30 ${className}`}
    />
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold text-slate-200">{children}</h2>
  );
}
