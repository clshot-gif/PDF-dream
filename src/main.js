import './style.css';
import { initAuth, signIn, signOut, getAccessToken } from './auth.js';
import { readCapturedAt } from './exif.js';
import { photoToPdf, isPdf, isImage } from './pdfBuilder.js';
import { buildMetadata, flattenMetadata } from './metadata.js';
import { groupIntoSessions } from './sessions.js';
import { findOrCreateFolder, resolveNestedFolder, uploadFile } from './drive.js';
import { fromFileList, fromDirectoryInput, fromDataTransfer } from './fileCollection.js';
import { pickMessage } from './messages.js';
import { pickCritters } from './critters.js';

document.querySelector('#app').innerHTML = `
  <div class="wrap">
    <h1>Reclaim your time</h1>
    <p class="subtitle" id="subtitle"></p>

    <section id="authSection">
      <button id="signInBtn">Sign in with Google</button>
      <span id="whoami" class="whoami"></span>
    </section>

    <section id="pickSection" class="disabled">
      <div id="dropzone" class="dropzone">
        Drop photos, PDFs, or any other files — or a whole folder — here
        <div class="dropzone-or">— or —</div>
        <label class="pick-btn">
          Choose files
          <input type="file" id="filePicker" multiple hidden />
        </label>
        <label class="pick-btn pick-btn-secondary">
          Choose a folder (desktop)
          <input type="file" id="folderPicker" webkitdirectory multiple hidden />
        </label>
      </div>
      <div id="fileSummary" class="file-summary"></div>
      <button id="uploadBtn" disabled>Upload to Drive</button>
    </section>

    <section id="progressSection" class="progress-section" hidden>
      <div class="grass-track">
        <div id="critterLayer" class="critter-layer"></div>
        <div id="inchworm" class="inchworm">
          <svg viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg">
            <g fill="#8fae7d" stroke="#5f7d4f" stroke-width="0.6">
              <ellipse class="worm-seg worm-seg-4" cx="8" cy="14" rx="5" ry="4.2" />
              <ellipse class="worm-seg worm-seg-3" cx="16" cy="14" rx="5" ry="4.2" />
              <ellipse class="worm-seg worm-seg-2" cx="24" cy="14" rx="5" ry="4.2" />
              <ellipse class="worm-seg worm-seg-1" cx="31" cy="12" rx="5.5" ry="5" />
            </g>
            <line class="worm-seg worm-seg-1" x1="33" y1="7" x2="31" y2="3" stroke="#5f7d4f" stroke-width="1" stroke-linecap="round" />
            <line class="worm-seg worm-seg-1" x1="35" y1="7" x2="37" y2="3" stroke="#5f7d4f" stroke-width="1" stroke-linecap="round" />
            <circle class="worm-seg worm-seg-1" cx="34" cy="9" r="1" fill="#2b2b2b" />
          </svg>
        </div>
        <div class="grass-visual">
          <div class="grass-base"></div>
          <div id="grassProgress" class="grass-progress"></div>
        </div>
      </div>
      <div id="progressText" class="progress-text"></div>
    </section>

    <section id="log" class="log"></section>
  </div>
`;

const whoami = document.querySelector('#whoami');
const signInBtn = document.querySelector('#signInBtn');
const pickSection = document.querySelector('#pickSection');
const dropzone = document.querySelector('#dropzone');
const filePicker = document.querySelector('#filePicker');
const folderPicker = document.querySelector('#folderPicker');
const fileSummary = document.querySelector('#fileSummary');
const uploadBtn = document.querySelector('#uploadBtn');
const progressSection = document.querySelector('#progressSection');
const grassProgress = document.querySelector('#grassProgress');
const inchworm = document.querySelector('#inchworm');
const critterLayer = document.querySelector('#critterLayer');
const progressText = document.querySelector('#progressText');
const subtitle = document.querySelector('#subtitle');
const log = document.querySelector('#log');

let collectedItems = []; // [{ file, relativePath }]

// Cycles through things she could be doing instead of chores — replaces the
// old static description entirely, runs continuously regardless of upload state.
let currentMessage = pickMessage();
subtitle.textContent = currentMessage;
setInterval(() => {
  subtitle.classList.add('fading');
  setTimeout(() => {
    currentMessage = pickMessage(currentMessage);
    subtitle.textContent = currentMessage;
    subtitle.classList.remove('fading');
  }, 400);
}, 4000);

function logLine(text) {
  const line = document.createElement('div');
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function setSignedIn(signedIn) {
  if (signedIn) {
    signInBtn.textContent = 'Sign out';
    whoami.textContent = 'Signed in';
    pickSection.classList.remove('disabled');
  } else {
    signInBtn.textContent = 'Sign in with Google';
    whoami.textContent = '';
    pickSection.classList.add('disabled');
  }
}

signInBtn.disabled = true;
signInBtn.textContent = 'Loading…';
initAuth().then(() => {
  signInBtn.disabled = false;
  signInBtn.textContent = 'Sign in with Google';
});

signInBtn.addEventListener('click', async () => {
  if (getAccessToken()) {
    signOut();
    setSignedIn(false);
    return;
  }
  try {
    await signIn();
    setSignedIn(true);
  } catch (err) {
    logLine(`Sign-in failed: ${err.message}`);
  }
});

function addItems(newItems) {
  collectedItems = collectedItems.concat(newItems);
  fileSummary.textContent = `${collectedItems.length} file(s) ready`;
  uploadBtn.disabled = collectedItems.length === 0;
}

filePicker.addEventListener('change', (e) => addItems(fromFileList(e.target.files)));
folderPicker.addEventListener('change', (e) => addItems(fromDirectoryInput(e.target.files)));

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const items = await fromDataTransfer(e.dataTransfer);
  addItems(items);
});

