## IG Follow Audit – Product Requirements

### Problem

Instagram does not provide a convenient way to understand how your follower and following lists have evolved over time, or to quickly spot stale / one-sided relationships. Users who care about privacy and safety may also want to audit who they follow and why, without giving third-party services their Instagram credentials.

### Product Vision

IG Follow Audit is a **purely client-side** tool that helps you explore and audit your Instagram relationships using only an **official Instagram data export ZIP file**. The app:

- Never asks for your **Instagram username/password**
- Never performs **automated actions** (no auto-follow, no auto-unfollow, no DMs)
- Runs **entirely in the browser**, so raw data does not leave the user’s machine

### Data Source

- Input: Instagram data export ZIP file downloaded from Instagram’s official “Download Your Information” tool.
- Data is parsed locally in the browser from JSON/HTML/CSV files inside the ZIP.
- No backend service is required for parsing or analysis.

### Core User Flows (Implemented)

1. **Upload data export ZIP**
   - User uploads "Followers & Following" ZIP (JSON format).
   - App auto-detects relevant files (`followers_1.json`, `following.json`).
   - **Optimization**: Large files (>10MB) parsed in background Web Worker.

2. **Audit Dashboard**
   - **Summary Cards**: Total Followers, Following, Mutuals, Not Following Back.
   - **Main Table**: Focus on "Not Following Back" accounts.
   - **Search & Filter**: Real-time filtering by username or Credibility status.
   - **Pagination**: Efficiently browse thousands of rows.

3. **Credibility & Tagging System**
   - **Tag**: Mark accounts as *Creator, Celebrity, Business, Personal, or Unknown*.
   - **Score**: Assign *High, Medium, or Low* activity levels.
   - **Persistence**: Tags are saved locally in the browser (`localStorage`), persisting across sessions.

4. **Actionable Unfollow Plan**
   - **Select**: Choose candidates to unfollow from the table.
   - **Safe Export**: Generate a **manual checklist text file** to guide your actions in the official app.
   - **Warning**: Strict copy ensuring users know to act manually and respect limits.

5. **Transparency & Telemetry**
   - **Debug Panel**: Visibility into parse times and file counts (local only).
   - **Privacy Controls**: "Reset Data" button to wipe local storage.

> None of these flows will ever trigger actions on Instagram itself. The app is an offline analysis tool only.

### Non-Goals

- No Instagram login or OAuth.
- No automation of in-app actions (unfollowing, blocking, messaging, etc.).
- No cloud storage of user data or exports.

### Constraints & Principles

- **Client-side only**: All ZIP parsing and analysis logic must run in the browser using JavaScript / Web APIs (e.g., `Blob`, `File`, `ArrayBuffer`, `TextDecoder`).
- **Privacy-first**: The app must not send Instagram data to any server.
- **Transparent behavior**: Clearly explain what is being done with the data and what is _not_ being done (no login, no automation).
