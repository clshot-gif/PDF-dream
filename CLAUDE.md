# Batch Uploader ("Unprocessed" tool) — Project Reference

Built from `../handoff-batch-uploader.md` — read that first for the original spec (who it's for, the flow, explicit non-goals). This file tracks status.

## What it is

A single static web page, no backend. Sign in with your own Google account, drop in any mix of files (photos, PDFs, or anything else — a whole folder works too), and it groups everything into sessions and uploads to a new `Unprocessed <ISO date-time>` folder in your own Drive. Photos convert to a single-page PDF each; an already-PDF file uploads unchanged; anything else (`.docx`, etc.) uploads in its original format, untouched — nothing dragged in gets silently dropped. Every uploaded file, regardless of which of those three paths it took, gets the same `properties` metadata schema the mobile app (`../archive-capture/`) writes, mostly blank (a later Phase 2 tool fills in box/folder/collection/tags).

## Two things a future reader (including Phase 2) must not assume

1. **Uploaded filenames are just the original filename, converted or not** (e.g. `Dad.pdf`, `Book (2)_edited.pdf`, `field-notes.docx`) — they do **not** follow the mobile app's `Archive <name> - Collection <name> - Box <n> - Folder <n> - Number[ - OMG].pdf` convention. That convention needs Collection/Box/Folder values this tool doesn't have yet (that's the whole point of "Unprocessed" — filing happens later, in the Phase 2 review UI's Filing Mode). Don't expect files in an `Unprocessed <date>` tree to parse like mobile-app filenames.
2. **Folder structure inside `Unprocessed <date>` varies by how files arrived**, and can be genuinely nested (not just one flat session level):
   - If the user dropped a real folder (or a folder tree with subfolders), the *exact* subfolder structure is mirrored as real nested Drive folders under the timestamped root — e.g. dropping a folder "Eliza Poster" containing "Originals" and "Ready" subfolders produces `Unprocessed <date>/Eliza Poster/Originals/...` and `Unprocessed <date>/Eliza Poster/Ready/...` as two separate real folders, not one flattened bucket. (This took a bug fix to get right — see `src/sessions.js`'s `groupByFolder`, which groups by the *full* containing-folder path, and `src/drive.js`'s `resolveNestedFolder`, which walks each path segment as a real nested folder rather than one folder with a slash in its name.)
   - If files were loose (no folder origin at all), they're grouped into synthetic `Session N (<timestamp>)` folders split on a 3-hour EXIF-timestamp gap — one flat level, no further nesting.
   - A single upload run can mix both: folder-sourced files keep their real structure, loose files alongside them land in an `Ungrouped` folder at the same level.

## Tech stack

- Vite (vanilla JS, no framework) — static build, deployed via GitHub Actions to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`)
- `pdf-lib` — builds each single-page PDF, page sized to the photo's own aspect ratio (same approach as the mobile app's `ConfirmationScreen.js`, not a fixed print-page shape)
- `exifr` — reads `DateTimeOriginal` from photo EXIF for session grouping; falls back to the file's own last-modified time if EXIF is missing
- `heic2any` — dynamically imported only when `createImageBitmap` fails to decode a HEIC file natively (i.e. only matters outside Safari)
- Google Identity Services (`accounts.google.com/gsi/client`, loaded on demand from `src/auth.js` rather than a `<script async>` tag — see below) for browser-side OAuth, `drive.file` scope only
- Drive REST API directly via `fetch`, same calling pattern as `archive-capture/src/services/DriveService.js` (find-or-create folder, two-step metadata+binary upload) — see `src/drive.js`

## Where things are

- `src/auth.js` — Google sign-in/out, token client
- `src/exif.js` — `readCapturedAt(file)`
- `src/imageDecode.js` — HEIC-aware decode to a downscaled JPEG blob
- `src/pdfBuilder.js` — `photoToPdf(file)`, `isPdf(file)` (already-PDF inputs pass through untouched), `isImage(file)` (decides whether a dragged-in file is a "pic" that should be converted at all — anything else, e.g. `.docx`, uploads untouched)
- `src/metadata.js` — the exact schema from `../archive-capture/docs/metadata-schema.md`, `flattenMetadata` for Drive's string-only `properties`; attached to every uploaded file regardless of whether it was converted, passed through, or copied as-is
- `src/sessions.js` — `groupIntoSessions(items)`: folder structure wins if present (top-level folder name = session), otherwise splits on a 3-hour EXIF timestamp gap
- `src/fileCollection.js` — normalizes the three input paths (plain file picker, `webkitdirectory` folder picker, drag-and-drop with recursive directory-entry walking) into one `{file, relativePath}` shape
- `src/drive.js` — folder create/find, `resolveNestedFolder` (walks a multi-segment path as real nested folders), two-step upload (`uploadFile`, not PDF-only — takes a `mimeType` so non-PDF files upload with their real content type), retry-with-backoff wrapper around every Drive fetch
- `src/messages.js` — the rotating "what to do with your reclaimed time" corpus shown in place of a static description, cycling every 4 seconds
- `src/critters.js` — the 16-icon SVG pool (butterflies/insects/flowers) and `pickCritters(10)` for the progress bar's random reveals
- `src/main.js` — DOM wiring + orchestration, including the three-way upload branch (PDF passthrough / image-to-PDF / copy-as-is) and the progress bar's grass/inchworm/critter state
- `src/*.test.js` — vitest unit tests for the pure logic (`npm test`)

## Status as of 2026-07-07 (latest) — merged to main, live, confirmed working

`feature/inchworm-progress-bar` and `feature/upload-all-file-types` (both described below) are merged into `main` and pushed. The `Deploy to GitHub Pages` Actions workflow ran the test suite, built, and deployed automatically (as it does on every push to `main` — no manual rebuild step). Carter confirmed the live site works after a hard refresh. This also means two items the 2026-07-06 status below still lists as "not yet done, blocking real use" are actually done and that section is stale: the OAuth Web Client ID in `src/config.js` is a real value, not a placeholder, and the site **is** hosted (GitHub Pages, via the workflow above) — see the updated "Next steps" section for what's still actually open.

## Status as of 2026-07-07 (later) — upload everything, convert only pics

Previously any non-PDF file was assumed to be a photo and forced through `photoToPdf` — a dragged-in `.docx` or other non-image file would throw partway through decode and land in `failures`, meaning it never made it to Drive at all. Now `src/pdfBuilder.js` exports `isImage(file)` (mime-type check with an extension fallback for browsers that don't set `type` on HEIC), and `runUpload` in `src/main.js` branches three ways: already-PDF passes through unchanged, images (incl. HEIC) still convert to a single-page PDF, and everything else uploads in its original bytes/filename/mime-type with the same metadata schema attached (`src/drive.js`'s `uploadFile`, renamed from `uploadPdf`, now takes a `mimeType` instead of hardcoding `application/pdf`). The upload log calls out each copied-as-is file individually, and the final summary lists them separately from real failures. Also dropped the `accept="image/*,.pdf,.heic,.heif"` restriction on the file-picker button so it doesn't block picking a non-photo file that drag-and-drop would have allowed anyway. Verified via `src/pdfBuilder.test.js` / updated `src/drive.test.js`, plus a real-module browser check (stubbed `fetch`, real `File` objects for a PNG/PDF/.docx trio) confirming the log output. Shipped on branch `feature/upload-all-file-types`, stacked on top of the not-yet-merged `feature/inchworm-progress-bar`.

## Status as of 2026-07-07 (earlier) — went live, several real-use bugs fixed, visual redesign

This entry was reconstructed after the fact from notes that existed only as an uncommitted `CLAUDE.md` draft in a separate, stray local clone of this repo (`../batch-uploader/`, same `origin` — see the note at the very bottom of this file) — the actual `CLAUDE.md` committed to this repo skipped straight from the 2026-07-06 scaffold entry below to this session's two feature entries above, with none of this ever written down here despite eight real commits happening in between. Worth knowing so it doesn't happen again: **update this file in the same commit as the code change it describes**, not after the fact from memory.

What actually happened, in order: real Google OAuth Client ID set (was briefly left uncommitted, causing a live `Error 401: invalid_client` until caught); GitHub Pages hosting turned on (needed a one-time manual Settings → Pages → Source → "GitHub Actions" switch, not just adding the workflow file); Drive API failures were surfaced with their actual error body instead of a bare HTTP status; large batches were made resilient (retry-with-backoff on transient errors, one bad file no longer aborts the rest, final summary of failures); a real bug where dropping a folder with sibling subfolders (e.g. "Eliza Poster/Originals" and "Eliza Poster/Ready") flattened everything into one folder, causing same-named files to collide — fixed by grouping on the full folder path (see the "must not assume" section above); and a visual redesign (dark mode, dusty-rose/sage/mustard/dusty-blue palette, headline "Reclaim your time," the static description replaced with `src/messages.js`'s rotating corpus). Real end-to-end testing happened against a live Drive account with a real mixed batch, not just synthetic data. **Still genuinely unconfirmed as of this writing: a real HEIC file from an iPhone** — everything tested so far has been desktop-sourced.

One more thing worth knowing: **an inchworm/garden-themed progress bar was tried once before, during this period, and shelved as "too rough to ship"** in favor of the plain grey-fading-to-rainbow bar that actually shipped — with a note that a future attempt should use "real illustration assets rather than hand-coded SVG." This session's inchworm progress bar (below) is a second, independent attempt that also used hand-coded SVG — a deliberate choice Carter confirmed directly when asked, for crispness at the small display size rather than out of not knowing about the earlier concern — and it shipped, was verified with screenshots at several progress points, and Carter confirmed it looks right on the live site. Flagging the history here rather than treating it as settled, since neither Carter nor this session has seen what specifically made the first attempt "too rough."

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

1. ~~Carter creates the OAuth Web Client ID + adds test users~~ — done, real client ID is in `src/config.js`.
2. ~~Pick a static host and add its origin to the OAuth client~~ — done, live on GitHub Pages, deploying automatically on every push to `main`.
3. Do one real end-to-end run with a live account to actually confirm (not yet specifically verified, as distinct from "the page loads and looks right"): drop a mix of a JPEG, a HEIC file, an already-made PDF, and something like a `.docx`; confirm the Drive folder structure, that the PDF/HEIC/JPEG all convert correctly, that the `.docx` lands untouched with metadata attached, and that `properties` on each file are correct.
4. Tell Justina to flip iPhone **Settings → Camera → Formats → "Most Compatible"** (per the handoff) so future photos are plain JPEG regardless.

## Git

This is its own repo, separate from `../archive-capture`'s repo, since it's a distinct deployable tool. Pushed to GitHub as `clshot-gif/PDF-dream`, `main` is the baseline and currently has everything merged in (`feature/inchworm-progress-bar` and `feature/upload-all-file-types` both fast-forwarded into `main`; the branches still exist on the remote but have nothing `main` doesn't already have). Local git identity set to match `archive-capture` (Carter Shotwell / carter@cshotwell.com) since no global git identity exists on this machine — this had to be set again per-repo the first time a commit was made from a WSL-native `git` (as opposed to the Windows-side `git`), since they don't share config.

**Push gotcha**: WSL-native `git push` hangs indefinitely with no error — it has no credential helper configured, unlike the Windows-side `git` (which has GitHub's Credential Manager set up already, same as `archive-capture`). Commit from wherever's convenient, but always push via the Windows-side path (`//wsl.localhost/ubuntu/home/carter/projects/PDF-dream`), not `wsl.exe -e bash -lc "cd ~/projects/PDF-dream && git push ..."`.

**Stray duplicate clone**: `../batch-uploader/` (i.e. `Organizer_Archives/batch-uploader`, a sibling of this folder) is a second, separate local clone of this exact same `clshot-gif/PDF-dream` repo — probably this project's original working directory before this one (`PDF-dream`) was cloned fresh in a later session. It's not ahead of `main` in commits, but it had one valuable uncommitted `CLAUDE.md` draft that this file's "Status as of 2026-07-07 (earlier)" entry and the "must not assume" section above were reconstructed from — check with Carter before assuming that folder is safe to delete, in case there's other uncommitted work in it.
