import type { JsonZipResult } from "../zip";
import { parseStringListData } from "./parsers";
import type { ProfileRef } from "./types";

export type DetectionCandidate = {
  file: string;
  count: number;
  score: number;
  reason: string;
};

export type DetectionResult = {
  followers?: DetectionCandidate;
  following?: DetectionCandidate;
  candidates: DetectionCandidate[];
};

/**
 * Scores a filename for how likely it is to be a following/followers list.
 * Returns a score from 0-100 based on filename patterns.
 */
function scoreFilename(filename: string, type: "following" | "followers"): number {
  const lower = filename.toLowerCase();
  let score = 0;

  // Exact matches get highest score
  if (lower.includes(type)) {
    score += 50;
  }

  // Common variations
  if (type === "following") {
    if (lower.includes("following") || lower.includes("follows")) {
      score += 30;
    }
    if (lower.includes("you_follow") || lower.includes("you-follow")) {
      score += 20;
    }
  } else {
    // followers
    if (lower.includes("followers") || lower.includes("follower")) {
      score += 30;
    }
    if (lower.includes("follow_you") || lower.includes("follow-you")) {
      score += 20;
    }
  }

  // Penalize if filename suggests the opposite type
  if (type === "following" && lower.includes("follower")) {
    score -= 30;
  }
  if (
    type === "followers" &&
    (lower.includes("following") || lower.includes("follows"))
  ) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Analyzes a JSON file and extracts profile count + scoring metadata.
 */
function analyzeFile(
  filename: string,
  data: unknown
): { count: number; scoreFollowing: number; scoreFollowers: number } | null {
  // Skip parse errors
  if (
    data &&
    typeof data === "object" &&
    "parseError" in data &&
    (data as { parseError: boolean }).parseError
  ) {
    return null;
  }

  // Try to extract profiles
  const profiles = parseStringListData(data);

  if (profiles.length === 0) {
    return null;
  }

  const scoreFollowing = scoreFilename(filename, "following");
  const scoreFollowers = scoreFilename(filename, "followers");

  return {
    count: profiles.length,
    scoreFollowing,
    scoreFollowers
  };
}

/**
 * Detects the best candidates for following and followers lists from a JsonZipResult.
 * Scores files based on:
 * - Number of profiles extracted
 * - Filename hints (following/followers keywords)
 * - Structure matches
 */
export function detectFollowersAndFollowing(files: JsonZipResult): DetectionResult {
  const candidates: DetectionCandidate[] = [];

  // Analyze all files
  for (const [filename, data] of Object.entries(files)) {
    const analysis = analyzeFile(filename, data);
    if (!analysis) {
      continue;
    }

    const { count, scoreFollowing, scoreFollowers } = analysis;

    // Create candidate for following
    if (count > 0) {
      const followingScore = count + scoreFollowing;
      candidates.push({
        file: filename,
        count,
        score: followingScore,
        reason: `Extracted ${count} profiles, filename score: ${scoreFollowing}/100`
      });
    }

    // Create candidate for followers (if different score)
    if (scoreFollowers !== scoreFollowing) {
      const followersScore = count + scoreFollowers;
      candidates.push({
        file: filename,
        count,
        score: followersScore,
        reason: `Extracted ${count} profiles, filename score: ${scoreFollowers}/100`
      });
    }
  }

  // Sort by score (descending)
  candidates.sort((a, b) => b.score - a.score);

  // Find best following candidate
  let following: DetectionCandidate | undefined;
  const followingCandidates = candidates.filter((c) => {
    const lower = c.file.toLowerCase();
    return (
      lower.includes("following") ||
      lower.includes("follows") ||
      lower.includes("you_follow") ||
      lower.includes("you-follow")
    );
  });
  if (followingCandidates.length > 0) {
    following = followingCandidates[0];
  } else if (candidates.length > 0) {
    // Fallback: use highest scoring candidate if no clear following match
    following = candidates[0];
  }

  // Find best followers candidate
  let followers: DetectionCandidate | undefined;
  const followersCandidates = candidates.filter((c) => {
    const lower = c.file.toLowerCase();
    return (
      lower.includes("followers") ||
      lower.includes("follower") ||
      lower.includes("follow_you") ||
      lower.includes("follow-you")
    );
  });
  if (followersCandidates.length > 0) {
    followers = followersCandidates[0];
  } else if (candidates.length > 1) {
    // Fallback: use second highest if no clear followers match
    followers = candidates[1];
  } else if (
    candidates.length === 1 &&
    following &&
    following.file !== candidates[0].file
  ) {
    // If only one candidate and it's not the following one, use it
    followers = candidates[0];
  }

  // Ensure following and followers are different files
  if (following && followers && following.file === followers.file) {
    // If same file, try to find a different one for followers
    const alternative = candidates.find((c) => c.file !== following!.file);
    if (alternative) {
      followers = alternative;
    } else {
      // If no alternative, don't set followers
      followers = undefined;
    }
  }

  return {
    following,
    followers,
    candidates
  };
}
