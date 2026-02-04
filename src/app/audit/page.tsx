"use client";

import React, { useMemo, useState, useEffect } from "react";
import UploadZip from "../../components/UploadZip";
import { type JsonZipResult } from "../../../lib/zip";
import { detectFollowersAndFollowing, type DetectionResult } from "../../lib/instagram/detect";
import { parseStringListData } from "../../lib/instagram/parsers";
import { computeRelationshipSets, type ComputeResult } from "../../lib/instagram/compute";
import {
    getCredibility,
    setCredibility,
    getCredibilityScore,
    type CredibilityData,
    type CategoryTag,
    type ActivityTag
} from "../../lib/persistence/credibility";
import type { ProfileRef } from "../../lib/instagram/types";

// Helper components for UI
function Card({ title, count, subtitle }: { title: string; count: number; subtitle: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/50">{title}</div>
            <div className="mt-1 text-2xl font-bold">{count.toLocaleString()}</div>
            <div className="text-xs text-white/40">{subtitle}</div>
        </div>
    );
}

// Credibility Badge/Editor
function CredibilityCell({
    username,
    data,
    onUpdate
}: {
    username: string;
    data: CredibilityData;
    onUpdate: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const score = getCredibilityScore(data);

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 rounded bg-black/40 p-2">
                <select
                    className="rounded bg-white/10 px-2 py-1 text-xs"
                    value={data.category}
                    onChange={(e) => {
                        setCredibility(username, { category: e.target.value as CategoryTag });
                        onUpdate();
                    }}
                >
                    <option value="unknown">Unknown Category</option>
                    <option value="creator">Creator</option>
                    <option value="celebrity">Celebrity</option>
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                </select>
                <select
                    className="rounded bg-white/10 px-2 py-1 text-xs"
                    value={data.activity}
                    onChange={(e) => {
                        setCredibility(username, { activity: e.target.value as ActivityTag });
                        onUpdate();
                    }}
                >
                    <option value="unknown">Unknown Activity</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                >
                    Done
                </button>
            </div>
        );
    }

    // Display Mode
    let color = "bg-gray-500/20 text-gray-300";
    if (score > 5) color = "bg-green-500/20 text-green-300";
    else if (score < 0) color = "bg-red-500/20 text-red-300";

    return (
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>
                {data.category} / {data.activity} (Score: {score})
            </span>
            <span className="text-[10px] text-white/30">Edit</span>
        </div>
    );
}


