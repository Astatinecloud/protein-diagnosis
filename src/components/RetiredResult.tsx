import { Link } from 'react-router-dom';
import data from '../data/proteins.json';

export const retiredMessage = (name: string) => `${name}は診断のリニューアルで入れ替わりました`;
export function RetiredResult({ id, shared = false }: { id?: string | null; shared?: boolean }) {
  const retired = data.retired.find(protein => protein.id === id);
  if (!retired) return null;
  return (
    <section className="hero">
      <h1>{retiredMessage(retired.nameJa)}</h1>
      {!shared && <Link className="button" to="/">トップへ</Link>}
    </section>
  );
}
