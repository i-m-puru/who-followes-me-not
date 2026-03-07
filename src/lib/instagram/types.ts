export type NormalizedUser = {
  username: string;
  displayUsername: string;
  href?: string;
  timestamp?: number;
  sourceFile: string;
};

export type ParseWarning = {
  file: string;
  message: string;
};

export type InstagramConnections = {
  following: NormalizedUser[];
  followers: NormalizedUser[];

  blocked: NormalizedUser[];
  pendingFollowRequests: NormalizedUser[];
  recentFollowRequests: NormalizedUser[];
  recentlyUnfollowed: NormalizedUser[];
  removedSuggestions: NormalizedUser[];

  warnings: ParseWarning[];
  matchedFiles: {
    following?: string;
    followerParts: string[];
    blocked?: string;
    pendingFollowRequests?: string;
    recentFollowRequests?: string;
    recentlyUnfollowed?: string;
    removedSuggestions?: string;
  };
};
