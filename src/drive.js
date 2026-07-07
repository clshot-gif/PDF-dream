// Browser port of archive-capture/src/services/DriveService.js's calling
// pattern (find-or-create folder, two-step metadata+binary upload). Not
// reused directly since that file targets React Native's FileSystem API —
// here we're uploading a Blob straight from the browser.
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function escapeForDriveQuery(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retries on the errors that are actually worth retrying (a transient rate
// limit, or Google's own backend hiccups) — not on things a retry can't
// fix, like a full Drive (storageQuotaExceeded) or a bad request.
function isRetryable(status, bodyText) {
  if (status === 429) return true;
  if (status >= 500) return true;
  if (status === 403 && /rateLimitExceeded|userRateLimitExceeded|backendError/.test(bodyText)) return true;
  return false;
}

async function fetchWithRetry(url, options, { retries = 4, baseDelayMs = 1000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    const bodyText = await res.text();
    if (attempt >= retries || !isRetryable(res.status, bodyText)) {
      throw new Error(`${res.status} ${bodyText}`);
    }
    await sleep(baseDelayMs * 2 ** attempt);
  }
}

export async function findOrCreateFolder(token, name, parentId = null) {
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${escapeForDriveQuery(name)}' and trashed=false${parentClause}`
  );
  const searchRes = await fetchWithRetry(`${FILES_URL}?q=${query}&fields=files(id,name)`, {
    headers: authHeaders(token),
  });
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return searchData.files[0].id;

  const body = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) body.parents = [parentId];

  const createRes = await fetchWithRetry(FILES_URL, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const folder = await createRes.json();
  return folder.id;
}

export async function uploadPdf(token, { bytes, filename, folderId, properties }) {
  const metaRes = await fetchWithRetry(FILES_URL, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: filename, parents: [folderId], properties }),
  });
  const { id: fileId } = await metaRes.json();

  await fetchWithRetry(`${UPLOAD_URL}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/pdf' },
    body: bytes,
  });
  return fileId;
}
