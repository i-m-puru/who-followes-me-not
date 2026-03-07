import type JSZip from "jszip";
import { InstagramConnections, NormalizedUser, ParseWarning } from "./types";

function normalizeZipPath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\/+/, "");
}

function normalizeUsername(username: string) {
  return username.trim().replace(/^@/, "").toLowerCase();
}

function pickNewest(a: NormalizedUser, b: NormalizedUser) {
  const ta = a.timestamp ?? -1;
  const tb = b.timestamp ?? -1;
  return tb > ta ? b : a;
}

function dedupeByUsername(users: NormalizedUser[]) {
  const map = new Map<string, NormalizedUser>();
  for (const u of users) {
    const key = u.username;
    const existing = map.get(key);
    map.set(key, existing ? pickNewest(existing, u) : u);
  }
  return [...map.values()];
}

function safeJsonParse(
  text: string,
  file: string,
): { ok: true; value: unknown } | { ok: false; warning: ParseWarning } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown JSON parse error";
    return {
      ok: false,
      warning: { file, message: `Failed to parse JSON: ${message}` },
    };
  }
}

function extractUsersFromTitleRelationship(
  json: unknown,
  file: string,
  relationshipKey: string,
): { users: NormalizedUser[]; warnings: ParseWarning[] } {
  const warnings: ParseWarning[] = [];
  const users: NormalizedUser[] = [];

  const obj = json as Record<string, unknown> | null;
  const list =
    obj && typeof obj === "object"
      ? (obj[relationshipKey] as unknown)
      : undefined;
  if (!Array.isArray(list)) {
    warnings.push({
      file,
      message: `Expected key "${relationshipKey}" to be an array.`,
    });
    return { users, warnings };
  }

  for (const item of list) {
    const title = (item as any)?.title;
    if (typeof title !== "string" || !title.trim()) continue;
    const username = normalizeUsername(title);
    if (!username) continue;
    const href = (item as any)?.string_list_data?.[0]?.href;
    const timestamp = (item as any)?.string_list_data?.[0]?.timestamp;
    users.push({
      username,
      displayUsername: title,
      href: typeof href === "string" ? href : undefined,
      timestamp: typeof timestamp === "number" ? timestamp : undefined,
      sourceFile: file,
    });
  }

  return { users, warnings };
}

function extractUsersFromValueRelationship(
  json: unknown,
  file: string,
  relationshipKey: string,
): { users: NormalizedUser[]; warnings: ParseWarning[] } {
  const warnings: ParseWarning[] = [];
  const users: NormalizedUser[] = [];

  const obj = json as Record<string, unknown> | null;
  const list =
    obj && typeof obj === "object"
      ? (obj[relationshipKey] as unknown)
      : undefined;
  if (!Array.isArray(list)) {
    warnings.push({
      file,
      message: `Expected key "${relationshipKey}" to be an array.`,
    });
    return { users, warnings };
  }

  for (const item of list) {
    const value = (item as any)?.string_list_data?.[0]?.value;
    if (typeof value !== "string" || !value.trim()) continue;
    const username = normalizeUsername(value);
    if (!username) continue;
    const href = (item as any)?.string_list_data?.[0]?.href;
    const timestamp = (item as any)?.string_list_data?.[0]?.timestamp;
    users.push({
      username,
      displayUsername: value,
      href: typeof href === "string" ? href : undefined,
      timestamp: typeof timestamp === "number" ? timestamp : undefined,
      sourceFile: file,
    });
  }

  return { users, warnings };
}

function extractFollowersFromFollowersArray(json: unknown, file: string) {
  const warnings: ParseWarning[] = [];
  const users: NormalizedUser[] = [];

  if (!Array.isArray(json)) {
    warnings.push({ file, message: "Expected followers JSON to be an array." });
    return { users, warnings };
  }

  for (const item of json) {
    const value = (item as any)?.string_list_data?.[0]?.value;
    if (typeof value !== "string" || !value.trim()) continue;
    const username = normalizeUsername(value);
    if (!username) continue;
    const href = (item as any)?.string_list_data?.[0]?.href;
    const timestamp = (item as any)?.string_list_data?.[0]?.timestamp;
    users.push({
      username,
      displayUsername: value,
      href: typeof href === "string" ? href : undefined,
      timestamp: typeof timestamp === "number" ? timestamp : undefined,
      sourceFile: file,
    });
  }

  return { users, warnings };
}

