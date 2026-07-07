import './style.css';
import { initAuth, signIn, signOut, getAccessToken } from './auth.js';
import { readCapturedAt } from './exif.js';
import { photoToPdf, isPdf } from './pdfBuilder.js';
import { buildMetadata, flattenMetadata } from './metadata.js';
import { groupIntoSessions } from './sessions.js';
import { findOrCreateFolder, resolveNestedFolder, uploadPdf } from './drive.js';
import { fromFileList, fromDirectoryInput, fromDataTransfer } from './fileCollection.js';
import { pickMessage } from './messages.js';

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
        Drop photos, PDFs, or a whole folder here
        <div class="dropzone-or">— or —</div>
        <label class="pick-btn">
          Choose files
          <input type="file" id="filePicker" multiple accept="image/*,.pdf,.heic,.heif" hidden />
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
      <div class="progress-track">
        <div id="progressFillGrey" class="progress-fill progress-fill-grey"></div>
        <div id="progressFillRainbow" class="progress-fill progress-fill-rainbow"></div>
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
const progressFillGrey = document.querySelector('#progressFillGrey');
const progressFillRainbow = document.querySelector('#progressFillRainbow');
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

function setProgress(completed, total, label) {
  progressSection.hidden = false;
  const fraction = total > 0 ? completed / total : 0;
  const pct = `${fraction * 100}%`;
  progressFillGrey.style.width = pct;
  progressFillRainbow.style.width = pct;
  progressFillRainbow.style.opacity = fraction; // grey at the start, full rainbow right as it finishes
  progressText.textContent = label ?? `${completed} of ${total} file(s) uploaded`;
}

uploadBtn.addEventListener('click', async () => {
  uploadBtn.disabled = true;
  log.textContent = '';
  progressSection.hidden = true;
  try {
    const { completed, total, failures } = await runUpload(collectedItems);
    if (failures.length === 0) {
      logLine(`Done — all ${total} file(s) uploaded. Check the new "Unprocessed …" folder in your Drive.`);
    } else {
      logLine(`Done with errors — ${completed} of ${total} uploaded, ${failures.length} failed:`);
      for (const f of failures) logLine(`  FAILED ${f.filename}: ${f.error}`);
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
  setProgress(completed, total);

  for (const session of sessions) {
    const sessionFolderId = await resolveNestedFolder(token, rootFolderId, session.name);
    logLine(`Session "${session.name}": ${session.items.length} file(s)`);

    for (const item of session.items) {
      const baseName = item.file.name.replace(/\.[^.]+$/, '');
      const filename = `${baseName}.pdf`;

      // Keep going on a per-file failure (e.g. a transient blip that outlasted
      // the retries, or one bad file) instead of aborting the whole batch —
      // she shouldn't have to restart a 200-file run because of one file.
      try {
        let pdfBytes;
        if (isPdf(item.file)) {
          pdfBytes = new Uint8Array(await item.file.arrayBuffer());
        } else {
          pdfBytes = await photoToPdf(item.file);
        }

        const metadata = buildMetadata({ capturedAt: item.capturedAt, filename, pageCount: 1 });
        await uploadPdf(token, {
          bytes: pdfBytes,
          filename,
          folderId: sessionFolderId,
          properties: flattenMetadata(metadata),
        });
        logLine(`  Uploaded ${filename}`);
      } catch (err) {
        logLine(`  FAILED ${filename}: ${err.message}`);
        failures.push({ filename, error: err.message });
      }

      completed += 1;
      setProgress(completed, total);
    }
  }

  return { completed: completed - failures.length, total, failures };
}