// Helper for Checklist Export
function generateChecklist(users: ProfileRef[]) {
    let content = `# Unfollow Checklist\n\n`;
    content += `WARNING: This is a manual tool. We do not automate actions. Do not use scripts. Respect Instagram's daily limits.\n\n`;
    content += `Selected Accounts: ${users.length}\n\n`;

    users.forEach((u, i) => {
        content += `[ ] ${i + 1}. Search for "${u.username}"\n`;
        if (u.href) content += `     Profile: ${u.href}\n`;
        content += `     Action: Review and Unfollow if desired.\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unfollow_checklist_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function UnfollowModal({
    isOpen,
    onClose,
    selectedUsers,
    onClearSelection
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedUsers: ProfileRef[];
    onClearSelection: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#0a0a0a] p-6 shadow-2xl">
                <h3 className="mb-2 text-xl font-bold text-white">
                    Generate Unfollow Plan
                </h3>

                <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    <strong>CRITICAL WARNING:</strong> We do NOT log in to Instagram. We
                    do NOT automate unfollowing. You must perform these actions manually
                    inside the Instagram app. Using automation tools can get your account
                    banned.
                </div>

                <p className="mb-4 text-sm text-white/70">
                    You have selected <strong>{selectedUsers.length}</strong> accounts.
                    Choose how you want to export this list:
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => generateChecklist(selectedUsers)}
                        className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-semibold text-black hover:bg-gray-200"
                    >
                        Download Manual Checklist (.txt)
                        <span className="text-xs font-normal opacity-60">
                            (Recommended)
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            // Reuse existing CSV logic but for selection
                            let csv = "Username,Link\n";
                            selectedUsers.forEach(p => {
                                csv += `${p.username},${p.href || ""}\n`;
                            });
                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `selected_users_${Date.now()}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="rounded-lg border border-white/20 px-4 py-3 text-sm font-medium hover:bg-white/5"
                    >
                        Download CSS Only
                    </button>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded px-4 py-2 text-sm text-white/50 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onClearSelection();
                            onClose();
                        }}
                        className="rounded px-4 py-2 text-sm text-blue-400 hover:underline"
                    >
                        Done & Clear Selection
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AuditPage() {
    const [zipResult, setZipResult] = useState<JsonZipResult | null>(null);
    const [detection, setDetection] = useState<DetectionResult | null>(null);

    // Selected filenames
    const [followersFile, setFollowersFile] = useState<string | null>(null);
    const [followingFile, setFollowingFile] = useState<string | null>(null);

    // Computation Results
    const [computeResult, setComputeResult] = useState<ComputeResult | null>(null);

    // Credibility State (Trigger re-render on updates)
    const [credibilityTick, setCredibilityTick] = useState(0);

    // UI State
    const [filterText, setFilterText] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<CategoryTag | "all">("all");
    const [sortOrder, setSortOrder] = useState<"score_asc" | "score_desc" | "alpha">("score_asc");

    // Selection State
    const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const itemsPerPage = 50;

    // 1. Initial Detection on Upload
    const handleUploadComplete = (result: JsonZipResult) => {
        setZipResult(result);
        const det = detectFollowersAndFollowing(result);
        setDetection(det);

        if (det.followers) setFollowersFile(det.followers.file);
        if (det.following) setFollowingFile(det.following.file);
    };

    // 2. Compute when files are selected
    useEffect(() => {
        if (!zipResult || !followersFile || !followingFile) {
            setComputeResult(null);
            return;
        }

        try {
            const followersData = parseStringListData(zipResult[followersFile]);
            const followingData = parseStringListData(zipResult[followingFile]);
            const result = computeRelationshipSets(followersData, followingData);
            setComputeResult(result);
            setSelectedUsernames(new Set()); // Reset selection on recompute
            setPage(1); // Reset pagination

            // Telemetry
            import("../../lib/telemetry").then(({ telemetry }) => {
                telemetry.update({
                    followersCount: result.stats.followersCount,
                    followingCount: result.stats.followingCount
                });
            });

        } catch (e) {
            console.error("Computation failed", e);
        }
    }, [zipResult, followersFile, followingFile]);

    // 3. Derived List: Not Following Back with Filtering & Sorting
    const visibleNotFollowingBack = useMemo(() => {
        if (!computeResult) return [];

        let list = computeResult.notFollowingBack;

        // Filter by Text
        if (filterText) {
            const lower = filterText.toLowerCase();
            list = list.filter((p) => p.username.toLowerCase().includes(lower));
        }

        // Filter by Credibility Category
        if (categoryFilter !== "all") {
            list = list.filter((p) => getCredibility(p.username).category === categoryFilter);
        }

        // Sort
        return [...list].sort((a, b) => {
            const credA = getCredibility(a.username);
            const credB = getCredibility(b.username);
            const scoreA = getCredibilityScore(credA);
            const scoreB = getCredibilityScore(credB);

            if (sortOrder === "score_asc") return scoreA - scoreB; // Lowest first
            if (sortOrder === "score_desc") return scoreB - scoreA; // Highest first
            return a.username.localeCompare(b.username);
        });
    }, [computeResult, filterText, categoryFilter, sortOrder, credibilityTick]);

    // Pagination Slice
    const paginatedList = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return visibleNotFollowingBack.slice(start, start + itemsPerPage);
    }, [visibleNotFollowingBack, page]);

    const totalPages = Math.ceil(visibleNotFollowingBack.length / itemsPerPage);


    // Selection Helpers
    const toggleSelection = (username: string) => {
        const next = new Set(selectedUsernames);
        if (next.has(username)) next.delete(username);
        else next.add(username);
        setSelectedUsernames(next);
    };

    const toggleSelectAll = () => {
        // Select/Deselect ALL visible (not just current page) for UX consistency? 
        // Or just current page? Usually "Safe" action is current page, but bulk action implies all.
        // Let's do ALL visible to make "Unfollow Plan" useful.

        const allVisibleSelected = visibleNotFollowingBack.every(p => selectedUsernames.has(p.username));

        const next = new Set(selectedUsernames);
        if (allVisibleSelected) {
            visibleNotFollowingBack.forEach(p => next.delete(p.username));
        } else {
            visibleNotFollowingBack.forEach(p => next.add(p.username));
        }
        setSelectedUsernames(next);
    };

    // CSV Export (Full Filtered List)
    const downloadCsv = () => {
        if (!visibleNotFollowingBack.length) return;

        // Header
        let csv = "Username,Link,Category,Activity,Score\n";

        visibleNotFollowingBack.forEach(p => {
            const cred = getCredibility(p.username);
            csv += `${p.username},${p.href || ""},${cred.category},${cred.activity},${getCredibilityScore(cred)}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `not_following_back_audit_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const selectedUsersList = useMemo(() => {
        // Return full ProfileRef objects for selected usernames
        // We look up from computeResult.notFollowingBack to get original refs (hrefs etc)
        if (!computeResult) return [];
        const map = new Map(computeResult.notFollowingBack.map(p => [p.username, p]));
        const list: ProfileRef[] = [];
        selectedUsernames.forEach(u => {
            const p = map.get(u);
            if (p) list.push(p);
        });
        return list;
    }, [computeResult, selectedUsernames]);

    return (
        <main className="min-h-screen bg-black text-white p-6 pb-32">
            <UnfollowModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedUsers={selectedUsersList}
                onClearSelection={() => setSelectedUsernames(new Set())}
            />

            <div className="mx-auto max-w-6xl space-y-8">
                <header>
                    <h1 className="text-3xl font-bold">Audit Dashboard</h1>
                    <p className="text-white/60">Upload, analyze, and tag your Instagram connections.</p>
                </header>

                {/* Upload Section */}
                {!zipResult && (
                    <UploadZip onUploadComplete={handleUploadComplete} />
                )}

                {/* Configuration / File Selection */}
                {zipResult && detection && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-wrap gap-x-8 gap-y-4 items-end">
                        <div className="w-full text-sm text-white/70 mb-2">
                            <p>
                                We tried to auto-detect your files. If the score is low ({"<"}50) or the results look wrong (0 mutuals),
                                please manually select the correct JSON files from the list.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/50">Followers File</label>
                            <div className="relative">
                                <select
                                    className="block w-80 rounded bg-black/40 border border-white/10 px-3 py-2 text-sm appearance-none"
                                    value={followersFile || ""}
                                    onChange={e => setFollowersFile(e.target.value)}
                                >
                                    <option value="">Select file...</option>
                                    {detection.candidates.map(c => (
                                        <option key={c.file} value={c.file}>
                                            {c.file} {c.score >= 50 ? `(Recommended - Score: ${c.score})` : `(Score: ${c.score})`}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">▼</div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-white/50">Following File</label>
                            <div className="relative">
                                <select
                                    className="block w-80 rounded bg-black/40 border border-white/10 px-3 py-2 text-sm appearance-none"
                                    value={followingFile || ""}
                                    onChange={e => setFollowingFile(e.target.value)}
                                >
                                    <option value="">Select file...</option>
                                    {detection.candidates.map(c => (
                                        <option key={c.file} value={c.file}>
                                            {c.file} {c.score >= 50 ? `(Recommended - Score: ${c.score})` : `(Score: ${c.score})`}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">▼</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Computation Results */}
                {computeResult && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card title="Followers" count={computeResult.stats.followersCount} subtitle="Total detected" />
                            <Card title="Following" count={computeResult.stats.followingCount} subtitle="Total detected" />
                            <Card title="Mutuals" count={computeResult.stats.mutualsCount} subtitle={`${computeResult.stats.mutualsPercentage.toFixed(1)}% of following`} />
                            <Card title="Not Following Back" count={computeResult.stats.notFollowingBackCount} subtitle={`${computeResult.stats.notFollowingBackPercentage.toFixed(1)}% of following`} />
                        </div>

                        {/* Primary Table Section */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <h2 className="text-xl font-semibold">Not Following Back <span className="text-white/40 text-base">({visibleNotFollowingBack.length})</span></h2>
                                <div className="flex gap-2">
                                    <button onClick={downloadCsv} className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90">
                                        Download CSV (All)
                                    </button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <input
                                    type="text"
                                    placeholder="Search username..."
                                    className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm w-48"
                                    value={filterText}
                                    onChange={e => setFilterText(e.target.value)}
                                />
                                <select
                                    className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value as any)}
                                >
                                    <option value="all">All Categories</option>
                                    <option value="creator">Creator</option>
                                    <option value="celebrity">Celebrity</option>
                                    <option value="business">Business</option>
                                    <option value="personal">Personal</option>
                                    <option value="unknown">Unknown</option>
                                </select>
                                <select
                                    className="bg-black/40 border border-white/10 rounded px-3 py-2 text-sm"
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value as any)}
                                >
                                    <option value="score_asc">Lowest Credibility First</option>
                                    <option value="score_desc">Highest Credibility First</option>
                                    <option value="alpha">Username (A-Z)</option>
                                </select>
                            </div>

                            {/* Floating Selection Bar */}
                            {selectedUsernames.size > 0 && (
                                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#1a1a1a] px-6 py-3 shadow-2xl flex items-center gap-4 z-40">
                                    <div className="text-sm font-medium">
                                        {selectedUsernames.size} selected
                                    </div>
                                    <div className="h-4 w-px bg-white/20"></div>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="text-sm font-bold text-blue-400 hover:text-blue-300"
                                    >
                                        Generate Unfollow Plan
                                    </button>
                                    <button
                                        onClick={() => setSelectedUsernames(new Set())}
                                        className="text-white/40 hover:text-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            )}

                            {/* Table */}
                            <div className="rounded-xl border border-white/10 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-white/50 font-medium">
                                        <tr>
                                            <th className="w-10 px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-white/20 bg-transparent text-blue-500 focus:ring-0"
                                                    checked={visibleNotFollowingBack.length > 0 && visibleNotFollowingBack.every(p => selectedUsernames.has(p.username))}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-4 py-3">Username</th>
                                            <th className="px-4 py-3">Credibility / Tags</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedList.map(p => {
                                            const isSelected = selectedUsernames.has(p.username);
                                            return (
                                                <tr key={p.username} className={`hover:bg-white/5 ${isSelected ? "bg-white/[0.03]" : ""}`}>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-white/20 bg-transparent text-blue-500 focus:ring-0"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelection(p.username)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">{p.username}</td>
                                                    <td className="px-4 py-3">
                                                        <CredibilityCell
                                                            username={p.username}
                                                            data={getCredibility(p.username)}
                                                            onUpdate={() => setCredibilityTick(t => t + 1)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {p.href && (
                                                            <a
                                                                href={p.href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:underline"
                                                            >
                                                                View Profile
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-3">
                                        <button
                                            className="rounded px-3 py-1 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </button>
                                        <span className="text-xs text-white/60">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            className="rounded px-3 py-1 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}

                                {visibleNotFollowingBack.length === 0 && (
                                    <div className="p-8 text-center text-white/40">
                                        No users found matching filters.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Privacy & Reset Footer */}
                <div className="mt-20 border-t border-white/10 pt-12 text-center text-sm text-white/50 space-y-4">
                    <h3 className="text-white/80 font-semibold mb-2">Privacy & Data Security</h3>
                    <ul className="flex flex-col md:flex-row justify-center gap-6 md:gap-12">
                        <li>
                            🔒 <b>100% Client-Side</b>
                            <span className="block text-xs mt-1 opacity-70">
                                Files never leave your browser. No server processing.
                            </span>
                        </li>
                        <li>
                            🛡️ <b>No Login Required</b>
                            <span className="block text-xs mt-1 opacity-70">
                                We don't ask for your password or use API access.
                            </span>
                        </li>
                        <li>
                            💾 <b>Local Storage Only</b>
                            <span className="block text-xs mt-1 opacity-70">
                                Tags/Scores are saved in your browser's local storage.
                            </span>
                        </li>
                    </ul>

                    <div className="pt-8">
                        <button
                            onClick={() => {
                                if (confirm("Are you sure? This will clear all local tags, scores, and reset the current session.")) {
                                    localStorage.removeItem("ig_audit_credibility");
                                    window.location.reload();
                                }
                            }}
                            className="text-red-400 hover:text-red-300 text-xs underline decoration-dotted"
                        >
                            Reset All Data & Clear Storage
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
