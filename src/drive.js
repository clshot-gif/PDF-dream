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

export async function findOrCreateFolder(token, name, parentId = null) {
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const query = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${escapeForDriveQuery(name)}' and trashed=false${parentClause}`
  );
  const searchRes = await fetch(`${FILES_URL}?q=${query}&fields=files(id,name)`, {
    headers: authHeaders(token),
  });
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return searchData.files[0].id;

  const body = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) body.parents = [parentId];

  const createRes = await fetch(FILES_URL, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!createRes.ok) throw new Error(`Drive folder create failed: ${createRes.status}`);
  const folder = await createRes.json();
  return folder.id;
}

export async function uploadPdf(token, { bytes, filename, folderId, properties }) {
  const metaRes = await fetch(FILES_URL, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: filename, parents: [folderId], properties }),
  });
  if (!metaRes.ok) throw new Error(`Drive file create failed: ${metaRes.status}`);
  const { id: fileId } = await metaRes.json();

  const uploadRes = await fetch(`${UPLOAD_URL}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/pdf' },
    body: bytes,
  });
  if (!uploadRes.ok) throw new Error(`Drive upload failed: ${uploadRes.status}`);
  return fileId;
}
