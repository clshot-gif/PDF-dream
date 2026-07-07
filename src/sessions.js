// Long enough to survive a lunch break mid-session without splitting one
// archive visit into two; short enough to separate genuinely different visits.
const SESSION_GAP_MS = 3 * 60 * 60 * 1000; // 3 hours

// items: [{ file, relativePath, capturedAt }]
// relativePath is set (and contains a "/") only when the item came from a
// real folder (webkitdirectory picker or a folder dragged onto the page).
// Loose files/photos have no folder structure to preserve, so they fall
// back to timestamp-gap grouping instead.
export function groupIntoSessions(items) {
  const hasFolderStructure = items.some((item) => item.relativePath?.includes('/'));
  return hasFolderStructure ? groupByFolder(items) : groupByTimestampGap(items);
}

// Groups by the file's full containing-folder path, not just the first
// segment — otherwise every subfolder in a multi-level drop (e.g.
// "Eliza Poster/Originals/x.jpg" and "Eliza Poster/Ready/y.jpg") collapses
// into one group named after the top-level folder alone, losing the
// subfolder distinction entirely.
function groupByFolder(items) {
  const groups = new Map();
  for (const item of items) {
    const segments = item.relativePath?.split('/') ?? [];
    const folderPath = segments.length > 1 ? segments.slice(0, -1).join('/') : 'Ungrouped';
    if (!groups.has(folderPath)) groups.set(folderPath, []);
    groups.get(folderPath).push(item);
  }
  return [...groups.entries()].map(([name, sessionItems]) => ({ name, items: sessionItems }));
}

function groupByTimestampGap(items) {
  const sorted = [...items].sort((a, b) => a.capturedAt - b.capturedAt);
  const sessions = [];
  let current = [];

  for (const item of sorted) {
    if (current.length > 0 && item.capturedAt - current[current.length - 1].capturedAt > SESSION_GAP_MS) {
      sessions.push(current);
      current = [];
    }
    current.push(item);
  }
  if (current.length) sessions.push(current);

  return sessions.map((sessionItems, idx) => ({
    name: `Session ${idx + 1} (${formatSessionLabel(sessionItems[0].capturedAt)})`,
    items: sessionItems,
  }));
}

function formatSessionLabel(date) {
  return date.toISOString().slice(0, 16).replace('T', ' ');
}
