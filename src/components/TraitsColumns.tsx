import type { Protein } from '../domain/types';

export function TraitsColumns({ protein }: { protein: Protein }) {
  return (
    <div className="two-columns">
      <section className="card">
        <h2>長所</h2>
        <ul>
          {protein.strengths.map(text => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>
      <section className="card lavender">
        <h2>弱点</h2>
        <ul>
          {protein.weaknesses.map(text => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
