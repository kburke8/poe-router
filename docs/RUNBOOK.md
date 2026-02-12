# Runbook

## Architecture Overview

PoE Speed Run Planner is a **fully client-side** Next.js application. All data is stored in the browser's IndexedDB via Dexie.js. There is no backend server, database, or external API.

This simplifies deployment and operations significantly — there are no secrets, no database migrations, and no server-side state to manage.

## Deployment

### Option 1: Static / Vercel Deployment

Deploy as a standard Next.js app:

```bash
npm run build
```

Deploy the `.next/` output to Vercel, Netlify, or any platform that supports Next.js.

### Option 2: Standalone Node.js Server

The app is configured with `output: 'standalone'` in `next.config.ts`, which produces a self-contained server bundle.

```bash
# Build
npm run build

# The standalone server is at:
#   .next/standalone/poe-router/server.js

# Copy static assets alongside the standalone directory:
cp -r .next/static .next/standalone/poe-router/.next/static
cp -r public .next/standalone/poe-router/public

# Run
node .next/standalone/poe-router/server.js
# Or use the shortcut:
npm run standalone
```

The standalone server listens on port 3000 by default. Override with the `PORT` environment variable.

### Option 3: Docker (example)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone/poe-router ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Monitoring

Since this is a client-side app, traditional server monitoring is minimal:

- **Build health**: Verify `npm run build` succeeds in CI
- **Lint**: Verify `npm run lint` passes in CI
- **Bundle size**: Monitor `.next/` output size — the standalone bundle should remain small
- **Browser errors**: Users may report issues via GitHub Issues

## Common Issues and Fixes

### Regex false positives

**Symptom**: A regex pattern highlights unintended items in PoE's stash search.

**Fix**:
1. Run `npx tsx scripts/test_new_patterns.ts` to identify the colliding pattern
2. Find the PoE text fragment causing the match
3. Add it to `POE_ITEM_TEXT_SAMPLES` in `src/lib/regex/abbreviator.ts`
4. The engine regenerates a longer pattern automatically
5. Verify with the test script

### IndexedDB data issues

**Symptom**: User reports lost data or corrupted state.

**Fix**: Data lives entirely in the browser's IndexedDB. Users can:
- Export their data via the app's JSON export feature (`src/lib/export.ts`)
- Clear IndexedDB via browser DevTools (Application > Storage > IndexedDB)
- Import a backup via the app's JSON import feature

### Build fails with EBUSY error

**Symptom**: `npm run build` fails with `EBUSY: resource busy or locked, rmdir '.next/standalone/...'`

**Fix**: Another process has the standalone directory open. Close any running `npm run standalone` process, or delete `.next/` and rebuild:
```bash
rm -rf .next
npm run build
```

### Standalone server missing static assets

**Symptom**: App loads but styles/images are broken.

**Fix**: Static assets must be copied alongside the standalone output:
```bash
cp -r .next/static .next/standalone/poe-router/.next/static
cp -r public .next/standalone/poe-router/public
```

## Rollback

Since this is a static/client-side app with no server-side state:

1. **Revert the deploy** to the previous build artifact or git commit
2. **Rebuild**: `npm run build`
3. **Redeploy** the previous build

No database rollback or data migration is needed — all user data is in their browser's IndexedDB.
