import { Link, useParams } from 'react-router-dom';
import data from '../data/proteins.json';
import { Disclaimer } from '../components/Shared';
import { ResultHeader } from '../components/ResultHeader';
import { TraitsColumns } from '../components/TraitsColumns';
import { ScienceSection } from '../components/ScienceSection';
import { StructureDataSection } from '../components/StructureDataSection';
import { imagePath } from '../structures/structures';
import { useQuiz } from '../state/QuizContext';
import { ResultActions } from '../components/ResultActions';

export default function ResultPage() {
  const { proteinId } = useParams();
  const { reset } = useQuiz();
  const protein = data.proteins.find(candidate => candidate.id === proteinId);

  if (!protein) {
    return (
      <section className="hero">
        <h1>結果が見つかりません</h1>
        <Link className="button" to="/">
          トップへ戻る
        </Link>
      </section>
    );
  }

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
        <ResultActions protein={protein} />
        <div className="restart">
          <Link className="button" to={`/result/${protein.id}/zukan`}>
            ほかのタンパク質も見てみる！
          </Link>
        </div>
        <div className="restart">
          <Link className="button" to="/" onClick={reset}>
            もう一度診断する
          </Link>
        </div>
      </article>
      <Disclaimer />
    </>
  );
}
