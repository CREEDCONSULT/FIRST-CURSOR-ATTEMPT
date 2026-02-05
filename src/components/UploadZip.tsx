"use client";

import React, { useMemo, useRef, useState } from "react";
import { extractJsonFilesFromZip } from "../lib/zip";
import type { JsonZipResult, JsonParseError } from "../lib/zip";

type UploadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: JsonZipResult }
  | { status: "error"; message: string };

function isParseError(v: unknown): v is JsonParseError {
  return typeof v === "object" && v !== null && (v as any).parseError === true;
}

interface UploadZipProps {
  onUploadComplete?: (result: JsonZipResult) => void;
}

export default function UploadZip({ onUploadComplete }: UploadZipProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const jsonFilenames = useMemo(() => {
    if (state.status !== "done") return [];
    return Object.keys(state.result).sort((a, b) => a.localeCompare(b));
  }, [state]);

  const parseErrorFiles = useMemo(() => {
    if (state.status !== "done") return [];
    return jsonFilenames.filter((name) => isParseError(state.result[name]));
  }, [state, jsonFilenames]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const MAX_ZIP_MB = 500; // Increased limit
    const maxBytes = MAX_ZIP_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setState({
        status: "error",
        message: `ZIP too large (${(file.size / (1024 * 1024)).toFixed(
          1
        )}MB). Max allowed is ${MAX_ZIP_MB}MB.`
      });
      return;
    }

    const looksLikeZip =
      file.name.toLowerCase().endsWith(".zip") ||
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed";

    if (!looksLikeZip) {
      setState({
        status: "error",
        message: "Please select a .zip file (Instagram export)."
      });
      return;
    }

    setState({ status: "loading" });
    const startTime = performance.now();

    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);

      // Use Worker for files > 10MB to avoid freezing UI
      if (file.size > 10 * 1024 * 1024) {
        if (!workerRef.current) {
          workerRef.current = new Worker(
            new URL("../workers/zip.worker.ts", import.meta.url)
          );
        }

        workerRef.current.onmessage = (ev) => {
          const { type, payload, error } = ev.data;
          if (type === "SUCCESS") {
            const endTime = performance.now();
            const duration = endTime - startTime;

            // Telemetry
            import("../lib/telemetry").then(({ telemetry }) => {
              telemetry.update({
                zipParseTimeMs: duration,
                jsonFileCount: Object.keys(payload).length
              });
            });

            setState({ status: "done", result: payload });
            if (onUploadComplete) onUploadComplete(payload);
          } else {
            setState({ status: "error", message: error || "Worker Error" });
          }
        };

        workerRef.current.onerror = (err) => {
          console.error("Worker failed", err);
          setState({
            status: "error",
            message: "Background parser failed. Try a smaller file."
          });
        };

        workerRef.current.postMessage({ type: "PARSE_ZIP", payload: bytes });
      } else {
        // Main thread for small files
        const result = extractJsonFilesFromZip(bytes);
        const endTime = performance.now();

        import("../lib/telemetry").then(({ telemetry }) => {
          telemetry.update({
            zipParseTimeMs: endTime - startTime,
            jsonFileCount: Object.keys(result).length
          });
        });

        setState({ status: "done", result });
        if (onUploadComplete) onUploadComplete(result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to read ZIP";
      setState({ status: "error", message: msg });
    }
  }

  return (
    <div className="mt-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Upload Instagram Export ZIP</h2>
          <p className="mt-1 text-sm text-white/70">
            This runs entirely in your browser. No login. No uploads to a server.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          onClick={() => inputRef.current?.click()}
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? "Parsing…" : "Choose ZIP"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          className="hidden"
          onChange={onPickFile}
        />
      </div>

      {state.status === "idle" && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          Tip: Request your Instagram data export as <b>JSON</b>, download the ZIP, then
          upload it here to preview discovered JSON files.
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {state.message}
        </div>
      )}

      {state.status === "loading" && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          Parsing ZIP… (this can take a moment for large exports)
        </div>
      )}

      {state.status === "done" && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">
              JSON files found: <b>{jsonFilenames.length}</b>
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              Parse errors: <b>{parseErrorFiles.length}</b>
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            {jsonFilenames.length === 0 ? (
              <div className="text-sm text-white/70 space-y-3">
                <p className="font-semibold text-white/90">No JSON files found!</p>
                <p>
                  This usually means you downloaded the default &quot;HTML&quot; export
                  from Instagram. This tool requires the <b>JSON</b>
                  format.
                </p>
                <div className="rounded bg-white/5 p-3">
                  <p className="font-semibold text-xs uppercase tracking-wider text-white/50 mb-2">
                    How to get JSON export:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-1 opacity-90">
                    <li>
                      Go to <b>Your Activity</b> {">"} <b>Download Your Information</b>
                    </li>
                    <li>Start a new download request</li>
                    <li>
                      Select <b>&quot;Followers and Following&quot;</b> (or everything)
                    </li>
                    <li>
                      CRITICAL: Changed Format from HTML to <b>JSON</b>
                    </li>
                    <li>Download the ZIP once ready and upload here.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <ul className="max-h-72 overflow-auto text-sm">
                {jsonFilenames.map((name) => {
                  const val = state.result[name];
                  const err = isParseError(val) ? val : null;

                  // Make error preview user-expandable (using simple details/summary for now to save state complexity)
                  return (
                    <li
                      key={name}
                      className="flex flex-col gap-1 border-b border-white/5 py-2 last:border-b-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-white/90">{name}</span>
                        {err ? (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-200">
                            parse error
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">
                            ok
                          </span>
                        )}
                      </div>

                      {err && (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-red-300 opacity-80 hover:opacity-100 select-none">
                            Show error details ▼
                          </summary>
                          <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                            <div className="font-semibold">Error:</div>
                            <div className="mt-1 mb-2">{err.errorMessage}</div>
                            <div className="font-semibold">
                              Preview (First 200 chars):
                            </div>
                            <pre className="mt-1 whitespace-pre-wrap break-words text-red-100/90 font-mono bg-black/30 p-2 rounded">
                              {err.rawPreview.slice(0, 500)}
                              {err.rawPreview.length > 500 && "..."}
                            </pre>
                          </div>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
