import UploadZip from "../src/components/UploadZip";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">IG Follow Audit</h1>
        <p className="mt-3 text-white/70">
          Upload your Instagram data export ZIP (JSON) to preview discovered JSON files
          — fully client-side.
        </p>

        <UploadZip />
      </div>
    </main>
  );
}
