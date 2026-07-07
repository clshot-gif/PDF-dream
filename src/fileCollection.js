// Normalizes the three ways files can enter this page into one shape:
// { file, relativePath } — relativePath is null for loose files (native
// photo-picker, or a plain-file drag), and a "folder/sub/name.jpg" style
// path when the source was a real folder (webkitdirectory input, or a
// folder dragged onto the page).

export function fromFileList(fileList) {
  return [...fileList].map((file) => ({ file, relativePath: null }));
}

export function fromDirectoryInput(fileList) {
  return [...fileList].map((file) => ({ file, relativePath: file.webkitRelativePath || null }));
}

export async function fromDataTransfer(dataTransfer) {
  const items = [...dataTransfer.items];
  const entries = items.map((item) => item.webkitGetAsEntry?.()).filter(Boolean);

  if (entries.length === 0) {
    // Browser doesn't support the entries API — fall back to a flat file list.
    return fromFileList(dataTransfer.files);
  }

  const results = [];
  for (const entry of entries) {
    await walkEntry(entry, '', results);
  }
  return results;
}

function walkEntry(entry, prefix, results) {
  return new Promise((resolve, reject) => {
    if (entry.isFile) {
      entry.file((file) => {
        results.push({ file, relativePath: prefix ? `${prefix}${entry.name}` : null });
        resolve();
      }, reject);
      return;
    }

    if (entry.isDirectory) {
      const reader = entry.createReader();
      const nextBatch = () => {
        reader.readEntries(async (subEntries) => {
          if (subEntries.length === 0) {
            resolve();
            return;
          }
          for (const sub of subEntries) {
            await walkEntry(sub, `${prefix}${entry.name}/`, results);
          }
          nextBatch(); // readEntries only returns a batch at a time, not the whole tree
        }, reject);
      };
      nextBatch();
      return;
    }

    resolve();
  });
}
