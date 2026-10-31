import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="hero">
      <h1>ページが見つかりません</h1>
      <Link className="button" to="/">
        トップへ戻る
      </Link>
    </section>
  );
}
