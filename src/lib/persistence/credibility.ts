export type CategoryTag = "creator" | "celebrity" | "business" | "personal" | "unknown";
export type ActivityTag = "high" | "medium" | "low" | "unknown";

export type CredibilityData = {
    category: CategoryTag;
    activity: ActivityTag;
    timestamp: number;
};

const STORAGE_KEY = "ig_audit_credibility";

// Helper to safely access localStorage (client-side only)
function getStorage(): Record<string, CredibilityData> {
    if (typeof window === "undefined") return {};
    try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        return item ? JSON.parse(item) : {};
    } catch (e) {
        console.error("Failed to parse credibility data", e);
        return {};
    }
}

function setStorage(data: Record<string, CredibilityData>) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save credibility data", e);
    }
}

export function getCredibility(username: string): CredibilityData {
    const all = getStorage();
    const lower = username.toLowerCase();
    return (
        all[lower] || {
            category: "unknown",
            activity: "unknown",
            timestamp: 0,
        }
    );
}

export function setCredibility(
    username: string,
    updates: Partial<CredibilityData>
) {
    const all = getStorage();
    const lower = username.toLowerCase();
    const current = all[lower] || {
        category: "unknown",
        activity: "unknown",
        timestamp: 0,
    };

    all[lower] = {
        ...current,
        ...updates,
        timestamp: Date.now(),
    };

    setStorage(all);
}

export function getAllCredibility(): Record<string, CredibilityData> {
    return getStorage();
}

/**
 * Heuristic score for sorting. 
 * Lower score = "Safe to unfollow" (Low credibility/activity).
 * Higher score = "Keep following" (High credibility/activity).
 */
export function getCredibilityScore(data: CredibilityData): number {
    let score = 0;

    // Category weights
    switch (data.category) {
        case "celebrity": score += 10; break;
        case "creator": score += 8; break;
        case "personal": score += 5; break;
        case "business": score += 3; break;
        case "unknown": score += 0; break;
    }

    // Activity weights
    switch (data.activity) {
        case "high": score += 5; break;
        case "medium": score += 3; break;
        case "low": score -= 2; break; // Penalize low activity
        case "unknown": score += 0; break;
    }

    return score;
}
