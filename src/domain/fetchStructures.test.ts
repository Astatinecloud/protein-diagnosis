import { afterEach, expect, it, vi } from 'vitest';
import data from '../data/proteins.json';
const mocks = vi.hoisted(() => ({ readFile: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn() }));

vi.mock('node:fs/promises', () => mocks);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('fetches every new structure assembly with mocked offline responses', async () => {
  mocks.readFile.mockResolvedValue(JSON.stringify(data));
  mocks.mkdir.mockResolvedValue(undefined);
  mocks.writeFile.mockResolvedValue(undefined);
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new Uint8Array([255, 216, 255]).buffer,
  });
  vi.stubGlobal('fetch', fetch);
  vi.spyOn(console, 'log').mockImplementation(() => { });
  const script = '../../scripts/fetch-structures.mjs';
  await import(script);
  expect(fetch).toHaveBeenCalledTimes(16);
  expect(mocks.writeFile).toHaveBeenCalledTimes(16);
  data.proteins.forEach((protein, index) => {
    const id = protein.structure.pdbId.toLowerCase();
    const root = `https://cdn.rcsb.org/images/structures/${id.slice(1, 3)}/${id}/`;
    expect(fetch.mock.calls[index][0]).toBe(`${root}${id}_assembly-${protein.structure.assemblyId}.jpeg`);
    expect(String(mocks.writeFile.mock.calls[index][0])).toMatch(new RegExp(`/public/structures/${id}\\.jpeg$`));
  });
});
