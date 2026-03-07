"use client";

import JSZip from "jszip";
import * as React from "react";
import { UploadZip } from "@/components/UploadZip";
import { Tabs } from "@/components/Tabs";
import { SummaryCards } from "@/components/SummaryCards";
import { UserList } from "@/components/UserList";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import type { InstagramConnections } from "@/lib/instagram/types";
import { parseInstagramConnectionsFromZip } from "@/lib/instagram/parse";
import { compareFollowersAndFollowing } from "@/lib/instagram/compare";

type ZipParseState =
  | { status: "idle" }
  | { status: "parsing"; message: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      connections: InstagramConnections;
      message: string;
    };

export default function Home() {
  const [state, setState] = React.useState<ZipParseState>({ status: "idle" });
  const [tab, setTab] = React.useState<
    "mutual" | "onlyYouFollow" | "onlyTheyFollow"
  >("onlyYouFollow");

  const handleZip = React.useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setState({
        status: "error",
        message: "Please upload the .zip file you downloaded from Instagram.",
      });
      return;
    }

    try {
      setState({ status: "parsing", message: "Reading ZIP…" });
      const zip = await JSZip.loadAsync(file);

      const connections = await parseInstagramConnectionsFromZip(
        zip,
        (message) => setState({ status: "parsing", message }),
      );

      if (
        connections.following.length === 0 ||
        connections.followers.length === 0
      ) {
        setState({
          status: "error",
          message:
            "Couldn’t read followers/following from this ZIP. Double-check you exported “Followers and following” in JSON format, then upload the downloaded ZIP.",
        });
        return;
      }

      setTab("onlyYouFollow");
      setState({
        status: "ready",
        message: "All set. Here are your results.",
        connections,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ status: "error", message: `Failed to read ZIP: ${message}` });
    }
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-3 rounded-3xl border border-white/40 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(253,186,116,0.15)] px-3 py-1 text-xs font-medium text-[#c05621]">
          <span className="inline-block h-2 w-2 rounded-full bg-linear-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4]" />
          Instagram export helper
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Who follows you back?
        </h1>
        <p className="text-sm text-slate-600">
          Follow the steps below to download your Instagram data from{" "}
          <a
            className="font-medium text-[#d62976] underline underline-offset-4"
            href="https://accountscenter.instagram.com/"
            target="_blank"
            rel="noreferrer"
          >
            accountscenter.instagram.com
          </a>{" "}
          and drop the ZIP here. Everything stays in your browser.
        </p>
      </header>

      <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-lg font-semibold">How to export from Instagram</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-700">
          <li>
            Go to{" "}
            <a
              className="underline"
              href="https://accountscenter.instagram.com/"
              target="_blank"
              rel="noreferrer"
            >
              accountscenter.instagram.com
            </a>
          </li>
          <li>Click “Your Information and permission”</li>
          <li>Click “Export your information”</li>
          <li>Click “Create export”</li>
          <li>Choose your Instagram account</li>
          <li>Click “Export to device”</li>
          <li>
            Fill the form:
            <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-700">
              <li>Notify: your preferred notification email</li>
              <li>
                Customize information: clear all, keep only “Followers and
                following” under “Connections”
              </li>
              <li>Date range: All time</li>
              <li>Format: JSON</li>
              <li>Media quality: Lower quality</li>
            </ul>
          </li>
          <li>Click “Start export”</li>
          <li>Wait for the email (can take ~30 minutes to a few days)</li>
          <li>
            When the email arrives, download from{" "}
            <a
              className="underline"
              href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
              target="_blank"
              rel="noreferrer"
            >
              accountscenter.instagram.com/info_and_permissions/dyi/
            </a>
          </li>
          <li>Upload the downloaded report (.zip) below</li>
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <UploadZip disabled={state.status === "parsing"} onFile={handleZip} />

        {state.status === "parsing" ? (
          <div className="text-sm text-neutral-700">{state.message}</div>
        ) : null}

        {state.status === "error" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.message}
          </div>
        ) : null}

        {state.status === "ready" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {state.message}
          </div>
        ) : null}
      </section>

      {state.status === "ready" ? (
        <Results
          connections={state.connections}
          tab={tab}
          onTabChange={setTab}
        />
      ) : null}
    </main>
  );
}

function Results({
  connections,
  tab,
  onTabChange,
}: {
  connections: InstagramConnections;
  tab: "mutual" | "onlyYouFollow" | "onlyTheyFollow";
  onTabChange: (tab: "mutual" | "onlyYouFollow" | "onlyTheyFollow") => void;
}) {
  const comparison = React.useMemo(
    () =>
      compareFollowersAndFollowing(
        connections.following,
        connections.followers,
      ),
    [connections.followers, connections.following],
  );

  const tabItems = [
    {
      id: "mutual" as const,
      label: "You follow & they follow",
      badge: comparison.mutual.length,
    },
    {
      id: "onlyYouFollow" as const,
      label: "Only you follow",
      badge: comparison.onlyYouFollow.length,
    },
    {
      id: "onlyTheyFollow" as const,
      label: "Only they follow",
      badge: comparison.onlyTheyFollow.length,
    },
  ];

  return (
    <section className="flex flex-col gap-6">
      <SummaryCards
        items={[
          { label: "Following", value: connections.following.length },
          { label: "Followers", value: connections.followers.length },
          { label: "Mutual", value: comparison.mutual.length },
          {
            label: "Not following back",
            value: comparison.onlyYouFollow.length,
            hint: "You follow them, they don’t follow you.",
          },
          {
            label: "You don’t follow back",
            value: comparison.onlyTheyFollow.length,
            hint: "They follow you, you don’t follow them.",
          },
          { label: "Blocked", value: connections.blocked.length },
        ]}
      />

      <div className="flex flex-col gap-4">
        <Tabs items={tabItems} value={tab} onChange={onTabChange} />
        {tab === "mutual" ? (
          <UserList
            title="You follow & they follow"
            users={comparison.mutual}
          />
        ) : null}
        {tab === "onlyYouFollow" ? (
          <UserList title="Only you follow" users={comparison.onlyYouFollow} />
        ) : null}
        {tab === "onlyTheyFollow" ? (
          <UserList
            title="Only they follow"
            users={comparison.onlyTheyFollow}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-lg font-semibold">More insights</div>
        <ConnectionPanel title="Blocked profiles" users={connections.blocked} />
        <ConnectionPanel
          title="Pending follow requests"
          users={connections.pendingFollowRequests}
        />
        <ConnectionPanel
          title="Recent follow requests"
          users={connections.recentFollowRequests}
        />
        <ConnectionPanel
          title="Recently unfollowed"
          users={connections.recentlyUnfollowed}
        />
        <ConnectionPanel
          title="Removed suggestions"
          users={connections.removedSuggestions}
        />
      </div>

      {connections.warnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Warnings</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {connections.warnings.slice(0, 10).map((w, idx) => (
              <li key={`${w.file}-${idx}`}>
                <span className="font-medium">{w.file}:</span> {w.message}
              </li>
            ))}
          </ul>
          {connections.warnings.length > 10 ? (
            <div className="mt-2 text-amber-800">
              Showing 10 of {connections.warnings.length} warnings.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
