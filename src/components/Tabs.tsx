"use client";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  badge?: number;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={[
              "rounded-full border px-4 py-2 text-sm font-medium transition shadow-sm",
              active
                ? "border-transparent bg-linear-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white"
                : "border-white/70 bg-white/80 text-slate-700 hover:bg-white",
            ].join(" ")}
          >
            <span>{item.label}</span>
            {typeof item.badge === "number" ? (
              <span
                className={[
                  "ml-2 inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
