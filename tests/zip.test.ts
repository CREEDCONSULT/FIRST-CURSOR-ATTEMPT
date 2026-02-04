import { zipSync } from "fflate";
import { extractJsonFilesFromZip } from "../lib/zip";

function makeZipFromEntries(entries: Record<string, string>): Uint8Array {
  const data: Record<string, Uint8Array> = {};
  for (const [name, text] of Object.entries(entries)) {
    data[name] = new TextEncoder().encode(text);
  }
  return zipSync(data);
}

describe("extractJsonFilesFromZip", () => {
  it("extracts and parses all .json files", () => {
    const bytes = makeZipFromEntries({
      "followers.json": JSON.stringify({ count: 1 }),
      "following.json": JSON.stringify({ count: 2 }),
      "readme.txt": "not json"
    });

    const { files } = extractJsonFilesFromZip(bytes);

    expect(Object.keys(files).sort()).toEqual(["followers.json", "following.json"]);
    expect(files["followers.json"]).toEqual({ count: 1 });
    expect(files["following.json"]).toEqual({ count: 2 });
  });

  it("handles invalid JSON by storing a parseError flag", () => {
    const bytes = makeZipFromEntries({
      "broken.json": "{not valid json"
    });

    const { files } = extractJsonFilesFromZip(bytes);
    const entry = files["broken.json"] as { parseError: boolean; raw: string };

    expect(entry.parseError).toBe(true);
    expect(entry.raw).toContain("not valid json");
  });
});
