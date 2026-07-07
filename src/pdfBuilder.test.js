import { describe, it, expect } from 'vitest';
import { isPdf, isImage } from './pdfBuilder.js';

function file(name, type) {
  return { name, type };
}

describe('isPdf', () => {
  it('matches by mime type or extension', () => {
    expect(isPdf(file('doc.pdf', ''))).toBe(true);
    expect(isPdf(file('doc.bin', 'application/pdf'))).toBe(true);
    expect(isPdf(file('doc.docx', 'application/msword'))).toBe(false);
  });
});

describe('isImage', () => {
  it('matches common photo types by mime type', () => {
    expect(isImage(file('photo.jpg', 'image/jpeg'))).toBe(true);
    expect(isImage(file('photo.png', 'image/png'))).toBe(true);
  });

  it('falls back to extension when the mime type is missing (e.g. some HEIC uploads)', () => {
    expect(isImage(file('photo.heic', ''))).toBe(true);
    expect(isImage(file('photo.HEIC', ''))).toBe(true);
  });

  it('does not treat non-photo files as images', () => {
    expect(isImage(file('report.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBe(
      false
    );
    expect(isImage(file('notes.txt', 'text/plain'))).toBe(false);
    expect(isImage(file('archive.zip', 'application/zip'))).toBe(false);
  });
});
