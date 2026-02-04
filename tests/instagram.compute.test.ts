import { describe, it, expect } from "vitest";
import { computeRelationshipSets } from "../src/lib/instagram/compute";
import type { ProfileRef } from "../src/lib/instagram/types";

describe("computeRelationshipSets", () => {
    it("should handle empty inputs", () => {
        const result = computeRelationshipSets([], []);
        expect(result.mutuals).toEqual([]);
        expect(result.notFollowingBack).toEqual([]);
        expect(result.followersYouDontFollow).toEqual([]);
        expect(result.stats).toEqual({
            followersCount: 0,
            followingCount: 0,
            mutualsCount: 0,
            mutualsPercentage: 0,
            notFollowingBackCount: 0,
            notFollowingBackPercentage: 0,
            followersYouDontFollowCount: 0,
            followersYouDontFollowPercentage: 0
        });
    });

    it("should identify mutuals", () => {
        const followers: ProfileRef[] = [{ username: "alice" }, { username: "bob" }];
        const following: ProfileRef[] = [{ username: "bob" }, { username: "alice" }];

        const result = computeRelationshipSets(followers, following);

        expect(result.mutuals).toHaveLength(2);
        expect(result.mutuals.map(p => p.username)).toEqual(["alice", "bob"]); // Sorted
        expect(result.notFollowingBack).toEqual([]);
        expect(result.followersYouDontFollow).toEqual([]);
        expect(result.stats.mutualsCount).toBe(2);
        expect(result.stats.mutualsPercentage).toBe(100);
    });

    it("should identify non-mutual relationships", () => {
        // Followers: alice (mutual), charlie (fan)
        // Following: alice (mutual), dave (idol)
        const followers: ProfileRef[] = [{ username: "alice" }, { username: "charlie" }];
        const following: ProfileRef[] = [{ username: "alice" }, { username: "dave" }];

        const result = computeRelationshipSets(followers, following);

        // Mutuals
        expect(result.mutuals).toHaveLength(1);
        expect(result.mutuals[0].username).toBe("alice");

        // Not following back (I follow dave, dave doesn't follow me)
        // = presented in 'following' list but not in 'followers'
        expect(result.notFollowingBack).toHaveLength(1);
        expect(result.notFollowingBack[0].username).toBe("dave");

        // Followers I don't follow (charlie follows me, I don't follow charlie)
        expect(result.followersYouDontFollow).toHaveLength(1);
        expect(result.followersYouDontFollow[0].username).toBe("charlie");

        // Stats
        expect(result.stats.followersCount).toBe(2);
        expect(result.stats.followingCount).toBe(2);
        expect(result.stats.mutualsPercentage).toBe(50); // 1/2
        expect(result.stats.notFollowingBackPercentage).toBe(50); // 1/2
    });

    it("should be case-insensitive but preserve original", () => {
        const followers: ProfileRef[] = [{ username: "Alice" }]; // Title case
        const following: ProfileRef[] = [{ username: "alice" }]; // Lower case

        const result = computeRelationshipSets(followers, following);

        expect(result.mutuals).toHaveLength(1);
        // Should preserve the one from the list we are iterating or looking up? 
        // Implementation: we iterate 'following' to find mutuals. 
        // If we push 'ref' from 'followingMap', it preserves 'following' version.
        // Let's check implementation behavior: 
        // "for (const [normUser, ref] of followingMap.entries())" -> we push 'ref' (from following).
        expect(result.mutuals[0].username).toBe("alice");
    });

    it("should sort results alphabetically", () => {
        const followers: ProfileRef[] = [{ username: "Zoe" }, { username: "Adam" }];
        const following: ProfileRef[] = [{ username: "Zoe" }, { username: "Adam" }];

        const result = computeRelationshipSets(followers, following);

        expect(result.mutuals.map(p => p.username)).toEqual(["Adam", "Zoe"]);
    });

    it("should handle links/hrefs correctly", () => {
        const followers: ProfileRef[] = [{ username: "alice", href: "https://instragram.com/alice" }];
        const following: ProfileRef[] = [{ username: "alice", href: "https://instragram.com/alice" }];

        const result = computeRelationshipSets(followers, following);
        expect(result.mutuals[0].href).toBe("https://instragram.com/alice");
    });
});
