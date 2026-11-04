function initial(name: string): string {
  return (name.trim()[0] ?? "?").toUpperCase();
}

export function KidAvatar({
  name,
  color,
  size = "lg",
  pulse = false,
}: {
  name: string;
  color: string;
  size?: "md" | "lg" | "xl";
  pulse?: boolean;
}) {
  const dims =
    size === "xl" ? "h-28 w-28 text-4xl" : size === "lg" ? "h-20 w-20 text-2xl" : "h-12 w-12 text-lg";

  return (
    <div className={`relative shrink-0 ${pulse ? "animate-glow-pulse" : ""}`}>
      {pulse ? (
        <span
          className="absolute inset-0 rounded-full opacity-40 blur-md"
          style={{ backgroundColor: color }}
        />
      ) : null}
      <div
        className={`relative flex ${dims} items-center justify-center rounded-full font-bold text-white shadow-lg ring-4 ring-white/10`}
        style={{
          background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 55%, #0f172a))`,
        }}
      >
        {initial(name)}
      </div>
    </div>
  );
}
