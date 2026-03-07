"use client";

export type SummaryCard = {
  label: string;
  value: number;
  hint?: string;
};

export function SummaryCards({ items }: { items: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </div>
          <div className="mt-1 bg-linear-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] bg-clip-text text-2xl font-bold tabular-nums text-transparent">
            {item.value}
          </div>
          {item.hint ? (
            <div className="mt-1 text-xs text-slate-600">{item.hint}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
