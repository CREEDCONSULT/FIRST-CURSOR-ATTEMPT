import { describe, it, expect } from "vitest";
import { parseStringListData } from "../src/lib/instagram/parsers";
import type { ProfileRef } from "../src/lib/instagram/types";

describe("parseStringListData", () => {
  it("parses array of objects with string_list_data (common IG export shape)", () => {
    const input = [
      {
        string_list_data: [
          { value: "user1", href: "https://instagram.com/user1" },
          { value: "user2" }
        ]
      },
      {
        string_list_data: [{ value: "user3", href: "https://instagram.com/user3" }]
      }
    ];

    const result = parseStringListData(input);

    expect(result).toEqual([
      { username: "user1", href: "https://instagram.com/user1" },
      { username: "user2" },
      { username: "user3", href: "https://instagram.com/user3" }
    ]);
  });

  it("parses object with relationships_following array", () => {
    const input = {
      relationships_following: [
        {
          string_list_data: [
            { value: "alice", href: "https://instagram.com/alice" },
            { value: "bob" }
          ]
        },
        {
          string_list_data: [{ value: "charlie" }]
        }
      ]
    };

    const result = parseStringListData(input);

    expect(result).toEqual([
      { username: "alice", href: "https://instagram.com/alice" },
      { username: "bob" },
      { username: "charlie" }
    ]);
  });

  it("parses object with relationships_followers array", () => {
    const input = {
      relationships_followers: [
        {
          string_list_data: [{ value: "follower1" }, { value: "follower2" }]
        }
      ]
    };

    const result = parseStringListData(input);

    expect(result).toEqual([{ username: "follower1" }, { username: "follower2" }]);
  });

  it("normalizes usernames: trims whitespace and lowercases", () => {
    const input = [
      {
        string_list_data: [
          { value: "  USERNAME  " },
          { value: "MixedCase" },
          { value: "  " }, // empty after trim
          { value: "" } // empty
        ]
      }
    ];

    const result = parseStringListData(input);

    expect(result).toEqual([{ username: "username" }, { username: "mixedcase" }]);
  });

  it("handles empty or invalid input gracefully", () => {
    expect(parseStringListData(null)).toEqual([]);
    expect(parseStringListData(undefined)).toEqual([]);
    expect(parseStringListData([])).toEqual([]);
    expect(parseStringListData({})).toEqual([]);
    expect(parseStringListData("not an object")).toEqual([]);
    expect(parseStringListData(123)).toEqual([]);
  });

  it("handles missing string_list_data gracefully", () => {
    const input = [
      { someOtherField: "value" },
      { string_list_data: [{ value: "valid" }] }
    ];

    const result = parseStringListData(input);

    expect(result).toEqual([{ username: "valid" }]);
  });

  it("handles nested wrapper objects", () => {
    const input = {
      data: {
        entries: [
          {
            string_list_data: [
              { value: "nested1" },
              { value: "nested2", href: "https://instagram.com/nested2" }
            ]
          }
        ]
      }
    };

    // This should find the nested array and parse it
    const result = parseStringListData(input);

    expect(result.length).toBeGreaterThan(0);
    expect(result).toContainEqual({ username: "nested1" });
    expect(result).toContainEqual({
      username: "nested2",
      href: "https://instagram.com/nested2"
    });
  });

  it("preserves href when provided", () => {
    const input = [
      {
        string_list_data: [
          { value: "withhref", href: "https://instagram.com/withhref" },
          { value: "nohref" },
          { value: "emptyhref", href: "" },
          { value: "whitespacehref", href: "   " }
        ]
      }
    ];

    const result = parseStringListData(input);

    expect(result).toEqual([
      { username: "withhref", href: "https://instagram.com/withhref" },
      { username: "nohref" },
      { username: "emptyhref" },
      { username: "whitespacehref" }
    ]);
  });
});
