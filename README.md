## IG Follow Audit

This repository contains the **IG Follow Audit** app, a Next.js + TypeScript project that will let you inspect your Instagram follower/following relationships using an official Instagram data export ZIP file.

All processing is designed to run **client-side in your browser**. The app will **never ask for your Instagram password**, and it will **not automate unfollow actions**.

### Overview

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Lint/format**: ESLint + Prettier
- **Testing**: Vitest + React Testing Library

There is also a small `legacy/` folder preserving the original Node.js scaffold (`legacy/index.js`) for reference only.

### How to Use

1. **Request Data from Instagram**
   - Go to **Your Activity** > **Download Your Information**.
   - Select **"Followers and Following"**.
   - **CRITICAL**: Select **Format: JSON** (not HTML).
   - Download the ZIP file when notified by Instagram.

2. **Run the Audit**
   - Click "Choose ZIP" in the app.
   - Select the downloaded file.
   - View your "Not Following Back" list.
   - Tag accounts to remember who they are (saved locally).
   - Generate an "Unfollow Plan" checklist.

### Project Structure (high level)

```text
.
├── app/                 # Next.js App Router (Layout, Landing)
├── src/
│   ├── app/audit/       # Main Dashboard Page
│   ├── components/      # UI Components (UploadZip, DebugPanel)
│   ├── lib/             # Logic (Parsing, Compute, Persistence)
│   └── workers/         # Web Workers (Background Parsing)
├── docs/                # PRD and architecture docs
├── tests/               # Vitest + RTL tests
├── public/              # Static assets
└── README.md
```

### Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the dev server**

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.

### Useful Scripts

- **`npm run dev`**: Start the Next.js dev server.
- **`npm run build`**: Create a production build.
- **`npm start`**: Run the production server after building.
- **`npm run lint`**: Lint the project with ESLint.
- **`npm run typecheck`**: Run TypeScript type checking.
- **`npm test`**: Run Vitest test suite.
- **`npm run format`**: Check code formatting with Prettier.
