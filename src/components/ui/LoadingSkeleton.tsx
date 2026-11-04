import { Card } from "../MobileShell";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-12 rounded-2xl bg-white/10" />
      <Card>
        <div className="mx-auto h-24 w-24 rounded-full bg-white/10" />
        <div className="mx-auto mt-4 h-6 w-48 rounded-lg bg-white/10" />
        <div className="mx-auto mt-2 h-4 w-32 rounded-lg bg-white/10" />
      </Card>
      <div className="h-14 rounded-2xl bg-white/10" />
      <Card>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-white/10" />
          ))}
        </div>
      </Card>
    </div>
  );
}