let critterEls = [];

// Called once per upload run: resets the track and picks 10 random
// flora/fauna (a fresh, different mix each time) to reveal at each
// 10%-of-total checkpoint as the inchworm crawls past.
function startProgressRun() {
  progressSection.hidden = false;
  grassProgress.style.width = '0%';
  inchworm.style.left = '0%';
  inchworm.classList.add('crawling');

  critterLayer.innerHTML = '';
  critterEls = pickCritters(10).map((critter, i) => {
    const threshold = (i + 1) * 10; // 10%, 20%, ... 100%
    const el = document.createElement('div');
    el.className = 'critter';
    el.style.left = `${threshold}%`;
    el.dataset.threshold = String(threshold);
    el.innerHTML = critter.svg;
    critterLayer.appendChild(el);
    return el;
  });
}

function setProgress(completed, total, label) {
  const fraction = total > 0 ? completed / total : 0;
  const pct = fraction * 100;
  grassProgress.style.width = `${pct}%`;
  inchworm.style.left = `${pct}%`;
  for (const el of critterEls) {
    if (pct >= Number(el.dataset.threshold)) el.classList.add('revealed');
  }
  if (pct >= 100) inchworm.classList.remove('crawling');
  progressText.textContent = label ?? `${completed} of ${total} file(s) uploaded`;
}

uploadBtn.addEventListener('click', async () => {
  uploadBtn.disabled = true;
  log.textContent = '';
  progressSection.hidden = true;
  try {
    const { completed, total, failures, copiedAsIs } = await runUpload(collectedItems);
    if (failures.length === 0) {
      logLine(`Done — all ${total} file(s) uploaded. Check the new "Unprocessed …" folder in your Drive.`);
    } else {
      logLine(`Done with errors — ${completed} of ${total} uploaded, ${failures.length} failed:`);
      for (const f of failures) logLine(`  FAILED ${f.filename}: ${f.error}`);
    }
    if (copiedAsIs.length > 0) {
      logLine(`${copiedAsIs.length} file(s) couldn't be converted to PDF, so they were uploaded in their original format:`);
      for (const name of copiedAsIs) logLine(`  ${name}`);
    }
    collectedItems = [];
    fileSummary.textContent = '';
  } catch (err) {
    logLine(`Upload stopped: ${err.message}`);
  } finally {
    uploadBtn.disabled = collectedItems.length === 0;
  }
});

async function runUpload(items) {
  const token = getAccessToken();
  if (!token) throw new Error('Sign in first');

  logLine(`Reading timestamps for ${items.length} file(s)...`);
  const withTimestamps = await Promise.all(
    items.map(async (item) => ({ ...item, capturedAt: await readCapturedAt(item.file) }))
  );

  const sessions = groupIntoSessions(withTimestamps);
  logLine(`Grouped into ${sessions.length} session(s).`);

  const rootName = `Unprocessed ${new Date().toISOString()}`;
  const rootFolderId = await findOrCreateFolder(token, rootName);
  logLine(`Created Drive folder "${rootName}".`);

  const total = items.length;
  let completed = 0;
  const failures = [];
  const copiedAsIs = [];
  startProgressRun();
  setProgress(completed, total);

  for (const session of sessions) {
    const sessionFolderId = await resolveNestedFolder(token, rootFolderId, session.name);
    logLine(`Session "${session.name}": ${session.items.length} file(s)`);

    for (const item of session.items) {
      const originalName = item.file.name;
      const baseName = originalName.replace(/\.[^.]+$/, '');

      // Keep going on a per-file failure (e.g. a transient blip that outlasted
      // the retries, or one bad file) instead of aborting the whole batch —
      // she shouldn't have to restart a 200-file run because of one file.
      try {
        let bytes;
        let filename;
        let mimeType;
        let converted;

        if (isPdf(item.file)) {
          bytes = new Uint8Array(await item.file.arrayBuffer());
          filename = `${baseName}.pdf`;
          mimeType = 'application/pdf';
          converted = true;
        } else if (isImage(item.file)) {
          bytes = await photoToPdf(item.file);
          filename = `${baseName}.pdf`;
          mimeType = 'application/pdf';
          converted = true;
        } else {
          // Not a pic and not already a PDF (e.g. a .docx) — everything that
          // gets dragged in still gets uploaded, just untouched, since there's
          // no conversion path for it here.
          bytes = new Uint8Array(await item.file.arrayBuffer());
          filename = originalName;
          mimeType = item.file.type || 'application/octet-stream';
          converted = false;
        }

        const metadata = buildMetadata({ capturedAt: item.capturedAt, filename, pageCount: 1 });
        await uploadFile(token, {
          bytes,
          filename,
          mimeType,
          folderId: sessionFolderId,
          properties: flattenMetadata(metadata),
        });

        if (converted) {
          logLine(`  Uploaded ${filename}`);
        } else {
          logLine(`  Uploaded ${filename} (copied as-is — couldn't convert to PDF)`);
          copiedAsIs.push(filename);
        }
      } catch (err) {
        logLine(`  FAILED ${originalName}: ${err.message}`);
        failures.push({ filename: originalName, error: err.message });
      }

      completed += 1;
      setProgress(completed, total);
    }
  }

  return { completed: completed - failures.length, total, failures, copiedAsIs };
}
