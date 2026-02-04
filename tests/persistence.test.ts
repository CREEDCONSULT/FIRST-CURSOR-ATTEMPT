import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    getCredibility,
    setCredibility,
    getAllCredibility,
    getCredibilityScore,
    type CredibilityData
} from "../src/lib/persistence/credibility";

describe("Credibility Persistence", () => {
    beforeEach(() => {
        // Clear localStorage before each test
        window.localStorage.clear();
    });

    it("should return default data for unknown user", () => {
        const data = getCredibility("non_existent_user");
        expect(data).toEqual({
            category: "unknown",
            activity: "unknown",
            timestamp: 0,
        });
    });

    it("should save and retrieve data", () => {
        const user = "test_user";
        setCredibility(user, { category: "creator", activity: "high" });

        const retrieved = getCredibility(user);
        expect(retrieved.category).toBe("creator");
        expect(retrieved.activity).toBe("high");
        expect(retrieved.timestamp).toBeGreaterThan(0);
    });

    it("should normalize usernames to lowercase", () => {
        setCredibility("UserOne", { category: "business" });
        const retrieved = getCredibility("userone");
        expect(retrieved.category).toBe("business");
    });

    it("should persist data across calls", () => {
        setCredibility("user1", { category: "personal" });

        // Simulate reading fresh from storage
        const all = getAllCredibility();
        expect(all["user1"].category).toBe("personal");
    });

    it("should calculate scores correctly", () => {
        const highVal: CredibilityData = { category: "celebrity", activity: "high", timestamp: 0 };
        const lowVal: CredibilityData = { category: "unknown", activity: "low", timestamp: 0 };

        expect(getCredibilityScore(highVal)).toBeGreaterThan(getCredibilityScore(lowVal));

        // Check penalty
        expect(getCredibilityScore(lowVal)).toBe(-2); // 0 + (-2)
    });
});
