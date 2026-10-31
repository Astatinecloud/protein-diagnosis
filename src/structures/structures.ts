import type { Protein } from '../domain/types';
import { assetPath } from '../paths';

export const imagePath = (protein: Protein) =>
  assetPath(`structures/${protein.structure.pdbId.toLowerCase()}.jpeg`);

export const rcsbUrl = (protein: Protein) =>
  `https://www.rcsb.org/structure/${protein.structure.pdbId}`;

export function imageCredit(protein: Protein): string {
  const { pdbId, citation } = protein.structure;

  return `構造画像: RCSB PDB (RCSB.org) — PDB ID ${pdbId}（${citation}）。`
    + 'Mol* (Sehnal et al., 2021) で描画。';
}
