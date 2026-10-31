import { Link } from 'react-router-dom';
import { Chain, Disclaimer } from '../components/Shared';
import { SiteQrButton } from '../components/QrCode';

export default function TopPage() {
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
        <p className="subtitle">8つの質問から、あなたのたんぱく質タイプを診断！</p>
        <p>
          身近な選択から見つける、あなたらしい働き方。
          <br />
          12種類のたんぱく質の世界をのぞいてみよう。
        </p>
        <p className="time">約1〜2分 · 全8問</p>
        <Link className="button" to="/quiz">
          診断スタート <span aria-hidden="true">→</span>
        </Link>
        <SiteQrButton />
      </section>
      <Disclaimer />
    </>
  );
}
