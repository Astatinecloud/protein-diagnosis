import { Link } from 'react-router-dom';
import type { Protein } from '../domain/types';
import { Disclaimer } from './Shared';
import { ResultHeader } from './ResultHeader';
import { TraitsColumns } from './TraitsColumns';
import { ScienceSection } from './ScienceSection';
import { StructureDataSection } from './StructureDataSection';
import { imagePath } from '../structures/structures';
import { ResultActions } from './ResultActions';

export function ResultBody({ protein, mode, onReplay }: {
  protein: Protein;
  mode: 'play' | 'shared';
  onReplay?: () => void;
}) {
  return (
    <>
      <article className="result">
        <ResultHeader protein={protein} />
        <img
          className="structure-image"
          src={imagePath(protein)}
          alt={`${protein.nameJa}の実験で決定された立体構造（PDB ID ${protein.structure.pdbId}）`}
        />
        <p className="catch">{protein.catchCopy}</p>
        <section>
          <h2>
            あなたの特徴 <small>たとえるなら…</small>
          </h2>
          <p>{protein.personality}</p>
        </section>
        <TraitsColumns protein={protein} />
        <ScienceSection protein={protein} />
        <StructureDataSection protein={protein} />
        <ResultActions protein={protein} mode={mode} />
        {mode === 'play' && <>
          <div className="restart">
            <Link className="button" to={`/result/${protein.id}/zukan`}>
              ほかのタンパク質も見てみる！
            </Link>
          </div>
          <div className="restart">
            <Link className="button" to="/" onClick={onReplay}>
              もう一度診断する
            </Link>
          </div>
        </>}
      </article>
      <Disclaimer />
    </>
  );
}
