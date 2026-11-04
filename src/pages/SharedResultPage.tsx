import { RetiredResult } from '../components/RetiredResult';
import { useLocation } from 'react-router-dom';
import data from '../data/proteins.json';
import { ResultBody } from '../components/ResultBody';

export default function SharedResultPage() {
  const { search } = useLocation();
  const id = new URLSearchParams(search).get('result');
  const protein = data.proteins.find(candidate => candidate.id === id);
  if (data.retired.some(candidate => candidate.id === id)) return <RetiredResult id={id} shared />;
  if (!protein) {
    return <section className="hero">
      <h1>結果が見つかりません</h1>
      <p>QRコードをもう一度読み取ってください。</p>
    </section>;
  }
  return <ResultBody key={protein.id} protein={protein} mode="shared" />;
}
