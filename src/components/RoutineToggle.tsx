"use client";

import { IconShower, IconSunrise } from "./ui/Icons";

type Routine = "evening" | "morning";

export function RoutineToggle({
  value,
  onChange,
}: {
  value: Routine;
  onChange: (r: Routine) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/30 p-1.5">
      {(
        [
          { id: "evening" as const, label: "Evening", Icon: IconShower },
          { id: "morning" as const, label: "Morning", Icon: IconSunrise },
        ] as const
      ).map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
              active
                ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
