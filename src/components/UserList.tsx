"use client";

import * as React from "react";
import type { NormalizedUser } from "@/lib/instagram/types";

type SortMode = "az" | "newest";

function instagramProfileUrl(username: string) {
  return `https://www.instagram.com/${encodeURIComponent(username)}/`;
}

export function UserList({
  title,
  users,
}: {
  title: string;
  users: NormalizedUser[];
}) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortMode>("az");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? users.filter(
          (u) =>
            u.username.includes(q) ||
            u.displayUsername.toLowerCase().includes(q),
        )
      : users;

    const sorted = [...base];
    if (sort === "newest") {
      sorted.sort((a, b) => (b.timestamp ?? -1) - (a.timestamp ?? -1));
    } else {
      sorted.sort((a, b) => a.username.localeCompare(b.username));
    }
    return sorted;
  }, [query, sort, users]);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-sm text-slate-600">{filtered.length} shown</div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[rgba(214,41,118,0.35)] sm:w-60"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[rgba(214,41,118,0.35)]"
          >
            <option value="az">Sort: A → Z</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>
      </div>

      <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl border border-slate-100 bg-white">
        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-neutral-600">No matches.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((u) => {
              const href = u.href ?? instagramProfileUrl(u.username);
              return (
                <li
                  key={u.username}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">@{u.username}</div>
                    {u.timestamp ? (
                      <div className="text-xs text-slate-400">
                        {new Date(u.timestamp * 1000).toLocaleString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}
                      </div>
                    ) : null}
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                  >
                    Open
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
