import exifr from 'exifr';

// Falls back to the file's own last-modified time when EXIF is missing or
// unreadable (e.g. a screenshot, or a photo that's been re-saved and stripped
// of metadata) — better than throwing away the file's position in the session.
export async function readCapturedAt(file) {
  try {
    const data = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
    const dt = data?.DateTimeOriginal || data?.CreateDate;
    if (dt instanceof Date && !isNaN(dt)) return dt;
  } catch {
    // Not fatal — PDFs and some images have no EXIF at all.
  }
  return new Date(file.lastModified);
}
