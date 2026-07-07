// The exact Drive `properties` schema from archive-capture/docs/metadata-schema.md.
// Fields this tool can't know yet (box/folder/collection/tags/etc.) are left
// blank rather than guessed — a later Phase 2 tool fills those in.
export function buildMetadata({ capturedAt, filename, pageCount = 1 }) {
  return {
    box: '',
    folder: '',
    tags: [],
    important: 'false',
    is_comment: 'false',
    parent_id: '',
    has_markup: 'false',
    collection: '',
    archive_name: '',
    captured_at: capturedAt.toISOString(),
    temp_filename: filename,
    page_count: String(pageCount),
    omg_pages: '[]',
    unmarked_backup_pages: '[]',
    typed_comments: '[]',
  };
}

// Drive `properties` values must be strings — same flattening rule as
// archive-capture/src/services/DriveService.js's flattenMetadata.
export function flattenMetadata(meta) {
  const result = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined) continue;
    result[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  return result;
}
