import type { Protein } from '../domain/types';

export function ScienceSection({ protein }: { protein: Protein }) {
  return (
    <section className="science">
      <p className="eyebrow">SCIENCE / たんぱく質の世界</p>
      <h2>本物の{protein.nameJa}はこんなたんぱく質</h2>
      <p>{protein.biology}</p>
      <h3>豆知識</h3>
      <p>{protein.funFact}</p>
    </section>
  );
}
