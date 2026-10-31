import { readFile, mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const { proteins } = JSON.parse(
  await readFile(new URL('src/data/proteins.json', root), 'utf8'),
);
await mkdir(new URL('public/structures/', root), { recursive: true });

let failed = false;

for (const protein of proteins) {
  const id = protein.structure.pdbId.toLowerCase();
  const assemblyId = protein.structure.assemblyId;
  const url = `https://cdn.rcsb.org/images/structures/${id.slice(1, 3)}/${id}/`
    + `${id}_assembly-${assemblyId}.jpeg`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Response is not a JPEG');

    await writeFile(new URL(`public/structures/${id}.jpeg`, root), bytes);
    console.log(`${id}: ${bytes.length} bytes`);
  } catch (error) {
    failed = true;
    console.error(`${id}: ${error.message}`);
  }
}

if (failed) process.exitCode = 1;
