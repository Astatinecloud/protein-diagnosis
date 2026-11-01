import { useQuiz } from '../state/QuizContext';
import data from '../data/proteins.json';
import { Link } from 'react-router-dom';
import { Chain, Disclaimer } from '../components/Shared';
import { SiteQrButton } from '../components/QrCode';

export default function TopPage() {
  const { questions } = useQuiz();
  return (
    <>
      <section className="hero">
        <p className="eyebrow">PROTEIN PERSONALITY QUIZ</p>
        <Chain />
        <h1>
          あなたはどの
          <br className="mobile-break" />
          たんぱく質？
        </h1>
        <p className="subtitle">{questions.questions.length}つの質問から、あなたのたんぱく質タイプを診断！</p>
        <p>
          身近な選択から見つける、あなたらしい働き方。
          <br />
          {data.proteins.length}種類のたんぱく質の世界をのぞいてみよう。
        </p>
        <p className="time">約1〜2分 · 全{questions.questions.length}問</p>
        <Link className="button" to="/quiz">
          診断スタート <span aria-hidden="true">→</span>
        </Link>
        <SiteQrButton />
      </section>
      <Disclaimer />
    </>
  );
}
