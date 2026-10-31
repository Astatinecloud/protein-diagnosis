import { mkdir, copyFile } from 'node:fs/promises';

await mkdir(new URL('../public/molstar/', import.meta.url), { recursive: true });
for (const file of ['molstar.js', 'molstar.css']) {
  await copyFile(
    new URL(`../node_modules/molstar/build/viewer/${file}`, import.meta.url),
    new URL(`../public/molstar/${file}`, import.meta.url),
  );
}
