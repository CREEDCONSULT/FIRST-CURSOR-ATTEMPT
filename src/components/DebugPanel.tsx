"use client";

import React, { useEffect, useState } from "react";
import { telemetry, type TelemetryParams } from "../lib/telemetry";

export default function DebugPanel() {
  const [stats, setStats] = useState<TelemetryParams>(telemetry.getDetails());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = telemetry.subscribe(() => {
      setStats(telemetry.getDetails());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-white/10 px-3 py-1 text-xs font-mono backdrop-blur hover:bg-white/20 text-white/50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg border border-white/10 bg-black/90 p-4 font-mono text-xs text-green-400 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
        <span className="font-bold">Telemetry (Local)</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/50 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-white/60">ZIP Parse Time:</span>
          <span>
            {stats.zipParseTimeMs ? `${stats.zipParseTimeMs.toFixed(1)}ms` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">JSON Files:</span>
          <span>{stats.jsonFileCount ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Followers:</span>
          <span>{stats.followersCount?.toLocaleString() ?? "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Following:</span>
          <span>{stats.followingCount?.toLocaleString() ?? "-"}</span>
        </div>
      </div>
      <div className="mt-4 text-[10px] text-white/30 text-center">
        No network requests. Stats ephemeral.
      </div>
    </div>
  );
}
