# Release Checklist

## 1. Pre-Flight Checks

- [ ] **Tests Pass**: Run `npm test` and ensure all unit tests pass (Compute, Persistence).
- [ ] **Linting**: Run `npm run lint` to catch potential Next.js build errors.
- [ ] **Type Check**: Run `npm run typecheck` (or `npx tsc --noEmit`) to verify TypeScript.
- [ ] **Build Check**: Run `npm run build` locally to simulate Vercel build process.
- [ ] **Clean Console**: Verify no unexpected console logs/errors in `DebugPanel` or DevTools during a sample run.

## 2. Deployment (Vercel)

This project is optimized for Vercel deployment.

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com).
   - "Add New" > "Project".
   - Import this repository.

2. **Build Settings** (Default Next.js settings usually work):
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Install Command**: `npm install`

3. **Environment Variables**:
   - None required for this client-side app.

4. **Deploy**:
   - Click **Deploy**.
   - Wait for build completion.

## 3. Post-Deployment Verification

- [ ] **Load Page**: Visit production URL.
- [ ] **Web Worker**: Upload a large ZIP (or regular one) and verify in `DebugPanel` that basic stats appear (confirming worker/main thread logic held up).
- [ ] **Privacy Check**: Ensure no network requests are made to external APIs in the Network tab.
- [ ] **Persistence**: Tag a user, refresh page, verify tag remains.

## 4. Updates

- To ship updates, typically just `git push` to main (if Vercel is connected to Git).
