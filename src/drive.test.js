import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveNestedFolder, uploadFile } from './drive.js';

// Fakes the two Drive calls findOrCreateFolder makes per segment: a search
// (always "not found" here) then a create, returning an id derived from the
// requested name+parent so we can assert the real nesting chain occurred.
function mockDriveFetch() {
  return vi.fn(async (url, options) => {
    if (!options || options.method === undefined) {
      // GET search — pretend nothing exists yet, forcing a create every time.
      return { ok: true, json: async () => ({ files: [] }) };
    }
    const body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ id: `id:${body.name}:${body.parents?.[0] ?? 'root'}` }),
    };
  });
}

describe('resolveNestedFolder', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates each path segment as a real nested folder, not one folder with a slash in its name', async () => {
    const fetchMock = mockDriveFetch();
    vi.stubGlobal('fetch', fetchMock);

    const finalId = await resolveNestedFolder('token', 'root-id', 'Eliza Poster/Originals');

    expect(finalId).toBe('id:Originals:id:Eliza Poster:root-id');

    const createCalls = fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');
    expect(createCalls).toHaveLength(2);
    expect(JSON.parse(createCalls[0][1].body)).toMatchObject({ name: 'Eliza Poster', parents: ['root-id'] });
    expect(JSON.parse(createCalls[1][1].body)).toMatchObject({
      name: 'Originals',
      parents: ['id:Eliza Poster:root-id'],
    });
  });

  it('behaves like a single findOrCreateFolder call for a one-segment path', async () => {
    const fetchMock = mockDriveFetch();
    vi.stubGlobal('fetch', fetchMock);

    await resolveNestedFolder('token', 'root-id', 'Ungrouped');

    const createCalls = fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');
    expect(createCalls).toHaveLength(1);
    expect(JSON.parse(createCalls[0][1].body)).toMatchObject({ name: 'Ungrouped', parents: ['root-id'] });
  });
});

describe('uploadFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to application/pdf when no mimeType is given', async () => {
    const fetchMock = vi.fn(async (url, options) => {
      if (options.method === 'POST') return { ok: true, json: async () => ({ id: 'file-id' }) };
      return { ok: true, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    await uploadFile('token', { bytes: new Uint8Array(), filename: 'doc.pdf', folderId: 'folder-id', properties: {} });

    const patchCall = fetchMock.mock.calls.find(([, options]) => options.method === 'PATCH');
    expect(patchCall[1].headers['Content-Type']).toBe('application/pdf');
  });

  it('uploads with the given mimeType for files that were copied as-is', async () => {
    const fetchMock = vi.fn(async (url, options) => {
      if (options.method === 'POST') return { ok: true, json: async () => ({ id: 'file-id' }) };
      return { ok: true, json: async () => ({}) };
    });
    vi.stubGlobal('fetch', fetchMock);

    await uploadFile('token', {
      bytes: new Uint8Array(),
      filename: 'report.docx',
      folderId: 'folder-id',
      properties: {},
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const patchCall = fetchMock.mock.calls.find(([, options]) => options.method === 'PATCH');
    expect(patchCall[1].headers['Content-Type']).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });
});
