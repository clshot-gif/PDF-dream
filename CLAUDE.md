# Batch Uploader ("Unprocessed" tool) — Project Reference

Built from `../handoff-batch-uploader.md` — read that first for the original spec (who it's for, the flow, explicit non-goals). This file tracks status.

## What it is

A single static web page, no backend. Sign in with your own Google account, drop in loose photos/PDFs or a whole folder, and it converts each photo to a single-page PDF, groups everything into sessions, and uploads to a new `Unprocessed <ISO date-time>` folder in your own Drive — with the same `properties` metadata schema the mobile app (`../archive-capture/`) writes, mostly blank (a later Phase 2 tool fills in box/folder/collection/tags).

## Tech stack

- Vite (vanilla JS, no framework) — static build, no server
- `pdf-lib` — builds each single-page PDF, page sized to the photo's own aspect ratio (same approach as the mobile app's `ConfirmationScreen.js`, not a fixed print-page shape)
- `exifr` — reads `DateTimeOriginal` from photo EXIF for session grouping; falls back to the file's own last-modified time if EXIF is missing
- `heic2any` — dynamically imported only when `createImageBitmap` fails to decode a HEIC file natively (i.e. only matters outside Safari)
- Google Identity Services (`accounts.google.com/gsi/client`, loaded on demand from `src/auth.js` rather than a `<script async>` tag — see below) for browser-side OAuth, `drive.file` scope only
- Drive REST API directly via `fetch`, same calling pattern as `archive-capture/src/services/DriveService.js` (find-or-create folder, two-step metadata+binary upload) — see `src/drive.js`

## Where things are

- `src/auth.js` — Google sign-in/out, token client
- `src/exif.js` — `readCapturedAt(file)`
- `src/imageDecode.js` — HEIC-aware decode to a downscaled JPEG blob
- `src/pdfBuilder.js` — `photoToPdf(file)` / `isPdf(file)` (already-PDF inputs pass through untouched)
- `src/metadata.js` — the exact schema from `../archive-capture/docs/metadata-schema.md`, `flattenMetadata` for Drive's string-only `properties`
- `src/sessions.js` — `groupIntoSessions(items)`: folder structure wins if present (top-level folder name = session), otherwise splits on a 3-hour EXIF timestamp gap
- `src/fileCollection.js` — normalizes the three input paths (plain file picker, `webkitdirectory` folder picker, drag-and-drop with recursive directory-entry walking) into one `{file, relativePath}` shape
- `src/drive.js` — folder create/find, two-step PDF upload
- `src/main.js` — DOM wiring + orchestration
- `src/*.test.js` — vitest unit tests for the pure logic (`npm test`)

## Status as of 2026-07-07 — inchworm progress bar

Replaced the plain grey/rainbow upload progress bar with a small animation: an inchworm crawls left-to-right across a grass line as `completed/total` advances, turning the grass green behind her (grey → green uses the same blade-shaped CSS mask for both layers, so it looks like real grass rather than a bar with a fancy skin). At each 10%-of-total checkpoint, one small flora/fauna SVG icon fades in behind her — a fresh random 10 out of a 16-icon pool (`src/critters.js`) picked at the start of each upload run, so the reveal sequence differs every time. Icons are hand-drawn SVG (not cropped from raster source images) so they stay crisp at the ~20px display size. Implementation: `src/critters.js` (icon pool + `pickCritters`), `startProgressRun`/`setProgress` in `src/main.js`, `.grass-*`/`.critter*`/`.inchworm` rules in `src/style.css`. Verified visually via a local dev-server preview (screenshots at 0%/30%/75%/100%) and `src/critters.test.js` (3 tests). Shipped on branch `feature/inchworm-progress-bar`, not yet merged into `main`.

## Status as of 2026-07-06 — scaffolded, unit-tested, not yet real-world tested

Everything in the spec is implemented and the pipeline works end-to-end against synthetic data (verified in a running dev server: a generated JPEG runs through `photoToPdf` and produces a valid PDF; sign-in wiring correctly builds the OAuth popup request; EXIF fallback to `lastModified` confirmed). `npm test` passes (8 tests covering session grouping and metadata shape).

**Not yet done, and blocking real use:**

1. **No real Google OAuth Web Client ID yet.** `src/config.js` has a placeholder. Carter needs to create one (steps are in that file's comment) — a **different client type** than the mobile app's Android client, in the same or a different Cloud project. Hannah's and Justina's Google accounts also need adding as OAuth test users (same step already done for the mobile app), since the Cloud project is still in "Testing" publishing status.
2. **Not hosted anywhere yet.** It's a static `dist/` build (Vite) — needs any static host (GitHub Pages is the natural choice, matching the mobile app's existing GitHub connection). Whatever URL it ends up at must also be added to the OAuth client's "Authorized JavaScript origins" alongside `http://localhost:5173` for local dev.
3. **Not tested with a real HEIC file yet** — the handoff explicitly calls this out as a must-do before calling the tool done. The code path exists (native decode first, `heic2any` fallback if that throws) but hasn't been exercised against an actual iPhone HEIC photo. Do this before handing the link to Justina.
4. Real end-to-end Drive upload (folder creation, nested session folders, metadata landing on the file) hasn't been tested against a live Drive account — only the request-building and PDF-generation logic have been verified, since there's no real OAuth client yet to complete a sign-in.

## Next steps, in order

1. Carter creates the OAuth Web Client ID + adds test users (see `src/config.js`).
2. Pick a static host (GitHub Pages recommended) and add its origin to the OAuth client.
3. `npm run build`, deploy `dist/`, do one real end-to-end run: sign in, drop a mix of JPEG + a HEIC file + an already-made PDF, confirm the Drive folder structure and metadata come out right.
4. Tell Justina to flip iPhone **Settings → Camera → Formats → "Most Compatible"** (per the handoff) so future photos are plain JPEG regardless.

## Git

This is its own repo, separate from `../archive-capture`'s repo, since it's a distinct deployable tool. Pushed to GitHub as `clshot-gif/PDF-dream`, `main` is the baseline. Local git identity set to match `archive-capture` (Carter Shotwell / carter@cshotwell.com) since no global git identity exists on this machine — this had to be set again per-repo the first time a commit was made from a WSL-native `git` (as opposed to the Windows-side `git`), since they don't share config.
