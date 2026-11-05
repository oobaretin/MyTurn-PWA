import Link from "next/link";

export function ParentNav({
  householdId,
  active,
}: {
  householdId: string;
  active: "setup" | "today";
}) {
  const items = [
    { id: "today" as const, href: `/h/${householdId}/today`, label: "Today" },
    { id: "setup" as const, href: `/h/${householdId}/setup`, label: "Settings" },
    { id: "home" as const, href: "/", label: "Home" },
  ];

  return (
    <nav
      aria-label="Parent navigation"
      className="sticky bottom-0 -mx-4 mt-auto border-t border-white/10 bg-[#070b14]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
    >
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/40 p-1">
        {items.map((item) => {
          const isLinkActive =
            item.id === "setup"
              ? active === "setup"
              : item.id === "today"
                ? active === "today"
                : false;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${
                isLinkActive
                  ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-current={isLinkActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
