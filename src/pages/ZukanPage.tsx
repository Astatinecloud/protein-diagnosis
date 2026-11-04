import { ClassificationTable } from '../components/ClassificationTable';
import { Classification } from '../components/Classification';
import { RetiredResult } from '../components/RetiredResult';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import data from '../data/proteins.json';
import type { Protein } from '../domain/types';
import { imagePath, rcsbUrl } from '../structures/structures';
import { Disclaimer } from '../components/Shared';

function ProteinCard({ protein, selected }: { protein: Protein; selected: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <article className={`zukan-card${selected ? ' zukan-card-selected' : ''}`}
      id={`protein-${protein.id}`} data-protein-id={protein.id}>
      {selected && <p className="zukan-badge">あなたのタンパク質！</p>}
      <div className="zukan-image-frame">
        <img src={imagePath(protein)} width={400} height={400} loading="lazy"
          alt={`${protein.nameJa}の実験で決定された立体構造（PDB ID ${protein.structure.pdbId}）`}
          hidden={failed} onError={() => setFailed(true)} />
        {failed && <p role="status">構造画像を表示できません</p>}
      </div>
      <h2>{protein.nameJa}</h2><Classification protein={protein} />
      <p className="zukan-english" lang="en">{protein.nameEn}</p>
      <p><strong>はたらき</strong><br />{protein.zukan.role}</p>
      <p>{protein.zukan.summary}</p>
      <p className="credit"><a href={rcsbUrl(protein)} target="_blank" rel="noreferrer">
        PDB ID {protein.structure.pdbId}（実験で決定された構造）
      </a></p>
    </article>
  );
}

export default function ZukanPage() {
  const { proteinId } = useParams();
  const protein = data.proteins.find(candidate => candidate.id === proteinId);
  if (data.retired.some(candidate => candidate.id === proteinId)) return <RetiredResult id={proteinId} />;
  if (!protein) return (
    <section className="hero">
      <h1>結果が見つかりません</h1>
      <Link className="button" to="/">トップへ戻る</Link>
    </section>
  );
  const ordered = [protein, ...data.proteins.filter(candidate => candidate.id !== protein.id)];
  const back = <Link className="button" to={`/result/${protein.id}`}>診断結果に戻る</Link>;
  return (
    <>
      <section className="zukan">
        <h1>タンパク質図鑑</h1>
        <p>この診断に登場する{data.proteins.length}種類のたんぱく質です。</p>
        {back}
        <ClassificationTable selectedId={protein.id} />
        <div className="zukan-grid">
          {ordered.map(candidate => (
            <ProteinCard key={candidate.id} protein={candidate} selected={candidate.id === protein.id} />
          ))}
        </div>
        {back}
        <p className="credit">構造画像: RCSB PDB (RCSB.org) の各エントリ。Mol* (Sehnal et al., 2021) で描画。</p>
      </section>
      <Disclaimer />
    </>
  );
}
