import type { ProfileRef } from "./types";

/**
 * Normalizes a username: trims whitespace, lowercases, and returns null if empty.
 */
function normalizeUsername(username: unknown): string | null {
  if (typeof username !== "string") {
    return null;
  }
  const trimmed = username.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extracts ProfileRef from a string_list_data entry.
 * Handles: { value: string, href?: string }
 */
function extractFromStringListEntry(entry: unknown): ProfileRef | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const obj = entry as Record<string, unknown>;
  const value = obj.value;
  const username = normalizeUsername(value);

  if (!username) {
    return null;
  }

  const href =
    typeof obj.href === "string" && obj.href.trim().length > 0
      ? obj.href.trim()
      : undefined;

  return { username, href };
}

/**
 * Parses a string_list_data array structure.
 * Handles: { string_list_data: [{ value: string, href?: string }] }
 */
function parseStringListDataInternal(data: unknown): ProfileRef[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  const obj = data as Record<string, unknown>;
  const stringListData = obj.string_list_data;

  if (!Array.isArray(stringListData)) {
    return [];
  }

  const items: ProfileRef[] = [];

  for (const entry of stringListData) {
    const profile = extractFromStringListEntry(entry);
    if (profile) {
      items.push(profile);
    }
  }

  return items;
}

/**
 * Main parser for Instagram export data.
 * Supports multiple common shapes:
 * - Array of objects with string_list_data
 * - Object with "relationships_following" or "relationships_followers" arrays
 * - Nested arrays / wrappers
 */
export function parseStringListData(x: unknown): ProfileRef[] {
  if (!x) {
    return [];
  }

  // Case 1: Direct array of objects with string_list_data
  if (Array.isArray(x)) {
    const items: ProfileRef[] = [];
    for (const item of x) {
      const parsed = parseStringListData(item);
      items.push(...parsed);
    }
    return items;
  }

  // Case 2: Object with relationships_following or relationships_followers
  if (typeof x === "object") {
    const obj = x as Record<string, unknown>;

    // Check for common Instagram export keys
    const relationshipsFollowing = obj.relationships_following;
    const relationshipsFollowers = obj.relationships_followers;

    if (Array.isArray(relationshipsFollowing)) {
      const items: ProfileRef[] = [];
      for (const item of relationshipsFollowing) {
        const parsed = parseStringListData(item);
        items.push(...parsed);
      }
      return items;
    }

    if (Array.isArray(relationshipsFollowers)) {
      const items: ProfileRef[] = [];
      for (const item of relationshipsFollowers) {
        const parsed = parseStringListData(item);
        items.push(...parsed);
      }
      return items;
    }

    // Case 3: Object with string_list_data directly
    if (obj.string_list_data) {
      return parseStringListDataInternal(obj);
    }

    // Case 4: Recursively search for arrays that might contain profile data
    const searchNested = (val: unknown): ProfileRef[] => {
      if (Array.isArray(val)) {
        const items: ProfileRef[] = [];
        for (const item of val) {
          const parsed = parseStringListData(item);
          if (parsed.length > 0) {
            items.push(...parsed);
          }
        }
        return items;
      }
      if (val && typeof val === "object") {
        const nestedObj = val as Record<string, unknown>;
        for (const nestedValue of Object.values(nestedObj)) {
          const found = searchNested(nestedValue);
          if (found.length > 0) {
            return found;
          }
        }
      }
      return [];
    };

    for (const value of Object.values(obj)) {
      const found = searchNested(value);
      if (found.length > 0) {
        return found;
      }
    }
  }

  return [];
}
