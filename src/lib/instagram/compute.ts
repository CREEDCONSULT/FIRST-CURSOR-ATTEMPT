import type { ProfileRef } from "./types";

export type RelationStats = {
  followersCount: number;
  followingCount: number;
  mutualsCount: number;
  mutualsPercentage: number; // relative to smaller list (or maybe following?) -> let's do relative to "following" usually, or just provide raw.
  // The prompt asked for "counts + percentages". I'll provide % of total unique profiles involved? 
  // Standard Instagram audit stats usually show % of following that doesn't follow back.
  notFollowingBackCount: number;
  notFollowingBackPercentage: number; // % of following
  
  followersYouDontFollowCount: number;
  followersYouDontFollowPercentage: number; // % of followers
};

export type ComputeResult = {
  mutuals: ProfileRef[];
  notFollowingBack: ProfileRef[];
  followersYouDontFollow: ProfileRef[];
  stats: RelationStats;
};

/**
 * Computes the intersection and differences between followers and following lists.
 * Matches profiles by normalized username (lowercase).
 * Preserves the original profile data (href).
 * Returns sorted lists and statistics.
 */
export function computeRelationshipSets(
  followers: ProfileRef[],
  following: ProfileRef[]
): ComputeResult {
  // 1. Normalize and Index
  // We use Maps to store the *original* ProfileRef, keyed by normalized username.
  // If duplicates exist in input, the last one wins (standard map behavior).
  const followersMap = new Map<string, ProfileRef>();
  for (const p of followers) {
    if (p.username) {
      followersMap.set(p.username.toLowerCase(), p);
    }
  }

  const followingMap = new Map<string, ProfileRef>();
  for (const p of following) {
    if (p.username) {
      followingMap.set(p.username.toLowerCase(), p);
    }
  }

  // 2. Compute Sets
  const mutuals: ProfileRef[] = [];
  const notFollowingBack: ProfileRef[] = [];
  const followersYouDontFollow: ProfileRef[] = [];

  // Iterate over "following" to find mutuals and not-following-back
  for (const [normUser, ref] of followingMap.entries()) {
    if (followersMap.has(normUser)) {
      mutuals.push(ref);
    } else {
      notFollowingBack.push(ref);
    }
  }

  // Iterate over "followers" to find those you don't follow back
  for (const [normUser, ref] of followersMap.entries()) {
    if (!followingMap.has(normUser)) {
      followersYouDontFollow.push(ref);
    }
  }

  // 3. Sort (stable sort by username)
  // ProfileRef.username is the original string. We should sort by normalized username or original?
  // "stable sort: by username". Usually implies case-insensitive alphabetic sort for user lists.
  const sorter = (a: ProfileRef, b: ProfileRef) => 
    a.username.localeCompare(b.username);

  mutuals.sort(sorter);
  notFollowingBack.sort(sorter);
  followersYouDontFollow.sort(sorter);

  // 4. Calculate Stats
  const followersCount = followersMap.size;
  const followingCount = followingMap.size;
  
  // Guard against division by zero
  const notFollowingBackPercentage = followingCount > 0 
    ? (notFollowingBack.length / followingCount) * 100 
    : 0;
    
  const followersYouDontFollowPercentage = followersCount > 0
    ? (followersYouDontFollow.length / followersCount) * 100
    : 0;

    // Mutuals % can be relative to either. Often "Engagement rate" like. 
    // Let's typically view it relative to "Following" (how many of my followings match?)
    const mutualsPercentage = followingCount > 0
    ? (mutuals.length / followingCount) * 100
    : 0;

  return {
    mutuals,
    notFollowingBack,
    followersYouDontFollow,
    stats: {
      followersCount,
      followingCount,
      mutualsCount: mutuals.length,
      mutualsPercentage,
      notFollowingBackCount: notFollowingBack.length,
      notFollowingBackPercentage,
      followersYouDontFollowCount: followersYouDontFollow.length,
      followersYouDontFollowPercentage
    }
  };
}