function extractFollowingFromFollowingObject(json: unknown, file: string) {
  return extractUsersFromTitleRelationship(
    json,
    file,
    "relationships_following",
  );
}

function listZipFileNames(zip: JSZip) {
  return Object.keys(zip.files)
    .map(normalizeZipPath)
    .filter((name) => !zip.files[name]?.dir);
}

function findBySuffix(fileNames: string[], suffix: string) {
  const normalizedSuffix = normalizeZipPath(suffix);
  return fileNames.find((n) => n.endsWith(normalizedSuffix));
}

function findAllByRegex(fileNames: string[], regex: RegExp) {
  return fileNames.filter((n) => regex.test(n));
}

async function readZipText(zip: JSZip, fileName: string) {
  const file = zip.file(fileName);
  if (!file) return null;
  return await file.async("text");
}

export type ParseProgress = (message: string) => void;

export async function parseInstagramConnectionsFromZip(
  zip: JSZip,
  onProgress?: ParseProgress,
): Promise<InstagramConnections> {
  const warnings: ParseWarning[] = [];
  const fileNames = listZipFileNames(zip);

  const followingPath =
    findBySuffix(
      fileNames,
      "connections/followers_and_following/following.json",
    ) ??
    findBySuffix(fileNames, "followers_and_following/following.json") ??
    findBySuffix(fileNames, "following.json");

  const followerParts = findAllByRegex(
    fileNames,
    /(^|\/)connections\/followers_and_following\/followers_\d+\.json$/,
  ).length
    ? findAllByRegex(
        fileNames,
        /(^|\/)connections\/followers_and_following\/followers_\d+\.json$/,
      )
    : findAllByRegex(fileNames, /(^|\/)followers_\d+\.json$/);

  const blockedPath =
    findBySuffix(
      fileNames,
      "connections/followers_and_following/blocked_profiles.json",
    ) ??
    findBySuffix(fileNames, "followers_and_following/blocked_profiles.json") ??
    findBySuffix(fileNames, "blocked_profiles.json");

  const pendingPath =
    findBySuffix(
      fileNames,
      "connections/followers_and_following/pending_follow_requests.json",
    ) ?? findBySuffix(fileNames, "pending_follow_requests.json");
  const recentPath =
    findBySuffix(
      fileNames,
      "connections/followers_and_following/recent_follow_requests.json",
    ) ?? findBySuffix(fileNames, "recent_follow_requests.json");
  const recentlyUnfollowedPath =
    findBySuffix(
      fileNames,
      "connections/followers_and_following/recently_unfollowed_profiles.json",
    ) ?? findBySuffix(fileNames, "recently_unfollowed_profiles.json");
  const removedSuggestionsPath =
    findBySuffix(
      fileNames,
      "connections/followers_and_following/removed_suggestions.json",
    ) ?? findBySuffix(fileNames, "removed_suggestions.json");

  if (!followingPath) {
    warnings.push({
      file: "(zip)",
      message: "Could not find following.json in the uploaded ZIP.",
    });
  }
  if (followerParts.length === 0) {
    warnings.push({
      file: "(zip)",
      message: "Could not find any followers_*.json files in the uploaded ZIP.",
    });
  }

  const result: InstagramConnections = {
    following: [],
    followers: [],
    blocked: [],
    pendingFollowRequests: [],
    recentFollowRequests: [],
    recentlyUnfollowed: [],
    removedSuggestions: [],
    warnings,
    matchedFiles: {
      following: followingPath,
      followerParts,
      blocked: blockedPath,
      pendingFollowRequests: pendingPath,
      recentFollowRequests: recentPath,
      recentlyUnfollowed: recentlyUnfollowedPath,
      removedSuggestions: removedSuggestionsPath,
    },
  };

  if (followingPath) {
    onProgress?.("Loading following.json…");
    const text = await readZipText(zip, followingPath);
    if (text == null) {
      result.warnings.push({
        file: followingPath,
        message: "File was not readable from the ZIP.",
      });
    } else {
      const parsed = safeJsonParse(text, followingPath);
      if (!parsed.ok) {
        result.warnings.push(parsed.warning);
      } else {
        const extracted = extractFollowingFromFollowingObject(
          parsed.value,
          followingPath,
        );
        result.following = dedupeByUsername(extracted.users);
        result.warnings.push(...extracted.warnings);
      }
    }
  }

  if (followerParts.length > 0) {
    const allFollowers: NormalizedUser[] = [];
    let idx = 0;
    for (const part of followerParts) {
      idx += 1;
      onProgress?.(`Loading followers (${idx}/${followerParts.length})…`);
      const text = await readZipText(zip, part);
      if (text == null) {
        result.warnings.push({
          file: part,
          message: "File was not readable from the ZIP.",
        });
        continue;
      }
      const parsed = safeJsonParse(text, part);
      if (!parsed.ok) {
        result.warnings.push(parsed.warning);
        continue;
      }
      const extracted = extractFollowersFromFollowersArray(parsed.value, part);
      allFollowers.push(...extracted.users);
      result.warnings.push(...extracted.warnings);
    }
    result.followers = dedupeByUsername(allFollowers);
  }

  if (blockedPath) {
    onProgress?.("Loading blocked profiles…");
    const text = await readZipText(zip, blockedPath);
    if (text != null) {
      const parsed = safeJsonParse(text, blockedPath);
      if (parsed.ok) {
        const extracted = extractUsersFromTitleRelationship(
          parsed.value,
          blockedPath,
          "relationships_blocked_users",
        );
        result.blocked = dedupeByUsername(extracted.users);
        result.warnings.push(...extracted.warnings);
      } else {
        result.warnings.push(parsed.warning);
      }
    }
  }

  if (pendingPath) {
    onProgress?.("Loading pending follow requests…");
    const text = await readZipText(zip, pendingPath);
    if (text != null) {
      const parsed = safeJsonParse(text, pendingPath);
      if (parsed.ok) {
        const extracted = extractUsersFromValueRelationship(
          parsed.value,
          pendingPath,
          "relationships_follow_requests_sent",
        );
        result.pendingFollowRequests = dedupeByUsername(extracted.users);
        result.warnings.push(...extracted.warnings);
      } else {
        result.warnings.push(parsed.warning);
      }
    }
  }

  if (recentPath) {
    onProgress?.("Loading recent follow requests…");
    const text = await readZipText(zip, recentPath);
    if (text != null) {
      const parsed = safeJsonParse(text, recentPath);
      if (parsed.ok) {
        const extracted = extractUsersFromValueRelationship(
          parsed.value,
          recentPath,
          "relationships_permanent_follow_requests",
        );
        result.recentFollowRequests = dedupeByUsername(extracted.users);
        result.warnings.push(...extracted.warnings);
      } else {
        result.warnings.push(parsed.warning);
      }
    }
  }

  if (recentlyUnfollowedPath) {
    onProgress?.("Loading recently unfollowed…");
    const text = await readZipText(zip, recentlyUnfollowedPath);
    if (text != null) {
      const parsed = safeJsonParse(text, recentlyUnfollowedPath);
      if (parsed.ok) {
        const extracted = extractUsersFromValueRelationship(
          parsed.value,
          recentlyUnfollowedPath,
          "relationships_unfollowed_users",
        );
        result.recentlyUnfollowed = dedupeByUsername(extracted.users);
        result.warnings.push(...extracted.warnings);
      } else {
        result.warnings.push(parsed.warning);
      }
    }
  }

  if (removedSuggestionsPath) {
    onProgress?.("Loading removed suggestions…");
    const text = await readZipText(zip, removedSuggestionsPath);
    if (text != null) {
      const parsed = safeJsonParse(text, removedSuggestionsPath);
      if (parsed.ok) {
        const extracted = extractUsersFromValueRelationship(
          parsed.value,
          removedSuggestionsPath,
          "relationships_dismissed_suggested_users",
        );
        result.removedSuggestions = dedupeByUsername(extracted.users);
        result.warnings.push(...extracted.warnings);
      } else {
        result.warnings.push(parsed.warning);
      }
    }
  }

  onProgress?.("Done.");
  return result;
}
