"use client";

import * as React from "react";
import type { NormalizedUser } from "@/lib/instagram/types";
import { UserList } from "./UserList";

export function ConnectionPanel({
  title,
  users,
  defaultOpen = false,
}: {
  title: string;
  users: NormalizedUser[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="font-semibold text-slate-800">{title}</div>
          <div className="text-sm text-slate-600">{users.length} items</div>
        </div>
        <div className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
          {open ? "Hide" : "Show"}
        </div>
      </button>
      {open ? (
        <div className="px-4 pb-4">
          <UserList title={title} users={users} />
        </div>
      ) : null}
    </div>
  );
}
