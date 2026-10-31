import type { Protein } from '../domain/types';
import { imageCredit, rcsbUrl } from '../structures/structures';

export function StructureDataSection({ protein }: { protein: Protein }) {
  const structure = protein.structure;

  return (
    <section className="structure-data">
      <h2>構造データ</h2>
      <dl>
        <dt>PDB ID</dt>
        <dd>
          <a href={rcsbUrl(protein)} target="_blank" rel="noreferrer">
            {structure.pdbId} ↗
          </a>
        </dd>
        <dt>説明</dt>
        <dd>{structure.description}</dd>
        <dt>生物種</dt>
        <dd>{structure.organism}</dd>
        <dt>手法</dt>
        <dd>{structure.method}</dd>
        <dt>分解能</dt>
        <dd>{structure.resolution}</dd>
        <dt>構造</dt>
        <dd>実験で決定された構造</dd>
        <dt>集合体</dt>
        <dd>{structure.assembly}</dd>
        {structure.note && (
          <>
            <dt>注記</dt>
            <dd>{structure.note}</dd>
          </>
        )}
        <dt>引用</dt>
        <dd>{structure.citation}</dd>
      </dl>
      <p className="credit">{imageCredit(protein)}</p>
    </section>
  );
}
