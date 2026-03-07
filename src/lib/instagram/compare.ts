import { NormalizedUser } from "./types";

export type ComparisonResult = {
  mutual: NormalizedUser[];
  onlyYouFollow: NormalizedUser[];
  onlyTheyFollow: NormalizedUser[];
};

function byUsernameAsc(a: NormalizedUser, b: NormalizedUser) {
  return a.username.localeCompare(b.username);
}

export function compareFollowersAndFollowing(
  following: NormalizedUser[],
  followers: NormalizedUser[],
): ComparisonResult {
  const followingMap = new Map(following.map((u) => [u.username, u] as const));
  const followersMap = new Map(followers.map((u) => [u.username, u] as const));

  const mutual: NormalizedUser[] = [];
  const onlyYouFollow: NormalizedUser[] = [];
  const onlyTheyFollow: NormalizedUser[] = [];

  for (const [username, user] of followingMap) {
    if (followersMap.has(username)) {
      // Prefer keeping richer data (href/timestamp) if present in either.
      mutual.push(mergeUser(user, followersMap.get(username)!));
    } else {
      onlyYouFollow.push(user);
    }
  }

  for (const [username, user] of followersMap) {
    if (!followingMap.has(username)) {
      onlyTheyFollow.push(user);
    }
  }

  mutual.sort(byUsernameAsc);
  onlyYouFollow.sort(byUsernameAsc);
  onlyTheyFollow.sort(byUsernameAsc);

  return { mutual, onlyYouFollow, onlyTheyFollow };
}

function mergeUser(a: NormalizedUser, b: NormalizedUser): NormalizedUser {
  const preferredDisplay =
    a.displayUsername.length >= b.displayUsername.length
      ? a.displayUsername
      : b.displayUsername;
  const maxTimestamp = Math.max(a.timestamp ?? -1, b.timestamp ?? -1);
  return {
    username: a.username,
    displayUsername: preferredDisplay,
    href: a.href ?? b.href,
    timestamp: maxTimestamp >= 0 ? maxTimestamp : undefined,
    sourceFile:
      a.sourceFile === b.sourceFile
        ? a.sourceFile
        : `${a.sourceFile},${b.sourceFile}`,
  };
}
