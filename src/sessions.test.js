import { describe, it, expect } from 'vitest';
import { groupIntoSessions } from './sessions.js';

function item(name, capturedAt, relativePath = null) {
  return { file: { name }, relativePath, capturedAt: new Date(capturedAt) };
}

describe('groupIntoSessions', () => {
  it('splits loose files into sessions on a large timestamp gap', () => {
    const items = [
      item('a.jpg', '2026-07-05T09:00:00Z'),
      item('b.jpg', '2026-07-05T09:05:00Z'),
      item('c.jpg', '2026-07-05T14:00:00Z'), // >3h gap from b -> new session
      item('d.jpg', '2026-07-05T14:02:00Z'),
    ];

    const sessions = groupIntoSessions(items);

    expect(sessions).toHaveLength(2);
    expect(sessions[0].items.map((i) => i.file.name)).toEqual(['a.jpg', 'b.jpg']);
    expect(sessions[1].items.map((i) => i.file.name)).toEqual(['c.jpg', 'd.jpg']);
  });

  it('keeps everything in one session when gaps are small', () => {
    const items = [
      item('a.jpg', '2026-07-05T09:00:00Z'),
      item('b.jpg', '2026-07-05T09:30:00Z'),
      item('c.jpg', '2026-07-05T10:45:00Z'),
    ];

    const sessions = groupIntoSessions(items);

    expect(sessions).toHaveLength(1);
    expect(sessions[0].items).toHaveLength(3);
  });

  it('sorts out-of-order input chronologically before grouping', () => {
    const items = [
      item('later.jpg', '2026-07-05T09:30:00Z'),
      item('earlier.jpg', '2026-07-05T09:00:00Z'),
    ];

    const sessions = groupIntoSessions(items);

    expect(sessions[0].items.map((i) => i.file.name)).toEqual(['earlier.jpg', 'later.jpg']);
  });

  it('groups by the full containing-folder path, ignoring timestamps', () => {
    const items = [
      item('a.jpg', '2026-07-05T09:00:00Z', 'Session A/a.jpg'),
      item('b.jpg', '2026-07-06T14:00:00Z', 'Session A/sub/b.jpg'),
      item('c.jpg', '2026-07-05T09:01:00Z', 'Session B/c.jpg'),
    ];

    const sessions = groupIntoSessions(items);

    // "Session A/sub" must stay distinct from "Session A" — collapsing both
    // to just the top segment was the bug that flattened real folder
    // structure (e.g. "Eliza Poster/Originals" and "Eliza Poster/Ready"
    // both landing in one "Eliza Poster" group).
    expect(sessions).toHaveLength(3);
    const byName = Object.fromEntries(sessions.map((s) => [s.name, s.items.map((i) => i.file.name)]));
    expect(byName['Session A']).toEqual(['a.jpg']);
    expect(byName['Session A/sub']).toEqual(['b.jpg']);
    expect(byName['Session B']).toEqual(['c.jpg']);
  });

  it('keeps sibling subfolders under a common top-level folder separate', () => {
    const items = [
      item('book.pdf', '2026-07-05T09:00:00Z', 'Eliza Poster/Originals/book.pdf'),
      item('book.pdf', '2026-07-05T09:01:00Z', 'Eliza Poster/Ready/book.pdf'),
      item('poster.pub', '2026-07-05T09:02:00Z', 'Eliza Poster/poster.pub'),
    ];

    const sessions = groupIntoSessions(items);

    expect(sessions).toHaveLength(3);
    const byName = Object.fromEntries(sessions.map((s) => [s.name, s.items.map((i) => i.file.name)]));
    expect(byName['Eliza Poster/Originals']).toEqual(['book.pdf']);
    expect(byName['Eliza Poster/Ready']).toEqual(['book.pdf']);
    expect(byName['Eliza Poster']).toEqual(['poster.pub']);
  });

  it('buckets loose files without a folder into "Ungrouped" when mixed with folder items', () => {
    const items = [
      item('a.jpg', '2026-07-05T09:00:00Z', 'Session A/a.jpg'),
      item('loose.jpg', '2026-07-05T09:01:00Z', null),
    ];

    const sessions = groupIntoSessions(items);
    const ungrouped = sessions.find((s) => s.name === 'Ungrouped');

    expect(ungrouped.items.map((i) => i.file.name)).toEqual(['loose.jpg']);
  });
});
