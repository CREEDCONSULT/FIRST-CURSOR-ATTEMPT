import { unzipSync, strFromU8, type Unzipped } from "fflate";

export type JsonParseError = {
  parseError: true;
  errorMessage: string;
  rawPreview: string;
};

export type JsonZipResult = Record<string, unknown | JsonParseError>;

/**
 * Extracts and parses all .json files from a ZIP (client-side).
 * - Only includes entries ending with .json (case-insensitive)
 * - Never throws on JSON parse failure; stores a JsonParseError instead
 */
export function extractJsonFilesFromZip(bytes: Uint8Array): JsonZipResult {
  const unzipped: Unzipped = unzipSync(bytes, {
    filter: (file) => file.name.toLowerCase().endsWith(".json")
  });

  const files: JsonZipResult = {};

  for (const [name, data] of Object.entries(unzipped)) {
    const text = strFromU8(data);

    try {
      files[name] = JSON.parse(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid JSON";
      files[name] = {
        parseError: true,
        errorMessage: msg,
        rawPreview: text.slice(0, 300)
      };
    }
  }

  return files;
}
