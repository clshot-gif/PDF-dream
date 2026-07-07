import { describe, it, expect } from 'vitest';
import { buildMetadata, flattenMetadata } from './metadata.js';

describe('buildMetadata', () => {
  it('leaves box/folder/collection/tags blank and fills what is known', () => {
    const capturedAt = new Date('2026-07-05T22:14:03.912Z');
    const meta = buildMetadata({ capturedAt, filename: 'doc.pdf', pageCount: 3 });

    expect(meta.box).toBe('');
    expect(meta.folder).toBe('');
    expect(meta.collection).toBe('');
    expect(meta.archive_name).toBe('');
    expect(meta.tags).toEqual([]);
    expect(meta.captured_at).toBe('2026-07-05T22:14:03.912Z');
    expect(meta.temp_filename).toBe('doc.pdf');
    expect(meta.page_count).toBe('3');
  });
});

describe('flattenMetadata', () => {
  it('matches the exact properties shape from the mobile app schema', () => {
    const meta = buildMetadata({
      capturedAt: new Date('2026-07-05T22:14:03.912Z'),
      filename: 'doc.pdf',
      pageCount: 1,
    });

    const flat = flattenMetadata(meta);

    // Every value must be a string (Drive `properties` constraint).
    for (const value of Object.values(flat)) {
      expect(typeof value).toBe('string');
    }
    expect(flat.tags).toBe('[]');
    expect(flat.omg_pages).toBe('[]');
    expect(flat.important).toBe('false');
  });

  it('drops null/undefined fields instead of stringifying them', () => {
    const flat = flattenMetadata({ keep: 'x', dropMe: undefined, alsoDrop: null });
    expect(flat).toEqual({ keep: 'x' });
  });
});
