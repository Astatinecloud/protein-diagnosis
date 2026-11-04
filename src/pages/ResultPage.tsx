import { RetiredResult } from '../components/RetiredResult';
import { Link, useParams } from 'react-router-dom';
import data from '../data/proteins.json';
import { useQuiz } from '../state/QuizContext';
import { ResultBody } from '../components/ResultBody';

export default function ResultPage() {
  const { proteinId } = useParams();
  const { reset } = useQuiz();
  const protein = data.proteins.find(candidate => candidate.id === proteinId);
  if (data.retired.some(candidate => candidate.id === proteinId)) return <RetiredResult id={proteinId} />;
  if (!protein) {
    return <section className="hero">
      <h1>結果が見つかりません</h1>
      <Link className="button" to="/">トップへ戻る</Link>
    </section>;
  }
  return <ResultBody protein={protein} mode="play" onReplay={reset} />;
}
