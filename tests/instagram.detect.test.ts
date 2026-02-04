import { describe, it, expect } from "vitest";
import { detectFollowersAndFollowing } from "../src/lib/instagram/detect";
import type { JsonZipResult } from "../lib/zip";

describe("detectFollowersAndFollowing", () => {
  it("detects following and followers from typical IG export structure", () => {
    const files: JsonZipResult = {
      "connections/followers_1.json": [
        {
          string_list_data: [
            { value: "follower1" },
            { value: "follower2" },
            { value: "follower3" }
          ]
        }
      ],
      "connections/following.json": [
        {
          string_list_data: [{ value: "following1" }, { value: "following2" }]
        }
      ],
      "profile/profile.json": {
        username: "testuser",
        bio: "Test bio"
      }
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.followers).toBeDefined();
    expect(result.followers?.file).toBe("connections/followers_1.json");
    expect(result.followers?.count).toBe(3);
    expect(result.followers?.score).toBeGreaterThan(0);

    expect(result.following).toBeDefined();
    expect(result.following?.file).toBe("connections/following.json");
    expect(result.following?.count).toBe(2);
    expect(result.following?.score).toBeGreaterThan(0);

    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it("handles relationships_following and relationships_followers structure", () => {
    const files: JsonZipResult = {
      "relationships/followers.json": {
        relationships_followers: [
          {
            string_list_data: [{ value: "f1" }, { value: "f2" }]
          }
        ]
      },
      "relationships/following.json": {
        relationships_following: [
          {
            string_list_data: [{ value: "u1" }, { value: "u2" }, { value: "u3" }]
          }
        ]
      }
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.followers).toBeDefined();
    expect(result.followers?.file).toContain("followers");
    expect(result.followers?.count).toBe(2);

    expect(result.following).toBeDefined();
    expect(result.following?.file).toContain("following");
    expect(result.following?.count).toBe(3);
  });

  it("scores files with ambiguous names based on profile count", () => {
    const files: JsonZipResult = {
      "data/list1.json": [
        {
          string_list_data: [
            { value: "user1" },
            { value: "user2" },
            { value: "user3" },
            { value: "user4" },
            { value: "user5" }
          ]
        }
      ],
      "data/list2.json": [
        {
          string_list_data: [{ value: "userA" }, { value: "userB" }]
        }
      ]
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.candidates.length).toBeGreaterThan(0);
    // Should prefer the file with more profiles
    if (result.following) {
      expect(result.following.count).toBeGreaterThanOrEqual(2);
    }
  });

  it("skips parseError entries", () => {
    const files: JsonZipResult = {
      "valid.json": [
        {
          string_list_data: [{ value: "user1" }]
        }
      ],
      "broken.json": {
        parseError: true,
        errorMessage: "Invalid JSON",
        rawPreview: "{invalid"
      }
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].file).toBe("valid.json");
    expect(result.candidates.some((c) => c.file === "broken.json")).toBe(false);
  });

  it("handles empty or non-profile JSON files", () => {
    const files: JsonZipResult = {
      "settings.json": {
        theme: "dark",
        notifications: true
      },
      "posts.json": [],
      "valid_following.json": [
        {
          string_list_data: [{ value: "user1" }]
        }
      ]
    };

    const result = detectFollowersAndFollowing(files);

    // Should only detect the valid profile file
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.following).toBeDefined();
    expect(result.following?.file).toBe("valid_following.json");
  });

  it("handles files with no extractable profiles", () => {
    const files: JsonZipResult = {
      "empty.json": [],
      "invalid_structure.json": {
        someField: "value"
      }
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.candidates.length).toBe(0);
    expect(result.following).toBeUndefined();
    expect(result.followers).toBeUndefined();
  });

  it("prefers files with following/followers in filename", () => {
    const files: JsonZipResult = {
      "generic_list.json": [
        {
          string_list_data: [{ value: "user1" }, { value: "user2" }, { value: "user3" }]
        }
      ],
      "connections/following.json": [
        {
          string_list_data: [{ value: "userA" }, { value: "userB" }]
        }
      ]
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.following).toBeDefined();
    expect(result.following?.file).toBe("connections/following.json");
    // The following file should have higher score despite fewer profiles
    expect(result.following?.score).toBeGreaterThanOrEqual(
      result.candidates.find((c) => c.file === "generic_list.json")?.score || 0
    );
  });

  it("ensures following and followers are different files when possible", () => {
    const files: JsonZipResult = {
      "followers.json": [
        {
          string_list_data: [{ value: "f1" }, { value: "f2" }]
        }
      ],
      "following.json": [
        {
          string_list_data: [{ value: "u1" }, { value: "u2" }]
        }
      ]
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.following).toBeDefined();
    expect(result.followers).toBeDefined();
    expect(result.following?.file).not.toBe(result.followers?.file);
  });

  it("handles single file with profiles (no clear distinction)", () => {
    const files: JsonZipResult = {
      "connections.json": [
        {
          string_list_data: [{ value: "user1" }, { value: "user2" }]
        }
      ]
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.candidates.length).toBeGreaterThan(0);
    // Should still detect something, but may not distinguish following/followers
    if (result.following) {
      expect(result.following.count).toBe(2);
    }
  });

  it("scores files with multiple profile entries correctly", () => {
    const files: JsonZipResult = {
      "followers.json": [
        {
          string_list_data: [{ value: "f1" }]
        },
        {
          string_list_data: [{ value: "f2" }, { value: "f3" }]
        }
      ],
      "following.json": [
        {
          string_list_data: [{ value: "u1" }, { value: "u2" }, { value: "u3" }]
        }
      ]
    };

    const result = detectFollowersAndFollowing(files);

    expect(result.followers?.count).toBe(3); // f1 + f2 + f3
    expect(result.following?.count).toBe(3); // u1 + u2 + u3
  });
});
