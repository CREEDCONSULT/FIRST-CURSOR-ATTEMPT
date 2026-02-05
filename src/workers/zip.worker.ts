import { extractJsonFilesFromZip, type JsonZipResult } from "../lib/zip";

// Define message types
type WorkerMessage = { type: "PARSE_ZIP"; payload: Uint8Array };

type WorkerResponse =
  | { type: "SUCCESS"; payload: JsonZipResult }
  | { type: "ERROR"; error: string };

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type === "PARSE_ZIP") {
    try {
      const result = extractJsonFilesFromZip(e.data.payload);
      self.postMessage({ type: "SUCCESS", payload: result } as WorkerResponse);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown worker error";
      self.postMessage({ type: "ERROR", error: msg } as WorkerResponse);
    }
  }
};
